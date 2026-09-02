import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApiData } from "@/hooks/useApiData.js";
import { executeApi } from "@/lib/executeApi.js";
import { QUIZZES, QUIZ_EMOJIS } from "@/data/quizzes/index.js";
import type { Quiz } from "@/data/quiz-types.js";
import { ALL_PATHS, getRolePathId, getPathById, type PathId, type PathConfig } from "@/data/paths.js";
import XpCard from "@/components/camp/XpCard.js";
import SummitModal from "@/components/camp/SummitModal.js";

const ANALYTICS_PASSWORD = "smoreenablement";
const ADMIN_EMAILS = ["jt.bohland@amplitude.com"];

export default function HomePage() {
  const navigate = useNavigate();
  const user = useSuperblocksUser();
  const userEmail = user?.email ?? "";
  const userName = user?.name ?? "";
  const isAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase());

  // Admin path switcher — default is AE
  const [adminPathOverride, setAdminPathOverride] = useState<PathId>("ae");

  // Summit modal state
  const [showSummit, setShowSummit] = useState(false);
  const summitChecked = useRef(false);

  // Track page visit silently on mount (fire-and-forget)
  const visitTracked = useRef(false);
  useEffect(() => {
    if (!userEmail || visitTracked.current) return;
    visitTracked.current = true;
    executeApi("CampTrackVisit", {
      userEmail,
      userName: user?.name ?? "",
    }).catch(() => {
      // Silent — don't disrupt UX
    });
  }, [userEmail, user?.name]);

  // Load the viewer's registration to get their role → path
  const { data: viewerData } = useApiData(
    "CampLookupViewer",
    { userEmail },
    { enabled: !!userEmail }
  );

  const viewerRole = viewerData?.viewer?.user_role ?? "";
  const userPathId = getRolePathId(viewerRole);
  // Admins see the switched path; regular users see their own path
  const activePathId = isAdmin ? adminPathOverride : userPathId;
  const activePath = getPathById(activePathId);

  const { data: progression, loading: progressionLoading, isError: progressionError, refetch: refetchProgression } = useApiData(
    "CampGetUserProgression",
    { userEmail },
    { enabled: !!userEmail }
  );

  // Cache progression in localStorage for resilience against API timeouts
  const CACHE_KEY = `camp_progression_${userEmail}`;
  useEffect(() => {
    if (progression && userEmail) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(progression));
      } catch {
        // localStorage full or unavailable — ignore
      }
    }
  }, [progression, userEmail, CACHE_KEY]);

  // Use live data if available, fall back to cached data on error
  const effectiveProgression = progression ?? (() => {
    if (!userEmail) return null;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  })();

  const passedQuizIds: string[] = effectiveProgression?.passedQuizIds ?? [];
  const completedQuizIds: string[] = effectiveProgression?.completedQuizIds ?? [];
  const retakeQuizIds: string[] = effectiveProgression?.retakeQuizIds ?? [];

  // Fetch XP data for summit modal stats
  const { data: xpData } = useApiData(
    "CampGetUserXP",
    { userEmail },
    { enabled: !!userEmail }
  );

  // Summit modal — check if user has passed all quizzes in their path
  useEffect(() => {
    if (summitChecked.current || !userEmail || passedQuizIds.length === 0) return;
    summitChecked.current = true;

    const SUMMIT_KEY = `summit_celebrated_${userEmail}`;
    const alreadyCelebrated = localStorage.getItem(SUMMIT_KEY);
    const pathQuizCount = activePath.quizOrder.length;

    // Count how many of the user's path quizzes they've passed
    const pathPassedCount = activePath.quizOrder.filter((qid) => passedQuizIds.includes(qid)).length;

    if (pathPassedCount >= pathQuizCount) {
      if (alreadyCelebrated) return;
      localStorage.setItem(SUMMIT_KEY, "true");
      setShowSummit(true);
    }
  }, [userEmail, passedQuizIds, activePath]);

  const fullyFailedQuizIds = completedQuizIds.filter(
    (id: string) => !passedQuizIds.includes(id) && !retakeQuizIds.includes(id)
  );

  // Path-aware unlock: quiz N is unlocked when quiz N-1 in this path's order is completed
  const isQuizUnlocked = useCallback(
    (quizId: string): boolean => {
      if (completedQuizIds.includes(quizId)) return true;
      if (retakeQuizIds.includes(quizId)) return true;
      const idx = activePath.quizOrder.indexOf(quizId);
      if (idx === 0) return true; // First quiz always unlocked
      if (idx < 0) return false;
      const prevQuizId = activePath.quizOrder[idx - 1];
      return completedQuizIds.includes(prevQuizId);
    },
    [completedQuizIds, retakeQuizIds, activePath.quizOrder]
  );

  // Password gate for analytics
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const handleAnalyticsClick = useCallback(() => {
    setShowPasswordModal(true);
    setPassword("");
    setPasswordError(false);
  }, []);

  const handlePasswordSubmit = useCallback(() => {
    if (password === ANALYTICS_PASSWORD) {
      navigate("/analytics");
    } else {
      setPasswordError(true);
    }
  }, [password, navigate]);

  // Build week sections from the active path's week groups
  const pathQuizMap = new Map(QUIZZES.map((q) => [q.id, q]));
  const weekSections = activePath.weekLabels.map((wl) => {
    const quizIds = activePath.weekGroups[wl.key] ?? [];
    const quizzes = quizIds.map((id) => pathQuizMap.get(id)).filter(Boolean) as Quiz[];
    return { label: wl.label, emoji: wl.emoji, quizzes };
  });

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-amber-700 border-b border-amber-800">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                🏔️ cAMP Ascent: Sales
              </h1>
              <p className="text-sm text-amber-100 mt-1">
                🧠 Knowledge Checks — Validate your learning from each session
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/xp")}
                className="px-4 py-2 text-sm font-medium text-amber-100 border border-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
              >
                🔭 XP-lanation
              </button>
              <button
                onClick={() => navigate("/leaderboard")}
                className="px-4 py-2 text-sm font-medium text-amber-100 border border-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={handleAnalyticsClick}
                className="px-4 py-2 text-sm font-medium text-amber-100 border border-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
              >
                📊 View Analytics
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Admin Path Switcher */}
        {isAdmin && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-indigo-900">🔧 Admin: Path Viewer</h3>
                <p className="text-xs text-indigo-600 mt-0.5">Preview quiz grids for each learner path (view-only)</p>
              </div>
              <div className="flex gap-2">
                {ALL_PATHS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAdminPathOverride(p.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      adminPathOverride === p.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                    }`}
                  >
                    {p.emoji} {p.label} ({p.quizOrder.length})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Path Badge for non-admins */}
        {!isAdmin && viewerRole && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
              {activePath.emoji} {activePath.label} — {activePath.quizOrder.length} quizzes
            </span>
          </div>
        )}

        {/* Personal XP Card */}
        <div className="mb-6">
          <XpCard />
        </div>

        {/* Error state — progression API failed and no cached data */}
        {progressionError && !effectiveProgression && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 shadow-sm">
            <h3 className="text-sm font-bold text-amber-900 mb-1">⚠️ Trouble loading your progress</h3>
            <p className="text-sm text-amber-700 mb-3">
              We couldn't reach the server right now. Your quiz data is safe — this is a temporary connection issue.
            </p>
            <button
              onClick={() => refetchProgression()}
              className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* Stale data notice — using cached progress */}
        {progressionError && effectiveProgression && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-blue-700">
              📡 Showing your last-known progress (connection hiccup). Your data is safe.
            </p>
            <button
              onClick={() => refetchProgression()}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-3 flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Before You Begin */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Before you begin</h3>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>📚 Every question is a real field scenario from your session materials. If you completed it, you have everything you need.</li>
            <li>✏️ Fill-in-the-blank is graded generously — the right concept counts, not the exact word.</li>
            <li>🔗 After you complete the quiz you'll see explanations for every question — right or wrong — with links to the source material.</li>
          </ul>
        </div>

        <div className="space-y-8">
          {weekSections.map((week) => (
            <section key={week.label}>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                {week.emoji} {week.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {week.quizzes.map((quiz) => {
                  const unlocked = isQuizUnlocked(quiz.id);
                  const passed = passedQuizIds.includes(quiz.id);
                  const fullyFailed = fullyFailedQuizIds.includes(quiz.id);
                  const retake = retakeQuizIds.includes(quiz.id);
                  const showReview = passed || fullyFailed;
                  return (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      unlocked={unlocked}
                      passed={passed}
                      retake={retake}
                      showReview={showReview}
                      onStart={() =>
                        navigate(
                          showReview
                            ? `/quiz/${quiz.id}?mode=review`
                            : `/quiz/${quiz.id}`
                        )
                      }
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Summit Modal */}
      {showSummit && xpData && (
        <SummitModal
          userName={userName}
          totalXp={xpData.totalXp}
          quizzesPassed={passedQuizIds.length}
          onDismiss={() => setShowSummit(false)}
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">🔒 Analytics Access</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter the admin password to view analytics.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              placeholder="Enter password..."
              className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                passwordError
                  ? "border-red-300 bg-red-50 focus:border-red-400"
                  : "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              }`}
              autoFocus
            />
            {passwordError && (
              <p className="text-xs text-red-600 mt-1.5">Incorrect password. Try again.</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizCard({
  quiz,
  unlocked,
  passed,
  retake,
  showReview,
  onStart,
}: {
  quiz: Quiz;
  unlocked: boolean;
  passed: boolean;
  retake: boolean;
  showReview: boolean;
  onStart: () => void;
}) {
  const emoji = QUIZ_EMOJIS[quiz.id] ?? "📚";
  const isPlaceholder = quiz.isPlaceholder === true;

  // Placeholder quizzes show as "Coming Soon" regardless of unlock state
  if (isPlaceholder) {
    return (
      <div className="rounded-xl border p-5 shadow-sm bg-slate-50 border-slate-200 opacity-80">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            {quiz.day}
          </span>
          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        </div>
        <h3 className="text-base font-semibold text-slate-500 mb-2 leading-snug">
          {emoji} {quiz.title}
        </h3>
        <p className="text-xs text-slate-400 mb-4">Questions being prepared</p>
        <div className="w-full py-2 text-sm font-medium text-slate-400 border border-dashed border-slate-300 rounded-lg text-center">
          🔒 Coming Soon
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-shadow ${
        unlocked
          ? "bg-white border-slate-200 hover:shadow-md"
          : "bg-slate-100 border-slate-200 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
          {quiz.day}
        </span>
        <span className="text-xs text-slate-500">
          {passed ? "✅ Passed" : `${quiz.questions.length} questions`}
        </span>
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2 leading-snug">
        {emoji} {quiz.title}
      </h3>
      <p className="text-xs text-slate-500 mb-4">80% to pass • 18 min • 2 attempts • 2 retakes</p>

      {unlocked ? (
        <button
          onClick={onStart}
          className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
            showReview
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : retake
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {showReview ? "📖 Review Quiz" : retake ? "🔄 Retake Quiz" : "👉🏽 This Way to Quiz"}
        </button>
      ) : (
        <div className="w-full py-2 text-sm font-medium text-slate-400 border border-slate-200 rounded-lg text-center">
          🔒 Pass previous quiz to unlock
        </div>
      )}
    </div>
  );
}
