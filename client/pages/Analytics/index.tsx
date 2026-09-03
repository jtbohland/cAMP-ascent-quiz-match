import { useState } from "react";
import { useNavigate } from "react-router";
import { useApiData } from "@/hooks/useApiData.js";
import { QUIZZES } from "@/data/quizzes/index.js";
import { ALL_PATHS, getRolePathId, type PathId } from "@/data/paths.js";
import CampersTable from "@/components/camp/CampersTable.js";
import LeaderboardMini from "@/components/camp/LeaderboardMini.js";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { data, loading, isError, error } = useApiData("CampGetAnalytics", {
    quizId: null,
    role: null,
    dateFrom: null,
    dateTo: null,
  });

  const { data: visitStats } = useApiData("CampGetVisitStats", {});
  const { data: campersData, loading: campersLoading } = useApiData("CampGetCampers", {});
  const { data: leaderboardData, loading: lbLoading } = useApiData("CampGetLeaderboard", {});

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-amber-700 border-b border-amber-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">📊 cAMP Ascent: Sales — Analytics</h1>
              <p className="text-sm text-amber-100 mt-1">🏔️ Performance data across all knowledge checks</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-sm font-medium text-amber-100 border border-amber-500 rounded-lg hover:bg-amber-600"
            >
              🦉 Back to cAMP Quizzes
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading && <LoadingSkeleton />}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            Failed to load analytics: {(error as { message?: string })?.message ?? "Unknown error"}
          </div>
        )}
        {data && (
          <AnalyticsDashboard
            data={data}
            visitStats={visitStats}
            campers={campersData?.campers}
            campersLoading={campersLoading}
            leaderboard={leaderboardData?.leaderboard}
            lbLoading={lbLoading}
          />
        )}
      </main>
    </div>
  );
}

/* ────────────────────────── Dashboard ────────────────────────── */

