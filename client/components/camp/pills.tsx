/**
 * Colored Role and Region pill components for cAMP analytics.
 */

// ── Role colors ──
const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  SDR:           { bg: "bg-purple-100",  text: "text-purple-500" },
  "Velocity AE": { bg: "bg-violet-100",  text: "text-violet-700" },
  "Emerging AE": { bg: "bg-cyan-100",    text: "text-cyan-700" },
  "Majors AE":   { bg: "bg-blue-100",    text: "text-blue-800" },
  "Strat AE":    { bg: "bg-green-100",   text: "text-green-700" },
  PSM:           { bg: "bg-orange-100",   text: "text-orange-700" },
  Renewals:      { bg: "bg-yellow-100",   text: "text-yellow-700" },
  Admin:         { bg: "bg-gray-100",     text: "text-gray-600" },
};

const DEFAULT_ROLE_STYLE = { bg: "bg-gray-100", text: "text-gray-600" };

// ── Region colors ──
const REGION_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  NAMER: { bg: "bg-blue-100",   text: "text-blue-700",   emoji: "🌎" },
  EMEA:  { bg: "bg-red-100",    text: "text-red-700",    emoji: "🌍" },
  AAPJ:  { bg: "bg-yellow-100", text: "text-yellow-700", emoji: "🌏" },
};

const DEFAULT_REGION_STYLE = { bg: "bg-gray-100", text: "text-gray-600", emoji: "🌐" };

// ── Components ──

export function RolePill({ role }: { role: string }) {
  const style = ROLE_STYLES[role] ?? DEFAULT_ROLE_STYLE;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {role}
    </span>
  );
}

export function RegionPill({ region }: { region: string }) {
  const style = REGION_STYLES[region] ?? DEFAULT_REGION_STYLE;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
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
