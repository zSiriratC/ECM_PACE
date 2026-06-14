import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";

/* ══════════════════════════════════════ TYPES ══════════════════════════════════════ */
interface Job {
  job_no: string; job_name: string; status: string; project_engineer: string;
  location: string; working_platform: string; asset: string;
  job_type: string; sub_type: string; discipline: string; group: string;
  plan_start_date: string | null; plan_end_date: string | null;
}

interface PlanSummary {
  total_manhour: number; actual_manhour_daily: number;
}

interface WpMapping { asset: string; working_platform: string; status: string; }
interface CompanyItem { name: string; status: string; }
interface JobTypeItem { description_l1: string; description_l2: string; description_l3: string; status: string; }

const STATUS_STEPS = [
  { key: "Drafting Plan", label: "Draft", page: "planning" },
  { key: "Pending Approval", label: "Pending", page: "planning" },
  { key: "Approved Plan", label: "Approved", page: "planning" },
  { key: "In Progress", label: "In Progress", page: "daily-report" },
  { key: "Completed", label: "Completed", page: "closeout" },
];

// Sort priority: higher = shown first
const STATUS_SORT_ORDER: Record<string, number> = {
  "In Progress": 5,
  "Approved Plan": 4,
  "Pending Approval": 3,
  "Drafting Plan": 2,
  "Completed": 1,
};

const STATUS_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Drafting Plan":    { bg: "rgba(108,142,255,0.08)", text: "var(--color-primary)", border: "rgba(108,142,255,0.2)" },
  "Pending Approval": { bg: "rgba(255,184,77,0.08)",  text: "var(--color-warning)", border: "rgba(255,184,77,0.2)" },
  "Approved Plan":    { bg: "rgba(80,227,194,0.08)",   text: "var(--color-accent)",  border: "rgba(80,227,194,0.2)" },
  "In Progress":      { bg: "rgba(255,184,77,0.08)",  text: "var(--color-warning)", border: "rgba(255,184,77,0.2)" },
  "Completed":        { bg: "rgba(74,222,128,0.08)",   text: "var(--color-success)", border: "rgba(74,222,128,0.2)" },
};

const SUMMARY_COLORS = [
  { bg: "rgba(108,142,255,0.06)", border: "rgba(108,142,255,0.15)", text: "var(--color-primary)" },
  { bg: "rgba(255,184,77,0.06)",  border: "rgba(255,184,77,0.15)",  text: "var(--color-warning)" },
  { bg: "rgba(80,227,194,0.06)",  border: "rgba(80,227,194,0.15)",  text: "var(--color-accent)" },
  { bg: "rgba(255,184,77,0.06)",  border: "rgba(255,184,77,0.15)",  text: "var(--color-warning)" },
  { bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.15)",  text: "var(--color-success)" },
];

const STEP_DONE   = { bg: "rgba(74,222,128,0.15)", color: "var(--color-success)", border: "rgba(74,222,128,0.4)" };
const STEP_ACTIVE = { bg: "rgba(255,184,77,0.15)",  color: "var(--color-warning)", border: "rgba(255,184,77,0.4)" };
const STEP_FUTURE = { bg: "var(--color-surface-2)", color: "var(--color-text-dim)", border: "var(--color-border)" };
const LINE_DONE = "rgba(74,222,128,0.35)";
const LINE_ACTIVE = "rgba(255,184,77,0.35)";
const LINE_FUTURE = "var(--color-border)";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const apiH = (): Record<string, string> => ({ "Content-Type": "application/json", "X-User-Role": localStorage.getItem("pace-role") || "administrator" });
const api = async (url: string) => { const r = await fetch(url, { headers: apiH() }); return r.json(); };

function todayStr(): string { return new Date().toISOString().split("T")[0]; }

function fmtDate(val: string | null): string {
  if (!val) return "";
  try { const d = new Date(val); const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return String(d.getDate()).padStart(2, "0") + " " + M[d.getMonth()] + " " + d.getFullYear(); } catch { return val; }
}

