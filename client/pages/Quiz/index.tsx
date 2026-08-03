import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { useApi } from "@/hooks/useApi.js";
import { useApiData } from "@/hooks/useApiData.js";
import { executeApi } from "@/lib/executeApi.js";
import { useSuperblocksUser } from "@superblocksteam/library";
import { QUIZZES, getQuizById, QUIZ_EMOJIS } from "@/data/quizzes/index.js";
import { PASS_THRESHOLD, TOTAL_TIME_SECONDS, MAX_ATTEMPTS, type Role } from "@/data/quiz-types.js";
import type { Question } from "@/data/quiz-types.js";
import QuestionCard from "@/components/quiz/QuestionCard.js";
import QuizResults from "@/components/quiz/QuizResults.js";
// Role is now auto-populated from registration — RoleSelector removed
import { useQuizTimer } from "@/components/quiz/QuizTimer.js";
import { showXpToasts } from "@/components/camp/xp-toasts.js";
import TierUnlockModal, { getTierIndex } from "@/components/camp/TierUnlockModal.js";
import CampGear from "@/components/camp/CampGear.js";

type QuizPhase = "intro" | "active" | "review" | "results";

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get("mode") === "review";
  const quiz = quizId ? getQuizById(quizId) : null;

  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [role, setRole] = useState<Role | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [lastAttemptPassed, setLastAttemptPassed] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());
  const [tierUnlock, setTierUnlock] = useState<{ tierIndex: number; totalXp: number; position: number } | null>(null);
  const [snapshotQuestions, setSnapshotQuestions] = useState<Question[] | null>(null);

  const timer = useQuizTimer(TOTAL_TIME_SECONDS);

  // Reset quiz-level state when quizId changes (prevents stale state when navigating between quizzes)
  // NOTE: role is intentionally NOT reset — it's a user-level property, not quiz-level
  useEffect(() => {
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers({});
    setShowFeedback(false);
    setScore(0);
    setAttemptNumber(1);
    setLastAttemptPassed(false);
    setShuffleSeed(Date.now());
    setTierUnlock(null);
    setSnapshotQuestions(null);
    submitLockRef.current = false;
    timer.reset();
  }, [quizId]);

  // Shuffle questions using a seeded Fisher-Yates shuffle
  const shuffledQuestions = useMemo(() => {
    if (!quiz) return [];
    const arr = [...quiz.questions];
    let seed = shuffleSeed;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF;
      return (seed >>> 0) / 0xFFFFFFFF;
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [quiz, shuffleSeed]);

  const { run: submitAttempt, loading: submitting } = useApi("CampSubmitAttempt");
  const { run: trackReview } = useApi("CampTrackReview");
  const preSubmitXpRef = useRef<number>(0);
  const submitLockRef = useRef(false); // Prevents double-submit on rapid clicks

  // Get user info from Superblocks context
  const user = useSuperblocksUser();
  const userEmail = user?.email ?? "";
  const userName = user?.name ?? "";

  // Load viewer registration data (for role)
  const { data: viewerData, loading: viewerLoading } = useApiData(
    "CampLookupViewer",
    { userEmail },
    { enabled: !!userEmail }
  );

  // Load prior attempts
  const { data: priorAttempts, loading: attemptsLoading, fetching: attemptsFetching } = useApiData(
    "CampGetUserAttempts",
    { quizId: quizId ?? "", userEmail },
    { enabled: !!quizId && !!userEmail }
  );

  // Auto-set role from viewer registration when no prior attempts
  useEffect(() => {
    if (viewerData?.viewer?.user_role && !role) {
      setRole(viewerData.viewer.user_role as Role);
    }
  }, [viewerData]);

  useEffect(() => {
    // Guard: don't process stale cached data while a fetch is in-flight.
    // When quizId changes, useApiData starts fetching new data (attemptsFetching=true)
    // but may still hold cached data from the previous quiz. Wait until the fetch
    // completes before processing.
    if (attemptsFetching) return;

    if (priorAttempts?.attempts && priorAttempts.attempts.length > 0) {
      const maxAttempt = Math.max(...priorAttempts.attempts.map((a: any) => a.attempt_number));
      const lastPassed = priorAttempts.attempts.some((a: any) => a.passed);
      // Remember the user's role from their prior attempts
      const priorRole = priorAttempts.attempts[0]?.user_role;
      if (priorRole) setRole(priorRole as Role);
      if (isReviewMode && (lastPassed || maxAttempt >= MAX_ATTEMPTS)) {
        // Go directly to review mode to show all Q&A (passed OR exhausted all 4 attempts)
        setPhase("review");
        setAttemptNumber(maxAttempt);
        setLastAttemptPassed(lastPassed);
        // Load snapshot for review — show the questions the learner actually took
        const latestAttempt = priorAttempts.attempts[priorAttempts.attempts.length - 1];
        if (latestAttempt) {
          executeApi("CampGetQuizSnapshot", { attemptId: latestAttempt.id })
            .then((snap) => {
              if (snap.questions && snap.questions.length > 0) {
                setSnapshotQuestions(snap.questions as Question[]);
              }
            })
            .catch(() => { /* Fallback to static questions */ });
        }
        // Track review engagement
        if (quizId && userEmail) {
          trackReview({ quizId, userEmail, userName }).catch(() => {});
        }
      } else if (lastPassed || maxAttempt >= MAX_ATTEMPTS) {
        setPhase("results");
        setAttemptNumber(maxAttempt);
        setScore(priorAttempts.attempts[priorAttempts.attempts.length - 1].score);
        setLastAttemptPassed(lastPassed);
      } else {
        // Still has attempts left — set next attempt number (intro screen)
        setAttemptNumber(maxAttempt + 1);
      }
    }
  }, [priorAttempts, isReviewMode, attemptsFetching]);

  // Handle timer expiry
  useEffect(() => {
    if (timer.isTimeUp && phase === "active") {
      handleSubmitQuiz();
    }
  }, [timer.isTimeUp]);

  const handleStartQuiz = useCallback(() => {
    if (!role) return;
    setPhase("active");
    setCurrentIndex(0);
    setAnswers({});
    setShowFeedback(false);
    timer.start();
  }, [role, timer]);

  const checkAnswer = useCallback(
    (question: Question, userAnswer: string): boolean => {
      if (question.type === "fill") {
        const accepted = question.correct as string[];
        const normalized = userAnswer.trim().toLowerCase();
        return accepted.some((a) => {
          const target = a.toLowerCase();
          if (normalized === target) return true;
          if (Math.abs(normalized.length - target.length) > 2) return false;
          let diff = 0;
          const longer = normalized.length > target.length ? normalized : target;
          const shorter = normalized.length > target.length ? target : normalized;
          for (let i = 0; i < longer.length; i++) {
            if (shorter[i] !== longer[i]) diff++;
          }
          return diff <= 2;
        });
      }
      if (question.type === "match") {
        if (!question.pairs) return false;
        try {
          const userMatches: Record<string, string> = JSON.parse(userAnswer);
          return question.pairs.every((p) => userMatches[p.term] === p.match);
        } catch {
          return false;
        }
      }
      return String(question.correct) === userAnswer;
    },
    []
  );

  const handleAnswer = useCallback(
    (answer: string) => {
      setAnswers((prev) => ({ ...prev, [currentIndex]: answer }));
    },
    [currentIndex]
  );

  const handleNext = useCallback(() => {
    if (!quiz) return;
    setShowFeedback(false);
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, quiz]);

  const handlePrev = useCallback(() => {
    setShowFeedback(false);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleCheckAnswer = useCallback(() => {
    setShowFeedback(true);
  }, []);

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz || !role || submitLockRef.current) return;
    submitLockRef.current = true; // Lock immediately — before any async work
    timer.pause();
    const elapsed = timer.getElapsed();

    let correctCount = 0;
    const answerDetails = shuffledQuestions.map((q, idx) => {
      const userAnswer = answers[idx] ?? null;
      const isCorrect = userAnswer !== null && checkAnswer(q, userAnswer);
      if (isCorrect) correctCount++;

      const correctAnswerText =
        q.type === "fill"
          ? (q.correct as string[]).join(" / ")
          : q.type === "match" && q.pairs
            ? q.pairs.map((p) => `${p.term} → ${p.match}`).join(", ")
            : q.type === "mc" && q.options
              ? q.options[q.correct as number]
              : q.correct === 0
                ? "True"
                : "False";

      return {
        questionId: q.id,
        questionText: q.text,
        userAnswer:
          userAnswer !== null
            ? q.type === "match" && q.pairs
              ? (() => {
                  try {
                    const m: Record<string, string> = JSON.parse(userAnswer);
                    return Object.entries(m).map(([t, v]) => `${t} → ${v}`).join(", ");
                  } catch { return userAnswer; }
                })()
              : q.type === "mc" && q.options
                ? q.options[parseInt(userAnswer)]
                : q.type === "tf"
                  ? parseInt(userAnswer) === 0
                    ? "True"
                    : "False"
                  : userAnswer
            : null,
        correctAnswer: correctAnswerText,
        isCorrect,
      };
    });

    const passed = (correctCount / quiz.questions.length) * 100 >= PASS_THRESHOLD;
    setScore(correctCount);
    setLastAttemptPassed(passed);

    try {
      // Capture pre-submission XP for delta calculation
      try {
        const preXp = await executeApi("CampGetUserXP", { userEmail });
        preSubmitXpRef.current = preXp.totalXp;
      } catch {
        preSubmitXpRef.current = 0;
      }

      await submitAttempt({
        quizId: quiz.id,
        userEmail,
        userName,
        userRole: role,
        attemptNumber,
        score: correctCount,
        totalQuestions: quiz.questions.length,
        passed,
        timeSpentSeconds: elapsed,
        answers: answerDetails,
        questionsSnapshot: shuffledQuestions.map((q) => ({
          id: q.id,
          type: q.type,
          lo: q.lo,
          text: q.text,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
          placeholder: q.placeholder,
          pairs: q.pairs,
          resource: q.resource,
        })),
      });

      // Fetch updated XP and show toasts
      try {
        const xpData = await executeApi("CampGetUserXP", { userEmail });
        showXpToasts(
          {
            passed,
            attemptNumber,
            score: correctCount,
            totalQuestions: quiz.questions.length,
            timeSpentSeconds: elapsed,
            quizId: quiz.id,
          },
          xpData,
          preSubmitXpRef.current
        );

        // Tier Unlock: "Seed, Don't Celebrate" pattern
        const TIER_KEY = `tier_celebrated_${userEmail}`;
        const currentTierIdx = getTierIndex(xpData.totalXp);
        const storedTier = localStorage.getItem(TIER_KEY);

        if (storedTier === null) {
          // First encounter — seed current tier silently
          localStorage.setItem(TIER_KEY, String(currentTierIdx));
        } else {
          const previousTierIdx = parseInt(storedTier, 10);
          if (currentTierIdx > previousTierIdx) {
            // New tier unlocked! Show the modal
            localStorage.setItem(TIER_KEY, String(currentTierIdx));
            // Get leaderboard position
            try {
              const leaderboard = await executeApi("CampGetLeaderboard", {});
              const position = leaderboard.leaderboard.findIndex(
                (e: any) => e.email.toLowerCase() === userEmail.toLowerCase()
              ) + 1;
              setTierUnlock({ tierIndex: currentTierIdx, totalXp: xpData.totalXp, position: position || 1 });
            } catch {
              setTierUnlock({ tierIndex: currentTierIdx, totalXp: xpData.totalXp, position: 1 });
            }
          }
        }
      } catch {
        // XP toasts are non-critical
      }
    } catch (e) {
      console.error("Failed to submit attempt:", e);
    }

    // Always show review after submission (pass or fail)
    // Show explanations if: passed, OR failed on an even attempt (2nd or 4th = end of attempt pair)
    if (passed || attemptNumber % 2 === 0) {
      setPhase("review");
    } else {
      // Failed on odd attempt (1st or 3rd) — show score only, no explanations
      setPhase("results");
    }
  }, [quiz, role, answers, attemptNumber, timer, checkAnswer, submitAttempt, userEmail, userName]);

  const handleFinishReview = useCallback(() => {
    setPhase("results");
  }, []);

  const handleRetry = useCallback(() => {
    submitLockRef.current = false; // Unlock submit for the new attempt
    setAttemptNumber((n) => n + 1);
    setPhase("active");
    setAnswers({});
    setCurrentIndex(0);
    setShowFeedback(false);
    setShuffleSeed(Date.now()); // Reshuffle questions for retry
    timer.start();
  }, [timer]);

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Quiz not found</h2>
          <p className="text-slate-600 mb-4">The trail you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            🧠 Back to cAMP Quizzes
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const passed = (score / quiz.questions.length) * 100 >= PASS_THRESHOLD;
  const quizEmoji = QUIZ_EMOJIS[quiz.id] ?? "📚";

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-amber-700 px-6 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-200 font-semibold uppercase tracking-wide">
              🏔️ cAMP Ascent: Sales
            </p>
            <h1 className="text-lg font-bold text-white leading-tight">
              {quizEmoji} {quiz.day}: {quiz.title}
            </h1>
            <p className="text-xs text-amber-200">{quiz.week}</p>
          </div>
          {phase === "active" && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-amber-200">
                  {answeredCount}/{quiz.questions.length} answered
                </p>
              </div>
              <TimerDisplay secondsLeft={timer.secondsLeft} totalSeconds={TOTAL_TIME_SECONDS} />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {phase === "intro" && (
          <IntroScreen
            quiz={quiz}
            quizId={quizId ?? ""}
            onStart={handleStartQuiz}
            attemptNumber={attemptNumber}
            hasRole={!!role}
            roleLoading={viewerLoading || attemptsLoading}
          />
        )}

        {phase === "active" && currentQuestion && (
          <div className="space-y-6">
            <QuestionCard
              question={currentQuestion}
              index={currentIndex}
              total={shuffledQuestions.length}
              userAnswer={answers[currentIndex] ?? null}
              onAnswer={handleAnswer}
              showFeedback={false}
              isCorrect={false}
            />

            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {currentIndex < shuffledQuestions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "🌙 Submit Quiz"}
                  </button>
                )}
              </div>
            </div>

            {/* Question navigator dots */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {shuffledQuestions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setShowFeedback(false);
                    setCurrentIndex(i);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentIndex
                      ? "bg-blue-600 scale-125"
                      : answers[i] != null
                        ? "bg-blue-200"
                        : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {phase === "review" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              {lastAttemptPassed ? (
                <>
                  <h2 className="text-lg font-bold text-green-700 mb-1">🎉 Success!</h2>
                  <h3 className="text-md font-semibold text-slate-900 mb-2">🏆 Trail Review</h3>
                  <p className="text-sm text-slate-600">
                    Great work! Review the explanations and resource links below.
                  </p>
                  {isReviewMode && priorAttempts?.attempts && priorAttempts.attempts.length > 0 && (
                    <ReviewStats attempts={priorAttempts.attempts} incorrectQuestions={priorAttempts.incorrectQuestions ?? []} />
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-red-700 mb-1">⛰️ You Took a Fall!</h2>
                  <h3 className="text-md font-semibold text-slate-900 mb-2">🧭 Review Your Answers</h3>
                  <p className="text-sm text-slate-600">
                    Here are the correct answers with explanations to help you prepare.
                  </p>
                  {isReviewMode && priorAttempts?.attempts && priorAttempts.attempts.length > 0 && (
                    <ReviewStats attempts={priorAttempts.attempts} incorrectQuestions={priorAttempts.incorrectQuestions ?? []} />
                  )}
                </>
              )}
            </div>
            {(isReviewMode && snapshotQuestions ? snapshotQuestions : shuffledQuestions).map((q, i) => {
              const userAns = answers[i] ?? null;
              const isReviewFromHome = isReviewMode && userAns === null;
              // In review mode from homepage, show correct answer as selected
              const displayAnswer = isReviewFromHome
                ? q.type === "fill"
                  ? (q.correct as string[])[0]
                  : q.type === "match" && q.pairs
                    ? JSON.stringify(Object.fromEntries(q.pairs.map((p) => [p.term, p.match])))
                    : String(q.correct)
                : userAns;
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  total={shuffledQuestions.length}
                  userAnswer={displayAnswer}
                  onAnswer={() => {}}
                  showFeedback={true}
                  isCorrect={isReviewFromHome ? true : (userAns != null ? checkAnswer(q, userAns) : false)}
                  showResource={true}
                />
              );
            })}
            <div className="flex justify-center">
              <button
                onClick={isReviewMode || attemptNumber % 2 === 0 ? () => navigate("/") : handleFinishReview}
                className="px-6 py-2.5 bg-amber-700 text-white rounded-lg font-medium text-sm hover:bg-amber-800"
              >
                {isReviewMode || attemptNumber % 2 === 0 ? "🧠 Back to cAMP Quizzes" : "See Results"}
              </button>
            </div>
          </div>
        )}

        {phase === "results" && (
          <QuizResults
            score={score}
            total={quiz.questions.length}
            passed={passed}
            attemptNumber={attemptNumber}
            timeSpent={timer.getElapsed()}
            onRetry={!passed && attemptNumber < MAX_ATTEMPTS ? handleRetry : undefined}
            onBackToQuizzes={() => navigate("/")}
          />
        )}
      </main>

      {/* Tier Unlock Modal */}
      {tierUnlock && (
        <TierUnlockModal
          tierIndex={tierUnlock.tierIndex}
          totalXp={tierUnlock.totalXp}
          leaderboardPosition={tierUnlock.position}
          onDismiss={() => setTierUnlock(null)}
        />
      )}
    </div>
  );
}

function IntroScreen({
  quiz,
  quizId,
  onStart,
  attemptNumber,
  hasRole,
  roleLoading = false,
}: {
  quiz: any;
  quizId: string;
  onStart: () => void;
  attemptNumber: number;
  hasRole: boolean;
  roleLoading?: boolean;
}) {
  const quizEmoji = QUIZ_EMOJIS[quiz.id] ?? "📚";
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {quizEmoji} cAMP Quiz
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Test your understanding of <strong>{quiz.title}</strong>.
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="font-semibold text-slate-900">10 Questions</p>
            <p className="text-slate-500 text-xs">Multiple formats</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="font-semibold text-slate-900">⏱️ 18 Minutes</p>
            <p className="text-slate-500 text-xs">Time limit</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="font-semibold text-slate-900">🎯 {PASS_THRESHOLD}% to Pass</p>
            <p className="text-slate-500 text-xs">8/10 correct</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="font-semibold text-slate-900">🧗 2 Attempts</p>
            <p className="text-slate-500 text-xs">
              {attemptNumber <= 2 ? `Attempt ${attemptNumber}` : "Complete"}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="font-semibold text-slate-900">🔄 2 Retakes</p>
            <p className="text-slate-500 text-xs">
              {attemptNumber > 2 ? `Retake ${attemptNumber - 2}` : "Optional practice"}
            </p>
          </div>
        </div>

      </div>

      <CampGear quizId={quizId} />

      <div className="flex flex-col gap-3">
        <button
          onClick={onStart}
          disabled={!hasRole || roleLoading}
          className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {roleLoading ? "Loading..." : attemptNumber === 4 ? "🪨 Final Try" : attemptNumber === 3 ? "🍂 Start Retake" : attemptNumber === 2 ? "🍃 Try Again" : "👣 Begin Quiz"}
        </button>
        <button
          onClick={() => window.location.href = "/"}
          className="w-full py-2.5 text-amber-700 border border-amber-300 bg-amber-50 rounded-lg font-medium text-sm hover:bg-amber-100 transition-colors"
        >
          🧠 Back to cAMP Quizzes
        </button>
      </div>
    </div>
  );
}

