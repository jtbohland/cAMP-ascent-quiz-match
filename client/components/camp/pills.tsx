/**
 * Colored Role and Region pill components for cAMP analytics.
 */

// ── Role colors ──
const ROLE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Velocity AE": { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  "Emerging AE": { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
  "Majors AE":   { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  "Strat AE":    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  SDR:           { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200" },
  PSM:           { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  Renewals:      { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-300" },
  Admin:         { bg: "bg-gray-100",   text: "text-gray-600",    border: "border-gray-200" },
};

const DEFAULT_ROLE_STYLE = { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };

// ── Region colors ──
const REGION_STYLES: Record<string, { bg: string; text: string; border: string; emoji: string }> = {
  NAMER: { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   emoji: "🌎" },
  EMEA:  { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    emoji: "🌍" },
  AAPJ:  { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300", emoji: "🌏" },
};

const DEFAULT_REGION_STYLE = { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", emoji: "🌐" };

// ── Components ──

export function RolePill({ role }: { role: string }) {
  const style = ROLE_STYLES[role] ?? DEFAULT_ROLE_STYLE;
  return (
    <span className={`inline-flex items-center whitespace-nowrap px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {role}
    </span>
  );
}

export function RegionPill({ region }: { region: string }) {
  const style = REGION_STYLES[region] ?? DEFAULT_REGION_STYLE;
  return (
    <span className={`inline-flex items-center gap-0.5 whitespace-nowrap px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {style.emoji} {region}
    </span>
  );
}

/** Format an ISO timestamp as a friendly date label. */
function formatActivityDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LastActivityPill({ date }: { date: string }) {
  if (!date) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
      🕓 {formatActivityDate(date)}
    </span>
  );
}

export function ManagerPill({ name }: { name: string }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      💼 {name}
    </span>
  );
}
