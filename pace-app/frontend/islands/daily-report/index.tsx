import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";

/* ══════════════════════════════════════ TYPES ══════════════════════════════════════ */
interface Job { job_no: string; job_name: string; status: string; asset: string; working_platform: string; location: string; job_type: string; sub_type: string; project_engineer: string; }
interface PlanSummaryData { total_manhour: number; estimated_pob: number; project_duration: number; actual_manhour_daily: number; }
interface Progress { id: number; project_no: string; weather_condition: string; status: string; plan_pob: number; actual_pob: number; plan_manhour: number; actual_manhour: number; progress_date: string; progress_today: number; progress_total: number; normal_working_time: string|null; lq_departure_time: string|null; pf_arrival_time: string|null; start_working_time: string|null; pf_departure_time: string|null; lq_arrival_time: string|null; downtime_hour: number; productive_hour: number; wrench_time_project: number; wrench_time_daily: number; pdi_project: number; pdi_daily: number; pgi_project: number; pgi_daily: number; pti_project: number; pti_daily: number; }
interface Manpower { id: number; project_no: string; contractor_id: string; contractor_name: string; contractor_company: string; contractor_position: string; location: string; quarter_platform: string; offshore_working: number; offshore_standby: number; offshore_overtime: number; onshore_working: number; onshore_standby: number; onshore_overtime: number; total: number; sse: boolean; }
interface EquipmentRow { id: number; project_no: string; equipment_id: number; equipment_name: string; equipment_company: string; charge_type: string; tag_no: string; quantity: number; offshore_working: number; offshore_standby: number; offshore_overtime: number; onshore_working: number; onshore_standby: number; onshore_overtime: number; total: number; }
interface ContractorItem { id: number; name: string; company: string; position: string; status: string; }
interface EquipmentItem { id: number; description: string; company: string; status: string; }
interface PlanActivityItem { id: number; job_no: string; structure: string; header: string; sub_header: string; description: string; unit: string; plan_quantity: number; plan_manhour: number; actual_quantity: number; actual_manhour: number; }
interface QpMapping { id: number; asset: string; quarter_platform: string; status: string; }
interface ActivityProgress { activity_id: number; progress_today: number; }

type TabKey = "progress" | "manpower" | "equipment" | "activity";

const WEATHER = ["Clear", "Cloudy", "Rain", "Storm", "Foggy"];
const NO_PROGRESS_REASONS = ["Bad Weather", "Waiting for Material", "Waiting for Permit", "Equipment Breakdown", "Safety Stand Down", "Holiday", "Other"];
const TABS: { key: TabKey; label: string }[] = [
  { key: "progress", label: "Progress & Time" },
  { key: "manpower", label: "Manpower" },
  { key: "equipment", label: "Equipment" },
  { key: "activity", label: "Activity" },
];

const apiH = (): Record<string, string> => ({ "Content-Type": "application/json", "X-User-Role": localStorage.getItem("pace-role") || "administrator", "X-User-Name": localStorage.getItem("pace-user-name") || "Dev User" });
const api = async (url: string, o?: RequestInit) => { const r = await fetch(url, { headers: apiH(), ...o }); if (!r.ok) { const j = await r.json().catch(() => ({ error: "HTTP " + r.status })); throw new Error(j.message || j.error); } return r.json(); };

function fmtDate(val: string | null): string {
  if (!val) return "—";
  try { const d = new Date(val); if (isNaN(d.getTime())) return val; const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return String(d.getDate()).padStart(2,"0") + " " + M[d.getMonth()] + " " + d.getFullYear(); }
  catch { return val; }
}
function todayStr(): string { return new Date().toISOString().split("T")[0]; }
function timeStr(dt: string | null | undefined): string {
  if (!dt) return "";
  if (dt.includes("T")) { const p = dt.split("T")[1]; if (p) return p.substring(0, 5); }
  if (dt.length >= 5 && dt.includes(":")) return dt.substring(0, 5);
  return "";
}
function hoursBetween(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = timeStr(start); const e = timeStr(end);
  if (!s || !e) return 0;
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

/* ══════════════════════════════════════ ACTIVITY SNAPSHOT HELPERS ══════════════════════════════════════ */
function normalizeDateKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return dateStr.slice(0, 10);
  }
}

function activityTodayStorageKey(projectNo: string, dateStr: string): string {
  return "pace-activity-today-" + projectNo + "-" + normalizeDateKey(dateStr);
}

function activityWeightStorageKey(projectNo: string): string {
  return "pace-weights-" + projectNo;
}

function activityDraftStorageKey(projectNo: string, dateStr: string): string {
  return "pace-progress-" + projectNo + "-" + normalizeDateKey(dateStr);
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

function loadAllActivityTodaySnapshots(projectNo: string): Record<string, Record<number, number>> {
  const prefix = "pace-activity-today-" + projectNo + "-";
  const result: Record<string, Record<number, number>> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (!k.startsWith(prefix)) continue;

      const dateKey = k.substring(prefix.length);
      const parsed = safeReadJson<Record<number, number>>(k, {});
      result[dateKey] = parsed;
    }
  } catch {}

  return result;
}

function buildCumulativeActivityTotals(
  allSnapshots: Record<string, Record<number, number>>,
  selectedDate: string
): Record<number, number> {
  const dateKey = normalizeDateKey(selectedDate);
  const dates = Object.keys(allSnapshots)
    .filter(d => d <= dateKey)
    .sort();

  const totals: Record<number, number> = {};

  for (const d of dates) {
    const dayMap = allSnapshots[d] || {};
    for (const [idStr, val] of Object.entries(dayMap)) {
      const id = parseInt(idStr, 10);
      const num = Number(val) || 0;
      totals[id] = Math.min((totals[id] || 0) + num, 100);
    }
  }

  return totals;
}

/* ══════════════════════════════════════ MANPOWER / EQUIPMENT SNAPSHOT HELPERS ══════════════════════════════════════ */
function manpowerStorageKey(projectNo: string, dateStr: string): string {
  return "pace-manpower-" + projectNo + "-" + normalizeDateKey(dateStr);
}

function equipmentStorageKey(projectNo: string, dateStr: string): string {
  return "pace-equipment-" + projectNo + "-" + normalizeDateKey(dateStr);
}

function findLatestSnapshotDate(prefix: string, selectedDate: string): string | null {
  const dateKey = normalizeDateKey(selectedDate);
  let latest: string | null = null;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (!k.startsWith(prefix)) continue;

      const d = k.substring(prefix.length);
      if (d <= dateKey && (!latest || d > latest)) {
        latest = d;
      }
    }
  } catch {}

  return latest;
}

function loadSnapshotByDateOrPrevious<T>(prefix: string, selectedDate: string, fallback: T): T {
  const target = findLatestSnapshotDate(prefix, selectedDate);
  if (!target) return fallback;

  return safeReadJson<T>(prefix + target, fallback);
}

