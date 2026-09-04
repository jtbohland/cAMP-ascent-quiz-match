import { useNavigate } from "react-router";
import { useApiData } from "@/hooks/useApiData.js";

const PATH_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  "AE / PSM / Renewals": { bg: "bg-green-100", text: "text-green-700" },
  SDR: { bg: "bg-purple-100", text: "text-purple-700" },
  "All Roles": { bg: "bg-blue-100", text: "text-blue-700" },
  Special: { bg: "bg-orange-100", text: "text-orange-700" },
};

export default function AdminAuditTab() {
  const navigate = useNavigate();
  const { data, loading, fetching, isError, error } = useApiData("AuditGetDashboard", {});

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>;
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
          See the full tile grid and click into any topic to review content
        </span>
      </div>

      {/* Audit Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📊 Audit Progress</h3>
          <span className="text-sm text-gray-500">
            {completedTopics} / {totalTopics} complete
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                <th className="pb-3 pr-4">Topic</th>
                <th className="pb-3 pr-4">Path</th>
                <th className="pb-3 pr-4">SMEs</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Sign-offs</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => {
                const tag = topic.path_tag ?? "All Roles";
                const tagColors = PATH_TAG_COLORS[tag] ?? PATH_TAG_COLORS["All Roles"];
                const pct = topic.question_count > 0
                  ? Math.round((topic.approved_count / topic.question_count) * 100)
                  : 0;
                const statusLabel = topic.signoff_count > 0
                  ? "Signed Off"
                  : pct > 0
                  ? `In Progress · ${pct}%`
                  : "Not Started · 0%";

                return (
                  <tr key={topic.quiz_id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => navigate("/audit")}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {topic.day ? `${topic.day}: ` : ""}{topic.quiz_topic}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors.bg} ${tagColors.text}`}>
                        {tag}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="space-y-1">
                        {topic.smes.split("\n").map((sme, i) => {
                          const name = sme.split(" · ")[0];
                          const isRegistered = topic.registered_count > i; // approximate
                          return (
                            <div key={i} className="text-xs flex items-center gap-1">
                              <span>{i + 1}.</span>
                              <span>{name}</span>
                              {isRegistered ? (
                                <span className="text-xs text-green-600 bg-green-50 px-1 rounded">✓ Reg</span>
                              ) : (
                                <span className="text-xs text-red-500 bg-red-50 px-1 rounded">✗ Not reg</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium ${
                        topic.signoff_count > 0 ? "text-green-600" : pct > 0 ? "text-amber-600" : "text-gray-500"
                      }`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-3">
                      {topic.signoff_count > 0 ? (
                        <span className="text-xs text-green-600">✅ {topic.signoff_count}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
