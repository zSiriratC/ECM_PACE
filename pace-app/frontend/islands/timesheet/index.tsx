import React, { useEffect, useState, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";

interface Job { job_no: string; job_name: string; status: string; location: string; working_platform: string; asset: string; job_type: string; sub_type: string; discipline: string; }
interface WpMapping { id: number; asset: string; working_platform: string; status: string; }
interface JobTypeItem { id: number; description_l1: string; description_l2: string; description_l3: string; status: string; }
interface CompanyItem { id: number; name: string; status: string; }
interface Progress { id: number; progress_date: string; actual_manhour: number; actual_pob: number; status: string; pdi_project: number; }
interface ManpowerRow { id: number; project_no: string; contractor_name: string; contractor_company: string; contractor_position: string; total: number; }
interface EquipmentRow { id: number; project_no: string; equipment_name: string; equipment_company: string; tag_no: string; total: number; }
interface PivotManpower { name: string; position: string; company: string; daily: Record<string, number>; total: number; }
interface PivotEquipment { name: string; company: string; tag: string; daily: Record<string, number>; total: number; }

type TabKey = "manpower" | "equipment";

const apiH = (): Record<string, string> => ({ "Content-Type": "application/json", "X-User-Role": localStorage.getItem("pace-role") || "administrator" });
const api = async (url: string) => { const r = await fetch(url, { headers: apiH() }); return r.json(); };

function getMonthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    opts.push({ value: val, label: M[d.getMonth()] + " " + d.getFullYear() });
  }
  return opts.reverse();
}