/* ══════════════════════════════════════ KPI CARD ══════════════════════════════════════ */
const KpiBox: React.FC<{ label: string; rows: { label: string; value: string | number; color?: string }[] }> = ({ label, rows }) => (
  <div className="kpi-card" style={{ textAlign: "left", padding: "14px 18px" }}>
    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--color-text-dim)", marginBottom: 8 }}>{label}</div>
    {rows.map((r, i) => (
      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{r.label}</span>
        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", color: r.color || "var(--color-text)" }}>{typeof r.value === "number" ? r.value.toFixed(1) : r.value}</span>
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════ PROGRESS TAB ══════════════════════════════════════ */
const ProgressTab: React.FC<{
  progressRef: React.MutableRefObject<Partial<Progress>>;
  dateStr: string; progressData: Progress | null; projectNo: string; disabled: boolean;
}> = ({ progressRef, dateStr, progressData, projectNo, disabled }) => {
  const [form, setForm] = useState<Partial<Progress>>({});
  const [noProgress, setNoProgress] = useState(false);
  const [noProgressReason, setNoProgressReason] = useState("");

  useEffect(() => {
    if (progressData) {
      setForm(progressData);
      setNoProgress(progressData.status === "No Progress");
      setNoProgressReason(progressData.status === "No Progress" ? (progressData.weather_condition || "") : "");
    } else {
      setForm({ project_no: projectNo, progress_date: dateStr, weather_condition: "Clear" });
      setNoProgress(false); setNoProgressReason("");
    }
  }, [progressData, projectNo, dateStr]);

  useEffect(() => {
    const prodHrs = hoursBetween(form.start_working_time ?? null, form.pf_departure_time ?? null) - (form.downtime_hour || 0);
    const availHrs = hoursBetween(form.lq_departure_time ?? null, form.lq_arrival_time ?? null);
    const wrench = availHrs > 0 ? (Math.max(prodHrs, 0) / availHrs) * 100 : 0;
    progressRef.current = { ...form, productive_hour: Math.max(prodHrs, 0), wrench_time_daily: Math.max(wrench, 0), status: noProgress ? "No Progress" : "In Progress", weather_condition: noProgress ? (noProgressReason || "No Progress") : (form.weather_condition || "Clear") };
  }, [form, noProgress, noProgressReason]);

  const update = (key: string, val: any) => { setForm(prev => { const n = { ...prev }; (n as any)[key] = val; return n; }); };
  const updateTime = (key: string, tv: string) => { setForm(prev => { const n = { ...prev }; (n as any)[key] = tv && tv.length >= 5 ? dateStr + "T" + tv + ":00" : null; return n; }); };

  const prodHrs = hoursBetween(form.start_working_time ?? null, form.pf_departure_time ?? null) - (form.downtime_hour || 0);
  const availHrs = hoursBetween(form.lq_departure_time ?? null, form.lq_arrival_time ?? null);
  const wrench = availHrs > 0 ? (Math.max(prodHrs, 0) / availHrs) * 100 : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "10px 14px", background: noProgress ? "rgba(255,184,77,0.08)" : "transparent", borderRadius: 8, border: noProgress ? "1px solid rgba(255,184,77,0.2)" : "1px solid transparent" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: disabled ? "default" : "pointer", fontSize: 13, fontWeight: 500 }}>
          <input type="checkbox" checked={noProgress} disabled={disabled} onChange={e => setNoProgress(e.target.checked)} /> No progress today
        </label>
        {noProgress && <select className="form-control" style={{ width: 220 }} value={noProgressReason} disabled={disabled} onChange={e => setNoProgressReason(e.target.value)}><option value="">-- Reason --</option>{NO_PROGRESS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select>}
      </div>
      {!noProgress && (<>
        <div className="form-row"><div className="form-group"><label>Weather</label><select className="form-control" value={form.weather_condition || ""} disabled={disabled} onChange={e => update("weather_condition", e.target.value)}><option value="">--</option>{WEATHER.map(w => <option key={w} value={w}>{w}</option>)}</select></div></div>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "16px 0 10px", color: "var(--color-text-muted)" }}>Time Schedule</h3>
        <div className="form-row">
          <div className="form-group"><label>Normal Working</label><input className="form-control" type="time" value={timeStr(form.normal_working_time)} disabled={disabled} onChange={e => updateTime("normal_working_time", e.target.value)} /></div>
          <div className="form-group"><label>LQ Departure</label><input className="form-control" type="time" value={timeStr(form.lq_departure_time)} disabled={disabled} onChange={e => updateTime("lq_departure_time", e.target.value)} /></div>
          <div className="form-group"><label>PF Arrival</label><input className="form-control" type="time" value={timeStr(form.pf_arrival_time)} disabled={disabled} onChange={e => updateTime("pf_arrival_time", e.target.value)} /></div>
          <div className="form-group"><label style={{ display: "flex", alignItems: "center", gap: 6 }}>Start Working<span title="Time after received work permit" style={{ cursor: "help", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", border: "1px solid var(--color-border-light)", fontSize: 10, fontWeight: 700, color: "var(--color-text-dim)", fontStyle: "italic", fontFamily: "Georgia, serif", lineHeight: 1 }}>i</span></label>
          <input className="form-control" type="time" value={timeStr(form.start_working_time)} disabled={disabled} onChange={e => updateTime("start_working_time", e.target.value)} /></div>
          <div className="form-group"><label>PF Departure</label><input className="form-control" type="time" value={timeStr(form.pf_departure_time)} disabled={disabled} onChange={e => updateTime("pf_departure_time", e.target.value)} /></div>
          <div className="form-group"><label>LQ Arrival</label><input className="form-control" type="time" value={timeStr(form.lq_arrival_time)} disabled={disabled} onChange={e => updateTime("lq_arrival_time", e.target.value)} /></div>
        </div>
        <div className="form-row" style={{ marginTop: 8 }}>
          <div className="form-group"><label>Downtime (Hrs)</label><input className="form-control" type="number" step="0.1" value={form.downtime_hour || 0} disabled={disabled} onChange={e => update("downtime_hour", parseFloat(e.target.value) || 0)} /></div>
          <div className="form-group"><label>Productive (Hrs)</label><div style={{ padding: "8px 12px", background: "var(--color-surface-2)", borderRadius: 6, fontFamily: "var(--font-mono)", fontWeight: 600, color: prodHrs > 0 ? "var(--color-success)" : "var(--color-text-dim)" }}>{Math.max(prodHrs, 0).toFixed(2)} hrs</div></div>
          <div className="form-group"><label>Wrench Time (%)</label><div style={{ padding: "8px 12px", background: "var(--color-surface-2)", borderRadius: 6, fontFamily: "var(--font-mono)", fontWeight: 600, color: wrench > 0 ? "var(--color-primary)" : "var(--color-text-dim)" }}>{Math.max(wrench, 0).toFixed(1)}%</div></div>
        </div>
      </>)}
    </div>
  );
};

/* ══════════════════════════════════════ MANPOWER TAB ══════════════════════════════════════ */
const ManpowerTab: React.FC<{ projectNo: string; rows: Manpower[]; platforms: string[]; onUpdate: (r: Manpower[]) => void; disabled: boolean }> = ({ projectNo, rows, platforms, onUpdate, disabled }) => {
  const [contractors, setContractors] = useState<ContractorItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selId, setSelId] = useState("");
  useEffect(() => { api("/api/master-data/contractors").then(setContractors).catch(() => {}); }, []);
  const addRow = () => { const c = contractors.find(x => String(x.id) === selId); if (!c) return; onUpdate([...rows, { id: -(Date.now()), project_no: projectNo, contractor_id: String(c.id), contractor_name: c.name, contractor_company: c.company, contractor_position: c.position, location: "", quarter_platform: "", offshore_working: 0, offshore_standby: 0, offshore_overtime: 0, onshore_working: 0, onshore_standby: 0, onshore_overtime: 0, total: 0, sse: false }]); setSelId(""); setShowAdd(false); };
  const uf = (i: number, f: string, v: any) => { if (disabled) return; const n = [...rows]; const it = { ...n[i] }; (it as any)[f] = v; it.total = (it.offshore_working||0)+(it.offshore_standby||0)+(it.offshore_overtime||0)+(it.onshore_working||0)+(it.onshore_standby||0)+(it.onshore_overtime||0); n[i] = it; onUpdate(n); };
  const del = (i: number) => { if (confirm("Remove?")) onUpdate(rows.filter((_, x) => x !== i)); };
  return (<div>
    {!disabled && <div className="toolbar"><div /><button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add</button></div>}
    {showAdd && !disabled && <div className="card" style={{ marginBottom: 12, padding: 12 }}><div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}><div className="form-group" style={{ flex: 1, marginBottom: 0 }}><label>Contractor</label><select className="form-control" value={selId} onChange={e => setSelId(e.target.value)}><option value="">--</option>{contractors.filter(c => c.status === "Active").map(c => <option key={c.id} value={String(c.id)}>{c.name} — {c.position} ({c.company})</option>)}</select></div><button className="btn btn-primary btn-sm" onClick={addRow} disabled={!selId}>Add</button><button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button></div></div>}
    <div className="table-wrapper" style={{ overflowX: "auto" }}><table>
        <thead>
          <tr>
            <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom" }}>Company</th>
            <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom" }}>Name</th>
            <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom" }}>Position</th>
            <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom" }}>QP</th>
            <th colSpan={3} style={{ fontSize: 10, textAlign: "center", borderBottom: "1px solid var(--color-border)" }}>Offshore (Hour)</th>
            <th colSpan={3} style={{ fontSize: 10, textAlign: "center", borderBottom: "1px solid var(--color-border)" }}>Onshore (Hour)</th>
            <th rowSpan={2} style={{ fontSize: 11, textAlign: "right", verticalAlign: "bottom" }}>Total<br/>(Hour)</th>
            <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom" }}>SSE</th>
            {!disabled && <th rowSpan={2} style={{ verticalAlign: "bottom" }}></th>}
          </tr>
          <tr>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(74,222,128,0.10)" }}>Working</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(255,107,107,0.10)" }}>Overtime</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(255,184,77,0.10)" }}>Standby</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(74,222,128,0.10)" }}>Working</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(255,107,107,0.10)" }}>Overtime</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(255,184,77,0.10)" }}>Standby</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={disabled ? 12 : 13} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: 24 }}>No manpower.</td></tr>}
          {rows.map((r, idx) => (
            <tr key={r.id}>
              <td style={{ fontSize: 11 }}>{r.contractor_company}</td>
              <td style={{ fontSize: 12 }}>{r.contractor_name}</td>
              <td style={{ fontSize: 11 }}>{r.contractor_position}</td>
              <td><select className="form-control" style={{ width: 80 }} value={r.quarter_platform || ""} disabled={disabled} onChange={e => uf(idx, "quarter_platform", e.target.value)}><option value="">--</option>{platforms.map(p => <option key={p} value={p}>{p}</option>)}</select></td>
              <td style={{ background: "rgba(74,222,128,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.offshore_working} disabled={disabled} onChange={e => uf(idx, "offshore_working", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(255,107,107,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.offshore_overtime} disabled={disabled} onChange={e => uf(idx, "offshore_overtime", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(255,184,77,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.offshore_standby} disabled={disabled} onChange={e => uf(idx, "offshore_standby", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(74,222,128,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.onshore_working} disabled={disabled} onChange={e => uf(idx, "onshore_working", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(255,107,107,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.onshore_overtime} disabled={disabled} onChange={e => uf(idx, "onshore_overtime", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(255,184,77,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.onshore_standby} disabled={disabled} onChange={e => uf(idx, "onshore_standby", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, textAlign: "right" }}>{r.total.toFixed(1)}</td>
              <td><input type="checkbox" checked={r.sse} disabled={disabled} onChange={e => uf(idx, "sse", e.target.checked)} /></td>
              {!disabled && <td><button className="btn btn-danger btn-sm" style={{ padding: "2px 6px" }} onClick={() => del(idx)}>✕</button></td>}
            </tr>
          ))}
        </tbody>
      </table></div>
  </div>);
};

