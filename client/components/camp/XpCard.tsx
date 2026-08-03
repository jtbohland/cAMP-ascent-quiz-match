import { useSuperblocksUser } from "@superblocksteam/library";
import { useApiData } from "@/hooks/useApiData.js";

export default function XpCard() {
  const user = useSuperblocksUser();
  const userEmail = user?.email ?? "";

  const { data, loading } = useApiData(
    "CampGetUserXP",
    { userEmail },
    { enabled: !!userEmail }
  );

  if (loading || !data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
        <div className="h-4 bg-slate-200 rounded w-full mb-2" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
      </div>
    );
  }

  const { totalXp, tier, rank, totalUsers, quizzesCompleted, pinnacleThreshold, breakdown, earnedBonuses } = data;

  // Progress bar calculation
  const nextTierMin = tier.max + 1;
  const isMaxTier = tier.name === "Pinnacle Achiever";
  const progressPercent = isMaxTier
    ? 100
    : Math.min(100, ((totalXp - tier.min) / (tier.max - tier.min + 1)) * 100);

  const nextTierLabel = isMaxTier
    ? null
    : totalXp <= 75
      ? "🥾 Trailblazer"
      : totalXp <= 150
        ? "🧗🏼 Summit Seeker"
        : "🏔️✨ Pinnacle Achiever";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tier.emoji}</span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{tier.name}</h3>
            <p className="text-xs text-slate-500">
              Rank #{rank} of {totalUsers} • {quizzesCompleted} quizzes completed
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-indigo-600">{totalXp} XP</p>
          {!isMaxTier && (
            <p className="text-xs text-slate-500">{nextTierMin - totalXp} to next tier</p>
          )}
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{tier.emoji} {tier.min} XP</span>
          {isMaxTier ? (
            <span>🏔️✨ Pinnacle!</span>
          ) : (
            <span>{nextTierLabel} {tier.max + 1} XP</span>
          )}
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-indigo-500 to-purple-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* XP Breakdown */}
      <div className="flex gap-4 text-xs text-slate-600">
        <span>📝 Core: {breakdown.core}</span>
        <span>🏆 Milestones: {breakdown.milestones}</span>
        <span>⚡ Bonuses: {breakdown.bonuses}</span>
      </div>

      {/* Earned Bonuses (show top ones) */}
      {earnedBonuses.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-700 mb-1.5">Earned Bonuses</p>
          <div className="flex flex-wrap gap-1.5">
            {earnedBonuses.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800"
              >
                {b.emoji} {b.name}
                {b.count > 1 && <span className="text-amber-600 font-medium">×{b.count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
