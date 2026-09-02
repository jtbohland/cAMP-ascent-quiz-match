import { RolePill, RegionPill } from "@/components/camp/pills.js";

const RANK_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface LeaderboardEntry {
  rank: number;
  userName: string;
  userEmail: string;
  userRole: string;
  region: string;
  totalXp: number;
  maxXp: number;
  tier: { name: string; emoji: string };
  quizzesCompleted: number;
  firstAttemptPasses: number;
}

export default function LeaderboardTable({
  entries,
  currentUserEmail,
  showRole = true,
}: {
  entries: LeaderboardEntry[];
  currentUserEmail: string;
  showRole?: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50">
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
            #
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Name
          </th>
          {showRole && (
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Role
            </th>
          )}
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Geo
          </th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            XP
          </th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quizzes
          </th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            1st Pass
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tier
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {entries.map((entry) => {
          const isCurrentUser =
            entry.userEmail === currentUserEmail;
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
                <span
                  className={`font-bold ${isTop3 ? "text-lg" : "text-slate-500"}`}
                >
                  {RANK_EMOJI[entry.rank] ?? `#${entry.rank}`}
                </span>
              </td>

              {/* Name */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`font-semibold ${isCurrentUser ? "text-indigo-900" : "text-slate-900"}`}
                >
                  {entry.userName ||
                    entry.userEmail.split("@")[0]}
                </span>
                {isCurrentUser && (
                  <span className="ml-2 text-xs font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                    You
                  </span>
                )}
              </td>

              {/* Role */}
              {showRole && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <RolePill role={entry.userRole} />
                </td>
              )}

              {/* Geo */}
              <td className="px-4 py-3 whitespace-nowrap">
                <RegionPill region={entry.region} />
              </td>

              {/* XP — number with "of ~max" subtext */}
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <div className="flex flex-col items-center">
                  <span
                    className={`font-bold text-base ${isCurrentUser ? "text-indigo-700" : "text-slate-900"}`}
                  >
                    {entry.totalXp}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    of ~{entry.maxXp}
                  </span>
                </div>
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
                  <span className="text-base">
                    {entry.tier.emoji}
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {entry.tier.name}
                  </span>
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
