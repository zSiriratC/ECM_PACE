import React, { useEffect, useState, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";

/* ══════════════════════════════════════ TYPES ══════════════════════════════════════ */
interface Job {
  job_no: string;
  job_name: string;
  job_type: string;
  group: string;
  discipline: string;
  sub_type: string;
  location: string;
  asset: string;
  working_platform: string;
  sro_no: string;
  project_engineer: string;
  plan_start_date: string | null;
  plan_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  suspended_day: number;
  total_day: number;
  status: string;
}

interface Progress {
  id: number;
  project_no: string;
  progress_date: string;
  weather_condition: string;
  status: string;
  plan_pob: number;
  actual_pob: number;
  plan_manhour: number;
  actual_manhour: number;
  progress_today: number;
  progress_total: number;
  pdi_project: number;
}

interface PlanSummaryData {
  id?: number;
  job_no?: string;
  plan_start_date?: string | null;
  plan_end_date?: string | null;
  contingency?: number;
  estimated_productive_time?: number;
  estimated_pob?: number;
  total_manhour?: number;
  project_duration?: number;
  unit_cost?: number;
  exchange_rate?: number;
}

interface PlanActivityItem {
  id: number;
  std_mh_id?: number | null;
  job_no: string;
  structure: string;
  header: string;
  sub_header: string;
  description: string;
  level: string;
  unit: string;
  plan_quantity: number;
  plan_manhour: number;
  actual_quantity: number;
  actual_manhour: number; // current app uses this as cumulative %
}

interface StdMhItem {
  id: number;
  header: string;
  sub_header?: string;
  description: string;
  md_group?: string;
  group?: string;
  level?: string;
  difficulty?: string;
  unit: string;
  manhour: number;
  status: string;
}

interface PositionItem {
  id: number;
  name?: string;
  description?: string;
  group: string;
  status?: string;
}

interface Manpower {
  id: number;
  project_no: string;
  contractor_id: string;
  contractor_name: string;
  contractor_company: string;
  contractor_position: string;
  location: string;
  quarter_platform: string;
  offshore_working: number;
  offshore_standby: number;
  offshore_overtime: number;
  onshore_working: number;
  onshore_standby: number;
  onshore_overtime: number;
  total: number;
  sse: boolean;
}

type SummaryView = "manpower" | "activity";

/* ══════════════════════════════════════ HELPERS ══════════════════════════════════════ */
const apiH = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "X-User-Role": localStorage.getItem("pace-role") || "administrator",
  "X-User-Name": localStorage.getItem("pace-user-name") || "Dev User",
});

const api = async (url: string, o?: RequestInit) => {
  const r = await fetch(url, { headers: apiH(), ...o });
  if (!r.ok) {
    const j = await r.json().catch(() => ({ error: "HTTP " + r.status }));
    throw new Error(j.message || j.error);
  }
  return r.json();
};

function fmtDate(val: string | null | undefined): string {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return String(d.getDate()).padStart(2, "0") + " " + M[d.getMonth()] + " " + d.getFullYear();
  } catch {
    return val;
  }
}

function fmtNum(n: number): string {
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
}

function normalizeDateKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return dateStr.slice(0, 10);
  }
}