function AnalyticsDashboard({
  data,
  visitStats,
  campers,
  campersLoading,
  leaderboard,
  lbLoading,
}: {
  data: any;
  visitStats: { totalVisits: number; uniqueVisitors: number } | undefined;
  campers: any[] | undefined;
  campersLoading: boolean;
  leaderboard: any[] | undefined;
  lbLoading: boolean;
}) {
  const { summary, byQuiz, byRole, mostMissed } = data;
  const [pathFilter, setPathFilter] = useState<PathId | "all">("all");

  // Filter byRole and byQuiz based on selected path
  const filteredByRole = pathFilter === "all"
    ? byRole ?? []
    : (byRole ?? []).filter((row: any) => getRolePathId(row.user_role) === pathFilter);

  const filteredByQuiz = pathFilter === "all"
    ? byQuiz ?? []
    : (() => {
        const pathConfig = ALL_PATHS.find((p) => p.id === pathFilter);
        const pathQuizSet = new Set(pathConfig?.quizOrder ?? []);
        return (byQuiz ?? []).filter((row: any) => pathQuizSet.has(row.quiz_id));
      })();

  // Cross-path comparison data
  const crossPathData = ALL_PATHS.map((p) => {
    const pathRoles = (byRole ?? []).filter((row: any) => getRolePathId(row.user_role) === p.id);
    const totalAttempts = pathRoles.reduce((sum: number, r: any) => sum + r.attempts, 0);
    const avgScore = pathRoles.length > 0
      ? Math.round(pathRoles.reduce((sum: number, r: any) => sum + r.avg_score * r.attempts, 0) / (totalAttempts || 1) * 10) / 10
      : 0;
    const avgPassRate = pathRoles.length > 0
      ? Math.round(pathRoles.reduce((sum: number, r: any) => sum + r.pass_rate * r.attempts, 0) / (totalAttempts || 1) * 10) / 10
      : 0;
    return { ...p, totalAttempts, avgScore, avgPassRate, roleCount: pathRoles.length };
  }).filter((p) => p.totalAttempts > 0);

  return (
    <div className="space-y-10">
      {/* ── 0. Path Filter ── */}
      <section>
        <SectionHeading emoji="🛤️" title="Filter by Path" />
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setPathFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              pathFilter === "all"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Paths
          </button>
          {ALL_PATHS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPathFilter(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                pathFilter === p.id
                  ? "bg-amber-700 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Cross-Path Comparison ── */}
      {crossPathData.length > 1 && pathFilter === "all" && (
        <section>
          <SectionHeading emoji="📊" title="Cross-Path Comparison" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {crossPathData.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{p.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.label}</p>
                    <p className="text-xs text-slate-500">{p.quizOrder.length} quizzes</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{p.totalAttempts}</p>
                    <p className="text-[10px] text-slate-500">Attempts</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{p.avgScore}%</p>
                    <p className="text-[10px] text-slate-500">Avg Score</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{p.avgPassRate}%</p>
                    <p className="text-[10px] text-slate-500">Pass Rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 1. Overall Summary ── */}
      <section>
        <SectionHeading emoji="⛺" title="Overall Summary" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="Total Attempts" value={summary?.totalAttempts ?? 0} />
          <StatCard label="Unique Learners" value={summary?.uniqueUsers ?? 0} />
          <StatCard label="Avg Score" value={`${summary?.averageScore ?? 0}%`} />
          <StatCard label="Pass Rate" value={`${summary?.overallPassRate ?? 0}%`} />
          <StatCard label="Page Visits" value={visitStats?.totalVisits ?? "—"} />
          <StatCard label="Unique Visitors" value={visitStats?.uniqueVisitors ?? "—"} />
        </div>
      </section>

      {/* ── 2. Performance by Role ── */}
      <section>
        <SectionHeading emoji="🧗" title="Performance by Role" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(filteredByRole).map((row: any) => (
            <div key={row.user_role} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{row.user_role}</p>
              <p className="text-2xl font-bold text-slate-900">{row.avg_score}%</p>
              <p className="text-xs text-slate-500 mt-1">{row.attempts} attempt{row.attempts !== 1 ? "s" : ""} • {row.pass_rate}% pass rate</p>
            </div>
          ))}
          {(filteredByRole.length === 0) && (
            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
              No role data available yet.
            </div>
          )}
        </div>
      </section>

      {/* ── 3. cAMPers ── */}
      <section>
        <SectionHeading emoji="🏕️" title="cAMPers" />
        {campersLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded" />)}
            </div>
          </div>
        ) : (
          <CampersTable campers={campers ?? []} />
        )}
      </section>

      {/* ── 4. XP Leaderboard ── */}
      <section>
        <SectionHeading emoji="🏆" title="XP Leaderboard" />
        {lbLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded" />)}
            </div>
          </div>
        ) : (
          <LeaderboardMini leaderboard={leaderboard ?? []} />
        )}
      </section>

      {/* ── 5. Per-Quiz Breakdown ── */}
      <section>
        <SectionHeading emoji="🧭" title="Per-Quiz Breakdown" />
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Quiz</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Attempts</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Avg Score</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Pass Rate</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {(filteredByQuiz).map((row: any) => {
                const quizMeta = QUIZZES.find((q) => q.id === row.quiz_id);
                return (
                  <tr key={row.quiz_id} className="border-b border-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{quizMeta?.title ?? row.quiz_id}</p>
                        <p className="text-xs text-slate-500">{quizMeta?.day} • {quizMeta?.week}</p>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3 text-slate-700">{row.attempts}</td>
                    <td className="text-center px-4 py-3 text-slate-700">{row.avg_score}%</td>
                    <td className="text-center px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.pass_rate >= 80 ? "bg-green-100 text-green-700" :
                        row.pass_rate >= 50 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{row.pass_rate}%</span>
                    </td>
                    <td className="text-center px-4 py-3 text-slate-700">{row.review_count}</td>
                  </tr>
                );
              })}
              {(!filteredByQuiz || filteredByQuiz.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No quiz data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 6. Most-Missed Questions ── */}
      <section>
        <SectionHeading emoji="🔥" title="Most-Missed Questions" />
        <p className="text-xs text-slate-500 mb-3">Questions with ≤65% correct rate (miss rate ≥35%)</p>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {(mostMissed ?? []).length > 0 ? (
            <div className="divide-y divide-slate-100">
              {(mostMissed ?? []).slice(0, 10).map((item: any, i: number) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                    {item.miss_rate}%
                  </span>
                  <div>
                    <p className="text-sm text-slate-900 leading-relaxed">{item.question_text}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quiz: {item.quiz_id} • {item.times_asked} answer{item.times_asked !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-slate-500">
              No missed question data available yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ────────────────────────── Shared Components ────────────────────────── */

function SectionHeading({ emoji, title }: { emoji: string; title: string }) {
  return (
    <h2 className="text-lg font-semibold text-slate-900 mb-4">
      {emoji} {title}
    </h2>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="h-7 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded" />)}
        </div>
      </div>
    </div>
  );
}