/* ══════════════════════════════════════ COMPONENT ══════════════════════════════════════ */
const HomePage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summaries, setSummaries] = useState<Record<string, PlanSummary>>({});
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [reportedToday, setReportedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Lookups
  const [wpMappings, setWpMappings] = useState<WpMapping[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeItem[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fType, setFType] = useState("");
  const [fAsset, setFAsset] = useState("");
  const [fPlatform, setFPlatform] = useState("");
  const [fCompany, setFCompany] = useState("");
  const [fJobType, setFJobType] = useState("");
  const [fSub1, setFSub1] = useState("");
  const [fSub2, setFSub2] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Load all data in parallel ──
  useEffect(() => {
    const loadAll = async () => {
      try {
        // Parallel fetch: lookups + jobs
        const [wpRes, compRes, jtRes, jobsRes] = await Promise.all([
          api("/api/master-data/working-platform-mappings"),
          api("/api/master-data/companies"),
          api("/api/master-data/job-types"),
          api("/api/planning/jobs"),
        ]);

        setWpMappings(wpRes);
        setCompanies(compRes);
        setJobTypes(jtRes);
        setJobs(jobsRes);

        // Parallel fetch: summaries + progress for all jobs
        const td = todayStr();
        const summaryPromises = jobsRes.map((j: Job) =>
          api("/api/planning/plan-summary?job_no=" + j.job_no).catch(() => null)
        );
        const progressPromises = jobsRes.map((j: Job) =>
          api("/api/daily-report/project/progress?project_no=" + j.job_no).catch(() => [])
        );

        const [summaryResults, progressResults] = await Promise.all([
          Promise.all(summaryPromises),
          Promise.all(progressPromises),
        ]);

        const sums: Record<string, PlanSummary> = {};
        const progs: Record<string, number> = {};
        const todaySet = new Set<string>();

        jobsRes.forEach((j: Job, idx: number) => {
          const s = summaryResults[idx];
          if (s && s.id) sums[j.job_no] = s;

          const reports = progressResults[idx];
          if (reports && reports.length > 0) {
            const sorted = reports.sort((a: any, b: any) => b.progress_date.localeCompare(a.progress_date));
            progs[j.job_no] = sorted[0].progress_total || 0;
            if (reports.some((r: any) => r.progress_date === td)) todaySet.add(j.job_no);
          }
        });

        setSummaries(sums);
        setProgressMap(progs);
        setReportedToday(todaySet);
      } catch {}
      setLoading(false);
    };
    loadAll();
  }, []);

  const activeStepIdx = useCallback((status: string) => STATUS_STEPS.findIndex(s => s.key === status), []);

  const navigate = useCallback((job: Job) => {
    const step = STATUS_STEPS.find(s => s.key === job.status);
    if (step) window.location.href = "/" + step.page + "?job=" + encodeURIComponent(job.job_no);
  }, []);

  // Dropdown options (memoized)
  const activeWp = useMemo(() => wpMappings.filter(m => m.status === "Active"), [wpMappings]);
  const uniqueAssets = useMemo(() => [...new Set(activeWp.map(m => m.asset))].sort(), [activeWp]);
  const uniquePlatforms = useMemo(() => [...new Set(activeWp.filter(m => !fAsset || m.asset === fAsset).map(m => m.working_platform))].sort(), [activeWp, fAsset]);
  const activeCompanies = useMemo(() => companies.filter(c => c.status === "Active").map(c => c.name).sort(), [companies]);
  const activeJt = useMemo(() => jobTypes.filter(j => j.status === "Active"), [jobTypes]);
  const uniqueL1 = useMemo(() => [...new Set(activeJt.map(j => j.description_l1).filter(Boolean))].sort(), [activeJt]);
  const uniqueL2 = useMemo(() => [...new Set(activeJt.filter(j => !fJobType || j.description_l1 === fJobType).map(j => j.description_l2).filter(Boolean))].sort(), [activeJt, fJobType]);
  const uniqueL3 = useMemo(() => [...new Set(activeJt.filter(j => (!fJobType || j.description_l1 === fJobType) && (!fSub1 || j.description_l2 === fSub1)).map(j => j.description_l3).filter(Boolean))].sort(), [activeJt, fJobType, fSub1]);

  // Filter + Sort
  const filtered = useMemo(() => {
    const result = jobs.filter(j => {
      if (j.status === "Completed" && statusFilter !== "Completed") return false;
      if (statusFilter && j.status !== statusFilter) return false;
      if (fType && (j.group || "project") !== fType) return false;
      if (fAsset && j.location !== fAsset) return false;
      if (fPlatform && j.working_platform !== fPlatform) return false;
      if (fCompany && j.asset !== fCompany) return false;
      if (fJobType && j.job_type !== fJobType) return false;
      if (fSub1 && j.sub_type !== fSub1) return false;
      if (fSub2 && j.discipline !== fSub2) return false;
      if (search) {
        const q = search.toLowerCase();
        return (j.job_no || "").toLowerCase().includes(q) ||
          (j.job_name || "").toLowerCase().includes(q) ||
          (j.location || "").toLowerCase().includes(q) ||
          (j.working_platform || "").toLowerCase().includes(q) ||
          (j.asset || "").toLowerCase().includes(q) ||
          (j.job_type || "").toLowerCase().includes(q) ||
          (j.sub_type || "").toLowerCase().includes(q) ||
          (j.project_engineer || "").toLowerCase().includes(q);
      }
      return true;
    });

    // Sort: status priority desc, then unreported first within In Progress, then completed last
    result.sort((a, b) => {
      const aPri = STATUS_SORT_ORDER[a.status] || 0;
      const bPri = STATUS_SORT_ORDER[b.status] || 0;
      if (aPri !== bPri) return bPri - aPri;

      // Within In Progress: unreported today first
      if (a.status === "In Progress" && b.status === "In Progress") {
        const aReported = reportedToday.has(a.job_no) ? 1 : 0;
        const bReported = reportedToday.has(b.job_no) ? 1 : 0;
        if (aReported !== bReported) return aReported - bReported;
      }

      return a.job_no.localeCompare(b.job_no);
    });

    return result;
  }, [jobs, search, statusFilter, fType, fAsset, fPlatform, fCompany, fJobType, fSub1, fSub2, reportedToday]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((safePage - 1) * pageSize, safePage * pageSize), [filtered, safePage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, fType, fAsset, fPlatform, fCompany, fJobType, fSub1, fSub2, pageSize]);

  const statusCounts = useMemo(() => STATUS_STEPS.map((s, i) => ({
    ...s, count: jobs.filter(j => j.status === s.key).length, color: SUMMARY_COLORS[i],
  })), [jobs]);

  const hasFilters = fType || fAsset || fPlatform || fCompany || fJobType || fSub1 || fSub2;
  const clearFilters = () => { setFType(""); setFAsset(""); setFPlatform(""); setFCompany(""); setFJobType(""); setFSub1(""); setFSub2(""); setSearch(""); setStatusFilter(""); };

  if (loading) return <div className="empty-state"><p style={{ color: "var(--color-text-dim)" }}>Loading...</p></div>;

  return (
    <div>
      {/* ── Status Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
        {statusCounts.map(s => {
          const isActive = statusFilter === s.key;
          return (
            <div key={s.key} onClick={() => setStatusFilter(isActive ? "" : s.key)}
              style={{
                background: isActive ? s.color.bg : "var(--color-surface)",
                border: "1px solid " + (isActive ? s.color.border : "var(--color-border)"),
                borderRadius: "var(--radius-md)", padding: "16px 12px", textAlign: "center",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = s.color.bg; (e.currentTarget as HTMLDivElement).style.borderColor = s.color.border; } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = "var(--color-surface)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)"; } }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: s.count > 0 ? s.color.text : "var(--color-text-dim)" }}>{s.count}</div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: s.count > 0 ? s.color.text : "var(--color-text-dim)", marginTop: 2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <input className="form-control" placeholder="Search all columns..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ minWidth: 110 }}>
            <select className="form-control" value={fType} onChange={e => setFType(e.target.value)}>
              <option value="">All Types</option>
              <option value="project">Project</option>
              <option value="notification">Notification</option>
            </select>
          </div>
          <div style={{ minWidth: 110 }}>
            <select className="form-control" value={fAsset} onChange={e => { setFAsset(e.target.value); setFPlatform(""); }}>
              <option value="">All Assets</option>
              {uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 110 }}>
            <select className="form-control" value={fPlatform} onChange={e => setFPlatform(e.target.value)}>
              <option value="">All Platforms</option>
              {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 110 }}>
            <select className="form-control" value={fCompany} onChange={e => setFCompany(e.target.value)}>
              <option value="">All Companies</option>
              {activeCompanies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 110 }}>
            <select className="form-control" value={fJobType} onChange={e => { setFJobType(e.target.value); setFSub1(""); setFSub2(""); }}>
              <option value="">All Job Types</option>
              {uniqueL1.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {fJobType && (
            <div style={{ minWidth: 110 }}>
              <select className="form-control" value={fSub1} onChange={e => { setFSub1(e.target.value); setFSub2(""); }}>
                <option value="">All Sub 1</option>
                {uniqueL2.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
          {fSub1 && (
            <div style={{ minWidth: 110 }}>
              <select className="form-control" value={fSub2} onChange={e => setFSub2(e.target.value)}>
                <option value="">All Sub 2</option>
                {uniqueL3.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
          {(hasFilters || search || statusFilter) && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ height: 34 }}>Clear</button>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-dim)", marginTop: 8 }}>
          Showing {paginated.length} of {filtered.length} projects
          {filtered.length !== jobs.length && " (filtered from " + jobs.length + " total)"}
        </div>
      </div>

      {/* ── Empty ── */}
      {filtered.length === 0 && (
        <div className="empty-state">
          <p style={{ color: "var(--color-text-dim)" }}>
            {statusFilter === "" && !hasFilters && !search ? "No active projects. Click DONE to view completed." : "No projects match your filter."}
          </p>
        </div>
      )}

      {/* ── Project Cards ── */}
      {paginated.map(job => (
        <ProjectCard
          key={job.job_no}
          job={job}
          summary={summaries[job.job_no]}
          progressPct={progressMap[job.job_no] || 0}
          isReportedToday={reportedToday.has(job.job_no)}
          stepIdx={activeStepIdx(job.status)}
          onNavigate={navigate}
        />
      ))}

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 16, padding: "12px 0", borderTop: "1px solid var(--color-border)",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-muted)" }}>
            <span>Show</span>
            <select className="form-control" value={pageSize} onChange={e => setPageSize(parseInt(e.target.value))}
              style={{ width: 70, padding: "4px 8px", fontSize: 12 }}>
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>per page</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Page {safePage} of {totalPages}</div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn btn-secondary btn-sm" disabled={safePage <= 1} onClick={() => setCurrentPage(1)} style={{ padding: "4px 8px", fontSize: 11 }}>««</button>
            <button className="btn btn-secondary btn-sm" disabled={safePage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} style={{ padding: "4px 10px", fontSize: 11 }}>‹ Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: "4px 4px", fontSize: 11, color: "var(--color-text-dim)" }}>…</span>}
                  <button className={"btn btn-sm " + (p === safePage ? "btn-primary" : "btn-secondary")} onClick={() => setCurrentPage(p)} style={{ padding: "4px 10px", fontSize: 11, minWidth: 32 }}>{p}</button>
                </React.Fragment>
              ))
            }
            <button className="btn btn-secondary btn-sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} style={{ padding: "4px 10px", fontSize: 11 }}>Next ›</button>
            <button className="btn btn-secondary btn-sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage(totalPages)} style={{ padding: "4px 8px", fontSize: 11 }}>»»</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════ PROJECT CARD (memoized) ══════════════════════════════════════ */
