import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Camper } from "../../../server/apis/camp/get-campers.js";
import { RolePill, RegionPill, ManagerPill, LastActivityPill } from "./pills.js";

const PAGE_SIZE = 20;

type SortField = "userName" | "xp" | "quizzesPassed" | "avgScore" | "firstPassRate" | "retakes" | "reviews";
type SortDir = "asc" | "desc";

export default function CampersTable({ campers }: { campers: Camper[] }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("xp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setDebouncedSearch(val); setPage(0); }, 300);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return campers;
    return campers.filter(
      (c) =>
        c.userName.toLowerCase().includes(q) ||
        c.userEmail.toLowerCase().includes(q) ||
        c.userRole.toLowerCase().includes(q)
    );
  }, [campers, debouncedSearch]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = useMemo(
    () => sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [sorted, page]
  );

  useEffect(() => { setPage(0); }, [sorted.length]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); return prev; }
      setSortDir(field === "userName" ? "asc" : "desc");
      return field;
    });
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-amber-600 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const thClass = "px-3 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap";

  return (
    <div>
      {/* Search bar */}
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="🔍 Search by name, email, or role…"
          className="w-full max-w-sm px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className={`${thClass} text-left`} onClick={() => handleSort("userName")}>
                  Camper <SortIcon field="userName" />
                </th>
                <th className={`${thClass} text-center`} onClick={() => handleSort("xp")}>
                  XP <SortIcon field="xp" />
                </th>
                <th className={`${thClass} text-center`} onClick={() => handleSort("quizzesPassed")}>
                  Progress <SortIcon field="quizzesPassed" />
                </th>
                <th className={`${thClass} text-center`} onClick={() => handleSort("avgScore")}>
                  Avg Score <SortIcon field="avgScore" />
                </th>
                <th className={`${thClass} text-center`} onClick={() => handleSort("firstPassRate")}>
                  1st Pass % <SortIcon field="firstPassRate" />
                </th>
                <th className={`${thClass} text-center`} onClick={() => handleSort("retakes")}>
                  Retakes <SortIcon field="retakes" />
                </th>
                <th className={`${thClass} text-center`} onClick={() => handleSort("reviews")}>
                  Reviews <SortIcon field="reviews" />
                </th>
                <th className={`${thClass} text-center`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((c) => (
                <tr key={c.userEmail} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  {/* Camper cell: name, email, pills */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" title={c.tier.name}>{c.tier.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{c.userName}</p>
                        <p className="text-xs text-slate-500 truncate">{c.userEmail}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <RolePill role={c.userRole} />
                          <ManagerPill name={c.managerName} />
                          <RegionPill region={c.region} />
                          <LastActivityPill date={c.lastActivity} />
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* XP */}
                  <td className="text-center px-3 py-3">
                    <span className="font-semibold text-amber-700">{c.xp}</span>
                  </td>
                  {/* Progress bar */}
                  <td className="text-center px-3 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(c.quizzesPassed / 15) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 whitespace-nowrap">{c.progress}</span>
                    </div>
                  </td>
                  {/* Avg Score */}
                  <td className="text-center px-3 py-3">
                    <span className={`font-medium ${c.avgScore >= 80 ? "text-emerald-700" : c.avgScore >= 60 ? "text-amber-700" : "text-red-600"}`}>
                      {c.avgScore}%
                    </span>
                  </td>
                  {/* 1st Pass Rate */}
                  <td className="text-center px-3 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.firstPassRate >= 80 ? "bg-green-100 text-green-700" :
                      c.firstPassRate >= 50 ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {c.firstPassRate}%
                    </span>
                  </td>
                  {/* Retakes */}
                  <td className="text-center px-3 py-3 text-slate-700">{c.retakes}</td>
                  {/* Reviews */}
                  <td className="text-center px-3 py-3 text-slate-700">{c.reviews}</td>
                  {/* Status */}
                  <td className="text-center px-3 py-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status.includes("Complete") ? "bg-emerald-100 text-emerald-700" :
                      c.status.includes("Progress") ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {debouncedSearch ? "No campers match your search." : "No camper data yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">
              {sorted.length} camper{sorted.length !== 1 ? "s" : ""} • Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
