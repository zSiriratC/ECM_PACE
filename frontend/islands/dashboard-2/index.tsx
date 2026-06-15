import React, { useEffect, useState, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

interface Job { job_no: string; job_name: string; status: string; location: string; working_platform: string; asset: string; job_type: string; sub_type: string; discipline: string; }
interface Progress { progress_date: string; actual_manhour: number; progress_total: number; status: string; }
interface WpMapping { id: number; asset: string; working_platform: string; status: string; }
interface JobTypeItem { id: number; status?: string; description_l1: string; description_l2: string; description_l3: string; }
interface CompanyItem { id: number; name: string; status: string; }
interface PlanSummary { total_manhour: number; project_duration: number; }
interface ScatterPoint { job_no: string; job_name: string; pdi: number; pgi: number; }

const apiH = (): Record<string, string> => ({ "Content-Type": "application/json" });
const api = async (url: string) => { const r = await fetch(url, { headers: apiH() }); return r.json(); };

const PdiVsPgiPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wpMappings, setWpMappings] = useState<WpMapping[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [fAsset, setFAsset] = useState("");
  const [fPlatform, setFPlatform] = useState("");
  const [fJobType, setFJobType] = useState("");
  const [fSub1, setFSub1] = useState("");
  const [fSub2, setFSub2] = useState("");
  const [fCompany, setFCompany] = useState("");
  const [scatterData, setScatterData] = useState<ScatterPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);

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

  const hasFilters = fAsset || fPlatform || fJobType || fSub1 || fSub2 || fCompany;
  const clearFilters = () => { setFAsset(""); setFPlatform(""); setFJobType(""); setFSub1(""); setFSub2(""); setFCompany(""); };

  