function normalizeText(v: string | null | undefined): string {
  return (v || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/&/g, " and ")
    .replace(/[‐‑‒–—−-]/g, " ")
    .replace(/[()]/g, " ")
    .replace(/[\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function manpowerStorageKey(projectNo: string, dateStr: string): string {
  return "pace-manpower-" + projectNo + "-" + normalizeDateKey(dateStr);
}

function loadAllManpowerSnapshots(projectNo: string): Record<string, Manpower[]> {
  const prefix = "pace-manpower-" + projectNo + "-";
  const result: Record<string, Manpower[]> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (!k.startsWith(prefix)) continue;
      const dateKey = k.substring(prefix.length);
      result[dateKey] = safeReadJson<Manpower[]>(k, []);
    }
  } catch {}

  return result;
}

/**
 * Very strict + robust Position -> Group lookup
 * Why previous logic failed:
 * - contractor_position may contain "-", "/", extra spaces, & vs and
 * - Position master may store the same wording in name OR description
 * This function normalizes both sides and tries:
 * 1) exact normalized match
 * 2) best token overlap fallback
 */
function getPositionGroup(positionName: string, positions: any[]): string {
  if (!positionName) return "Unassigned";

  const target = positionName.trim();
  const active = (positions || []).filter(p => !p.status || p.status === "Active");

  // 1) exact match against Position.name
  for (const p of active) {
    const name = (p.name || "").trim();
    if (name === target) {
      return p.md_group || "Unassigned";
    }
  }

  // 2) fallback exact match against Position.description
  for (const p of active) {
    const desc = (p.description || "").trim();
    if (desc === target) {
      return p.md_group || "Unassigned";
    }
  }

  // 3) case-insensitive fallback against name
  for (const p of active) {
    const name = (p.name || "").trim().toLowerCase();
    if (name === target.toLowerCase()) {
      return p.md_group || "Unassigned";
    }
  }

  // 4) case-insensitive fallback against description
  for (const p of active) {
    const desc = (p.description || "").trim().toLowerCase();
    if (desc === target.toLowerCase()) {
      return p.md_group || "Unassigned";
    }
  }

  return "Unassigned";
}

/**
 * Activity -> Group lookup
 * Prefer std_mh_id first because that is the strongest relationship.
 */
function getActivityGroup(activity: PlanActivityItem, stdMhList: StdMhItem[]): string {
  if (activity.std_mh_id) {
    const hit = stdMhList.find(s => s.id === activity.std_mh_id);
    if (hit) return hit.group || hit.md_group || "Unassigned";
  }

  const h = normalizeText(activity.header);
  const sh = normalizeText(activity.sub_header);
  const d = normalizeText(activity.description);
  const lv = normalizeText(activity.level);

  for (const s of stdMhList) {
    if ((s.status || "Active") !== "Active") continue;

    const sh1 = normalizeText(s.header);
    const sh2 = normalizeText(s.sub_header);
    const sd = normalizeText(s.description);
    const sl = normalizeText(s.level || s.difficulty);

    if (sh1 === h && (sh2 === sh || sd === sh || sd === d) && (!lv || sl === lv)) {
      return s.group || s.md_group || "Unassigned";
    }
  }

  for (const s of stdMhList) {
    if ((s.status || "Active") !== "Active") continue;

    const sh1 = normalizeText(s.header);
    const sh2 = normalizeText(s.sub_header);
    const sd = normalizeText(s.description);

    if (sh1 === h && (sh2 === sh || sd === sh || sd === d)) {
      return s.group || s.md_group || "Unassigned";
    }
  }

  return "Unassigned";
}

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="kpi-card" style={{ textAlign: "left", padding: "14px 16px" }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color: "var(--color-text-dim)",
        marginBottom: 6
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{value || "—"}</div>
  </div>
);

/* ══════════════════════════════════════ MAIN PAGE ══════════════════════════════════════ */
const ManhourPage: React.FC = () => {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [showJobDd, setShowJobDd] = useState(false);

  const [allProgress, setAllProgress] = useState<Progress[]>([]);
  const [activities, setActivities] = useState<PlanActivityItem[]>([]);
  const [planSummary, setPlanSummary] = useState<PlanSummaryData | null>(null);
  const [allStdMh, setAllStdMh] = useState<StdMhItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);

  const [view, setView] = useState<SummaryView>("manpower");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api("/api/planning/jobs").catch(() => []),
      api("/api/master-data/standardize-manhour").catch(() => []),
      api("/api/master-data/positions").catch(() => []), // change only if your endpoint name differs
    ]).then(([jobs, stdmh, pos]) => {
      setAllJobs(jobs || []);
      setAllStdMh(stdmh || []);
      setPositions(pos || []);

      const params = new URLSearchParams(window.location.search);
      const jobNo = params.get("job");
      if (jobNo) setSelectedJob(jobNo);
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedJob) return;
    setLoading(true);

    try {
      const [progressList, actList, ps] = await Promise.all([
        api("/api/daily-report/project/progress?project_no=" + selectedJob).catch(() => []),
        api("/api/planning/plan-activities?job_no=" + selectedJob).catch(() => []),
        api("/api/planning/plan-summary?job_no=" + selectedJob).catch(() => null),
      ]);

      setAllProgress(progressList || []);
      setActivities(actList || []);
      setPlanSummary(ps && (ps.id || ps.plan_start_date || ps.plan_end_date) ? ps : null);
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeJobs = useMemo(() => {
    return (allJobs || []).filter(j =>
      j.status === "In Progress" ||
      j.status === "Completed" ||
      j.status === "Approved Plan" ||
      j.status === "Pending Approval"
    );
  }, [allJobs]);

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return activeJobs;
    const q = jobSearch.toLowerCase();
    return activeJobs.filter(j =>
      (j.job_no || "").toLowerCase().includes(q) ||
      (j.job_name || "").toLowerCase().includes(q) ||
      (j.location || "").toLowerCase().includes(q) ||
      (j.asset || "").toLowerCase().includes(q) ||
      (j.job_type || "").toLowerCase().includes(q) ||
      (j.sub_type || "").toLowerCase().includes(q)
    );
  }, [activeJobs, jobSearch]);

  const selectedJobObj = useMemo(
    () => allJobs.find(j => j.job_no === selectedJob) || null,
    [allJobs, selectedJob]
  );

  const progressSorted = useMemo(() => {
    return [...allProgress].sort((a, b) => a.progress_date.localeCompare(b.progress_date));
  }, [allProgress]);

  const actualStart = useMemo(() => {
    if (selectedJobObj?.actual_start_date) return selectedJobObj.actual_start_date;
    return progressSorted.length > 0 ? progressSorted[0].progress_date : "";
  }, [selectedJobObj, progressSorted]);

  const actualFinish = useMemo(() => {
    if (selectedJobObj?.actual_end_date) return selectedJobObj.actual_end_date;
    return progressSorted.length > 0 ? progressSorted[progressSorted.length - 1].progress_date : "";
  }, [selectedJobObj, progressSorted]);

  const planStart = useMemo(() => {
    return planSummary?.plan_start_date || selectedJobObj?.plan_start_date || "";
  }, [planSummary, selectedJobObj]);

  const planFinish = useMemo(() => {
    return planSummary?.plan_end_date || selectedJobObj?.plan_end_date || "";
  }, [planSummary, selectedJobObj]);

  /* ───────────────────────────────────── Shared group numbers ───────────────────────────────────── */

  // Total activity quantity by group
  const activityQtyByGroup = useMemo(() => {
    const map = new Map<string, number>();

    for (const a of activities || []) {
      const group = getActivityGroup(a, allStdMh);

      const qty =
        Number(a.actual_quantity || 0) > 0
          ? Number(a.actual_quantity || 0)
          : Number(a.plan_quantity || 0);

      if (qty === 0) continue;
      map.set(group, (map.get(group) || 0) + qty);
    }

    return map;
  }, [activities, allStdMh]);

  // Total manpower MH by group
  const manpowerMhByGroup = useMemo(() => {
    const map = new Map<string, number>();
    if (!selectedJob) return map;

    const snaps = loadAllManpowerSnapshots(selectedJob);
    const dates = Object.keys(snaps).sort();

    for (const d of dates) {
      const rows = snaps[d] || [];
      for (const r of rows) {
        const group = getPositionGroup(r.contractor_position, positions);
        const mh = Number(r.total || 0);
        if (mh === 0) continue;
        map.set(group, (map.get(group) || 0) + mh);
      }
    }

    return map;
  }, [selectedJob, positions]);

  /* ───────────────────────────────────── Manpower View ───────────────────────────────────── */
  const groupedManpower = useMemo(() => {
    if (!selectedJob) return [];

    type DetailRow = {
      group: string;
      company: string;
      name: string;
      manhour: number;
      quantity: number;
      ratio: number;
    };

    const detailMap = new Map<string, DetailRow>();
    const snaps = loadAllManpowerSnapshots(selectedJob);
    const dates = Object.keys(snaps).sort();

    for (const d of dates) {
      const rows = snaps[d] || [];
      for (const r of rows) {
        const group = getPositionGroup(r.contractor_position, positions);
        const mh = Number(r.total || 0);
        const qty = activityQtyByGroup.get(group) || 0;

        if (mh === 0 && qty === 0) continue;

        const key = [group, r.contractor_company || "—", r.contractor_name || "—"].join("||");

        if (!detailMap.has(key)) {
          detailMap.set(key, {
            group,
            company: r.contractor_company || "—",
            name: r.contractor_name || "—",
            manhour: 0,
            quantity: qty,
            ratio: 0
          });
        }

        const item = detailMap.get(key)!;
        item.manhour += mh;
        item.quantity = qty;
      }
    }

    const details = Array.from(detailMap.values())
      .map(r => ({
        ...r,
        ratio: r.quantity > 0 ? r.manhour / r.quantity : 0
      }))
      .filter(r => !(r.manhour === 0 && r.quantity === 0))
      .sort((a, b) =>
        a.group.localeCompare(b.group) ||
        a.company.localeCompare(b.company) ||
        a.name.localeCompare(b.name)
      );

    const groupMap = new Map<string, {
      group: string;
      manhour: number;
      quantity: number;
      ratio: number;
      rows: DetailRow[];
    }>();

    for (const row of details) {
      if (!groupMap.has(row.group)) {
        groupMap.set(row.group, {
          group: row.group,
          manhour: 0,
          quantity: activityQtyByGroup.get(row.group) || 0,
          ratio: 0,
          rows: []
        });
      }

      const g = groupMap.get(row.group)!;
      g.rows.push(row);
      g.manhour += row.manhour;
      g.quantity = activityQtyByGroup.get(row.group) || 0;
    }

    return Array.from(groupMap.values())
      .map(g => ({
        ...g,
        ratio: g.quantity > 0 ? g.manhour / g.quantity : 0
      }))
      .filter(g => !(g.manhour === 0 && g.quantity === 0))
      .sort((a, b) => a.group.localeCompare(b.group));
  }, [selectedJob, positions, activityQtyByGroup]);

  /* ───────────────────────────────────── Activity View ───────────────────────────────────── */
  const groupedActivity = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    type DetailRow = {
      group: string;
      activity: string;
      difficulty: string;
      manhour: number;
      quantity: number;
      ratio: number;
    };

    const detailMap = new Map<string, DetailRow>();

    for (const a of activities) {
      const group = getActivityGroup(a, allStdMh);
      const difficulty = a.level || "Medium";

      const qty =
        Number(a.actual_quantity || 0) > 0
          ? Number(a.actual_quantity || 0)
          : Number(a.plan_quantity || 0);

      const mh = manpowerMhByGroup.get(group) || 0;

      if (mh === 0 && qty === 0) continue;

      const activityName = a.sub_header || a.header || "—";
      const key = [group, activityName, difficulty].join("||");

      if (!detailMap.has(key)) {
        detailMap.set(key, {
          group,
          activity: activityName,
          difficulty,
          manhour: 0,
          quantity: 0,
          ratio: 0
        });
      }

      const row = detailMap.get(key)!;
      row.manhour = mh;
      row.quantity += qty;
    }

    const details = Array.from(detailMap.values())
      .map(r => ({
        ...r,
        ratio: r.quantity > 0 ? r.manhour / r.quantity : 0
      }))
      .filter(r => !(r.manhour === 0 && r.quantity === 0))
      .sort((a, b) =>
        a.group.localeCompare(b.group) ||
        a.activity.localeCompare(b.activity) ||
        a.difficulty.localeCompare(b.difficulty)
      );

    const groupMap = new Map<string, {
      group: string;
      manhour: number;
      quantity: number;
      ratio: number;
      rows: DetailRow[];
    }>();

    for (const row of details) {
      if (!groupMap.has(row.group)) {
        groupMap.set(row.group, {
          group: row.group,
          manhour: manpowerMhByGroup.get(row.group) || 0,
          quantity: 0,
          ratio: 0,
          rows: []
        });
      }

      const g = groupMap.get(row.group)!;
      g.rows.push(row);
      g.manhour = manpowerMhByGroup.get(row.group) || 0;
      g.quantity += row.quantity;
    }

    return Array.from(groupMap.values())
      .map(g => ({
        ...g,
        ratio: g.quantity > 0 ? g.manhour / g.quantity : 0
      }))
      .filter(g => !(g.manhour === 0 && g.quantity === 0))
      .sort((a, b) => a.group.localeCompare(b.group));
  }, [activities, allStdMh, manpowerMhByGroup]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const expandAll = () => {
    if (view === "manpower") {
      setExpandedGroups(new Set(groupedManpower.map(g => g.group)));
    } else {
      setExpandedGroups(new Set(groupedActivity.map(g => g.group)));
    }
  };

  const collapseAll = () => setExpandedGroups(new Set());

  const totals = useMemo(() => {
    if (view === "manpower") {
      const mh = groupedManpower.reduce((s, g) => s + g.manhour, 0);
      const qty = groupedManpower.reduce((s, g) => s + g.quantity, 0);
      return { manhour: mh, quantity: qty, ratio: qty > 0 ? mh / qty : 0 };
    }

    const mh = groupedActivity.reduce((s, g) => s + g.manhour, 0);
    const qty = groupedActivity.reduce((s, g) => s + g.quantity, 0);
    return { manhour: mh, quantity: qty, ratio: qty > 0 ? mh / qty : 0 };
  }, [view, groupedManpower, groupedActivity]);

  return (
    <div>
      {/* ── Search Project ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 3, minWidth: 280, marginBottom: 0, position: "relative" }}>
            <label>Select Project</label>
            <input
              className="form-control"
              placeholder="Search project..."
              value={selectedJob ? (selectedJobObj ? selectedJobObj.job_no + " — " + selectedJobObj.job_name : selectedJob) : jobSearch}
              onChange={e => {
                setJobSearch(e.target.value);
                setSelectedJob("");
                setShowJobDd(true);
              }}
              onFocus={() => setShowJobDd(true)}
              onBlur={() => setTimeout(() => setShowJobDd(false), 200)}
            />

            {showJobDd && !selectedJob && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-md)",
                  maxHeight: 250,
                  overflowY: "auto"
                }}
              >
                {filteredJobs.length === 0 && (
                  <div style={{ padding: 12, fontSize: 12, color: "var(--color-text-dim)" }}>
                    No projects.
                  </div>
                )}
                {filteredJobs.map(j => (
                  <div
                    key={j.job_no}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontSize: 12,
                      display: "flex",
                      justifyContent: "space-between"
                    }}
                    onMouseDown={e => {
                      e.preventDefault();
                      setSelectedJob(j.job_no);
                      setJobSearch("");
                      setShowJobDd(false);
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{j.job_no}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-dim)" }}>{j.job_name}</div>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--color-text-dim)" }}>
                      {j.location} · {j.asset}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {selectedJob && (
              <button
                style={{
                  position: "absolute",
                  right: 8,
                  top: 28,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "var(--color-text-dim)"
                }}
                onClick={() => {
                  setSelectedJob("");
                  setJobSearch("");
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {!selectedJob && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>Select a project to view close-out summary.</p>
        </div>
      )}

      {selectedJob && selectedJobObj && (
        <>
          {/* ── Project Information Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <InfoCard label="Job No • Job Name" value={`${selectedJobObj.job_no} • ${selectedJobObj.job_name}`} />
            <InfoCard label="Company" value={`${selectedJobObj.asset || "—"}`} />
            <InfoCard label="Asset • Location" value={`${selectedJobObj.location || "—"} • ${selectedJobObj.working_platform || "—"}`} />
            <InfoCard label="Job Type • Sub Type" value={`${selectedJobObj.job_type || "—"} • ${selectedJobObj.sub_type || "—"}`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
            <InfoCard label="Plan Start" value={fmtDate(planStart)} />
            <InfoCard label="Plan Finish" value={fmtDate(planFinish)} />
            <InfoCard label="Actual Start" value={fmtDate(actualStart)} />
            <InfoCard label="Actual Finish" value={fmtDate(actualFinish)} />
          </div>

          {/* ── Tabs below project info ── */}
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button
              className={"tab-btn " + (view === "manpower" ? "active" : "")}
              onClick={() => setView("manpower")}
            >
              Manpower View
            </button>
            <button
              className={"tab-btn " + (view === "activity" ? "active" : "")}
              onClick={() => setView("activity")}
            >
              Activity View
            </button>
          </div>

          {/* ── Summary Report ── */}
          <div className="card">
            <div className="card-header">
              <h2>{view === "manpower" ? "Summary Report — Manpower View" : "Summary Report — Activity View"}</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={expandAll}>Expand All</button>
                <button className="btn btn-secondary btn-sm" onClick={collapseAll}>Collapse All</button>
              </div>
            </div>

            {loading && (
              <div style={{ padding: 16, fontSize: 13, color: "var(--color-text-dim)" }}>
                Loading...
              </div>
            )}

            {!loading && view === "manpower" && (
              <div className="table-wrapper">
                <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
                  <colgroup>
                    <col style={{ width: 30 }} />
                    <col style={{ width: 150 }} />
                    <col style={{ width: 150 }} />
                    <col/>
                    <col style={{ width: 100 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 180 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th />
                      <th>Group</th>
                      <th>Company</th>
                      <th>Name</th>
                      <th style={{ textAlign: "right" }}>Manhour</th>
                      <th style={{ textAlign: "right" }}>Quantity</th>
                      <th style={{ textAlign: "right" }}>Manhour / Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedManpower.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: 24 }}>
                          No manpower summary.
                        </td>
                      </tr>
                    )}

                    {groupedManpower.map(group => {
                      const expanded = expandedGroups.has(group.group);

                      return (
                        <React.Fragment key={group.group}>
                          <tr
                            onClick={() => toggleGroup(group.group)}
                            style={{
                              cursor: "pointer",
                              background: "rgba(0,0,0,0.015)",
                              fontWeight: 600
                            }}
                          >
                            <td
                              style={{
                                textAlign: "center",
                                fontSize: 10,
                                padding: "10px 8px",
                                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                                transition: "transform 0.15s"
                              }}
                            >
                              ▶
                            </td>
                            <td style={{ padding: "10px 12px" }}>{group.group}</td>
                            <td style={{ fontSize: 11, color: "var(--color-text-dim)" }}>{group.rows.length} rows</td>
                            <td></td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(group.manhour)}</td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(group.quantity)}</td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px", fontWeight: 700 }}>{fmtNum(group.ratio)}</td>
                          </tr>

                          {expanded && group.rows.map((r, idx) => (
                            <tr key={group.group + "-" + idx}>
                              <td style={{ padding: "10px 8px" }}></td>
                              <td style={{ padding: "10px 12px" }}></td>
                              <td style={{ padding: "10px 12px" }}>{r.company}</td>
                              <td style={{ padding: "10px 12px" }}>{r.name}</td>
                              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(r.manhour)}</td>
                              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(r.quantity)}</td>
                              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(r.ratio)}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "var(--color-surface-2)", borderTop: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "10px 8px" }}></td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>Total</td>
                      <td style={{ padding: "10px 12px" }}></td>
                      <td style={{ padding: "10px 12px" }}></td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmtNum(totals.manhour)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmtNum(totals.quantity)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmtNum(totals.ratio)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {!loading && view === "activity" && (
              <div className="table-wrapper">
                <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
                  <colgroup>
                    <col style={{ width: 30 }} />
                    <col style={{ width: 150 }} />
                    <col />
                    <col style={{ width: 150 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 180 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th />
                      <th>Group</th>
                      <th>Activity</th>
                      <th>Difficulty</th>
                      <th style={{ textAlign: "right" }}>Manhour</th>
                      <th style={{ textAlign: "right" }}>Quantity</th>
                      <th style={{ textAlign: "right" }}>Manhour / Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedActivity.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: 24 }}>
                          No activity summary.
                        </td>
                      </tr>
                    )}

                    {groupedActivity.map(group => {
                      const expanded = expandedGroups.has(group.group);

                      return (
                        <React.Fragment key={group.group}>
                          <tr
                            onClick={() => toggleGroup(group.group)}
                            style={{
                              cursor: "pointer",
                              background: "rgba(0,0,0,0.015)",
                              fontWeight: 600
                            }}
                          >
                            <td
                              style={{
                                textAlign: "center",
                                fontSize: 10,
                                padding: "10px 8px",
                                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                                transition: "transform 0.15s"
                              }}
                            >
                              ▶
                            </td>
                            <td style={{ padding: "10px 12px" }}>{group.group}</td>
                            <td style={{ fontSize: 11, color: "var(--color-text-dim)", padding: "10px 12px" }}>{group.rows.length} rows</td>
                            <td style={{ padding: "10px 12px" }}></td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(group.manhour)}</td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(group.quantity)}</td>
                            <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px", fontWeight: 700 }}>{fmtNum(group.ratio)}</td>
                          </tr>

                          {expanded && group.rows.map((r, idx) => (
                            <tr key={group.group + "-" + idx}>
                              <td style={{ padding: "10px 8px" }}></td>
                              <td style={{ padding: "10px 12px" }}></td>
                              <td style={{ padding: "10px 12px" }}>{r.activity}</td>
                              <td style={{ padding: "10px 12px" }}>{r.difficulty}</td>
                              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(r.manhour)}</td>
                              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(r.quantity)}</td>
                              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{fmtNum(r.ratio)}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "var(--color-surface-2)", borderTop: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "10px 8px" }}></td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>Total</td>
                      <td style={{ padding: "10px 12px" }}></td>
                      <td style={{ padding: "10px 12px" }}></td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmtNum(totals.manhour)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmtNum(totals.quantity)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmtNum(totals.ratio)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<ManhourPage />);