import { RolePill, RegionPill } from "./pills.js";

type LeaderEntry = {
  rank: number;
  userName: string;
  userRole?: string;
  region?: string;
  totalXp: number;
  tier: { name: string; emoji: string };
  quizzesCompleted: number;
  firstAttemptPasses: number;
};

export default function LeaderboardMini({ leaderboard }: { leaderboard: LeaderEntry[] }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
        No leaderboard data yet. XP rankings will appear once learners complete quizzes.
      </div>
    );
  }

  const top = leaderboard.slice(0, 10);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-50">
        {top.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center gap-3 px-4 py-3 ${entry.rank <= 3 ? "bg-amber-50/40" : ""}`}
          >
            <span className="text-lg w-8 text-center flex-shrink-0">
              {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className="text-lg flex-shrink-0" title={entry.tier.name}>
              {entry.tier.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{entry.userName}</p>
              <p className="text-xs text-slate-500">
                {entry.tier.name} • {entry.quizzesCompleted} quiz{entry.quizzesCompleted !== 1 ? "zes" : ""} completed
              </p>
              <div className="flex gap-1 mt-1">
                {entry.userRole && <RolePill role={entry.userRole} />}
                {entry.region && <RegionPill region={entry.region} />}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-amber-700 text-lg">{entry.totalXp}</p>
              <p className="text-xs text-slate-400">XP</p>
            </div>
          </div>
        ))}
      </div>
      {leaderboard.length > 10 && (
        <div className="px-4 py-2 text-center text-xs text-slate-400 border-t border-slate-100 bg-slate-50">
          Showing top 10 of {leaderboard.length} learners
        </div>
      )}
    </div>
  );
}