function TimerDisplay({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const percentLeft = (secondsLeft / totalSeconds) * 100;
  const urgency = percentLeft <= 10 ? "text-red-500" : percentLeft <= 25 ? "text-amber-500" : "text-slate-700";

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            percentLeft <= 10 ? "bg-red-500" : percentLeft <= 25 ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>
      <span className={`font-mono text-sm font-medium ${urgency}`}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

function ReviewStats({
  attempts,
  incorrectQuestions,
}: {
  attempts: any[];
  incorrectQuestions: any[];
}) {
  const bestAttempt = attempts.reduce((best, a) => (a.score > best.score ? a : best), attempts[0]);
  const bestScore = bestAttempt.score;
  const total = bestAttempt.total_questions;
  const percentage = Math.round((bestScore / total) * 100);
  const attemptsUsed = attempts.length;

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <div className="flex gap-4 mb-3">
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-slate-900">{percentage}%</p>
          <p className="text-xs text-slate-500">Best Score</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-slate-900">{bestScore}/{total}</p>
          <p className="text-xs text-slate-500">Correct</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-slate-900">{attemptsUsed}</p>
          <p className="text-xs text-slate-500">Attempt{attemptsUsed > 1 ? "s" : ""}</p>
        </div>
      </div>
      {incorrectQuestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1.5">
            ⚠️ Questions you initially got wrong ({incorrectQuestions.length}):
          </p>
          <ul className="space-y-1">
            {incorrectQuestions.map((q, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="text-red-400 flex-shrink-0">✗</span>
                <span className="line-clamp-2">{q.question_text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
