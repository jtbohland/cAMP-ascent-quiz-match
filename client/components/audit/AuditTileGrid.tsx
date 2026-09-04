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

function getProgress(topic: AuditTopic): { pct: number; label: string } {
  if (topic.signoff_count > 0) return { pct: 100, label: "Signed Off" };
  if (topic.question_count === 0) return { pct: 0, label: "Not Started · 0%" };
  const pct = Math.round((topic.approved_count / topic.question_count) * 100);
  if (pct === 0) return { pct: 0, label: "Not Started · 0%" };
  return { pct, label: `In Progress · ${pct}%` };
}

function formatLastActivity(dateStr: string | null): string {
  if (!dateStr) return "No activity yet";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
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

          return (
            <button
              key={topic.quiz_id}
              onClick={() => canAccess && onSelectTopic(topic.quiz_id)}
              disabled={!canAccess}
              className={`
                text-left rounded-xl border-2 p-4 transition-all
                ${canAccess
                  ? "border-green-200 bg-white hover:border-green-400 hover:shadow-md cursor-pointer"
                  : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"}
                ${progress.pct === 100 ? "border-green-400 bg-green-50" : ""}
              `}
            >
              {/* Header bar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                    {topic.day ?? topic.quiz_id}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  progress.pct === 100
                    ? "bg-green-100 text-green-700"
                    : progress.pct > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  ● {progress.label}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 text-sm mb-3 line-clamp-1">
                {topic.quiz_topic}
              </h3>

              {/* Path tag + last activity */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors.bg} ${tagColors.text}`}>
                  {tag}
                </span>
                <span className="text-xs text-gray-400">
                  {formatLastActivity(topic.last_activity)}
                </span>
              </div>

              {/* SME names */}
              <div className="text-xs text-gray-600 space-y-0.5">
                {topic.smes.split("\n").map((sme, i) => (
                  <div key={i} className={sme.toLowerCase().includes(currentSmeName.toLowerCase()) ? "font-semibold text-amber-700" : ""}>
                    {sme}
                  </div>
                ))}
              </div>

              {/* Lock indicator for non-assigned */}
              {!canAccess && (
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  <span>🔒</span> Assigned to other SMEs
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
