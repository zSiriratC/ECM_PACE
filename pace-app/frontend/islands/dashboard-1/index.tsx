import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

interface Job { job_no: string; job_name: string; status: string; }
interface Progress {
  progress_date: string; actual_manhour: number; actual_pob: number;
  progress_today: number; progress_total: number; wrench_time_daily: number;
  status: string;
}
interface PlanSummary {
  id: number | null; total_manhour: number; estimated_pob: number; project_duration: number;
  actual_manhour_daily: number;
  plan_start_date: string | null; plan_end_date: string | null;
}

const apiH = (): Record<string, string> => ({ "Content-Type": "application/json", "X-User-Role": localStorage.getItem("pace-role") || "administrator" });
const api = async (url: string) => { const r = await fetch(url, { headers: apiH() }); return r.json(); };
function fmtNum(n: number): string { return n.toLocaleString("en-US", { maximumFractionDigits: 1 }); }
function fmtDate(val: string | null): string {
  if (!val) return "—";
  try { const d = new Date(val); const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return String(d.getDate()).padStart(2, "0") + " " + M[d.getMonth()]; }
  catch { return val; }
}

interface ChartDataResult {
  labels: string[];
  planMhLine: number[];
  planPctLine: number[];
  actualMhLine: (number | null)[];
  actualProgressLine: (number | null)[];
  planMh: number;
  noProgressDates: Set<string>;
}

const EfficiencyDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sel, setSel] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [showDd, setShowDd] = useState(false);
  const [reports, setReports] = useState<Progress[]>([]);
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);

  useEffect(() => { api("/api/planning/jobs").then(setJobs); }, []);

  const selJobObj = useMemo(() => jobs.find(j => j.job_no === sel), [jobs, sel]);

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return jobs;
    const q = jobSearch.toLowerCase();
    return jobs.filter(j => (j.job_no || "").toLowerCase().includes(q) || (j.job_name || "").toLowerCase().includes(q));
  }, [jobs, jobSearch]);

  const load = useCallback(() => {
    if (!sel) return;
    api("/api/daily-report/project/progress?project_no=" + sel).then(d =>
      setReports((d || []).sort((a: Progress, b: Progress) => a.progress_date.localeCompare(b.progress_date)))
    );
    api("/api/planning/plan-summary?job_no=" + sel).then(d => setSummary(d && (d.id || d.total_manhour > 0) ? d : null));
  }, [sel]);
  useEffect(() => { load(); }, [load]);

  const chartData = useMemo((): ChartDataResult | null => {
    if (!reports.length || !summary) return null;
    const planStart = summary.plan_start_date;
    const planEnd = summary.plan_end_date;
    if (!planStart || !planEnd) return null;

    const planMh = summary.total_manhour || 1;
    const lastReportDate = reports[reports.length - 1].progress_date;
    const endDate = lastReportDate > planEnd ? lastReportDate : planEnd;

    const allDates: string[] = [];
    const d = new Date(planStart);
    const e = new Date(endDate);
    while (d <= e) { allDates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate() + 1); }

    const noProgressDates = new Set<string>();
    reports.forEach(r => { if (r.status === "No Progress") noProgressDates.add(r.progress_date); });

    const reportMap = new Map<string, Progress>();
    reports.forEach(r => reportMap.set(r.progress_date, r));

    const planDuration = summary.project_duration || allDates.length;
    const mhPerWorkDay = planMh / planDuration;
    const progressPerWorkDay = 100 / planDuration;

    const labels: string[] = [];
    const planMhLine: number[] = [];
    const planPctLine: number[] = [];
    const actualMhLine: (number | null)[] = [];
    const actualProgressLine: (number | null)[] = [];

    let cumPlanMh = 0;
    let cumPlanProgress = 0;
    let cumActMh = 0;
    let hasStarted = false;

    const firstReportDate = reports.length > 0 ? reports[0].progress_date : null;
    const lastReportDateActual = reports.length > 0 ? reports[reports.length - 1].progress_date : null;

    allDates.forEach(date => {
      labels.push(date);

      const isNoProgress = noProgressDates.has(date);
      if (!isNoProgress && date >= planStart && date <= planEnd) {
        cumPlanMh += mhPerWorkDay;
        cumPlanProgress += progressPerWorkDay;
      }
      cumPlanProgress = Math.min(cumPlanProgress, 100);
      cumPlanMh = Math.min(cumPlanMh, planMh);
      planMhLine.push(Math.round(cumPlanMh * 100) / 100);
      planPctLine.push(Math.round(cumPlanProgress * 100) / 100);

      const report = reportMap.get(date);
      if (report) {
        hasStarted = true;
        cumActMh += report.actual_manhour || 0;
        actualMhLine.push(cumActMh);
        actualProgressLine.push(report.progress_total || 0);
      } else if (hasStarted && firstReportDate && lastReportDateActual && date >= firstReportDate && date <= lastReportDateActual) {
        actualMhLine.push(actualMhLine.length > 0 ? actualMhLine[actualMhLine.length - 1] : null);
        actualProgressLine.push(actualProgressLine.length > 0 ? actualProgressLine[actualProgressLine.length - 1] : null);
      } else {
        actualMhLine.push(null);
        actualProgressLine.push(null);
      }
    });

    return { labels, planMhLine, planPctLine, actualMhLine, actualProgressLine, planMh, noProgressDates };
  }, [reports, summary]);

  const kpis = useMemo(() => {
    if (!chartData || !summary) return { pgi: 0, pdi: 0, totalActualMh: 0, totalProgress: 0, planMh: 0, noProgressDays: 0, workingDays: 0, plannedProgressNow: 0, plannedMhNow: 0 };

    // Find last report date index
    const lastReportDate = reports.length > 0 ? reports[reports.length - 1].progress_date : "";
    const lastReportIdx = chartData.labels.indexOf(lastReportDate);
    const idx = lastReportIdx >= 0 ? lastReportIdx : chartData.labels.length - 1;

    // Get actual values (handle null)
    let actualProgress = 0;
    let actualMh = 0;
    for (let i = idx; i >= 0; i--) {
      if (chartData.actualProgressLine[i] !== null) { actualProgress = chartData.actualProgressLine[i] as number; break; }
    }
    for (let i = idx; i >= 0; i--) {
      if (chartData.actualMhLine[i] !== null) { actualMh = chartData.actualMhLine[i] as number; break; }
    }

    const plannedPct = chartData.planPctLine[idx] || 0;
    const plannedMh = chartData.planMhLine[idx] || 0;
    const planMh = summary.total_manhour || 1;

    const pgi = plannedPct > 0 ? actualProgress / plannedPct : 0;
    const pdi = (actualMh > 0 && planMh > 0) ? (actualProgress / 100) / (actualMh / planMh) : 0;
    const noProgressDays = chartData.noProgressDates.size;
    const workingDays = reports.filter(r => r.status !== "No Progress").length;

    return { pgi, pdi, totalActualMh: actualMh, totalProgress: actualProgress, planMh, noProgressDays, workingDays, plannedProgressNow: plannedPct, plannedMhNow: plannedMh };
  }, [chartData, summary, reports]);

  useEffect(() => {
    if (!chartData || !chartRef.current || !summary) return;
    if (chartInst.current) chartInst.current.destroy();
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const grid = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const txt = isDark ? "#8B90A5" : "#5F6577";
    const planMh = summary.total_manhour || 1;

    const validActualMh = chartData.actualMhLine.filter(v => v !== null) as number[];
    const maxActualMh = validActualMh.length > 0 ? Math.max(...validActualMh, planMh) : planMh;
    const rightMax = Math.ceil(maxActualMh / 10) * 10;
    const leftMax = Math.ceil((rightMax / planMh) * 100 / 10) * 10;

    chartInst.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: chartData.labels.map(d => fmtDate(d)),
        datasets: [
          {
            label: "Plan", data: chartData.planPctLine,
            borderColor: "#8B90A5", borderDash: [6, 3], borderWidth: 2, pointRadius: 0,
            fill: false, yAxisID: "y",
          },
          {
            label: "Actual MH", data: chartData.actualMhLine,
            borderColor: "#6C8EFF", backgroundColor: "rgba(108,142,255,0.08)",
            fill: false, tension: 0.3, yAxisID: "y1",
            spanGaps: false,
            pointRadius: chartData.actualMhLine.map((v, i) => {
              if (v === null) return 0;
              return chartData.noProgressDates.has(chartData.labels[i]) ? 5 : 3;
            }),
            pointBackgroundColor: chartData.actualMhLine.map((v, i) => {
              if (v === null) return "transparent";
              return chartData.noProgressDates.has(chartData.labels[i]) ? "#FF6B6B" : "#6C8EFF";
            }),
          },
          {
            label: "Actual Progress", data: chartData.actualProgressLine,
            borderColor: "#50E3C2", backgroundColor: "rgba(80,227,194,0.08)",
            fill: false, tension: 0.3, yAxisID: "y",
            spanGaps: false,
            pointRadius: chartData.actualProgressLine.map((v, i) => {
              if (v === null) return 0;
              return chartData.noProgressDates.has(chartData.labels[i]) ? 5 : 3;
            }),
            pointBackgroundColor: chartData.actualProgressLine.map((v, i) => {
              if (v === null) return "transparent";
              return chartData.noProgressDates.has(chartData.labels[i]) ? "#FF6B6B" : "#50E3C2";
            }),
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { grid: { color: grid }, ticks: { color: txt, maxTicksLimit: 15, maxRotation: 45, font: { size: 10 } } },
          y: { position: "left", title: { display: true, text: "Progress (%)", color: txt, font: { size: 12 } }, grid: { color: grid }, ticks: { color: txt, callback: (v: any) => v + "%" }, min: 0, max: leftMax },
          y1: { position: "right", title: { display: true, text: "Cumulative MH (hours)", color: txt, font: { size: 12 } }, grid: { display: false }, ticks: { color: txt }, min: 0, max: rightMax },
        },
        plugins: {
          legend: { labels: { color: txt, usePointStyle: true, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const ds = ctx.dataset; const v = ctx.parsed.y;
                if (v === null || v === undefined) return "";
                if (ds.label === "Plan") { const mhVal = chartData.planMhLine[ctx.dataIndex] || 0; return "Plan: " + fmtNum(mhVal) + " MH / " + v.toFixed(1) + "%"; }
                if (ds.yAxisID === "y1") return "Actual MH: " + fmtNum(v) + " hours / " + ((v / planMh) * 100).toFixed(1) + "% of plan";
                return "Actual Progress: " + v.toFixed(1) + "%";
              },
              afterBody: (items: any[]) => {
                const idx = items[0]?.dataIndex; if (idx === undefined) return "";
                const lines: string[] = [];
                if (chartData.noProgressDates.has(chartData.labels[idx])) lines.push("⚠️ No Progress Day");
                return lines;
              },
            },
          },
        },
      },
      plugins: [{
        id: "planLine100",
        afterDraw: (chart: any) => {
          const { ctx, scales } = chart;
          const y100 = scales.y.getPixelForValue(100);
          ctx.save();
          ctx.strokeStyle = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)";
          ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(scales.x.left, y100); ctx.lineTo(scales.x.right, y100); ctx.stroke();
          ctx.fillStyle = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)";
          ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "left";
          ctx.fillText("Progress 100% = " + fmtNum(planMh) + " MH", scales.x.left + 4, y100 - 4);
          ctx.restore();
        },
      }],
    });
  }, [chartData, summary]);

  return (
    <div>
      {/* Searchable Project Selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-group" style={{ marginBottom: 0, position: "relative", maxWidth: 500 }}>
          <label>Select Project</label>
          <input
            className="form-control"
            placeholder="Search project no or name..."
            value={sel ? (selJobObj ? selJobObj.job_no + " — " + selJobObj.job_name : sel) : jobSearch}
            onChange={e => { setJobSearch(e.target.value); setSel(""); setShowDd(true); }}
            onFocus={() => setShowDd(true)}
            onBlur={() => setTimeout(() => setShowDd(false), 200)}
          />
          {showDd && !sel && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-md)", maxHeight: 250, overflowY: "auto" }}>
              {filteredJobs.length === 0 && <div style={{ padding: 12, fontSize: 12, color: "var(--color-text-dim)" }}>No projects found.</div>}
              {filteredJobs.map(j => (
                <div key={j.job_no} style={{ padding: "10px 12px", cursor: "pointer", fontSize: 12, display: "flex", justifyContent: "space-between" }}
                  onMouseDown={e => { e.preventDefault(); setSel(j.job_no); setJobSearch(""); setShowDd(false); }}>
                  <div><div style={{ fontWeight: 600 }}>{j.job_no}</div><div style={{ fontSize: 11, color: "var(--color-text-dim)" }}>{j.job_name}</div></div>
                  <span className={"badge " + ({ "In Progress": "badge-inprogress", "Completed": "badge-completed", "Approved Plan": "badge-approved", "Drafting Plan": "badge-draft", "Pending Approval": "badge-pending" }[j.status] || "badge-draft")} style={{ fontSize: 9, alignSelf: "center" }}>{j.status}</span>
                </div>
              ))}
            </div>
          )}
          {sel && <button style={{ position: "absolute", right: 8, top: 28, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--color-text-dim)" }} onClick={() => { setSel(""); setJobSearch(""); }}>✕</button>}
        </div>
      </div>

      {!sel && <div className="empty-state"><div className="empty-icon">📊</div><p>Select a project.</p></div>}

      {sel && summary && (<>
        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card"><div className="kpi-value">{fmtNum(kpis.planMh)}</div><div className="kpi-label">Plan MH</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{ color: "var(--color-primary)" }}>{fmtNum(kpis.totalActualMh)}</div><div className="kpi-label">Actual MH</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{ color: kpis.totalActualMh > kpis.planMh ? "var(--color-danger)" : "var(--color-success)" }}>{kpis.planMh > 0 ? ((kpis.totalActualMh / kpis.planMh) * 100).toFixed(1) : 0}%</div><div className="kpi-label">MH Used</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{ color: "var(--color-accent)" }}>{kpis.totalProgress.toFixed(1)}%</div><div className="kpi-label">Progress</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{ color: kpis.pdi >= 0.8 && kpis.pdi <= 1.2 ? "var(--color-success)" : "var(--color-danger)" }}>{kpis.pdi.toFixed(3)}</div><div className="kpi-label">PDI</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{ color: kpis.pgi >= 0.8 && kpis.pgi <= 1.2 ? "var(--color-success)" : "var(--color-danger)" }}>{kpis.pgi.toFixed(3)}</div><div className="kpi-label">PGI</div></div>
          <div className="kpi-card"><div className="kpi-value">{kpis.workingDays}</div><div className="kpi-label">Working Days</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{ color: kpis.noProgressDays > 0 ? "var(--color-warning)" : "var(--color-text-muted)" }}>{kpis.noProgressDays}</div><div className="kpi-label">No Progress</div></div>
        </div>

        {/* Plan Info */}
        <div className="card" style={{ marginBottom: 16, padding: "12px 20px" }}>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--color-text-muted)", flexWrap: "wrap" }}>
            <span>Plan: <strong style={{ color: "var(--color-text)" }}>{fmtDate(summary.plan_start_date)}</strong> → <strong style={{ color: "var(--color-text)" }}>{fmtDate(summary.plan_end_date)}</strong></span>
            <span>Duration: <strong style={{ color: "var(--color-text)" }}>{summary.project_duration} days</strong></span>
            <span>Progress 100% = {fmtNum(summary.total_manhour)} MH</span>
          </div>
        </div>

        {/* Chart */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h2>Efficiency Chart</h2>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--color-text-dim)" }}>
              <span style={{ color: "#8B90A5" }}>--- Plan</span>
              <span style={{ color: "#6C8EFF" }}>━ MH</span>
              <span style={{ color: "#50E3C2" }}>━ Progress</span>
            </div>
          </div>
          {chartData ? <div style={{ height: 400 }}><canvas ref={chartRef} /></div> : <div className="empty-state" style={{ padding: 32 }}><p>Set plan dates first.</p></div>}
          <div style={{ padding: "8px 16px", fontSize: 11, color: "var(--color-text-dim)" }}>
            Left axis = Progress (%). Right axis = MH (hours). Plan line: {fmtNum(summary.total_manhour)} MH = 100%.
          </div>
        </div>

        {/* PDI/PGI Formula */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2>PDI & PGI Calculation</h2></div>
          <div className="table-wrapper"><table>
            <thead><tr><th>Index</th><th>Formula</th><th>Current Value</th><th>Interpretation</th></tr></thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>PDI</td>
                <td style={{ fontSize: 12 }}>
                  <div>(Actual Progress / 100) / (Actual MH / Plan MH)</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-dim)", marginTop: 2 }}>= ({kpis.totalProgress.toFixed(1)} / 100) / ({fmtNum(kpis.totalActualMh)} / {fmtNum(kpis.planMh)})</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-dim)" }}>= {(kpis.totalProgress / 100).toFixed(3)} / {kpis.planMh > 0 ? (kpis.totalActualMh / kpis.planMh).toFixed(3) : "0"}</div>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: kpis.pdi >= 0.8 && kpis.pdi <= 1.2 ? "var(--color-success)" : "var(--color-danger)" }}>{kpis.pdi.toFixed(3)}</td>
                <td style={{ fontSize: 12 }}>
                  {kpis.pdi >= 1.0 ? "✅ Efficient" : kpis.pdi >= 0.8 ? "⚠️ Slightly inefficient" : "🔴 Inefficient"}
                  <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 2 }}>1.0 = as planned, &gt;1.0 = more efficient, &lt;1.0 = less efficient</div>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>PGI</td>
                <td style={{ fontSize: 12 }}>
                  <div>Actual Progress / Planned Progress</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-dim)", marginTop: 2 }}>= {kpis.totalProgress.toFixed(1)}% / {kpis.plannedProgressNow.toFixed(1)}%</div>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: kpis.pgi >= 0.8 && kpis.pgi <= 1.2 ? "var(--color-success)" : "var(--color-danger)" }}>{kpis.pgi.toFixed(3)}</td>
                <td style={{ fontSize: 12 }}>
                  {kpis.pgi >= 1.0 ? "✅ Ahead of schedule" : kpis.pgi >= 0.8 ? "⚠️ Slightly behind" : "🔴 Behind schedule"}
                  <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 2 }}>1.0 = on plan, &gt;1.0 = ahead, &lt;1.0 = behind</div>
                </td>
              </tr>
            </tbody>
          </table></div>
        </div>

        {/* Daily Detail */}
        <div className="card">
          <div className="card-header"><h2>Daily Detail</h2></div>
          <div className="table-wrapper" style={{ maxHeight: 300, overflowY: "auto" }}><table>
            <thead><tr>
              <th>Date</th><th>Status</th>
              <th style={{ textAlign: "right" }}>POB</th>
              <th style={{ textAlign: "right" }}>Wrench Time (%)</th>
              <th style={{ textAlign: "right" }}>Actual MH (HR)</th>
              <th style={{ textAlign: "right" }}>Plan MH (HR)</th>
              <th style={{ textAlign: "right" }}>Actual Progress (%)</th>
              <th style={{ textAlign: "right" }}>Plan Progress (%)</th>
            </tr></thead>
            <tbody>
              {reports.map((r, i) => {
                const cumMh = reports.slice(0, i + 1).reduce((s, x) => s + (x.actual_manhour || 0), 0);
                const isNP = r.status === "No Progress";
                const dateIdx = chartData ? chartData.labels.indexOf(r.progress_date) : -1;
                const plannedMhAtDate = chartData && dateIdx >= 0 ? chartData.planMhLine[dateIdx] : 0;
                const plannedPctAtDate = chartData && dateIdx >= 0 ? chartData.planPctLine[dateIdx] : 0;
                return (
                  <tr key={i} style={isNP ? { background: "rgba(255,107,107,0.06)" } : {}}>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{fmtDate(r.progress_date)}</td>
                    <td>{isNP ? <span className="badge badge-pending" style={{ fontSize: 10 }}>NP</span> : <span className="badge badge-active" style={{ fontSize: 10 }}>Work</span>}</td>
                    <td style={{ textAlign: "right" }}>{r.actual_pob}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{(r.wrench_time_daily || 0).toFixed(1)}%</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{cumMh.toFixed(0)}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{plannedMhAtDate.toFixed(0)}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: r.progress_total > plannedPctAtDate ? "var(--color-success)" : r.progress_total < plannedPctAtDate ? "var(--color-danger)" : "var(--color-text)" }}>{r.progress_total}%</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{plannedPctAtDate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      </>)}
    </div>
  );
};

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<EfficiencyDashboard />);