import { useNavigate } from "react-router";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApiData } from "@/hooks/useApiData.js";
import { RolePill, RegionPill } from "@/components/camp/pills.js";

const RANK_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const user = useSuperblocksUser();
  const currentUserEmail = user?.email ?? "";

  const { data, loading } = useApiData("CampGetLeaderboard", {});

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-amber-700 border-b border-amber-800">
        <div className="max-w-5xl mx-auto px-6 py-6">
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <LeaderboardSkeleton />
        ) : !data?.leaderboard || data.leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏕️</p>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No campers yet!</h3>
            <p className="text-sm text-slate-600">
              Be the first to earn XP by completing a quiz.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Geo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">XP</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Quizzes</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">1st Pass</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.leaderboard.map((entry) => {
                  const isCurrentUser = entry.userEmail === currentUserEmail;
                  const isTop3 = entry.rank <= 3;

                  return (
                    <tr
                      key={entry.userEmail}
                      className={
                        isCurrentUser
                          ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200"
                          : entry.rank === 1
                            ? "bg-green-100"
                            : entry.rank === 2
                              ? "bg-green-50"
                              : entry.rank === 3
                                ? "bg-emerald-50/50"
                                : "hover:bg-slate-50"
                      }
                    >
                      {/* Rank */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-bold ${isTop3 ? "text-lg" : "text-slate-500"}`}>
                          {RANK_EMOJI[entry.rank] ?? `#${entry.rank}`}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-semibold ${isCurrentUser ? "text-indigo-900" : "text-slate-900"}`}>
                          {entry.userName || entry.userEmail.split("@")[0]}
                        </span>
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <RolePill role={entry.userRole} />
                      </td>

                      {/* Geo */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <RegionPill region={entry.region} />
                      </td>

                      {/* XP */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`font-bold ${isCurrentUser ? "text-indigo-700" : "text-slate-900"}`}>
                          {entry.totalXp}
                        </span>
                      </td>

                      {/* Quizzes Taken */}
                      <td className="px-4 py-3 whitespace-nowrap text-center text-slate-700">
                        {entry.quizzesCompleted}
                      </td>

                      {/* 1st Attempt Passes */}
                      <td className="px-4 py-3 whitespace-nowrap text-center text-slate-700">
                        {entry.firstAttemptPasses}
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-base">{entry.tier.emoji}</span>
                          <span className="text-xs font-medium text-slate-600">{entry.tier.name}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded w-16" />
        ))}
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-slate-100 flex items-center gap-4 animate-pulse">
          <div className="w-8 h-4 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded w-28" />
          <div className="h-5 bg-slate-200 rounded-full w-20" />
          <div className="h-5 bg-slate-200 rounded-full w-16" />
          <div className="h-4 bg-slate-200 rounded w-10 ml-auto" />
          <div className="h-4 bg-slate-200 rounded w-8" />
          <div className="h-4 bg-slate-200 rounded w-8" />
          <div className="h-4 bg-slate-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}
