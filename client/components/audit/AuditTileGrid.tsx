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
                text-left rounded-xl overflow-hidden transition-all
                ${canAccess
                  ? "bg-white border-2 border-green-200 hover:border-green-400 hover:shadow-md cursor-pointer"
                  : "bg-gray-50 border-2 border-gray-200 opacity-60 cursor-not-allowed"}
                ${progress.pct === 100 ? "border-green-400 bg-green-50" : ""}
              `}
            >
              {/* Dark orange header bar */}
              <div className="bg-amber-700 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{emoji}</span>
                  <span className="text-xs font-bold text-amber-100 uppercase tracking-wide">
                    {topic.day ?? topic.quiz_id}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  progress.pct === 100
                    ? "bg-green-100 text-green-700"
                    : progress.pct > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-white/20 text-white"
                }`}>
                  ● {progress.label}
                </span>
              </div>

              {/* Title */}
              <div className="px-4 pt-3 pb-1">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                  {topic.quiz_topic}
                </h3>
              </div>

              {/* Path tag + last activity */}
              <div className="px-4 pb-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors.bg} ${tagColors.text}`}>
                  {tag}
                </span>
                <span className="text-xs text-gray-400">
                  {formatLastActivity(topic.last_activity)}
                </span>
              </div>

              {/* SME names */}
              <div className="px-4 pb-4 text-xs text-gray-600 space-y-0.5">
                {topic.smes.split("\n").map((sme, i) => {
                  const [name, ...titleParts] = sme.split(" · ");
                  const title = titleParts.join(" · ");
                  const isCurrentUser = name.toLowerCase().trim() === currentSmeName.toLowerCase();
                  return (
                    <div key={i} className={isCurrentUser ? "text-amber-700" : ""}>
                      <span className="font-semibold">{name}</span>
                      {title && <span className="text-gray-400"> · {title}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Lock indicator for non-assigned */}
              {!canAccess && (
                <div className="px-4 pb-3 text-xs text-gray-400 flex items-center gap-1">
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