const ProjectCard = React.memo<{
  job: Job; summary?: PlanSummary; progressPct: number;
  isReportedToday: boolean; stepIdx: number; onNavigate: (j: Job) => void;
}>(({ job, summary, progressPct, isReportedToday, stepIdx, onNavigate }) => {
  const planMh = summary?.total_manhour || 0;
  const actualMh = summary?.actual_manhour_daily || 0;
  const mhPct = planMh > 0 ? (actualMh / planMh * 100) : 0;
  const isCompleted = job.status === "Completed";
  const badgeColor = STATUS_BADGE_COLORS[job.status] || STATUS_BADGE_COLORS["Drafting Plan"];
  const isGreen = job.status === "In Progress" && isReportedToday;
  const cardBorder = isGreen ? "rgba(74,222,128,0.5)" : "var(--color-border)";
  const cardBg = isGreen ? "rgba(74,222,128,0.02)" : "var(--color-surface)";

  return (
    <div
      onClick={() => onNavigate(job)}
      style={{
        background: cardBg, border: "1px solid " + cardBorder,
        borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: 10,
        cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
        borderLeftWidth: isGreen ? 3 : 1,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>{job.job_name || job.job_no}</span>
            {isGreen && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: "rgba(74,222,128,0.12)", color: "var(--color-success)", fontWeight: 600 }}>✓ Reported</span>}
            {job.status === "In Progress" && !isReportedToday && (
              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: "rgba(255,107,107,0.1)", color: "var(--color-danger)", fontWeight: 600 }}>⚠ Pending</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-dim)", marginTop: 3, fontFamily: "var(--font-mono)", letterSpacing: 0.3 }}>
            {job.job_no}
            {[job.location, job.working_platform, job.asset].filter(Boolean).length > 0 && <span style={{ margin: "0 5px", color: "var(--color-border-light)" }}>·</span>}
            {[job.location, job.working_platform, job.asset].filter(Boolean).join(" · ")}
          </div>
        </div>
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, letterSpacing: 0.3, flexShrink: 0, background: badgeColor.bg, color: badgeColor.text, border: "1px solid " + badgeColor.border }}>{job.status}</span>
      </div>

      {/* Step Progress */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14, padding: "0 4px" }}>
        {STATUS_STEPS.map((step, i) => {
          const isPast = i < stepIdx;
          const isCurrent = i === stepIdx;
          const isFuture = i > stepIdx;
          let cs = STEP_FUTURE; let content: string | number = i + 1;
          if (isPast || (isCompleted && i <= stepIdx)) { cs = STEP_DONE; content = "✓"; }
          else if (isCurrent && !isCompleted) { cs = STEP_ACTIVE; content = "↻"; }
          let lc = "var(--color-text-dim)";
          if (isPast || (isCompleted && i <= stepIdx)) lc = "var(--color-success)";
          else if (isCurrent) lc = "var(--color-warning)";
          else lc = "var(--color-text-dim)";
          let lineColor = LINE_FUTURE;
          if (i > 0) { if (i <= stepIdx) lineColor = LINE_DONE; else if (i === stepIdx + 1 && !isCompleted) lineColor = LINE_ACTIVE; }

          return (
            <React.Fragment key={step.key}>
              {i > 0 && <div style={{ flex: 1, height: 3, borderRadius: 2, background: lineColor, margin: "0 -3px", marginTop: -12 }} />}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}
                onClick={e => { e.stopPropagation(); if (!isFuture) window.location.href = "/" + step.page + "?job=" + encodeURIComponent(job.job_no); }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isCurrent ? 13 : 10, fontWeight: 700, background: cs.bg, color: cs.color, border: "2px solid " + cs.border, cursor: isFuture ? "default" : "pointer", transition: "all 0.15s", position: "relative", zIndex: 1 }}>{content}</div>
                <div style={{ fontSize: 8, marginTop: 3, fontWeight: isCurrent ? 700 : 400, color: lc, textTransform: "uppercase", letterSpacing: 0.5 }}>{step.label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-dim)", marginBottom: 3 }}>
            <span>Manhour</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{actualMh.toFixed(0)} / {planMh.toFixed(0)} MH{planMh > 0 && <span style={{ marginLeft: 4, fontWeight: 600, color: mhPct > 100 ? "var(--color-danger)" : "var(--color-primary)" }}>({mhPct.toFixed(0)}%)</span>}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--color-surface-2)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, width: Math.min(mhPct, 100) + "%", background: mhPct > 100 ? "var(--color-danger)" : "var(--color-primary)", transition: "width 0.3s" }} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-dim)", marginBottom: 3 }}>
            <span>Progress</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: progressPct >= 100 ? "var(--color-success)" : "var(--color-accent)" }}>{progressPct.toFixed(1)}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--color-surface-2)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, width: Math.min(progressPct, 100) + "%", background: progressPct >= 100 ? "var(--color-success)" : "var(--color-accent)", transition: "width 0.3s" }} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--color-text-dim)", flexWrap: "wrap", marginTop: 6 }}>
        {job.plan_start_date && <span>{fmtDate(job.plan_start_date)} → {fmtDate(job.plan_end_date)}</span>}
        {job.job_type && <span style={{ color: "var(--color-text-muted)" }}>{job.job_type}{job.sub_type ? " / " + job.sub_type : ""}</span>}
        {isCompleted && <span style={{ color: "var(--color-success)", fontWeight: 600 }}>✓ Completed</span>}
      </div>
    </div>
  );
});

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<HomePage />);