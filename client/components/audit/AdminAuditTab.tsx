import { useNavigate } from "react-router";
import { useApiData } from "@/hooks/useApiData.js";
import { QUIZ_EMOJIS } from "@/data/quizzes/index.js";

const PATH_TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "AE / PSM / Renewals": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  SDR: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "All Roles": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
};

export default function AdminAuditTab() {
  const navigate = useNavigate();
  const { data, loading, fetching, isError, error } = useApiData("AuditGetDashboard", {});

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        Failed to load audit data: {(error as { message?: string })?.message ?? "Unknown error"}
      </div>
    );
  }

  if (!data) return null;

  const topics = data.topics;
  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.signoff_count > 0).length;

  return (
    <div className={fetching && !loading ? "opacity-70" : ""}>
      {/* Link to SME view */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/audit")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
        >
          🍁 View SME Landing Page →
        </button>
        <span className="text-sm text-gray-500">
          {completedTopics} / {totalTopics} topics signed off
        </span>
      </div>

      {/* Audit Progress Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_140px_180px_120px_80px] gap-2 px-5 py-3 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span>Topic</span>
          <span>Path</span>
          <span>SMEs</span>
          <span>Status</span>
          <span className="text-right">Sign-offs</span>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-gray-100">
          {topics.map((topic) => {
            const tag = topic.path_tag ?? "All Roles";
            const tagColors = PATH_TAG_COLORS[tag] ?? PATH_TAG_COLORS["All Roles"];
            const emoji = QUIZ_EMOJIS[topic.quiz_id] ?? "📝";
            const pct = topic.question_count > 0
              ? Math.round((topic.approved_count / topic.question_count) * 100)
              : 0;

            return (
              <div
                key={topic.quiz_id}
                className="grid grid-cols-[1fr_140px_180px_120px_80px] gap-2 px-5 py-3.5 items-center hover:bg-orange-50/40 transition-colors"
              >
                {/* Topic — emoji + day prefix + linked name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg flex-shrink-0">{emoji}</span>
                  <button
                    onClick={() => navigate("/audit")}
                    className="text-left min-w-0"
                  >
                    <span className="text-sm">
                      {topic.day && (
                        <span className="font-semibold text-gray-900">{topic.day}: </span>
                      )}
                      <span className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                        {topic.quiz_topic}
                      </span>
                    </span>
                  </button>
                </div>

                {/* Path pill */}
                <div>
                  <span className={`inline-flex text-xs px-2.5 py-0.5 rounded-full font-medium border ${tagColors.bg} ${tagColors.text} ${tagColors.border}`}>
                    {tag}
                  </span>
                </div>

                {/* SMEs — compact list */}
                <div className="space-y-0.5">
                  {topic.smes.split("\n").map((sme, i) => {
                    const name = sme.split(" · ")[0];
                    const isRegistered = topic.registered_count > i;
                    return (
                      <div key={i} className="text-xs flex items-center gap-1">
                        <span className="text-gray-700">{name}</span>
                        {isRegistered ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-400 text-[10px]">✗</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status */}
                <div>
                  {topic.signoff_count > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Signed Off
                    </span>
                  ) : pct > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {pct}% approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      Not started
                    </span>
                  )}
                </div>

                {/* Sign-offs */}
                <div className="text-right">
                  {topic.signoff_count > 0 ? (
                    <span className="text-xs text-green-600 font-medium">✅ {topic.signoff_count}</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