const activeJobs = useMemo(() => {
    return jobs.filter(j => {
      // Show all projects that have been started (exclude Drafting Plan and Pending Approval)
      if (j.status === "Drafting Plan" || j.status === "Pending Approval") return false;
      if (fAsset && j.location !== fAsset) return false;
      if (fPlatform && j.working_platform !== fPlatform) return false;
      if (fJobType && j.job_type !== fJobType) return false;
      if (fSub1 && j.sub_type !== fSub1) return false;
      if (fSub2 && j.discipline !== fSub2) return false;
      if (fCompany && j.asset !== fCompany) return false;
      return true;
    });
  }, [jobs, fAsset, fPlatform, fJobType, fSub1, fSub2, fCompany]);

  useEffect(() => {
    const compute = async () => {
      setLoading(true);
      const results: ScatterPoint[] = [];
      for (const job of activeJobs) {
        try {
          const [reports, sum] = await Promise.all([
            api("/api/daily-report/project/progress?project_no=" + job.job_no),
            api("/api/planning/plan-summary?job_no=" + job.job_no),
          ]);
          if (!sum || !sum.id || reports.length === 0) continue;
          const sorted: Progress[] = reports.sort((a: Progress, b: Progress) => a.progress_date.localeCompare(b.progress_date));
          const n = sorted.length;
          const actualProgress = sorted[n - 1].progress_total || 0;
          const actualMh = sorted.reduce((s: number, r: Progress) => s + (r.actual_manhour || 0), 0);
          const planMh = sum.total_manhour || 1;
          const planDuration = sum.project_duration || n;
          const workingDays = sorted.filter((r: Progress) => r.status !== "No Progress").length;
          const plannedProgressAtDay = (workingDays / planDuration) * 100;

          const pgi = plannedProgressAtDay > 0 ? actualProgress / plannedProgressAtDay : 0;
          const pdi = (actualMh > 0 && planMh > 0) ? (actualProgress / 100) / (actualMh / planMh) : 0;
          results.push({ job_no: job.job_no, job_name: job.job_name, pdi, pgi });
        } catch {}
      }
      setScatterData(results);
      setLoading(false);
    };
    if (activeJobs.length > 0) compute();
    else { setScatterData([]); setLoading(false); }
  }, [activeJobs]);

  const axisRange = useMemo(() => {
    if (scatterData.length === 0) return { minX: -0.2, maxX: 2.2, minY: -0.2, maxY: 2.2 };
    const allPdi = scatterData.map(d => d.pdi);
    const allPgi = scatterData.map(d => d.pgi);
    const padX = Math.max((Math.max(...allPdi) - Math.min(...allPdi)) * 0.3, 0.4);
    const padY = Math.max((Math.max(...allPgi) - Math.min(...allPgi)) * 0.3, 0.4);
    return {
      minX: Math.floor(Math.min(Math.min(...allPdi) - padX, 0) * 10) / 10,
      maxX: Math.ceil(Math.max(Math.max(...allPdi) + padX, 1.5) * 10) / 10,
      minY: Math.floor(Math.min(Math.min(...allPgi) - padY, 0) * 10) / 10,
      maxY: Math.ceil(Math.max(Math.max(...allPgi) + padY, 1.5) * 10) / 10,
    };
  }, [scatterData]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInst.current) chartInst.current.destroy();
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const grid = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const txt = isDark ? "#8B90A5" : "#5F6577";

    const points = scatterData.map(d => ({ x: d.pdi, y: d.pgi }));
    const bgColors = scatterData.map(d => (d.pdi >= 0.8 && d.pdi <= 1.2 && d.pgi >= 0.8 && d.pgi <= 1.2) ? "#4ADE80" : "#FF6B6B");
    const bdColors = scatterData.map(d => (d.pdi >= 0.8 && d.pdi <= 1.2 && d.pgi >= 0.8 && d.pgi <= 1.2) ? "#34B86A" : "#E05252");

    chartInst.current = new Chart(chartRef.current, {
      type: "scatter",
      data: {
        datasets: [{
          label: "Jobs",
          data: points,
          backgroundColor: bgColors,
          borderColor: bdColors,
          borderWidth: 2,
          pointRadius: 10,
          pointHoverRadius: 14,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: "PDI (Productivity Index)", color: txt, font: { size: 13, weight: "bold" as const } },
            grid: { color: grid }, ticks: { color: txt, stepSize: 0.2 },
            min: axisRange.minX, max: axisRange.maxX,
          },
          y: {
            title: { display: true, text: "PGI (Progress Index)", color: txt, font: { size: 13, weight: "bold" as const } },
            grid: { color: grid }, ticks: { color: txt, stepSize: 0.2 },
            min: axisRange.minY, max: axisRange.maxY,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "#1C2030" : "#FFFFFF",
            titleColor: isDark ? "#E8EAF0" : "#1A1D26",
            bodyColor: isDark ? "#8B90A5" : "#5F6577",
            borderColor: isDark ? "#2A2E3F" : "#D8DAE0",
            borderWidth: 1, padding: 12,
            callbacks: {
              title: (items: any[]) => { const d = scatterData[items[0]?.dataIndex]; return d ? d.job_no : ""; },
              label: (ctx: any) => { const d = scatterData[ctx.dataIndex]; return d ? d.job_name : ""; },
              afterLabel: (ctx: any) => {
                const d = scatterData[ctx.dataIndex]; if (!d) return "";
                const ok = d.pdi >= 0.8 && d.pdi <= 1.2 && d.pgi >= 0.8 && d.pgi <= 1.2;
                return ["PDI: " + d.pdi.toFixed(3), "PGI: " + d.pgi.toFixed(3), ok ? "✅ Healthy" : "⚠️ Attention"];
              },
            },
          },
        },
      },
      plugins: [
        {
          id: "quadrants",
          beforeDraw: (chart: any) => {
            const { ctx, scales } = chart;
            const xS = scales.x; const yS = scales.y;
            const cx = xS.getPixelForValue(1); const cy = yS.getPixelForValue(1);
            ctx.save();

            // Quadrant backgrounds
            ctx.fillStyle = isDark ? "rgba(74,222,128,0.04)" : "rgba(74,222,128,0.06)";
            ctx.fillRect(cx, yS.top, xS.right - cx, cy - yS.top);
            ctx.fillStyle = isDark ? "rgba(255,184,77,0.04)" : "rgba(255,184,77,0.05)";
            ctx.fillRect(xS.left, yS.top, cx - xS.left, cy - yS.top);
            ctx.fillStyle = isDark ? "rgba(255,107,107,0.04)" : "rgba(255,107,107,0.05)";
            ctx.fillRect(xS.left, cy, cx - xS.left, yS.bottom - cy);
            ctx.fillStyle = isDark ? "rgba(108,142,255,0.04)" : "rgba(108,142,255,0.05)";
            ctx.fillRect(cx, cy, xS.right - cx, yS.bottom - cy);

            // Green zone
            const gx1 = xS.getPixelForValue(0.8); const gx2 = xS.getPixelForValue(1.2);
            const gy1 = yS.getPixelForValue(1.2); const gy2 = yS.getPixelForValue(0.8);
            ctx.fillStyle = isDark ? "rgba(74,222,128,0.06)" : "rgba(74,222,128,0.1)";
            ctx.fillRect(gx1, gy1, gx2 - gx1, gy2 - gy1);
            ctx.strokeStyle = isDark ? "rgba(74,222,128,0.25)" : "rgba(74,222,128,0.35)";
            ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
            ctx.strokeRect(gx1, gy1, gx2 - gx1, gy2 - gy1);

            // Crosshair
            ctx.strokeStyle = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
            ctx.lineWidth = 1.5; ctx.setLineDash([]);
            ctx.beginPath(); ctx.moveTo(cx, yS.top); ctx.lineTo(cx, yS.bottom); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(xS.left, cy); ctx.lineTo(xS.right, cy); ctx.stroke();

            // Quadrant labels
            const la = isDark ? 0.35 : 0.25;
            ctx.font = "bold 13px Inter, sans-serif"; ctx.textAlign = "center";

            ctx.fillStyle = "rgba(74,222,128," + la + ")";
            ctx.fillText("EFFICIENT", (cx + xS.right) / 2, (yS.top + cy) / 2 - 10);
            ctx.font = "11px Inter, sans-serif";
            ctx.fillText("& AHEAD (Best)", (cx + xS.right) / 2, (yS.top + cy) / 2 + 8);

            ctx.font = "bold 13px Inter, sans-serif";
            ctx.fillStyle = "rgba(255,184,77," + la + ")";
            ctx.fillText("INEFFICIENT", (xS.left + cx) / 2, (yS.top + cy) / 2 - 10);
            ctx.font = "11px Inter, sans-serif";
            ctx.fillText("but AHEAD (Watch MH)", (xS.left + cx) / 2, (yS.top + cy) / 2 + 8);

            ctx.font = "bold 13px Inter, sans-serif";
            ctx.fillStyle = "rgba(255,107,107," + la + ")";
            ctx.fillText("INEFFICIENT", (xS.left + cx) / 2, (cy + yS.bottom) / 2 - 10);
            ctx.font = "11px Inter, sans-serif";
            ctx.fillText("& BEHIND (Worst)", (xS.left + cx) / 2, (cy + yS.bottom) / 2 + 8);

            ctx.font = "bold 13px Inter, sans-serif";
            ctx.fillStyle = "rgba(108,142,255," + la + ")";
            ctx.fillText("EFFICIENT", (cx + xS.right) / 2, (cy + yS.bottom) / 2 - 10);
            ctx.font = "11px Inter, sans-serif";
            ctx.fillText("but BEHIND (Watch Schedule)", (cx + xS.right) / 2, (cy + yS.bottom) / 2 + 8);

            // Axis labels
            ctx.font = "bold 10px Inter, sans-serif";
            ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
            ctx.textAlign = "left"; ctx.fillText("PDI = 1.0", cx + 4, yS.bottom - 4);
            ctx.textAlign = "right"; ctx.fillText("PGI = 1.0", xS.right - 4, cy - 4);

            ctx.font = "9px Inter, sans-serif";
            ctx.fillStyle = isDark ? "rgba(74,222,128,0.4)" : "rgba(34,184,106,0.5)";
            ctx.textAlign = "center"; ctx.fillText("Healthy Zone (0.8–1.2)", (gx1 + gx2) / 2, gy2 + 12);

            ctx.restore();
          },
        },
        {
          id: "jobLabels",
          afterDraw: (chart: any) => {
            const { ctx } = chart;
            ctx.save(); ctx.font = "bold 9px Inter, sans-serif"; ctx.textAlign = "center";
            const meta = chart.getDatasetMeta(0);
            meta.data.forEach((pt: any, idx: number) => {
              const d = scatterData[idx]; if (!d) return;
              ctx.fillStyle = (d.pdi >= 0.8 && d.pdi <= 1.2 && d.pgi >= 0.8 && d.pgi <= 1.2) ? "#34B86A" : "#E05252";
              ctx.fillText(d.job_no, pt.x, pt.y - 14);
            });
            ctx.restore();
          },
        },
      ],
    });
  }, [scatterData, axisRange]);

  return (
    <div>
      {/* Filters */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 110 }}><select className="form-control" value={fAsset} onChange={e => { setFAsset(e.target.value); setFPlatform(""); }} style={{ fontFamily: "var(--font-family)" }}><option value="">All Assets</option>{uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div style={{ minWidth: 110 }}><select className="form-control" value={fPlatform} onChange={e => setFPlatform(e.target.value)} style={{ fontFamily: "var(--font-family)" }}><option value="">All Platforms</option>{uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div style={{ minWidth: 110 }}><select className="form-control" value={fCompany} onChange={e => setFCompany(e.target.value)} style={{ fontFamily: "var(--font-family)" }}><option value="">All Companies</option>{activeCompanies.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div style={{ minWidth: 110 }}><select className="form-control" value={fJobType} onChange={e => { setFJobType(e.target.value); setFSub1(""); setFSub2(""); }} style={{ fontFamily: "var(--font-family)" }}><option value="">All Job Types</option>{uniqueL1.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
          {fJobType && <div style={{ minWidth: 110 }}><select className="form-control" value={fSub1} onChange={e => { setFSub1(e.target.value); setFSub2(""); }} style={{ fontFamily: "var(--font-family)" }}><option value="">All Sub 1</option>{uniqueL2.map(l => <option key={l} value={l}>{l}</option>)}</select></div>}
          {fSub1 && <div style={{ minWidth: 110 }}><select className="form-control" value={fSub2} onChange={e => setFSub2(e.target.value)} style={{ fontFamily: "var(--font-family)" }}><option value="">All Sub 2</option>{uniqueL3.map(l => <option key={l} value={l}>{l}</option>)}</select></div>}
          {hasFilters && <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ height: 34 }}>Clear</button>}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-dim)", marginTop: 8, fontFamily: "var(--font-family)" }}>{scatterData.length} active job(s){hasFilters && " (filtered)"}</div>
      </div>

      {loading && <div className="empty-state"><p>Computing...</p></div>}

      {!loading && (<>
        {/* Chart */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h2>PDI vs PGI — All Active Jobs</h2>
            <div style={{ fontSize: 11, color: "var(--color-text-dim)" }}>{scatterData.length} job(s)</div>
          </div>
          {scatterData.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><div className="empty-icon">📈</div><p>No active jobs with data.</p></div>
          ) : (
            <div style={{ height: 520 }}><canvas ref={chartRef} /></div>
          )}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 11, color: "var(--color-text-dim)", marginTop: 12, flexWrap: "wrap", padding: "0 16px 12px" }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#4ADE80", marginRight: 4 }}></span>Healthy (0.8–1.2)</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#FF6B6B", marginRight: 4 }}></span>Attention</span>
            <span><span style={{ display: "inline-block", width: 20, height: 10, background: "rgba(74,222,128,0.15)", border: "1px dashed rgba(74,222,128,0.4)", marginRight: 4 }}></span>Green Zone</span>
          </div>
        </div>

        {/* Explanation */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2>How to Read This Chart</h2></div>
          <div style={{ padding: "12px 16px", fontSize: 12, lineHeight: 1.8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><div style={{ fontWeight: 700, color: "var(--color-warning)", marginBottom: 4 }}>↖ Top-Left: INEFFICIENT but AHEAD</div><div style={{ color: "var(--color-text-muted)" }}>PDI &lt; 1, PGI &gt; 1. Ahead but using too much MH.</div></div>
              <div><div style={{ fontWeight: 700, color: "var(--color-success)", marginBottom: 4 }}>↗ Top-Right: EFFICIENT & AHEAD</div><div style={{ color: "var(--color-text-muted)" }}>PDI &gt; 1, PGI &gt; 1. Best. Less MH and ahead of schedule.</div></div>
              <div><div style={{ fontWeight: 700, color: "var(--color-danger)", marginBottom: 4 }}>↙ Bottom-Left: INEFFICIENT & BEHIND</div><div style={{ color: "var(--color-text-muted)" }}>PDI &lt; 1, PGI &lt; 1. Worst. Behind and overspending MH.</div></div>
              <div><div style={{ fontWeight: 700, color: "var(--color-primary)", marginBottom: 4 }}>↘ Bottom-Right: EFFICIENT but BEHIND</div><div style={{ color: "var(--color-text-muted)" }}>PDI &gt; 1, PGI &lt; 1. Efficient but behind. Need more resources.</div></div>
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--color-surface-2)", borderRadius: 6, fontSize: 11 }}>
              <strong>PGI</strong> = Actual Progress / Planned Progress → Schedule<br />
              <strong>PDI</strong> = (Actual Progress / 100) / (Actual MH / Plan MH) → Productivity<br />
              <strong>Healthy</strong> = 0.8 to 1.2 for both
            </div>
          </div>
        </div>

        {/* Table */}
        {scatterData.length > 0 && (
          <div className="card">
            <div className="card-header"><h2>Job Summary</h2></div>
            <div className="table-wrapper"><table>
              <thead><tr><th>Job No</th><th>Name</th><th style={{ textAlign: "right" }}>PDI</th><th style={{ textAlign: "right" }}>PGI</th><th>Quadrant</th><th>Status</th></tr></thead>
              <tbody>
                {scatterData.sort((a, b) => {
                  const aOk = a.pdi >= 0.8 && a.pdi <= 1.2 && a.pgi >= 0.8 && a.pgi <= 1.2;
                  const bOk = b.pdi >= 0.8 && b.pdi <= 1.2 && b.pgi >= 0.8 && b.pgi <= 1.2;
                  if (aOk === bOk) return a.job_no.localeCompare(b.job_no);
                  return aOk ? 1 : -1;
                }).map(d => {
                  const pdiOk = d.pdi >= 0.8 && d.pdi <= 1.2;
                  const pgiOk = d.pgi >= 0.8 && d.pgi <= 1.2;
                  let quadrant = ""; let qColor = "";
                  if (d.pdi >= 1 && d.pgi >= 1) { quadrant = "Efficient & Ahead"; qColor = "var(--color-success)"; }
                  else if (d.pdi < 1 && d.pgi >= 1) { quadrant = "Inefficient but Ahead"; qColor = "var(--color-warning)"; }
                  else if (d.pdi < 1 && d.pgi < 1) { quadrant = "Inefficient & Behind"; qColor = "var(--color-danger)"; }
                  else { quadrant = "Efficient but Behind"; qColor = "var(--color-primary)"; }
                  return (
                    <tr key={d.job_no}>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{d.job_no}</td>
                      <td>{d.job_name}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: pdiOk ? "var(--color-success)" : "var(--color-danger)" }}>{d.pdi.toFixed(3)}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: pgiOk ? "var(--color-success)" : "var(--color-danger)" }}>{d.pgi.toFixed(3)}</td>
                      <td style={{ fontSize: 12, color: qColor, fontWeight: 600 }}>{quadrant}</td>
                      <td>{pdiOk && pgiOk ? <span className="badge badge-active">✅ Healthy</span> : <span className="badge badge-inactive">⚠️ Attention</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        )}
      </>)}
    </div>
  );
};

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<PdiVsPgiPage />);