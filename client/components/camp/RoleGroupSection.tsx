import { useState } from "react";
import LeaderboardTable from "./LeaderboardTable.js";

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
  avgTimeSeconds: number | null;
}

// Role group display config
const ROLE_GROUP_CONFIG: Record<
  string,
  { label: string; emoji: string; bgColor: string; textColor: string }
> = {
  "Account Executives": {
    label: "Account Executives",
    emoji: "💰",
    bgColor: "bg-emerald-600",
    textColor: "text-white",
  },
  SDRs: {
    label: "SDRs",
    emoji: "📞",
    bgColor: "bg-purple-600",
    textColor: "text-white",
  },
  PSMs: {
    label: "PSMs",
    emoji: "🤝",
    bgColor: "bg-orange-600",
    textColor: "text-white",
  },
  Renewals: {
    label: "Renewals",
    emoji: "🐦‍🔥",
    bgColor: "bg-yellow-600",
    textColor: "text-white",
  },
  "Velocity Promo": {
    label: "Velocity Promo",
    emoji: "🚀",
    bgColor: "bg-amber-600",
    textColor: "text-white",
  },
};

const DEFAULT_CONFIG = {
  label: "Other",
  emoji: "📋",
  bgColor: "bg-slate-600",
  textColor: "text-white",
};

/** Map a user role to its group key */
export function getRoleGroupKey(role: string): string {
  if (
    role === "Velocity AE" ||
    role === "Emerging AE" ||
    role === "Majors AE" ||
    role === "Strat AE"
  )
    return "Account Executives";
  if (role === "SDR") return "SDRs";
  if (role === "PSM") return "PSMs";
  if (role === "Renewals") return "Renewals";
  if (role === "SDR → Velocity AE Promo") return "Velocity Promo";
  return "Account Executives"; // fallback
}

/** Ordered role groups for display */
export const ROLE_GROUP_ORDER = [
  "Account Executives",
  "SDRs",
  "PSMs",
  "Renewals",
  "Velocity Promo",
];

export default function RoleGroupSection({
  groupKey,
  entries,
  currentUserEmail,
}: {
  groupKey: string;
  entries: LeaderboardEntry[];
  currentUserEmail: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = ROLE_GROUP_CONFIG[groupKey] ?? DEFAULT_CONFIG;

  // Re-rank within this group
  const ranked = entries
    .sort((a, b) => b.totalXp - a.totalXp)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  if (ranked.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-5 py-3 ${config.bgColor} ${config.textColor} transition-colors hover:opacity-90`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{config.emoji}</span>
          <span className="text-sm font-bold">{config.label}</span>
          <span className="text-xs opacity-80">({ranked.length})</span>
        </div>
        <span className="text-xs opacity-80">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Table body */}
      {expanded && (
        <LeaderboardTable
          entries={ranked}
          currentUserEmail={currentUserEmail}
          showRole={groupKey === "Account Executives"}
        />
      )}
    </div>
  );
}
