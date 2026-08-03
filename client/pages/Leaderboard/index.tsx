import { useNavigate } from "react-router";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApiData } from "@/hooks/useApiData.js";
import { RolePill, RegionPill } from "@/components/camp/pills.js";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const user = useSuperblocksUser();
  const currentUserEmail = user?.email ?? "";

  const { data, loading } = useApiData("CampGetLeaderboard", {});

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-amber-700 border-b border-amber-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">🏆 Leaderboard</h1>
              <p className="text-sm text-amber-100 mt-1">
                See how you stack up against your fellow campers
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-sm font-medium text-amber-100 border border-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
            >
              🧠 Back to cAMP Quizzes
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-200 rounded-full" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="ml-auto h-4 bg-slate-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.leaderboard || data.leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏕️</p>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No campers yet!</h3>
            <p className="text-sm text-slate-600">
              Be the first to earn XP by completing a quiz.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.leaderboard.map((entry) => {
              const isCurrentUser = entry.userEmail === currentUserEmail;
              const rankDisplay =
                entry.rank === 1
                  ? "🥇"
                  : entry.rank === 2
                    ? "🥈"
                    : entry.rank === 3
                      ? "🥉"
                      : `#${entry.rank}`;

              return (
                <div
                  key={entry.userEmail}
                  className={`rounded-lg border p-4 transition-colors ${
                    isCurrentUser
                      ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-10 text-center">
                      <span className={`text-lg font-bold ${entry.rank <= 3 ? "" : "text-slate-500 text-sm"}`}>
                        {rankDisplay}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${isCurrentUser ? "text-indigo-900" : "text-slate-900"}`}>
                          {entry.userName || entry.userEmail.split("@")[0]}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entry.quizzesCompleted} quizzes • {entry.firstAttemptPasses} first-attempt passes
                      </p>
                    </div>

                    {/* Tier Badge + Role/Region pills */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{entry.tier.emoji}</span>
                        <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                          {entry.tier.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <RolePill role={entry.userRole} />
                        <RegionPill region={entry.region} />
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right min-w-[60px]">
                      <p className={`text-sm font-bold ${isCurrentUser ? "text-indigo-700" : "text-slate-900"}`}>
                        {entry.totalXp} XP
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
