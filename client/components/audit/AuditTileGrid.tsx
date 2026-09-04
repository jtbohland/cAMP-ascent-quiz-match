import { QUIZ_EMOJIS } from "@/data/quizzes/index.js";

interface AuditTopic {
  quiz_id: string;
  quiz_topic: string;
  day: string | null;
  title: string | null;
  week: string | null;
  path_tag: string | null;
  smes: string;
  sme_count: number;
  registered_count: number;
  question_count: number;
  approved_count: number;
  gear_total: number;
  gear_reviewed: number;
  signoff_count: number;
  last_activity: string | null;
}

interface AuditTileGridProps {
  topics: AuditTopic[];
  currentSmeName: string;
  isAdmin: boolean;
  onSelectTopic: (quizId: string) => void;
}

const PATH_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  "AE / PSM / Renewals": { bg: "bg-green-100", text: "text-green-700" },
  SDR: { bg: "bg-purple-100", text: "text-purple-700" },
  "All Roles": { bg: "bg-blue-100", text: "text-blue-700" },
  Special: { bg: "bg-orange-100", text: "text-orange-700" },
};

function getProgress(topic: AuditTopic): { pct: number; status: "complete" | "in_progress" | "not_started"; label: string } {
  if (topic.signoff_count > 0) return { pct: 100, status: "complete", label: "Signed Off · 100%" };
  if (topic.question_count === 0) return { pct: 0, status: "not_started", label: "Not Started · 0%" };
  const pct = Math.round((topic.approved_count / topic.question_count) * 100);
  if (pct === 0) return { pct: 0, status: "not_started", label: "Not Started · 0%" };
  if (pct >= 100) return { pct: 100, status: "complete", label: "Complete · 100%" };
  return { pct, status: "in_progress", label: `In Progress · ${pct}%` };
}

function getActivityColor(dateStr: string | null): string {
  if (!dateStr) return "bg-gray-100 text-gray-500";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 7) return "bg-emerald-50 text-emerald-700";
  if (days <= 14) return "bg-yellow-50 text-yellow-700";
  if (days <= 21) return "bg-orange-50 text-orange-700";
  return "bg-red-50 text-red-700";
}

function formatLastActivity(dateStr: string | null): string {
  if (!dateStr) return "No activity yet";
  return `Last activity: ${new Date(dateStr).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}`;
}

function isSmeAssigned(topic: AuditTopic, smeName: string): boolean {
  return topic.smes.toLowerCase().includes(smeName.toLowerCase());
}

export default function AuditTileGrid({ topics, currentSmeName, isAdmin, onSelectTopic }: AuditTileGridProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        All Quiz Topics ({topics.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => {
          const assigned = isSmeAssigned(topic, currentSmeName);
          const canAccess = isAdmin || assigned;
          const progress = getProgress(topic);
          const emoji = QUIZ_EMOJIS[topic.quiz_id] ?? "📝";
          const tag = topic.path_tag ?? "All Roles";
          const tagColors = PATH_TAG_COLORS[tag] ?? PATH_TAG_COLORS["All Roles"];
          const activityColor = getActivityColor(topic.last_activity);

          const statusPill = progress.status === "complete"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : progress.status === "in_progress"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-gray-100 text-gray-600 border-gray-200";

          const statusDot = progress.status === "complete"
            ? "bg-emerald-500"
            : progress.status === "in_progress"
            ? "bg-amber-500"
            : "bg-gray-400";

          return (
            <button
              key={topic.quiz_id}
              onClick={() => canAccess && onSelectTopic(topic.quiz_id)}
              disabled={!canAccess}
              className={`
                text-left rounded-xl overflow-hidden transition-all
                ${canAccess
                  ? "bg-white border border-gray-200 hover:shadow-lg hover:border-amber-400 cursor-pointer"
                  : "bg-gray-50 border border-gray-100 opacity-75 cursor-default"}
              `}
            >
              {/* ── 1. Header Bar ── */}
              <div className="bg-amber-700 px-4 py-2.5 flex items-center justify-between gap-2">
                {/* Left: emoji + text stack */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg flex-shrink-0">{emoji}</span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-amber-300 uppercase tracking-[0.05em]">
                      {topic.day ?? topic.quiz_id}
                    </div>
                    <div className="text-sm font-bold text-white leading-[1.25] overflow-hidden text-ellipsis whitespace-nowrap">
                      {topic.quiz_topic}
                    </div>
                  </div>
                </div>
                {/* Right: status pill */}
                <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusPill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                  {progress.label}
                </span>
              </div>

              {/* ── 2. Body ── */}
              <div className="px-4 py-3 flex flex-col gap-2">
                {/* Pills row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${tagColors.bg} ${tagColors.text}`}>
                    {tag}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${activityColor}`}>
                    {formatLastActivity(topic.last_activity)}
                  </span>
                </div>

                {/* SME list */}
                <div className="text-xs space-y-0.5">
                  {topic.smes.split("\n").map((sme, i) => {
                    const [name, ...titleParts] = sme.split(" · ");
                    const title = titleParts.join(" · ");
                    const isCurrentUser = name.toLowerCase().trim() === currentSmeName.toLowerCase();
                    return (
                      <div key={i} className={isCurrentUser ? "text-amber-700" : "text-gray-700"}>
                        <span className="font-medium">{name}</span>
                        {title && <span className="text-gray-400"> · {title}</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Assigned-to-you indicator */}
                {assigned && !isAdmin && (
                  <div className="border-t border-gray-100 pt-2 text-[10px] font-bold text-amber-700">
                    🎯 Assigned to you
                  </div>
                )}

                {/* Lock indicator */}
                {!canAccess && (
                  <div className="border-t border-gray-100 pt-2 text-[10px] text-gray-400">
                    🔒 Assigned to other SMEs
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