function getDaysInMonth(ym: string): string[] {
  if (!ym) return [];
  const [y, m] = ym.split("-").map(Number);
  const days: string[] = [];
  const d = new Date(y, m - 1, 1);
  while (d.getMonth() === m - 1) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    days.push(d.getFullYear() + "-" + mm + "-" + dd);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function fmtDay(date: string): string {
  return String(parseInt(date.split("-")[2]));
}

const TimesheetPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wpMappings, setWpMappings] = useState<WpMapping[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [tab, setTab] = useState<TabKey>("manpower");
  const [loading, setLoading] = useState(false);

  const [fMonth, setFMonth] = useState(() => {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  });
  const [fAsset, setFAsset] = useState("");
  const [fPlatform, setFPlatform] = useState("");
  const [fCompany, setFCompany] = useState("");
  const [fJobType, setFJobType] = useState("");
  const [fSub1, setFSub1] = useState("");
  const [fSub2, setFSub2] = useState("");

  const [pivotMp, setPivotMp] = useState<PivotManpower[]>([]);
  const [pivotEq, setPivotEq] = useState<PivotEquipment[]>([]);
  const [datesInMonth, setDatesInMonth] = useState<string[]>([]);

  useEffect(() => {
    api("/api/planning/jobs").then(setJobs);
    api("/api/master-data/working-platform-mappings").then(setWpMappings);
    api("/api/master-data/job-types").then(setJobTypes);
    api("/api/master-data/companies").then(setCompanies);
  }, []);

  const activeWp = useMemo(() => (wpMappings || []).filter(m => m.status === "Active"), [wpMappings]);
  const uniqueAssets = useMemo(() => [...new Set(activeWp.map(m => m.asset))].sort(), [activeWp]);
  const uniquePlatforms = useMemo(() => [...new Set(activeWp.filter(m => !fAsset || m.asset === fAsset).map(m => m.working_platform))].sort(), [activeWp, fAsset]);
  const ajt = useMemo(() => (jobTypes || []).filter(j => j.status === "Active"), [jobTypes]);
  const uniqueL1 = useMemo(() => [...new Set(ajt.map(j => j.description_l1).filter(Boolean))].sort(), [ajt]);
  const uniqueL2 = useMemo(() => [...new Set(ajt.filter(j => !fJobType || j.description_l1 === fJobType).map(j => j.description_l2).filter(Boolean))].sort(), [ajt, fJobType]);
  const uniqueL3 = useMemo(() => [...new Set(ajt.filter(j => (!fJobType || j.description_l1 === fJobType) && (!fSub1 || j.description_l2 === fSub1)).map(j => j.description_l3).filter(Boolean))].sort(), [ajt, fJobType, fSub1]);
  const activeCompanies = useMemo(() => (companies || []).filter(c => c.status === "Active").map(c => c.name).sort(), [companies]);
  const monthOpts = useMemo(() => getMonthOptions(), []);

  const hasFilters = fAsset || fPlatform || fCompany || fJobType || fSub1 || fSub2;
  const clearFilters = () => { setFAsset(""); setFPlatform(""); setFCompany(""); setFJobType(""); setFSub1(""); setFSub2(""); };

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (fAsset && j.location !== fAsset) return false;
      if (fPlatform && j.working_platform !== fPlatform) return false;
      if (fCompany && j.asset !== fCompany) return false;
      if (fJobType && j.job_type !== fJobType) return false;
      if (fSub1 && j.sub_type !== fSub1) return false;
      if (fSub2 && j.discipline !== fSub2) return false;
      return true;
    });
  }, [jobs, fAsset, fPlatform, fCompany, fJobType, fSub1, fSub2]);

  const loadData = useCallback(async () => {
    if (!fMonth || filteredJobs.length === 0) {
      setPivotMp([]); setPivotEq([]); setDatesInMonth([]);
      return;
    }
    setLoading(true);

    const days = getDaysInMonth(fMonth);
    setDatesInMonth(days);
    const monthStart = days[0];
    const monthEnd = days[days.length - 1];

    const mpMap = new Map<string, Record<string, number>>();
    const eqMap = new Map<string, Record<string, number>>();

    for (const job of filteredJobs) {
      try {
        const reports: Progress[] = await api("/api/daily-report/project/progress?project_no=" + job.job_no);
        const monthReports = reports.filter(r => r.progress_date >= monthStart && r.progress_date <= monthEnd && r.status !== "No Progress");

        if (monthReports.length > 0) {
          const mpRows: ManpowerRow[] = await api("/api/daily-report/project/manpower?project_no=" + job.job_no).catch(() => []);
          const eqRows: EquipmentRow[] = await api("/api/daily-report/project/equipment?project_no=" + job.job_no).catch(() => []);

          const mpTotal = mpRows.reduce((s, r) => s + (r.total || 0), 0);
          const eqTotal = eqRows.reduce((s, r) => s + (r.total || 0), 0);

          for (const report of monthReports) {
            const date = report.progress_date;
            const dayMh = report.actual_manhour || 0;
            const dayEqMh = report.pdi_project || 0;

            // Distribute day's MH proportionally across manpower
            for (const mp of mpRows) {
              const key = mp.contractor_name + "|" + mp.contractor_position + "|" + mp.contractor_company;
              if (!mpMap.has(key)) mpMap.set(key, {});
              const daily = mpMap.get(key)!;
              const ratio = mpTotal > 0 ? (mp.total || 0) / mpTotal : 0;
              const val = Math.round(dayMh * ratio * 10) / 10;
              daily[date] = (daily[date] || 0) + val;
            }

            // Distribute day's equipment MH proportionally
            for (const eq of eqRows) {
              const key = eq.equipment_name + "|" + eq.equipment_company + "|" + (eq.tag_no || "");
              if (!eqMap.has(key)) eqMap.set(key, {});
              const daily = eqMap.get(key)!;
              const ratio = eqTotal > 0 ? (eq.total || 0) / eqTotal : 0;
              const val = Math.round(dayEqMh * ratio * 10) / 10;
              daily[date] = (daily[date] || 0) + val;
            }
          }
        }
      } catch {}
    }

    const mpArr: PivotManpower[] = [];
    mpMap.forEach((daily, key) => {
      const [name, position, company] = key.split("|");
      const total = Math.round(Object.values(daily).reduce((s, v) => s + v, 0) * 10) / 10;
      mpArr.push({ name, position, company, daily, total });
    });
    mpArr.sort((a, b) => a.name.localeCompare(b.name));

    const eqArr: PivotEquipment[] = [];
    eqMap.forEach((daily, key) => {
      const [name, company, tag] = key.split("|");
      const total = Math.round(Object.values(daily).reduce((s, v) => s + v, 0) * 10) / 10;
      eqArr.push({ name, company, tag, daily, total });
    });
    eqArr.sort((a, b) => a.name.localeCompare(b.name));

    setPivotMp(mpArr);
    setPivotEq(eqArr);
    setLoading(false);
  }, [fMonth, filteredJobs]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalMpMh = pivotMp.reduce((s, r) => s + r.total, 0);
  const totalEqMh = pivotEq.reduce((s, r) => s + r.total, 0);

  const exportExcel = async () => {
    const ExcelJS = await import("exceljs");
    const { saveAs } = await import("file-saver");
    const wb = new ExcelJS.Workbook();

    const ms = wb.addWorksheet("Manpower");
    const mpCols: any[] = [{ header: "Company", key: "company", width: 15 },{ header: "Name", key: "name", width: 25 }, { header: "Position", key: "position", width: 20 }];
    datesInMonth.forEach(d => mpCols.push({ header: fmtDay(d), key: d, width: 5 }));
    mpCols.push({ header: "Total", key: "total", width: 10 });
    ms.columns = mpCols;
    pivotMp.forEach(r => {
      const row: any = { company: r.company, name: r.name, position: r.position, total: r.total };
      datesInMonth.forEach(d => { row[d] = r.daily[d] || 0; });
      ms.addRow(row);
    });
    ms.getRow(1).eachCell(c => { c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B6FE0" } }; });

    const es = wb.addWorksheet("Equipment");
    const eqCols: any[] = [{ header: "Company", key: "company", width: 15 }, { header: "Equipment", key: "name", width: 30 }, { header: "Tag", key: "tag", width: 12 }];
    datesInMonth.forEach(d => eqCols.push({ header: fmtDay(d), key: d, width: 5 }));
    eqCols.push({ header: "Total", key: "total", width: 10 });
    es.columns = eqCols;
    pivotEq.forEach(r => {
      const row: any = { company: r.company, name: r.name, tag: r.tag, total: r.total };
      datesInMonth.forEach(d => { row[d] = r.daily[d] || 0; });
      es.addRow(row);
    });
    es.getRow(1).eachCell(c => { c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B6FE0" } }; });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), "PACE_Timesheet_" + fMonth + ".xlsx");
  };

  return (
    <div>
      {/* Filters */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 130 }}>
            <select className="form-control" value={fMonth} onChange={e => setFMonth(e.target.value)} style={{ fontFamily: "var(--font-family)" }}>
              {monthOpts.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 110 }}><select className="form-control" value={fAsset} onChange={e => { setFAsset(e.target.value); setFPlatform(""); }} style={{ fontFamily: "var(--font-family)" }}><option value="">All Assets</option>{uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div style={{ minWidth: 110 }}><select className="form-control" value={fPlatform} onChange={e => setFPlatform(e.target.value)} style={{ fontFamily: "var(--font-family)" }}><option value="">All Platforms</option>{uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div style={{ minWidth: 110 }}><select className="form-control" value={fCompany} onChange={e => setFCompany(e.target.value)} style={{ fontFamily: "var(--font-family)" }}><option value="">All Companies</option>{activeCompanies.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div style={{ minWidth: 110 }}><select className="form-control" value={fJobType} onChange={e => { setFJobType(e.target.value); setFSub1(""); setFSub2(""); }} style={{ fontFamily: "var(--font-family)" }}><option value="">All Job Types</option>{uniqueL1.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
          {fJobType && <div style={{ minWidth: 110 }}><select className="form-control" value={fSub1} onChange={e => { setFSub1(e.target.value); setFSub2(""); }} style={{ fontFamily: "var(--font-family)" }}><option value="">All Sub 1</option>{uniqueL2.map(l => <option key={l} value={l}>{l}</option>)}</select></div>}
          {fSub1 && <div style={{ minWidth: 110 }}><select className="form-control" value={fSub2} onChange={e => setFSub2(e.target.value)} style={{ fontFamily: "var(--font-family)" }}><option value="">All Sub 2</option>{uniqueL3.map(l => <option key={l} value={l}>{l}</option>)}</select></div>}
          {hasFilters && <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ height: 34 }}>Clear</button>}
          <button className="btn btn-primary btn-sm" onClick={exportExcel} style={{ height: 34 }}>📥 Export</button>
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-dim)", marginTop: 8, fontFamily: "var(--font-family)" }}>
          {filteredJobs.length} project(s) · {datesInMonth.length} days in {fMonth}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card"><div className="kpi-value">{filteredJobs.length}</div><div className="kpi-label">Projects</div></div>
        <div className="kpi-card"><div className="kpi-value">{pivotMp.length}</div><div className="kpi-label">Manpower</div></div>
        <div className="kpi-card"><div className="kpi-value" style={{ color: "var(--color-primary)" }}>{totalMpMh.toFixed(1)}</div><div className="kpi-label">Manpower MH</div></div>
        <div className="kpi-card"><div className="kpi-value">{pivotEq.length}</div><div className="kpi-label">Equipment</div></div>
        <div className="kpi-card"><div className="kpi-value" style={{ color: "var(--color-accent)" }}>{totalEqMh.toFixed(1)}</div><div className="kpi-label">Equipment MH</div></div>
      </div>

      {loading && <div className="empty-state"><p>Loading...</p></div>}

      {!loading && (<>
        <div className="tabs">
          <button className={"tab-btn " + (tab === "manpower" ? "active" : "")} onClick={() => setTab("manpower")}>Manpower</button>
          <button className={"tab-btn " + (tab === "equipment" ? "active" : "")} onClick={() => setTab("equipment")}>Equipment</button>
        </div>

        <div className="card">
          {tab === "manpower" && (
            <div className="table-wrapper" style={{ overflowX: "auto" }}>
              <table style={{ minWidth: datesInMonth.length * 36 + 400 }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, background: "var(--color-surface-2)", zIndex: 2, fontSize: 11, minWidth: 80 }}>Company</th>
                    <th style={{ fontSize: 11, minWidth: 140 }}>Name</th>
                    <th style={{ fontSize: 11, minWidth: 100 }}>Position</th>
                    {datesInMonth.map(d => (
                      <th key={d} style={{ textAlign: "center", fontSize: 10, minWidth: 32, padding: "6px 2px" }}>{fmtDay(d)}</th>
                    ))}
                    <th style={{ textAlign: "right", fontSize: 11, minWidth: 55, fontWeight: 700 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotMp.length === 0 && <tr><td colSpan={3 + datesInMonth.length + 1} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: 24 }}>No manpower data.</td></tr>}
                  {pivotMp.map((r, i) => (
                    <tr key={i}>
                      <td style={{ position: "sticky", left: 0, background: "var(--color-surface)", zIndex: 1, fontSize: 11 }}>{r.company}</td>
                      <td style={{ fontSize: 12 }}>{r.name}</td>
                      <td style={{ fontSize: 11 }}>{r.position}</td>
                      {datesInMonth.map(d => {
                        const v = r.daily[d] || 0;
                        return <td key={d} style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 2px", color: v > 0 ? "var(--color-text)" : "var(--color-text-dim)", background: v > 0 ? "rgba(74,222,128,0.08)" : "transparent" }}>{v > 0 ? v.toFixed(1) : "0"}</td>;
                      })}
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>{r.total.toFixed(1)}</td>
                    </tr>
                  ))}
                  {pivotMp.length > 0 && (
                    <tr style={{ background: "var(--color-surface-2)", fontWeight: 700 }}>
                      <td style={{ position: "sticky", left: 0, background: "var(--color-surface-2)", zIndex: 1, fontSize: 12 }} colSpan={3}>Total</td>
                      {datesInMonth.map(d => {
                        const dt = pivotMp.reduce((s, r) => s + (r.daily[d] || 0), 0);
                        return <td key={d} style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 2px", color: dt > 0 ? "var(--color-text)" : "var(--color-text-dim)", background: dt > 0 ? "rgba(74,222,128,0.08)" : "transparent" }}>{dt.toFixed(1)}</td>;
                      })}
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-primary)" }}>{totalMpMh.toFixed(1)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "equipment" && (
            <div className="table-wrapper" style={{ overflowX: "auto" }}>
              <table style={{ minWidth: datesInMonth.length * 36 + 400 }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, background: "var(--color-surface-2)", zIndex: 2, fontSize: 11, minWidth: 80 }}>Company</th>
                    <th style={{ fontSize: 11, minWidth: 160 }}>Equipment</th>
                    <th style={{ fontSize: 11, minWidth: 60 }}>Tag</th>
                    {datesInMonth.map(d => (
                      <th key={d} style={{ textAlign: "center", fontSize: 10, minWidth: 32, padding: "6px 2px" }}>{fmtDay(d)}</th>
                    ))}
                    <th style={{ textAlign: "right", fontSize: 11, minWidth: 55, fontWeight: 700 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotEq.length === 0 && <tr><td colSpan={3 + datesInMonth.length + 1} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: 24 }}>No equipment data.</td></tr>}
                  {pivotEq.map((r, i) => (
                    <tr key={i}>
                      <td style={{ position: "sticky", left: 0, background: "var(--color-surface)", zIndex: 1, fontSize: 11 }}>{r.company}</td>
                      <td style={{ fontSize: 12 }}>{r.name}</td>
                      <td style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>{r.tag || "—"}</td>
                      {datesInMonth.map(d => {
                        const v = r.daily[d] || 0;
                        return <td key={d} style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 2px", color: v > 0 ? "var(--color-text)" : "var(--color-text-dim)", background: v > 0 ? "rgba(74,222,128,0.08)" : "transparent" }}>{v > 0 ? v.toFixed(1) : "0"}</td>;
                      })}
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--color-accent)" }}>{r.total.toFixed(1)}</td>
                    </tr>
                  ))}
                  {pivotEq.length > 0 && (
                    <tr style={{ background: "var(--color-surface-2)", fontWeight: 700 }}>
                      <td style={{ position: "sticky", left: 0, background: "var(--color-surface-2)", zIndex: 1, fontSize: 12 }} colSpan={3}>Total</td>
                      {datesInMonth.map(d => {
                        const dt = pivotEq.reduce((s, r) => s + (r.daily[d] || 0), 0);
                        return <td key={d} style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 2px", color: dt > 0 ? "var(--color-text)" : "var(--color-text-dim)", background: dt > 0 ? "rgba(74,222,128,0.08)" : "transparent" }}>{dt.toFixed(1)}</td>;
                      })}
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-accent)" }}>{totalEqMh.toFixed(1)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>)}
    </div>
  );
};

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<TimesheetPage />);