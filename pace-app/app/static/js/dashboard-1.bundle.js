/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./islands/dashboard-1/index.tsx"
/*!***************************************!*\
  !*** ./islands/dashboard-1/index.tsx ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ \"./node_modules/react/jsx-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-dom/client */ \"./node_modules/react-dom/client.js\");\n/* harmony import */ var chart_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! chart.js */ \"./node_modules/chart.js/dist/chart.js\");\n\n\n\n\nchart_js__WEBPACK_IMPORTED_MODULE_3__.Chart.register(...chart_js__WEBPACK_IMPORTED_MODULE_3__.registerables);\nconst apiH = () => ({ \"Content-Type\": \"application/json\", \"X-User-Role\": localStorage.getItem(\"pace-role\") || \"administrator\" });\nconst api = async (url) => { const r = await fetch(url, { headers: apiH() }); return r.json(); };\nfunction fmtNum(n) { return n.toLocaleString(\"en-US\", { maximumFractionDigits: 1 }); }\nfunction fmtDate(val) {\n    if (!val)\n        return \"—\";\n    try {\n        const d = new Date(val);\n        const M = [\"Jan\", \"Feb\", \"Mar\", \"Apr\", \"May\", \"Jun\", \"Jul\", \"Aug\", \"Sep\", \"Oct\", \"Nov\", \"Dec\"];\n        return String(d.getDate()).padStart(2, \"0\") + \" \" + M[d.getMonth()];\n    }\n    catch {\n        return val;\n    }\n}\nconst EfficiencyDashboard = () => {\n    const [jobs, setJobs] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [sel, setSel] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [jobSearch, setJobSearch] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [showDd, setShowDd] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [reports, setReports] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [summary, setSummary] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const chartRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    const chartInst = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => { api(\"/api/planning/jobs\").then(setJobs); }, []);\n    const selJobObj = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => jobs.find(j => j.job_no === sel), [jobs, sel]);\n    const filteredJobs = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {\n        if (!jobSearch)\n            return jobs;\n        const q = jobSearch.toLowerCase();\n        return jobs.filter(j => (j.job_no || \"\").toLowerCase().includes(q) || (j.job_name || \"\").toLowerCase().includes(q));\n    }, [jobs, jobSearch]);\n    const load = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(() => {\n        if (!sel)\n            return;\n        api(\"/api/daily-report/project/progress?project_no=\" + sel).then(d => setReports((d || []).sort((a, b) => a.progress_date.localeCompare(b.progress_date))));\n        api(\"/api/planning/plan-summary?job_no=\" + sel).then(d => setSummary(d && (d.id || d.total_manhour > 0) ? d : null));\n    }, [sel]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => { load(); }, [load]);\n    const chartData = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {\n        if (!reports.length || !summary)\n            return null;\n        const planStart = summary.plan_start_date;\n        const planEnd = summary.plan_end_date;\n        if (!planStart || !planEnd)\n            return null;\n        const planMh = summary.total_manhour || 1;\n        const lastReportDate = reports[reports.length - 1].progress_date;\n        const endDate = lastReportDate > planEnd ? lastReportDate : planEnd;\n        const allDates = [];\n        const d = new Date(planStart);\n        const e = new Date(endDate);\n        while (d <= e) {\n            allDates.push(d.toISOString().split(\"T\")[0]);\n            d.setDate(d.getDate() + 1);\n        }\n        const noProgressDates = new Set();\n        reports.forEach(r => { if (r.status === \"No Progress\")\n            noProgressDates.add(r.progress_date); });\n        const reportMap = new Map();\n        reports.forEach(r => reportMap.set(r.progress_date, r));\n        const planDuration = summary.project_duration || allDates.length;\n        const mhPerWorkDay = planMh / planDuration;\n        const progressPerWorkDay = 100 / planDuration;\n        const labels = [];\n        const planMhLine = [];\n        const planPctLine = [];\n        const actualMhLine = [];\n        const actualProgressLine = [];\n        let cumPlanMh = 0;\n        let cumPlanProgress = 0;\n        let cumActMh = 0;\n        let hasStarted = false;\n        const firstReportDate = reports.length > 0 ? reports[0].progress_date : null;\n        const lastReportDateActual = reports.length > 0 ? reports[reports.length - 1].progress_date : null;\n        allDates.forEach(date => {\n            labels.push(date);\n            const isNoProgress = noProgressDates.has(date);\n            if (!isNoProgress && date >= planStart && date <= planEnd) {\n                cumPlanMh += mhPerWorkDay;\n                cumPlanProgress += progressPerWorkDay;\n            }\n            cumPlanProgress = Math.min(cumPlanProgress, 100);\n            cumPlanMh = Math.min(cumPlanMh, planMh);\n            planMhLine.push(Math.round(cumPlanMh * 100) / 100);\n            planPctLine.push(Math.round(cumPlanProgress * 100) / 100);\n            const report = reportMap.get(date);\n            if (report) {\n                hasStarted = true;\n                cumActMh += report.actual_manhour || 0;\n                actualMhLine.push(cumActMh);\n                actualProgressLine.push(report.progress_total || 0);\n            }\n            else if (hasStarted && firstReportDate && lastReportDateActual && date >= firstReportDate && date <= lastReportDateActual) {\n                actualMhLine.push(actualMhLine.length > 0 ? actualMhLine[actualMhLine.length - 1] : null);\n                actualProgressLine.push(actualProgressLine.length > 0 ? actualProgressLine[actualProgressLine.length - 1] : null);\n            }\n            else {\n                actualMhLine.push(null);\n                actualProgressLine.push(null);\n            }\n        });\n        return { labels, planMhLine, planPctLine, actualMhLine, actualProgressLine, planMh, noProgressDates };\n    }, [reports, summary]);\n    const kpis = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {\n        if (!chartData || !summary)\n            return { pgi: 0, pdi: 0, totalActualMh: 0, totalProgress: 0, planMh: 0, noProgressDays: 0, workingDays: 0, plannedProgressNow: 0, plannedMhNow: 0 };\n        // Find last report date index\n        const lastReportDate = reports.length > 0 ? reports[reports.length - 1].progress_date : \"\";\n        const lastReportIdx = chartData.labels.indexOf(lastReportDate);\n        const idx = lastReportIdx >= 0 ? lastReportIdx : chartData.labels.length - 1;\n        // Get actual values (handle null)\n        let actualProgress = 0;\n        let actualMh = 0;\n        for (let i = idx; i >= 0; i--) {\n            if (chartData.actualProgressLine[i] !== null) {\n                actualProgress = chartData.actualProgressLine[i];\n                break;\n            }\n        }\n        for (let i = idx; i >= 0; i--) {\n            if (chartData.actualMhLine[i] !== null) {\n                actualMh = chartData.actualMhLine[i];\n                break;\n            }\n        }\n        const plannedPct = chartData.planPctLine[idx] || 0;\n        const plannedMh = chartData.planMhLine[idx] || 0;\n        const planMh = summary.total_manhour || 1;\n        const pgi = plannedPct > 0 ? actualProgress / plannedPct : 0;\n        const pdi = (actualMh > 0 && planMh > 0) ? (actualProgress / 100) / (actualMh / planMh) : 0;\n        const noProgressDays = chartData.noProgressDates.size;\n        const workingDays = reports.filter(r => r.status !== \"No Progress\").length;\n        return { pgi, pdi, totalActualMh: actualMh, totalProgress: actualProgress, planMh, noProgressDays, workingDays, plannedProgressNow: plannedPct, plannedMhNow: plannedMh };\n    }, [chartData, summary, reports]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {\n        if (!chartData || !chartRef.current || !summary)\n            return;\n        if (chartInst.current)\n            chartInst.current.destroy();\n        const isDark = document.documentElement.getAttribute(\"data-theme\") !== \"light\";\n        const grid = isDark ? \"rgba(255,255,255,0.06)\" : \"rgba(0,0,0,0.06)\";\n        const txt = isDark ? \"#8B90A5\" : \"#5F6577\";\n        const planMh = summary.total_manhour || 1;\n        const validActualMh = chartData.actualMhLine.filter(v => v !== null);\n        const maxActualMh = validActualMh.length > 0 ? Math.max(...validActualMh, planMh) : planMh;\n        const rightMax = Math.ceil(maxActualMh / 10) * 10;\n        const leftMax = Math.ceil((rightMax / planMh) * 100 / 10) * 10;\n        chartInst.current = new chart_js__WEBPACK_IMPORTED_MODULE_3__.Chart(chartRef.current, {\n            type: \"line\",\n            data: {\n                labels: chartData.labels.map(d => fmtDate(d)),\n                datasets: [\n                    {\n                        label: \"Plan\", data: chartData.planPctLine,\n                        borderColor: \"#8B90A5\", borderDash: [6, 3], borderWidth: 2, pointRadius: 0,\n                        fill: false, yAxisID: \"y\",\n                    },\n                    {\n                        label: \"Actual MH\", data: chartData.actualMhLine,\n                        borderColor: \"#6C8EFF\", backgroundColor: \"rgba(108,142,255,0.08)\",\n                        fill: false, tension: 0.3, yAxisID: \"y1\",\n                        spanGaps: false,\n                        pointRadius: chartData.actualMhLine.map((v, i) => {\n                            if (v === null)\n                                return 0;\n                            return chartData.noProgressDates.has(chartData.labels[i]) ? 5 : 3;\n                        }),\n                        pointBackgroundColor: chartData.actualMhLine.map((v, i) => {\n                            if (v === null)\n                                return \"transparent\";\n                            return chartData.noProgressDates.has(chartData.labels[i]) ? \"#FF6B6B\" : \"#6C8EFF\";\n                        }),\n                    },\n                    {\n                        label: \"Actual Progress\", data: chartData.actualProgressLine,\n                        borderColor: \"#50E3C2\", backgroundColor: \"rgba(80,227,194,0.08)\",\n                        fill: false, tension: 0.3, yAxisID: \"y\",\n                        spanGaps: false,\n                        pointRadius: chartData.actualProgressLine.map((v, i) => {\n                            if (v === null)\n                                return 0;\n                            return chartData.noProgressDates.has(chartData.labels[i]) ? 5 : 3;\n                        }),\n                        pointBackgroundColor: chartData.actualProgressLine.map((v, i) => {\n                            if (v === null)\n                                return \"transparent\";\n                            return chartData.noProgressDates.has(chartData.labels[i]) ? \"#FF6B6B\" : \"#50E3C2\";\n                        }),\n                    },\n                ],\n            },\n            options: {\n                responsive: true, maintainAspectRatio: false,\n                interaction: { mode: \"index\", intersect: false },\n                scales: {\n                    x: { grid: { color: grid }, ticks: { color: txt, maxTicksLimit: 15, maxRotation: 45, font: { size: 10 } } },\n                    y: { position: \"left\", title: { display: true, text: \"Progress (%)\", color: txt, font: { size: 12 } }, grid: { color: grid }, ticks: { color: txt, callback: (v) => v + \"%\" }, min: 0, max: leftMax },\n                    y1: { position: \"right\", title: { display: true, text: \"Cumulative MH (hours)\", color: txt, font: { size: 12 } }, grid: { display: false }, ticks: { color: txt }, min: 0, max: rightMax },\n                },\n                plugins: {\n                    legend: { labels: { color: txt, usePointStyle: true, font: { size: 11 } } },\n                    tooltip: {\n                        callbacks: {\n                            label: (ctx) => {\n                                const ds = ctx.dataset;\n                                const v = ctx.parsed.y;\n                                if (v === null || v === undefined)\n                                    return \"\";\n                                if (ds.label === \"Plan\") {\n                                    const mhVal = chartData.planMhLine[ctx.dataIndex] || 0;\n                                    return \"Plan: \" + fmtNum(mhVal) + \" MH / \" + v.toFixed(1) + \"%\";\n                                }\n                                if (ds.yAxisID === \"y1\")\n                                    return \"Actual MH: \" + fmtNum(v) + \" hours / \" + ((v / planMh) * 100).toFixed(1) + \"% of plan\";\n                                return \"Actual Progress: \" + v.toFixed(1) + \"%\";\n                            },\n                            afterBody: (items) => {\n                                const idx = items[0]?.dataIndex;\n                                if (idx === undefined)\n                                    return \"\";\n                                const lines = [];\n                                if (chartData.noProgressDates.has(chartData.labels[idx]))\n                                    lines.push(\"⚠️ No Progress Day\");\n                                return lines;\n                            },\n                        },\n                    },\n                },\n            },\n            plugins: [{\n                    id: \"planLine100\",\n                    afterDraw: (chart) => {\n                        const { ctx, scales } = chart;\n                        const y100 = scales.y.getPixelForValue(100);\n                        ctx.save();\n                        ctx.strokeStyle = isDark ? \"rgba(255,255,255,0.12)\" : \"rgba(0,0,0,0.15)\";\n                        ctx.lineWidth = 1;\n                        ctx.setLineDash([4, 4]);\n                        ctx.beginPath();\n                        ctx.moveTo(scales.x.left, y100);\n                        ctx.lineTo(scales.x.right, y100);\n                        ctx.stroke();\n                        ctx.fillStyle = isDark ? \"rgba(255,255,255,0.25)\" : \"rgba(0,0,0,0.35)\";\n                        ctx.font = \"10px Inter, sans-serif\";\n                        ctx.textAlign = \"left\";\n                        ctx.fillText(\"Progress 100% = \" + fmtNum(planMh) + \" MH\", scales.x.left + 4, y100 - 4);\n                        ctx.restore();\n                    },\n                }],\n        });\n    }, [chartData, summary]);\n    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"card\", style: { marginBottom: 20 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"form-group\", style: { marginBottom: 0, position: \"relative\", maxWidth: 500 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"label\", { children: \"Select Project\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"input\", { className: \"form-control\", placeholder: \"Search project no or name...\", value: sel ? (selJobObj ? selJobObj.job_no + \" — \" + selJobObj.job_name : sel) : jobSearch, onChange: e => { setJobSearch(e.target.value); setSel(\"\"); setShowDd(true); }, onFocus: () => setShowDd(true), onBlur: () => setTimeout(() => setShowDd(false), 200) }), showDd && !sel && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { position: \"absolute\", top: \"100%\", left: 0, right: 0, zIndex: 20, background: \"var(--color-surface)\", border: \"1px solid var(--color-border)\", borderRadius: \"var(--radius-sm)\", boxShadow: \"var(--shadow-md)\", maxHeight: 250, overflowY: \"auto\" }, children: [filteredJobs.length === 0 && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { padding: 12, fontSize: 12, color: \"var(--color-text-dim)\" }, children: \"No projects found.\" }), filteredJobs.map(j => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { padding: \"10px 12px\", cursor: \"pointer\", fontSize: 12, display: \"flex\", justifyContent: \"space-between\" }, onMouseDown: e => { e.preventDefault(); setSel(j.job_no); setJobSearch(\"\"); setShowDd(false); }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { fontWeight: 600 }, children: j.job_no }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { fontSize: 11, color: \"var(--color-text-dim)\" }, children: j.job_name })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { className: \"badge \" + ({ \"In Progress\": \"badge-inprogress\", \"Completed\": \"badge-completed\", \"Approved Plan\": \"badge-approved\", \"Drafting Plan\": \"badge-draft\", \"Pending Approval\": \"badge-pending\" }[j.status] || \"badge-draft\"), style: { fontSize: 9, alignSelf: \"center\" }, children: j.status })] }, j.job_no)))] })), sel && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { style: { position: \"absolute\", right: 8, top: 28, background: \"none\", border: \"none\", cursor: \"pointer\", fontSize: 14, color: \"var(--color-text-dim)\" }, onClick: () => { setSel(\"\"); setJobSearch(\"\"); }, children: \"\\u2715\" })] }) }), !sel && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"empty-state\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"empty-icon\", children: \"\\uD83D\\uDCCA\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"p\", { children: \"Select a project.\" })] }), sel && summary && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-grid\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", children: fmtNum(kpis.planMh) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"Plan MH\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", style: { color: \"var(--color-primary)\" }, children: fmtNum(kpis.totalActualMh) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"Actual MH\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-value\", style: { color: kpis.totalActualMh > kpis.planMh ? \"var(--color-danger)\" : \"var(--color-success)\" }, children: [kpis.planMh > 0 ? ((kpis.totalActualMh / kpis.planMh) * 100).toFixed(1) : 0, \"%\"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"MH Used\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-value\", style: { color: \"var(--color-accent)\" }, children: [kpis.totalProgress.toFixed(1), \"%\"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"Progress\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", style: { color: kpis.pdi >= 0.8 && kpis.pdi <= 1.2 ? \"var(--color-success)\" : \"var(--color-danger)\" }, children: kpis.pdi.toFixed(3) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"PDI\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", style: { color: kpis.pgi >= 0.8 && kpis.pgi <= 1.2 ? \"var(--color-success)\" : \"var(--color-danger)\" }, children: kpis.pgi.toFixed(3) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"PGI\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", children: kpis.workingDays }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"Working Days\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", style: { color: kpis.noProgressDays > 0 ? \"var(--color-warning)\" : \"var(--color-text-muted)\" }, children: kpis.noProgressDays }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"No Progress\" })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"card\", style: { marginBottom: 16, padding: \"12px 20px\" }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { display: \"flex\", gap: 24, fontSize: 12, color: \"var(--color-text-muted)\", flexWrap: \"wrap\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"span\", { children: [\"Plan: \", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"strong\", { style: { color: \"var(--color-text)\" }, children: fmtDate(summary.plan_start_date) }), \" \\u2192 \", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"strong\", { style: { color: \"var(--color-text)\" }, children: fmtDate(summary.plan_end_date) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"span\", { children: [\"Duration: \", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"strong\", { style: { color: \"var(--color-text)\" }, children: [summary.project_duration, \" days\"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"span\", { children: [\"Progress 100% = \", fmtNum(summary.total_manhour), \" MH\"] })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", style: { marginBottom: 16 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card-header\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"h2\", { children: \"Efficiency Chart\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { display: \"flex\", gap: 12, fontSize: 11, color: \"var(--color-text-dim)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { color: \"#8B90A5\" }, children: \"--- Plan\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { color: \"#6C8EFF\" }, children: \"\\u2501 MH\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { color: \"#50E3C2\" }, children: \"\\u2501 Progress\" })] })] }), chartData ? (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { height: 400 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"canvas\", { ref: chartRef }) }) : (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"empty-state\", style: { padding: 32 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"p\", { children: \"Set plan dates first.\" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { padding: \"8px 16px\", fontSize: 11, color: \"var(--color-text-dim)\" }, children: [\"Left axis = Progress (%). Right axis = MH (hours). Plan line: \", fmtNum(summary.total_manhour), \" MH = 100%.\"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", style: { marginBottom: 16 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"card-header\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"h2\", { children: \"PDI & PGI Calculation\" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"table-wrapper\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"table\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"thead\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Index\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Formula\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Current Value\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Interpretation\" })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tbody\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontWeight: 600 }, children: \"PDI\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"td\", { style: { fontSize: 12 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { children: \"(Actual Progress / 100) / (Actual MH / Plan MH)\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { fontFamily: \"var(--font-mono)\", fontSize: 11, color: \"var(--color-text-dim)\", marginTop: 2 }, children: [\"= (\", kpis.totalProgress.toFixed(1), \" / 100) / (\", fmtNum(kpis.totalActualMh), \" / \", fmtNum(kpis.planMh), \")\"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { fontFamily: \"var(--font-mono)\", fontSize: 11, color: \"var(--color-text-dim)\" }, children: [\"= \", (kpis.totalProgress / 100).toFixed(3), \" / \", kpis.planMh > 0 ? (kpis.totalActualMh / kpis.planMh).toFixed(3) : \"0\"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontFamily: \"var(--font-mono)\", fontWeight: 700, fontSize: 16, color: kpis.pdi >= 0.8 && kpis.pdi <= 1.2 ? \"var(--color-success)\" : \"var(--color-danger)\" }, children: kpis.pdi.toFixed(3) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"td\", { style: { fontSize: 12 }, children: [kpis.pdi >= 1.0 ? \"✅ Efficient\" : kpis.pdi >= 0.8 ? \"⚠️ Slightly inefficient\" : \"🔴 Inefficient\", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { fontSize: 10, color: \"var(--color-text-dim)\", marginTop: 2 }, children: \"1.0 = as planned, >1.0 = more efficient, <1.0 = less efficient\" })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontWeight: 600 }, children: \"PGI\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"td\", { style: { fontSize: 12 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { children: \"Actual Progress / Planned Progress\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { fontFamily: \"var(--font-mono)\", fontSize: 11, color: \"var(--color-text-dim)\", marginTop: 2 }, children: [\"= \", kpis.totalProgress.toFixed(1), \"% / \", kpis.plannedProgressNow.toFixed(1), \"%\"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontFamily: \"var(--font-mono)\", fontWeight: 700, fontSize: 16, color: kpis.pgi >= 0.8 && kpis.pgi <= 1.2 ? \"var(--color-success)\" : \"var(--color-danger)\" }, children: kpis.pgi.toFixed(3) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"td\", { style: { fontSize: 12 }, children: [kpis.pgi >= 1.0 ? \"✅ Ahead of schedule\" : kpis.pgi >= 0.8 ? \"⚠️ Slightly behind\" : \"🔴 Behind schedule\", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { fontSize: 10, color: \"var(--color-text-dim)\", marginTop: 2 }, children: \"1.0 = on plan, >1.0 = ahead, <1.0 = behind\" })] })] })] })] }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"card-header\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"h2\", { children: \"Daily Detail\" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"table-wrapper\", style: { maxHeight: 300, overflowY: \"auto\" }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"table\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"thead\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Date\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Status\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\" }, children: \"POB\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\" }, children: \"Wrench Time (%)\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\" }, children: \"Actual MH (HR)\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\" }, children: \"Plan MH (HR)\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\" }, children: \"Actual Progress (%)\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\" }, children: \"Plan Progress (%)\" })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"tbody\", { children: reports.map((r, i) => {\n                                                const cumMh = reports.slice(0, i + 1).reduce((s, x) => s + (x.actual_manhour || 0), 0);\n                                                const isNP = r.status === \"No Progress\";\n                                                const dateIdx = chartData ? chartData.labels.indexOf(r.progress_date) : -1;\n                                                const plannedMhAtDate = chartData && dateIdx >= 0 ? chartData.planMhLine[dateIdx] : 0;\n                                                const plannedPctAtDate = chartData && dateIdx >= 0 ? chartData.planPctLine[dateIdx] : 0;\n                                                return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { style: isNP ? { background: \"rgba(255,107,107,0.06)\" } : {}, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontFamily: \"var(--font-mono)\" }, children: fmtDate(r.progress_date) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { children: isNP ? (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { className: \"badge badge-pending\", style: { fontSize: 10 }, children: \"NP\" }) : (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { className: \"badge badge-active\", style: { fontSize: 10 }, children: \"Work\" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"right\" }, children: r.actual_pob }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\" }, children: [(r.wrench_time_daily || 0).toFixed(1), \"%\"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", fontWeight: 600 }, children: cumMh.toFixed(0) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", color: \"var(--color-text-muted)\" }, children: plannedMhAtDate.toFixed(0) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", fontWeight: 600, color: r.progress_total > plannedPctAtDate ? \"var(--color-success)\" : r.progress_total < plannedPctAtDate ? \"var(--color-danger)\" : \"var(--color-text)\" }, children: [r.progress_total, \"%\"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", color: \"var(--color-text-muted)\" }, children: [plannedPctAtDate.toFixed(1), \"%\"] })] }, i));\n                                            }) })] }) })] })] }))] }));\n};\nconst root = document.getElementById(\"react-root\");\nif (root)\n    (0,react_dom_client__WEBPACK_IMPORTED_MODULE_2__.createRoot)(root).render((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(EfficiencyDashboard, {}));\n\n\n//# sourceURL=webpack://pace-frontend/./islands/dashboard-1/index.tsx?\n}");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"dashboard-1": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkpace_frontend"] = self["webpackChunkpace_frontend"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendor"], () => (__webpack_require__("./islands/dashboard-1/index.tsx")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;