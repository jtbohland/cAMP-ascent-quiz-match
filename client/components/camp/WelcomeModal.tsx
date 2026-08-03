interface WelcomeModalProps {
  userName: string;
  onDismiss: () => void;
}

export default function WelcomeModal({ userName, onDismiss }: WelcomeModalProps) {
  const firstName = userName.split(" ")[0] || "Climber";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-6 text-center">
          <div className="text-4xl mb-2">🧭</div>
          <h2 className="text-2xl font-bold text-white">Welcome, {firstName}!</h2>
          <p className="text-amber-100 text-sm mt-1">Let's unpack your cAMP Quiz Gear</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl flex-shrink-0">📝</span>
            <div>
              <p className="font-semibold text-gray-800">Daily Quizzes</p>
              <p className="text-sm text-gray-600">
                15 content-retention quizzes — one for each day of your Ascent. Test what you've learned from the Guide and Clips.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl flex-shrink-0">⭐</span>
            <div>
              <p className="font-semibold text-gray-800">Earn XP & Climb Tiers</p>
              <p className="text-sm text-gray-600">
                Score points on every quiz. Earn bonuses for speed, accuracy, streaks, and more. Climb from Base Camper to Pinnacle Achiever.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl flex-shrink-0">🏆</span>
            <div>
              <p className="font-semibold text-gray-800">Leaderboard & Badges</p>
              <p className="text-sm text-gray-600">
                Compete with your fellow cAMPers. Unlock badges like Ace 💯, Speed ⚡, Hot Streak 🔥, and Clean Sweep 🧹.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-xl flex-shrink-0">✨</span>
            <div>
              <p className="text-sm text-amber-900">
                <strong>Quizzes, Clips, and Wheel & Deal</strong> all include XP, bonus opportunities, and leaderboards — keep ascending alongside your fellow cAMPers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-center text-xs text-gray-500 mb-3">
            Questions, feedback, or something not working? Reach out — and keep flagging issues as you go.
          </p>
          <button
            onClick={onDismiss}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            ⛰️ Begin Your Ascent
          </button>
        </div>
      </div>
    </div>
  );
}