/* ══════════════════════════════════════ EQUIPMENT TAB ══════════════════════════════════════ */
const EquipmentTabComp: React.FC<{ projectNo: string; projectCompany: string; rows: EquipmentRow[]; onUpdate: (r: EquipmentRow[]) => void; disabled: boolean }> = ({ projectNo, projectCompany, rows, onUpdate, disabled }) => {
  const [eqList, setEqList] = useState<EquipmentItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selId, setSelId] = useState("");
  useEffect(() => { api("/api/master-data/equipment").then(setEqList).catch(() => {}); }, []);
  const addRow = () => { const eq = eqList.find(x => String(x.id) === selId); if (!eq) return; onUpdate([...rows, { id: -(Date.now()), project_no: projectNo, equipment_id: eq.id, equipment_name: eq.description, equipment_company: projectCompany || eq.company, charge_type: "", tag_no: "", quantity: 1, offshore_working: 0, offshore_standby: 0, offshore_overtime: 0, onshore_working: 0, onshore_standby: 0, onshore_overtime: 0, total: 0 }]); setSelId(""); setShowAdd(false); };
  const uf = (i: number, f: string, v: any) => { if (disabled) return; const n = [...rows]; const it = { ...n[i] }; (it as any)[f] = v; it.total = (it.offshore_working||0)+(it.offshore_standby||0)+(it.offshore_overtime||0)+(it.onshore_working||0)+(it.onshore_standby||0)+(it.onshore_overtime||0); n[i] = it; onUpdate(n); };
  const del = (i: number) => { if (confirm("Remove?")) onUpdate(rows.filter((_, x) => x !== i)); };
  return (<div>
    {!disabled && <div className="toolbar"><div /><button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add</button></div>}
    {showAdd && !disabled && <div className="card" style={{ marginBottom: 12, padding: 12 }}><div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}><div className="form-group" style={{ flex: 1, marginBottom: 0 }}><label>Equipment</label><select className="form-control" value={selId} onChange={e => setSelId(e.target.value)}><option value="">--</option>{eqList.filter(e => e.status === "Active").map(e => <option key={e.id} value={String(e.id)}>{e.description}</option>)}{eqList.filter(e => e.status === "Active").map(e => <option key={e.id} value={String(e.id)}>{e.description} ({e.company})</option>)}</select></div><button className="btn btn-primary btn-sm" onClick={addRow} disabled={!selId}>Add</button><button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button></div></div>}
    <div className="table-wrapper" style={{ overflowX: "auto" }}><table>
        <thead>
          <tr>
            <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom" }}>Company</th>
            <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom" }}>Equipment</th>
            <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom" }}>Tag</th>
            <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom" }}>Qty</th>
            <th colSpan={3} style={{ fontSize: 10, textAlign: "center", borderBottom: "1px solid var(--color-border)" }}>Offshore (Day)</th>
            <th colSpan={3} style={{ fontSize: 10, textAlign: "center", borderBottom: "1px solid var(--color-border)" }}>Onshore (Day)</th>
            <th rowSpan={2} style={{ fontSize: 11, textAlign: "right", verticalAlign: "bottom" }}>Total<br/>(Day)</th>
            {!disabled && <th rowSpan={2} style={{ verticalAlign: "bottom" }}></th>}
          </tr>
          <tr>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(74,222,128,0.10)" }}>Working</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(255,107,107,0.10)" }}>Overtime</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(255,184,77,0.10)" }}>Standby</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(74,222,128,0.10)" }}>Working</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(255,107,107,0.10)" }}>Overtime</th>
            <th style={{ fontSize: 9, textAlign: "center", background: "rgba(255,184,77,0.10)" }}>Standby</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={disabled ? 11 : 12} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: 24 }}>No equipment.</td></tr>}
          {rows.map((r, idx) => (
            <tr key={r.id}>
              <td style={{ fontSize: 11 }}>{r.equipment_company}</td>
              <td style={{ fontSize: 12 }}>{r.equipment_name}</td>
              <td><input className="form-control" style={{ width: 80 }} value={r.tag_no || ""} disabled={disabled} onChange={e => uf(idx, "tag_no", e.target.value)} /></td>
              <td><input className="form-control" type="number" style={{ width: 50 }} value={r.quantity} disabled={disabled} onChange={e => uf(idx, "quantity", parseInt(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(74,222,128,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.offshore_working} disabled={disabled} onChange={e => uf(idx, "offshore_working", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(255,107,107,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.offshore_overtime} disabled={disabled} onChange={e => uf(idx, "offshore_overtime", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(255,184,77,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.offshore_standby} disabled={disabled} onChange={e => uf(idx, "offshore_standby", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(74,222,128,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.onshore_working} disabled={disabled} onChange={e => uf(idx, "onshore_working", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(255,107,107,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.onshore_overtime} disabled={disabled} onChange={e => uf(idx, "onshore_overtime", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ background: "rgba(255,184,77,0.10)" }}><input className="form-control" type="number" style={{ width: 55 }} value={r.onshore_standby} disabled={disabled} onChange={e => uf(idx, "onshore_standby", parseFloat(e.target.value) || 0)} /></td>
              <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, textAlign: "right" }}>{r.total.toFixed(1)}</td>
              {!disabled && <td><button className="btn btn-danger btn-sm" style={{ padding: "2px 6px" }} onClick={() => del(idx)}>✕</button></td>}
            </tr>
          ))}
        </tbody>
      </table></div>
  </div>);
};

/* ══════════════════════════════════════ ACTIVITY TAB ══════════════════════════════════════ */
interface ActivityRow {
  id: number;
  job_no: string;
  header: string;
  sub_header: string;
  description: string;
  unit: string;
  plan_quantity: number;
  plan_manhour: number;
  actual_quantity: number;
  actual_manhour: number;
}

/* ══════════════════════════════════════ ACTIVITY TAB ══════════════════════════════════════ */
interface ActivityRow {
  id: number;
  job_no: string;
  header: string;
  sub_header: string;
  description: string;
  unit: string;
  plan_quantity: number;
  plan_manhour: number;
  actual_quantity: number;
  actual_manhour: number;
}

const ActivityTab: React.FC<{
  projectNo: string;
  selectedDate: string;
  activityProgressRef: React.MutableRefObject<ActivityProgress[]>;
  allStdMh: any[];
}> = ({ projectNo, selectedDate, activityProgressRef, allStdMh }) => {
  const [activities, setActivities] = useState<PlanActivityItem[]>([]);
  const [localProgress, setLocalProgress] = useState<Record<number, number>>({});
  const [savedTotals, setSavedTotals] = useState<Record<number, number>>({});
  const [localQty, setLocalQty] = useState<Record<number, number>>({});
  const [localWeights, setLocalWeights] = useState<Record<number, string>>({});
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"std" | "custom">("std");
  const [selStd, setSelStd] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  const [customUnit, setCustomUnit] = useState("ea");
  const [customQty, setCustomQty] = useState(0);
  const [difficulty, setDifficulty] = useState("Medium");

  const initializedRef = useRef(false);
  const prevIdsRef = useRef<number[]>([]);

  const dateKey = normalizeDateKey(selectedDate);
  const weightKey = activityWeightStorageKey(projectNo);
  const draftKey = activityDraftStorageKey(projectNo, selectedDate);
  const todayKey = activityTodayStorageKey(projectNo, selectedDate);

  const stdMhOptions = useMemo(() => {
    if (!allStdMh || allStdMh.length === 0) return [];
    const seen = new Set<string>();
    return allStdMh
      .filter((s: any) => s.status === "Active")
      .filter((s: any) => {
        const key = (s.header || "") + "||" + (s.description || "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [allStdMh]);

  const loadActivities = useCallback(async () => {
    if (!projectNo) return;

    try {
      const acts: PlanActivityItem[] = await api("/api/planning/plan-activities?job_no=" + projectNo).catch(() => []);
      const filtered = (acts || []).filter(
        a =>
          (a.plan_quantity || 0) > 0 ||
          (a.actual_quantity || 0) > 0 ||
          (a.plan_manhour || 0) > 0
      );

      setActivities(filtered);

      // Qty default = planning row by row
      const nextQty: Record<number, number> = {};
      filtered.forEach(a => {
        nextQty[a.id] = a.plan_quantity || 0;
      });
      setLocalQty(nextQty);

      // Expand all tags by default
      const tags = new Set<string>();
      filtered.forEach(a => tags.add(a.description || "—"));
      setExpandedTags(tags);

      // TODAY snapshot for selected date
      let savedToday = safeReadJson<Record<number, number>>(todayKey, {});
      if (Object.keys(savedToday).length === 0) {
        // fallback to draft for current unsaved view
        savedToday = safeReadJson<Record<number, number>>(draftKey, {});
      }

      const nextProgress: Record<number, number> = {};
      filtered.forEach(a => {
        nextProgress[a.id] = savedToday[a.id] || 0;
      });
      setLocalProgress(nextProgress);

      // TOTAL snapshot built from all saved TODAY snapshots up to selected date
      const allSnapshots = loadAllActivityTodaySnapshots(projectNo);
      const totals = buildCumulativeActivityTotals(allSnapshots, selectedDate);
      const nextTotals: Record<number, number> = {};
      filtered.forEach(a => {
        nextTotals[a.id] = totals[a.id] || 0;
      });
      setSavedTotals(nextTotals);

      // Weights (project-level)
      const savedWeights = safeReadJson<Record<number, string>>(weightKey, {});
      const totalPlanMh = filtered.reduce((s, a) => s + (a.plan_manhour || 0), 0);

      setLocalWeights(prev => {
        const prevIds = new Set(prevIdsRef.current);
        const next: Record<number, string> = {};

        if (
          !initializedRef.current &&
          Object.keys(savedWeights).length === 0 &&
          Object.keys(prev).length === 0
        ) {
          // first load only
          filtered.forEach(a => {
            const w = totalPlanMh > 0 ? ((a.plan_manhour || 0) / totalPlanMh) * 100 : 0;
            next[a.id] = w.toFixed(1);
          });
          initializedRef.current = true;
        } else {
          filtered.forEach(a => {
            if (prev[a.id] !== undefined) {
              next[a.id] = prev[a.id];
            } else if (savedWeights[a.id] !== undefined) {
              next[a.id] = savedWeights[a.id];
            } else if (prevIds.has(a.id)) {
              const w = totalPlanMh > 0 ? ((a.plan_manhour || 0) / totalPlanMh) * 100 : 0;
              next[a.id] = w.toFixed(1);
            } else {
              // new row starts at 0
              next[a.id] = "0";
            }
          });
        }

        try {
          localStorage.setItem(weightKey, JSON.stringify(next));
        } catch {}

        prevIdsRef.current = filtered.map(a => a.id);
        return next;
      });
    } catch {
      setActivities([]);
      setLocalProgress({});
      setSavedTotals({});
    }
  }, [projectNo, selectedDate, todayKey, draftKey, weightKey]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Sync row-level TODAY (%) to parent ref + draft localStorage
  useEffect(() => {
    activityProgressRef.current = activities.map(a => ({
      activity_id: a.id,
      progress_today: localProgress[a.id] || 0
    }));

    try {
      localStorage.setItem(draftKey, JSON.stringify(localProgress));
    } catch {}
  }, [activities, localProgress, activityProgressRef, draftKey]);

  const grouped = useMemo(() => {
    const map = new Map<string, PlanActivityItem[]>();
    activities.forEach(a => {
      const tag = a.description || "—";
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)!.push(a);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activities]);

  const getWeight = (a: PlanActivityItem): number => {
    const raw = localWeights[a.id];
    if (raw === undefined || raw === "") return 0;
    const parsed = parseFloat(raw);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getWeightDisplay = (a: PlanActivityItem): string => {
    return localWeights[a.id] ?? "0";
  };

  const totalWeight = activities.reduce((s, a) => s + getWeight(a), 0);

  const updateProgress = (id: number, val: number) => {
    setLocalProgress(prev => {
      const next = { ...prev };
      next[id] = Math.min(Math.max(val, 0), 100);
      return next;
    });
  };

  const updateQty = async (id: number, val: number) => {
    setLocalQty(prev => {
      const next = { ...prev };
      next[id] = val;
      return next;
    });

    try {
      await api("/api/planning/plan-activities/" + id, {
        method: "PUT",
        body: JSON.stringify({ actual_quantity: val })
      });
    } catch {}
  };

  const updateWeight = (id: number, val: string) => {
    setLocalWeights(prev => {
      const next = {
        ...prev,
        [id]: val
      };

      try {
        localStorage.setItem(weightKey, JSON.stringify(next));
      } catch {}

      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTags(new Set(grouped.map(([tag]) => tag)));
  };

  const collapseAll = () => {
    setExpandedTags(new Set());
  };

  const addStdActivity = async () => {
    if (!selStd) return;
    const std = stdMhOptions.find((s: any) => s.id === parseInt(selStd, 10));
    if (!std) return;

    const factor =
      difficulty === "Easy" ? 0.8 :
      difficulty === "Hard" ? 1.2 :
      1.0;

    try {
      await api("/api/planning/plan-activities", {
        method: "POST",
        body: JSON.stringify({
          job_no: projectNo,
          structure: "daily_added",
          header: std.header || "",
          sub_header: std.description || "",
          description: customTag || "",
          unit: std.unit || "",
          plan_quantity: customQty || 1,
          plan_manhour: (customQty || 1) * (std.manhour || 0) * factor,
          actual_quantity: 0,
          actual_manhour: 0
        })
      });

      setSelStd("");
      setCustomTag("");
      setCustomQty(0);
      setDifficulty("Medium");
      setShowAdd(false);

      await loadActivities();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  const addCustomActivity = async () => {
    if (!customActivity.trim()) return;

    try {
      await api("/api/planning/plan-activities", {
        method: "POST",
        body: JSON.stringify({
          job_no: projectNo,
          structure: "daily_added",
          header: "Custom",
          sub_header: customActivity,
          description: customTag || "",
          unit: customUnit || "ea",
          plan_quantity: customQty || 1,
          plan_manhour: 0,
          actual_quantity: 0,
          actual_manhour: 0
        })
      });

      setCustomActivity("");
      setCustomTag("");
      setCustomUnit("ea");
      setCustomQty(0);
      setDifficulty("Medium");
      setShowAdd(false);

      await loadActivities();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={expandAll} style={{ fontSize: 10 }}>
            Expand All
          </button>
          <button className="btn btn-secondary btn-sm" onClick={collapseAll} style={{ fontSize: 10 }}>
            Collapse All
          </button>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          + Add Activity
        </button>
      </div>

      {/* Add Activity Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 12, padding: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              className={"btn btn-sm " + (addMode === "std" ? "btn-primary" : "btn-secondary")}
              onClick={() => setAddMode("std")}
            >
              From Std MH
            </button>
            <button
              className={"btn btn-sm " + (addMode === "custom" ? "btn-primary" : "btn-secondary")}
              onClick={() => setAddMode("custom")}
            >
              Custom
            </button>
          </div>

          {addMode === "std" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 2, minWidth: 250, marginBottom: 0 }}>
                <label>Activity</label>
                <select className="form-control" value={selStd} onChange={e => setSelStd(e.target.value)}>
                  <option value="">--</option>
                  {stdMhOptions.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.header} — {s.description} ({s.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 0.6, minWidth: 120, marginBottom: 0 }}>
                <label>Tag</label>
                <input className="form-control" placeholder="TR-001" value={customTag} onChange={e => setCustomTag(e.target.value)} />
              </div>

              <div className="form-group" style={{ flex: 0.4, minWidth: 100, marginBottom: 0 }}>
                <label>Difficulty</label>
                <select className="form-control" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 0.3, minWidth: 80, marginBottom: 0 }}>
                <label>Qty</label>
                <input className="form-control" type="number" value={customQty || ""} onChange={e => setCustomQty(parseFloat(e.target.value) || 0)} />
              </div>

              <button className="btn btn-primary btn-sm" onClick={addStdActivity} disabled={!selStd}>
                Add
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          )}

          {addMode === "custom" && (
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div className="form-group" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
                  <label>Activity *</label>
                  <input className="form-control" value={customActivity} onChange={e => setCustomActivity(e.target.value)} />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                  <label>Tag</label>
                  <input className="form-control" placeholder="TR-001" value={customTag} onChange={e => setCustomTag(e.target.value)} />
                </div>

                <div className="form-group" style={{ flex: 0.4, minWidth: 80, marginBottom: 0 }}>
                  <label>Unit</label>
                  <input className="form-control" value={customUnit} onChange={e => setCustomUnit(e.target.value)} />
                </div>

                <div className="form-group" style={{ flex: 0.4, minWidth: 100, marginBottom: 0 }}>
                  <label>Difficulty</label>
                  <select className="form-control" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 0.3, minWidth: 80, marginBottom: 0 }}>
                  <label>Qty</label>
                  <input className="form-control" type="number" value={customQty || ""} onChange={e => setCustomQty(parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={addCustomActivity} disabled={!customActivity.trim()}>
                  Add
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="table-wrapper">
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: 30 }} />
            <col style={{ width: 180 }} />
            <col />
            <col style={{ width: 90 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 80 }} />
          </colgroup>

          <thead>
            <tr>
              <th></th>
              <th>Tag / Name</th>
              <th>Activity</th>
              <th>Unit</th>
              <th style={{ textAlign: "right" }}>Total Qty</th>
              <th style={{ textAlign: "right" }}>Weight (%)</th>
              <th style={{ textAlign: "right" }}>Today (%)</th>
              <th style={{ textAlign: "right" }}>Total (%)</th>
            </tr>
          </thead>

          <tbody>
            {grouped.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: 24 }}>
                  No activities.
                </td>
              </tr>
            )}

            {grouped.map(([tag, items]) => {
              const isExpanded = expandedTags.has(tag);
              const tagWeight = items.reduce((s, a) => s + getWeight(a), 0);
              const tagProgressArr = items.map(a => savedTotals[a.id] || 0);
              const tagAvgProgress =
                tagProgressArr.length > 0
                  ? tagProgressArr.reduce((s, v) => s + v, 0) / tagProgressArr.length
                  : 0;

              return (
                <React.Fragment key={tag}>
                  <tr
                    onClick={() => toggleTag(tag)}
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
                        color: "var(--color-text-dim)",
                        padding: "10px 8px",
                        transition: "transform 0.15s",
                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)"
                      }}
                    >
                      ▶
                    </td>

                    <td style={{ fontFamily: "var(--font-mono)", padding: "10px 12px" }}>{tag}</td>

                    <td style={{ fontSize: 11, color: "var(--color-text-dim)", padding: "10px 12px" }}>
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </td>

                    <td style={{ padding: "10px 12px" }}></td>
                    <td style={{ padding: "10px 12px" }}></td>

                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", padding: "10px 12px" }}>
                      {tagWeight.toFixed(1)}%
                    </td>

                    <td style={{ padding: "10px 12px" }}></td>

                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: tagAvgProgress >= 100 ? "var(--color-success)" : "var(--color-text)",
                        padding: "10px 12px"
                      }}
                    >
                      {tagAvgProgress.toFixed(1)}%
                    </td>
                  </tr>

                  {isExpanded &&
                    items.map(a => {
                      const todayVal = localProgress[a.id] || 0;
                      const totalPct = savedTotals[a.id] || 0;
                      const qty = localQty[a.id] ?? a.plan_quantity;
                      const weightDisplay = getWeightDisplay(a);

                      return (
                        <tr key={a.id} style={{ background: "var(--color-surface)" }}>
                          <td style={{ padding: "10px 8px" }}></td>
                          <td style={{ padding: "10px 12px" }}></td>

                          <td style={{ fontSize: 12, padding: "10px 12px 10px 8px" }}>
                            {a.sub_header || a.header}
                          </td>

                          <td style={{ fontSize: 12, color: "var(--color-text-muted)", padding: "10px 12px" }}>
                            {a.unit}
                          </td>

                          <td style={{ textAlign: "right", padding: "6px 8px" }}>
                            <input
                              className="form-control"
                              type="number"
                              style={{ width: "100%", textAlign: "right" }}
                              value={qty || ""}
                              onChange={e => updateQty(a.id, parseFloat(e.target.value) || 0)}
                            />
                          </td>

                          <td style={{ textAlign: "right", padding: "6px 8px" }}>
                            <input
                              className="form-control"
                              type="number"
                              step="0.1"
                              style={{ width: "100%", textAlign: "right" }}
                              value={weightDisplay}
                              onChange={e => updateWeight(a.id, e.target.value)}
                              onBlur={e => {
                                const raw = e.target.value.trim();
                                if (raw === "") {
                                  updateWeight(a.id, "0");
                                  return;
                                }

                                let v = parseFloat(raw);
                                if (isNaN(v)) v = 0;
                                if (v < 0) v = 0;
                                if (v > 100) v = 100;

                                updateWeight(a.id, v.toFixed(1));
                              }}
                            />
                          </td>

                          <td style={{ textAlign: "right", padding: "6px 8px" }}>
                            <input
                              className="form-control"
                              type="number"
                              step="0.1"
                              style={{ width: "100%", textAlign: "right" }}
                              value={todayVal || ""}
                              placeholder="0"
                              onChange={e => updateProgress(a.id, parseFloat(e.target.value) || 0)}
                            />
                          </td>

                          <td
                            style={{
                              textAlign: "right",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              color: totalPct >= 100 ? "var(--color-success)" : "var(--color-text)",
                              padding: "10px 12px"
                            }}
                          >
                            {totalPct.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>

          <tfoot>
            <tr
              style={{
                background: "var(--color-surface-2)",
                borderTop: "1px solid var(--color-border)"
              }}
            >
              <td style={{ padding: "10px 8px" }}></td>

              <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                Total
              </td>

              <td
                style={{
                  padding: "10px 12px",
                  fontSize: 11,
                  color: "var(--color-text-dim)"
                }}
              >
                {activities.length} items
              </td>

              <td style={{ padding: "10px 12px" }}></td>
              <td style={{ padding: "10px 12px" }}></td>

              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    Math.abs(totalWeight - 100) < 0.5
                      ? "var(--color-success)"
                      : "var(--color-danger)"
                }}
              >
                {totalWeight.toFixed(1)}%
              </td>

              <td style={{ padding: "10px 12px" }}></td>
              <td style={{ padding: "10px 12px" }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════ MAIN PAGE ══════════════════════════════════════ */
const DailyReportPage: React.FC = () => {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [activeTab, setActiveTab] = useState<TabKey>("progress");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [allProgress, setAllProgress] = useState<Progress[]>([]);
  const [manpower, setManpower] = useState<Manpower[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [planSummary, setPlanSummary] = useState<PlanSummaryData | null>(null);
  const [activities, setActivities] = useState<PlanActivityItem[]>([]);
  const [qpMappings, setQpMappings] = useState<QpMapping[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [showJobDd, setShowJobDd] = useState(false);
  const [allStdMh, setAllStdMh] = useState<any[]>([]);

  const progressRef = useRef<Partial<Progress>>({});
  const activityProgressRef = useRef<ActivityProgress[]>([]);
  const currentUserName = localStorage.getItem("pace-user-name") || "";

  useEffect(() => {
    api("/api/planning/jobs").then((data: Job[]) => {
      setAllJobs(data || []);
      const params = new URLSearchParams(window.location.search);
      const jobNo = params.get("job");
      if (jobNo) {
        const found = (data || []).find(j => j.job_no === jobNo);
        if (found && (found.status === "In Progress" || found.status === "Approved Plan")) {
          setSelectedJob(jobNo);
        }
      }
    }).catch(() => {});
    api("/api/master-data/quarter-platform-mappings").then(setQpMappings).catch(() => {});
    api("/api/master-data/standardize-manhour").then(setAllStdMh).catch(() => {});
  }, []);


  const activeJobs = useMemo(() => {
    return allJobs.filter(j => {
      if (j.status !== "In Progress" && j.status !== "Approved Plan") return false;
      if (currentUserName) {
        const members = (j.project_engineer || "").split(",").map(s => s.trim().toLowerCase());
        if (members.length > 0 && members[0] !== "" && !members.includes(currentUserName.toLowerCase())) {
          const role = (localStorage.getItem("pace-role") || "").toLowerCase();
          if (role !== "administrator") return false;
        }
      }
      return true;
    });
  }, [allJobs, currentUserName]);

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return activeJobs;
    const q = jobSearch.toLowerCase();
    return activeJobs.filter(j => (j.job_no||"").toLowerCase().includes(q) || (j.job_name||"").toLowerCase().includes(q) || (j.location||"").toLowerCase().includes(q) || (j.asset||"").toLowerCase().includes(q));
  }, [activeJobs, jobSearch]);

  const selectedJobObj = useMemo(() => allJobs.find(j => j.job_no === selectedJob), [allJobs, selectedJob]);

  const [isNoProgress, setIsNoProgress] = useState(false);
  useEffect(() => { const iv = setInterval(() => { setIsNoProgress(progressRef.current?.status === "No Progress"); }, 500); return () => clearInterval(iv); }, []);

  const loadData = useCallback(async () => {
    if (!selectedJob) return;

    try {
      // ============================
      // 1. LOAD ALL PROGRESS FIRST
      // ============================
      const progressList: Progress[] = await api(
        "/api/daily-report/project/progress?project_no=" + selectedJob
      ).catch(() => []);

      setAllProgress(progressList);

      const sorted = [...progressList].sort((a, b) =>
        a.progress_date.localeCompare(b.progress_date)
      );

      // ============================
      // 2. FIND TARGET DATE
      // ============================
      let selectedProgress = sorted.find(p => p.progress_date === selectedDate);

      let fallbackProgress: Progress | null = null;
      if (!selectedProgress) {
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (sorted[i].progress_date < selectedDate) {
            fallbackProgress = sorted[i];
            break;
          }
        }
      }

      const target = selectedProgress || fallbackProgress || null;
      setProgress(target);

      // ============================
      // 3. LOAD MANPOWER SNAPSHOT
      // exact date or latest previous date
      // ============================
      const mpPrefix = "pace-manpower-" + selectedJob + "-";
      const mpRows = loadSnapshotByDateOrPrevious<Manpower[]>(
        mpPrefix,
        selectedDate,
        []
      );
      setManpower(mpRows);

      // ============================
      // 4. LOAD EQUIPMENT SNAPSHOT
      // exact date or latest previous date
      // ============================
      const eqPrefix = "pace-equipment-" + selectedJob + "-";
      const eqRows = loadSnapshotByDateOrPrevious<EquipmentRow[]>(
        eqPrefix,
        selectedDate,
        []
      );
      setEquipment(eqRows);

      // ============================
      // 5. LOAD PLAN + ACTIVITIES
      // ============================
      const ps = await api(
        "/api/planning/plan-summary?job_no=" + selectedJob
      ).catch(() => null);

      setPlanSummary(ps && (ps.id || ps.total_manhour > 0) ? ps : null);

      const acts = await api(
        "/api/planning/plan-activities?job_no=" + selectedJob
      ).catch(() => []);

      setActivities(acts);
    } catch (e) {
      console.error(e);
      setAllProgress([]);
      setProgress(null);
      setManpower([]);
      setEquipment([]);
      setPlanSummary(null);
      setActivities([]);
    }
  }, [selectedJob, selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ══════════════════════════════════════
   * SAVE ALL
   * ══════════════════════════════════════ */
  const saveAll = async () => {
    if (!selectedJob) return;

    setSaving(true);
    setMsg("");

    try {
      const dateKey = normalizeDateKey(selectedDate);

      const isNP = progressRef.current?.status === "No Progress";
      const todayMh = isNP ? 0 : manpower.reduce((s, r) => s + (r.total || 0), 0);
      const todayPobVal = isNP ? 0 : manpower.length;
      const todayEqVal = isNP ? 0 : equipment.reduce((s, r) => s + (r.total || 0), 0);

      const actList: PlanActivityItem[] = await api(
        "/api/planning/plan-activities?job_no=" + selectedJob
      ).catch(() => []);

      const totalPlanMh = actList.reduce((s, a) => s + (a.plan_manhour || 0), 0);

      // ============================
      // Load weights (project level)
      // ============================
      const weightMapRaw = safeReadJson<Record<string, string | number>>(
        activityWeightStorageKey(selectedJob),
        {}
      );

      // ============================
      // Read row-level TODAY (%) for this date
      // priority:
      // 1) draft localStorage
      // 2) current ref
      // 3) saved today snapshot
      // ============================
      let activityInputs: Record<number, number> = safeReadJson<Record<number, number>>(
        activityDraftStorageKey(selectedJob, dateKey),
        {}
      );

      if (activityProgressRef.current.length > 0) {
        for (const ap of activityProgressRef.current) {
          activityInputs[ap.activity_id] = ap.progress_today;
        }
      }

      if (Object.keys(activityInputs).length === 0) {
        activityInputs = safeReadJson<Record<number, number>>(
          activityTodayStorageKey(selectedJob, dateKey),
          {}
        );
      }

      // ============================
      // Calculate project-level progress_today
      // ============================
      let progressTodayVal = 0;

      if (!isNP && totalPlanMh > 0) {
        for (const [idStr, todayVal] of Object.entries(activityInputs)) {
          const actId = parseInt(idStr, 10);
          const act = actList.find(a => a.id === actId);
          if (!act || todayVal <= 0) continue;

          const defaultWeight = (act.plan_manhour / totalPlanMh) * 100;
          const rawWeight =
            weightMapRaw[String(act.id)] !== undefined
              ? weightMapRaw[String(act.id)]
              : defaultWeight;

          const weight = (parseFloat(String(rawWeight)) || 0) / 100;
          progressTodayVal += todayVal * weight;
        }
      }

      // ============================
      // Save / update project progress row
      // ============================
      const pData: any = {
        ...progressRef.current,
        project_no: selectedJob,
        progress_date: dateKey,
        actual_manhour: todayMh,
        actual_pob: todayPobVal,
        plan_pob: planSummary?.estimated_pob || 0,
        plan_manhour: planSummary?.total_manhour || 0,
        progress_today: Math.round(progressTodayVal * 10) / 10,
        progress_total: 0, // recalculated below
        pdi_project: todayEqVal // equipment/day
      };

      if (progress && progress.id) {
        await api("/api/daily-report/project/progress/" + progress.id, {
          method: "PUT",
          body: JSON.stringify(pData)
        });
      } else {
        await api("/api/daily-report/project/progress", {
          method: "POST",
          body: JSON.stringify(pData)
        });
      }

      // ============================
      // Save manpower / equipment
      // keep your existing UI/data behavior
      // ============================
      if (!isNP) {
        // ============================
        // SAVE CURRENT DAY SNAPSHOT TO LOCAL STORAGE
        // exact rows as user sees on screen
        // ============================
        try {
          localStorage.setItem(
            manpowerStorageKey(selectedJob, dateKey),
            JSON.stringify(manpower)
          );
        } catch {}

        try {
          localStorage.setItem(
            equipmentStorageKey(selectedJob, dateKey),
            JSON.stringify(equipment)
          );
        } catch {}

        // ============================
        // OPTIONAL: keep existing backend save behavior
        // (current-day persistence only)
        // ============================
        const exMp = await api(
          "/api/daily-report/project/manpower?project_no=" + selectedJob
        ).catch(() => []);
        for (const m of exMp) {
          await api("/api/daily-report/project/manpower/" + m.id, {
            method: "DELETE"
          }).catch(() => {});
        }
        for (const m of manpower) {
          const { id, ...rest } = m;
          await api("/api/daily-report/project/manpower", {
            method: "POST",
            body: JSON.stringify(rest)
          }).catch(() => {});
        }

        const exEq = await api(
          "/api/daily-report/project/equipment?project_no=" + selectedJob
        ).catch(() => []);
        for (const e of exEq) {
          await api("/api/daily-report/project/equipment/" + e.id, {
            method: "DELETE"
          }).catch(() => {});
        }
        for (const e of equipment) {
          const { id, ...rest } = e;
          await api("/api/daily-report/project/equipment", {
            method: "POST",
            body: JSON.stringify(rest)
          }).catch(() => {});
        }
      } else {
        // If No Progress day, still save empty snapshot for that date
        try {
          localStorage.setItem(
            manpowerStorageKey(selectedJob, dateKey),
            JSON.stringify([])
          );
        } catch {}

        try {
          localStorage.setItem(
            equipmentStorageKey(selectedJob, dateKey),
            JSON.stringify([])
          );
        } catch {}
      }

      // ============================
      // SAVE TODAY snapshot for this date
      // ============================
      const todaySnapshot: Record<number, number> = {};
      for (const act of actList) {
        todaySnapshot[act.id] = activityInputs[act.id] || 0;
      }

      try {
        localStorage.setItem(
          activityTodayStorageKey(selectedJob, dateKey),
          JSON.stringify(todaySnapshot)
        );
      } catch {}

      // ============================
      // Rebuild cumulative TOTALS from all saved TODAY snapshots
      // This is the key fix
      // ============================
      const allSnapshots = loadAllActivityTodaySnapshots(selectedJob);
      allSnapshots[dateKey] = todaySnapshot; // ensure current save included

      const cumulativeTotals = buildCumulativeActivityTotals(allSnapshots, dateKey);

      // sync backend activity cumulative %
      for (const act of actList) {
        const newTotal = cumulativeTotals[act.id] || 0;

        if (Math.abs((act.actual_manhour || 0) - newTotal) > 0.001) {
          await api("/api/planning/plan-activities/" + act.id, {
            method: "PUT",
            body: JSON.stringify({
              actual_manhour: newTotal
            })
          }).catch(() => {});
        }
      }

      // ============================
      // Recalculate project progress_total from all saved report rows
      // ============================
      const fresh: Progress[] = await api(
        "/api/daily-report/project/progress?project_no=" + selectedJob
      );

      const sorted = [...fresh].sort((a, b) =>
        a.progress_date.localeCompare(b.progress_date)
      );

      let running = 0;
      for (const rp of sorted) {
        running += rp.progress_today || 0;
        const ct = Math.round(running * 10) / 10;

        if (Math.abs((rp.progress_total || 0) - ct) > 0.01) {
          await api("/api/daily-report/project/progress/" + rp.id, {
            method: "PUT",
            body: JSON.stringify({ progress_total: ct })
          }).catch(() => {});
        }
      }

      // ============================
      // Update plan summary actual MH
      // ============================
      const totalActMh = fresh.reduce((s, r) => s + (r.actual_manhour || 0), 0);
      await api("/api/planning/plan-summary", {
        method: "POST",
        body: JSON.stringify({
          job_no: selectedJob,
          actual_manhour_daily: totalActMh
        })
      }).catch(() => {});

      // clear draft only (keep saved today snapshot)
      localStorage.removeItem(activityDraftStorageKey(selectedJob, dateKey));

      setMsg("✅ Saved!");
      loadData();
    } catch (e: any) {
      setMsg("⚠️ " + e.message);
    } finally {
      setSaving(false);
    }
  };


  /* ══════════════════════════════════════
   * KPI — TODAY from local, TOTAL from all saved days
   *
   * TODAY = current local state (manpower/equipment arrays)
   * TOTAL = sum of ALL saved days' values (replacing current date with local)
   *
   * POB TOTAL = SUM of all days' POB (not max!)
   * MH TOTAL = SUM of all days' MH
   * EQUIPMENT TOTAL = SUM of all days' equipment (stored in pdi_project field)
   * PROGRESS TOTAL = SUM of all days' progress_today
   * ══════════════════════════════════════ */

  const kpiMhToday = isNoProgress ? 0 : manpower.reduce((s, r) => s + (r.total || 0), 0);
  const kpiPobToday = isNoProgress ? 0 : manpower.length;
  const kpiEqToday = isNoProgress ? 0 : equipment.reduce((s, r) => s + (r.total || 0), 0);

  // Totals: sum OTHER days from DB + today from local
  const kpiMhTotal = useMemo(() => {
    const other = allProgress.filter(r => r.progress_date !== selectedDate).reduce((s, r) => s + (r.actual_manhour || 0), 0);
    return other + kpiMhToday;
  }, [allProgress, selectedDate, kpiMhToday]);

  const kpiPobTotal = useMemo(() => {
    const other = allProgress.filter(r => r.progress_date !== selectedDate).reduce((s, r) => s + (r.actual_pob || 0), 0);
    return other + kpiPobToday;
  }, [allProgress, selectedDate, kpiPobToday]);

  const kpiEqTotal = useMemo(() => {
    // Equipment stored in pdi_project field
    const other = allProgress.filter(r => r.progress_date !== selectedDate).reduce((s, r) => s + (r.pdi_project || 0), 0);
    return other + kpiEqToday;
  }, [allProgress, selectedDate, kpiEqToday]);

  const kpiProgressToday = useMemo(() => {
    if (isNoProgress) return 0;
    const tpm = activities.reduce((s, a) => s + (a.plan_manhour || 0), 0);
    if (tpm <= 0) return progress?.progress_today || 0;
    let wm: Record<number, number> = {};
    try { const sw = localStorage.getItem("pace-weights-" + selectedJob); if (sw) wm = JSON.parse(sw); } catch {}

    // Get activity inputs from multiple sources
    let inputs: Record<number, number> = {};
    try { const sp = localStorage.getItem("pace-progress-" + selectedJob + "-" + selectedDate); if (sp) inputs = JSON.parse(sp); } catch {}
    if (activityProgressRef.current.length > 0) {
      for (const ap of activityProgressRef.current) { inputs[ap.activity_id] = ap.progress_today; }
    }
    if (Object.keys(inputs).length === 0) {
      try { const st = localStorage.getItem("pace-saved-today-" + selectedJob + "-" + selectedDate); if (st) inputs = JSON.parse(st); } catch {}
    }

    let t = 0;
    for (const [idStr, todayVal] of Object.entries(inputs)) {
      const act = activities.find(a => a.id === parseInt(idStr));
      if (act && todayVal > 0) { const dw = act.plan_manhour / tpm * 100; const w = (wm[act.id] !== undefined ? wm[act.id] : dw) / 100; t += todayVal * w; }
    }
    return Math.round(t * 10) / 10;
  }, [activities, isNoProgress, selectedJob, selectedDate, activityProgressRef.current, progress]);


  const kpiProgressTotal = useMemo(() => {
    const other = allProgress.filter(r => r.progress_date !== selectedDate).reduce((s, r) => s + (r.progress_today || 0), 0);
    return Math.round((other + kpiProgressToday) * 10) / 10;
  }, [allProgress, selectedDate, kpiProgressToday]);

  const planMh = planSummary?.total_manhour || 0;
  const planPob = planSummary?.estimated_pob || 0;

  const platforms = useMemo(() => {
    const job = allJobs.find(j => j.job_no === selectedJob);
    const ja = job?.location || "";
    const qps = qpMappings.filter(m => m.status === "Active" && (!ja || m.asset === ja)).map(m => m.quarter_platform);
    const u = [...new Set(qps)];
    if (job?.working_platform && !u.includes(job.working_platform)) u.unshift(job.working_platform);
    return u;
  }, [selectedJob, allJobs, qpMappings]);

  const projectCompany = selectedJobObj?.asset || "";

  // Compute running totals for report history display
  const reportHistoryWithTotals = useMemo(() => {
    const sorted = [...allProgress].sort((a, b) => a.progress_date.localeCompare(b.progress_date));
    let runMh = 0, runPob = 0, runEq = 0, runProgress = 0;
    const result = sorted.map(r => {
      runMh += r.actual_manhour || 0;
      runPob += r.actual_pob || 0;
      runEq += r.pdi_project || 0; // equipment stored here
      runProgress += r.progress_today || 0;
      return {
        ...r,
        mh_total: runMh,
        pob_total: runPob,
        eq_today: r.pdi_project || 0,
        eq_total: runEq,
        progress_total_calc: Math.round(runProgress * 10) / 10,
        wrench_today: r.wrench_time_daily || 0,
      };
    });
    // Reverse for display (newest first)
    return result.reverse();
  }, [allProgress]);

  return (
    <div>
      {/* ── Header ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 3, minWidth: 280, marginBottom: 0, position: "relative" }}>
            <label>Select Project</label>
            <input className="form-control" placeholder="Search project..."
              value={selectedJob ? (selectedJobObj ? selectedJobObj.job_no + " — " + selectedJobObj.job_name : selectedJob) : jobSearch}
              onChange={e => { setJobSearch(e.target.value); setSelectedJob(""); setShowJobDd(true); }}
              onFocus={() => setShowJobDd(true)} onBlur={() => setTimeout(() => setShowJobDd(false), 200)} />
            {showJobDd && !selectedJob && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-md)", maxHeight: 250, overflowY: "auto" }}>
                {filteredJobs.length === 0 && <div style={{ padding: 12, fontSize: 12, color: "var(--color-text-dim)" }}>No projects.</div>}
                {filteredJobs.map(j => (
                  <div key={j.job_no} style={{ padding: "10px 12px", cursor: "pointer", fontSize: 12, display: "flex", justifyContent: "space-between" }}
                    onMouseDown={e => { e.preventDefault(); setSelectedJob(j.job_no); setJobSearch(""); setShowJobDd(false); setProgress(null); setMsg(""); }}>
                    <div><div style={{ fontWeight: 600 }}>{j.job_no}</div><div style={{ fontSize: 11, color: "var(--color-text-dim)" }}>{j.job_name}</div></div>
                    <span style={{ fontSize: 10, color: "var(--color-text-dim)" }}>{j.location} · {j.asset}</span>
                  </div>
                ))}
              </div>
            )}
            {selectedJob && <button style={{ position: "absolute", right: 8, top: 28, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--color-text-dim)" }} onClick={() => { setSelectedJob(""); setJobSearch(""); setProgress(null); }}>✕</button>}
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}><label>Report Date</label><input className="form-control" type="date" value={selectedDate} max={todayStr()} onChange={e => {setSelectedDate(e.target.value); setActiveTab("progress");}} /></div>
          {selectedJob && <button className="btn btn-primary" onClick={saveAll} disabled={saving} style={{ height: 38 }}>{saving ? "Saving..." : "Save All"}</button>}
        </div>
        {msg && <div style={{ marginTop: 8, fontSize: 13, color: msg.startsWith("✅") ? "var(--color-success)" : "var(--color-danger)" }}>{msg}</div>}
      </div>

      {!selectedJob && <div className="empty-state"><div className="empty-icon">📝</div><p>Select a project.</p></div>}

      {selectedJob && (<>
        {/* ── KPI Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
          <KpiBox label="POB (Manday)" rows={[
            { label: "Today", value: kpiPobToday, color: "var(--color-primary)" },
            { label: "Total", value: kpiPobTotal, color: "var(--color-accent)" },
            { label: "Plan", value: planPob, color: "var(--color-text-muted)" },
          ]} />
          <KpiBox label="Manhour (Manhour)" rows={[
            { label: "Today", value: kpiMhToday, color: "var(--color-primary)" },
            { label: "Total", value: kpiMhTotal, color: "var(--color-accent)" },
            { label: "Plan", value: planMh, color: "var(--color-text-muted)" },
          ]} />
          <KpiBox label="Equipment (Day)" rows={[
            { label: "Today", value: kpiEqToday, color: "var(--color-primary)" },
            { label: "Total", value: kpiEqTotal, color: "var(--color-accent)" },
          ]} />
          <KpiBox label="Progress (%)" rows={[
            { label: "Today", value: kpiProgressToday, color: "var(--color-primary)" },
            { label: "Total", value: kpiProgressTotal, color: "var(--color-accent)" },
            { label: "Plan", value: "100%", color: "var(--color-text-muted)" },
          ]} />
        </div>

        {/* ── Report History ── */}
        {allProgress.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h2>Report History</h2></div>
            <div style={{ maxHeight: 280, overflowY: "auto", overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom", position: "sticky", top: 0, background: "var(--color-surface-2)", zIndex: 2 }}>Date</th>
                    <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom", position: "sticky", top: 0, background: "var(--color-surface-2)", zIndex: 2 }}>Weather</th>
                    <th colSpan={2} style={{ fontSize: 11, textAlign: "center", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-surface-2)", zIndex: 2 }}>POB (Manday)</th>
                    <th colSpan={2} style={{ fontSize: 11, textAlign: "center", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-surface-2)", zIndex: 2 }}>Manhour (Manhour)</th>
                    <th colSpan={2} style={{ fontSize: 11, textAlign: "center", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-surface-2)", zIndex: 2 }}>Equipment (Day)</th>
                    <th colSpan={2} style={{ fontSize: 11, textAlign: "center", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-surface-2)", zIndex: 2 }}>Progress (%)</th>
                    <th colSpan={1} style={{ fontSize: 11, textAlign: "center", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-surface-2)", zIndex: 2 }}>Wrench (%)</th>
                    <th rowSpan={2} style={{ fontSize: 11, verticalAlign: "bottom", position: "sticky", top: 0, background: "var(--color-surface-2)", zIndex: 2 }}></th>
                  </tr>
                  <tr>
                    <th style={{ fontSize: 9, textAlign: "right", position: "sticky", top: 28, background: "var(--color-surface-2)", zIndex: 2 }}>Today</th>
                    <th style={{ fontSize: 9, textAlign: "right", position: "sticky", top: 28, background: "var(--color-surface-2)", zIndex: 2 }}>Total</th>
                    <th style={{ fontSize: 9, textAlign: "right", position: "sticky", top: 28, background: "var(--color-surface-2)", zIndex: 2 }}>Today</th>
                    <th style={{ fontSize: 9, textAlign: "right", position: "sticky", top: 28, background: "var(--color-surface-2)", zIndex: 2 }}>Total</th>
                    <th style={{ fontSize: 9, textAlign: "right", position: "sticky", top: 28, background: "var(--color-surface-2)", zIndex: 2 }}>Today</th>
                    <th style={{ fontSize: 9, textAlign: "right", position: "sticky", top: 28, background: "var(--color-surface-2)", zIndex: 2 }}>Total</th>
                    <th style={{ fontSize: 9, textAlign: "right", position: "sticky", top: 28, background: "var(--color-surface-2)", zIndex: 2 }}>Today</th>
                    <th style={{ fontSize: 9, textAlign: "right", position: "sticky", top: 28, background: "var(--color-surface-2)", zIndex: 2 }}>Total</th>
                    <th style={{ fontSize: 9, textAlign: "right", position: "sticky", top: 28, background: "var(--color-surface-2)", zIndex: 2 }}>Today</th>
                  </tr>
                </thead>
                <tbody>
                  {reportHistoryWithTotals.map(r => (
                    <tr key={r.id} style={r.progress_date === selectedDate ? { background: "var(--color-primary-bg)" } : {}}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "8px 10px" }}>{fmtDate(r.progress_date)}</td>
                      <td style={{ fontSize: 11, padding: "8px 6px" }}>{r.status === "No Progress" ? <span className="badge badge-pending" style={{ fontSize: 9 }}>NP</span> : r.weather_condition}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, padding: "8px 6px" }}>{r.actual_pob}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, padding: "8px 6px" }}>{r.pob_total}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, padding: "8px 6px" }}>{r.actual_manhour}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, padding: "8px 6px" }}>{r.mh_total}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, padding: "8px 6px" }}>{r.eq_today.toFixed(1)}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, padding: "8px 6px" }}>{r.eq_total.toFixed(1)}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, padding: "8px 6px" }}>{r.progress_today.toFixed(1)}%</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, padding: "8px 6px" }}>{r.progress_total_calc.toFixed(1)}%</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, padding: "8px 6px" }}>{r.wrench_today.toFixed(1)}%</td>
                      <td style={{ padding: "8px 6px" }}><button className="btn btn-primary btn-sm" style={{ fontSize: 10 }} onClick={() => { setSelectedDate(r.progress_date); setActiveTab("progress"); }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.key} className={"tab-btn " + (activeTab === t.key ? "active" : "")} onClick={() => setActiveTab(t.key)}>
              {t.label}{isNoProgress && t.key !== "progress" && <span style={{ fontSize: 9, color: "var(--color-text-dim)", marginLeft: 4 }}>🔒</span>}
            </button>
          ))}
        </div>

        <div className="card">
          {activeTab === "progress" && <ProgressTab progressRef={progressRef} dateStr={selectedDate} progressData={progress} projectNo={selectedJob} disabled={false} />}
          {activeTab === "manpower" && <ManpowerTab projectNo={selectedJob} rows={manpower} platforms={platforms} onUpdate={setManpower} disabled={isNoProgress} />}
          {activeTab === "equipment" && <EquipmentTabComp projectNo={selectedJob} projectCompany={projectCompany} rows={equipment} onUpdate={setEquipment} disabled={isNoProgress} />}
          {activeTab === "activity" && <ActivityTab projectNo={selectedJob} selectedDate={selectedDate} activityProgressRef={activityProgressRef} allStdMh={allStdMh} />}
        </div>
      </>)}
    </div>
  );
};

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<DailyReportPage />);