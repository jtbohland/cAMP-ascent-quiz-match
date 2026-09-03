import { useNavigate } from "react-router";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApiData } from "@/hooks/useApiData.js";
import LeaderboardTable from "@/components/camp/LeaderboardTable.js";
import RoleGroupSection, {
  getRoleGroupKey,
  ROLE_GROUP_ORDER,
} from "@/components/camp/RoleGroupSection.js";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const user = useSuperblocksUser();
  const currentUserEmail = user?.email ?? "";

  const { data, loading } = useApiData("CampGetLeaderboard", {});

  // Group entries by role for the "By Role" section
  const allEntries = data?.leaderboard ?? [];
  const roleGroups = new Map<string, typeof allEntries>();

  for (const entry of allEntries) {
    const key = getRoleGroupKey(entry.userRole);
    if (!roleGroups.has(key)) roleGroups.set(key, []);
    roleGroups.get(key)!.push(entry);
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-amber-700 border-b border-amber-800">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                🏆 Leaderboard
              </h1>
              <p className="text-sm text-amber-100 mt-1">
                See how you stack up against your fellow campers
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-sm font-medium text-amber-100 border border-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
            >
              🦉 Back to cAMP Quizzes
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {loading ? (
          <LeaderboardSkeleton />
        ) : allEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏕️</p>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              No campers yet!
            </h3>
            <p className="text-sm text-slate-600">
              Be the first to earn XP by completing a quiz.
            </p>
          </div>
        ) : (
          <>
            {/* ── All Campers ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🌍</span>
                <h2 className="text-lg font-bold text-slate-900">
                  All Campers
                </h2>
                <span className="text-xs text-slate-500">
                  Ranked by XP earned
                </span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <LeaderboardTable
                  entries={allEntries}
                  currentUserEmail={currentUserEmail}
                />
              </div>
            </section>

            {/* ── By Role ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">👥</span>
                <h2 className="text-lg font-bold text-slate-900">
                  By Role
                </h2>
                <span className="text-xs text-slate-500">
                  Ranked by XP within role
                </span>
              </div>
              <div className="space-y-4">
                {ROLE_GROUP_ORDER.map((key) => {
                  const entries = roleGroups.get(key);
                  if (!entries || entries.length === 0) return null;
                  return (
                    <RoleGroupSection
                      key={key}
                      groupKey={key}
                      entries={entries}
                      currentUserEmail={currentUserEmail}
                    />
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded w-16" />
        ))}
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-3 border-b border-slate-100 flex items-center gap-4 animate-pulse"
        >
          <div className="w-8 h-4 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded w-28" />
          <div className="h-5 bg-slate-200 rounded-full w-20" />
          <div className="h-5 bg-slate-200 rounded-full w-16" />
          <div className="h-4 bg-slate-200 rounded w-10 ml-auto" />
          <div className="h-4 bg-slate-200 rounded w-8" />
          <div className="h-4 bg-slate-200 rounded w-8" />
          <div className="h-4 bg-slate-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}
