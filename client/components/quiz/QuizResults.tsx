import { PASS_THRESHOLD, MAX_ATTEMPTS } from "@/data/quiz-types.js";

interface QuizResultsProps {
  score: number;
  total: number;
  passed: boolean;
  attemptNumber: number;
  timeSpent: number;
  onRetry?: () => void;
  onBackToQuizzes: () => void;
}

export default function QuizResults({
  score,
  total,
  passed,
  attemptNumber,
  timeSpent,
  onRetry,
  onBackToQuizzes,
}: QuizResultsProps) {
  const percentage = Math.round((score / total) * 100);
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;
  // Show "Try Again" only on odd attempts (1st or 3rd) — after even attempts (2nd or 4th),
  // user goes back to homepage. This prevents getting stuck in a quiz loop.
  const canRetry = !passed && attemptNumber % 2 === 1 && attemptNumber < MAX_ATTEMPTS;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center max-w-lg mx-auto">
      <div
        className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
          passed ? "bg-green-100" : "bg-red-100"
        }`}
      >
        <span className="text-3xl">{passed ? "🏆" : "🧗"}</span>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {passed ? "🌟 Summit Reached!" : "🏕️ Almost there, camper!"}
      </h2>

      <p className="text-slate-600 mb-6">
        {passed
          ? "You've conquered this trail! Your knowledge of this material is solid. Keep ascending! ⛺"
          : canRetry
            ? `You need ${PASS_THRESHOLD}% to summit. Regroup at base camp — you have one more attempt. Hit Try Again!`
            : `You need ${PASS_THRESHOLD}% to pass. Head back to cAMP Quizzes — you can retake anytime to improve your score. 🧠`}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-slate-900">{percentage}%</p>
          <p className="text-xs text-slate-500">Score</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-slate-900">
            {score}/{total}
          </p>
          <p className="text-xs text-slate-500">Correct</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-slate-900">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
          <p className="text-xs text-slate-500">Time</p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors"
          >
            {attemptNumber === 3 ? "🍂 Start Retake" : "🍃 Try Again"}
          </button>
        )}
        {/* Always show "Back to cAMP Quizzes" except on attempt 1 fail (where they must try again) */}
        {(passed || !canRetry || attemptNumber >= 3) && (
          <button
            onClick={onBackToQuizzes}
            className="px-5 py-2.5 bg-amber-700 text-white rounded-lg font-medium text-sm hover:bg-amber-800 transition-colors"
          >
            🧠 Back to cAMP Quizzes
          </button>
        )}
      </div>
    </div>
  );
}
