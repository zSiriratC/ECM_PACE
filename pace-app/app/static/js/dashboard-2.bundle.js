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

/***/ "./islands/dashboard-2/index.tsx"
/*!***************************************!*\
  !*** ./islands/dashboard-2/index.tsx ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ \"./node_modules/react/jsx-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-dom/client */ \"./node_modules/react-dom/client.js\");\n/* harmony import */ var chart_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! chart.js */ \"./node_modules/chart.js/dist/chart.js\");\n\n\n\n\nchart_js__WEBPACK_IMPORTED_MODULE_3__.Chart.register(...chart_js__WEBPACK_IMPORTED_MODULE_3__.registerables);\nconst apiH = () => ({ \"Content-Type\": \"application/json\" });\nconst api = async (url) => { const r = await fetch(url, { headers: apiH() }); return r.json(); };\nconst PdiVsPgiPage = () => {\n    const [jobs, setJobs] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [wpMappings, setWpMappings] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [jobTypes, setJobTypes] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [companies, setCompanies] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [fAsset, setFAsset] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fPlatform, setFPlatform] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fJobType, setFJobType] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fSub1, setFSub1] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fSub2, setFSub2] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fCompany, setFCompany] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [scatterData, setScatterData] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const chartRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    const chartInst = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {\n        api(\"/api/planning/jobs\").then(setJobs);\n        api(\"/api/master-data/working-platform-mappings\").then(setWpMappings);\n        api(\"/api/master-data/job-types\").then(setJobTypes);\n        api(\"/api/master-data/companies\").then(setCompanies);\n    }, []);\n    const activeWp = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => (wpMappings || []).filter(m => m.status === \"Active\"), [wpMappings]);\n    const uniqueAssets = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(activeWp.map(m => m.asset))].sort(), [activeWp]);\n    const uniquePlatforms = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(activeWp.filter(m => !fAsset || m.asset === fAsset).map(m => m.working_platform))].sort(), [activeWp, fAsset]);\n    const ajt = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => (jobTypes || []).filter(j => j.status === \"Active\"), [jobTypes]);\n    const uniqueL1 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(ajt.map(j => j.description_l1).filter(Boolean))].sort(), [ajt]);\n    const uniqueL2 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(ajt.filter(j => !fJobType || j.description_l1 === fJobType).map(j => j.description_l2).filter(Boolean))].sort(), [ajt, fJobType]);\n    const uniqueL3 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(ajt.filter(j => (!fJobType || j.description_l1 === fJobType) && (!fSub1 || j.description_l2 === fSub1)).map(j => j.description_l3).filter(Boolean))].sort(), [ajt, fJobType, fSub1]);\n    const activeCompanies = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => (companies || []).filter(c => c.status === \"Active\").map(c => c.name).sort(), [companies]);\n    const hasFilters = fAsset || fPlatform || fJobType || fSub1 || fSub2 || fCompany;\n    const clearFilters = () => { setFAsset(\"\"); setFPlatform(\"\"); setFJobType(\"\"); setFSub1(\"\"); setFSub2(\"\"); setFCompany(\"\"); };\n    const activeJobs = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {\n        return jobs.filter(j => {\n            // Show all projects that have been started (exclude Drafting Plan and Pending Approval)\n            if (j.status === \"Drafting Plan\" || j.status === \"Pending Approval\")\n                return false;\n            if (fAsset && j.location !== fAsset)\n                return false;\n            if (fPlatform && j.working_platform !== fPlatform)\n                return false;\n            if (fJobType && j.job_type !== fJobType)\n                return false;\n            if (fSub1 && j.sub_type !== fSub1)\n                return false;\n            if (fSub2 && j.discipline !== fSub2)\n                return false;\n            if (fCompany && j.asset !== fCompany)\n                return false;\n            return true;\n        });\n    }, [jobs, fAsset, fPlatform, fJobType, fSub1, fSub2, fCompany]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {\n        const compute = async () => {\n            setLoading(true);\n            const results = [];\n            for (const job of activeJobs) {\n                try {\n                    const [reports, sum] = await Promise.all([\n                        api(\"/api/daily-report/project/progress?project_no=\" + job.job_no),\n                        api(\"/api/planning/plan-summary?job_no=\" + job.job_no),\n                    ]);\n                    if (!sum || !sum.id || reports.length === 0)\n                        continue;\n                    const sorted = reports.sort((a, b) => a.progress_date.localeCompare(b.progress_date));\n                    const n = sorted.length;\n                    const actualProgress = sorted[n - 1].progress_total || 0;\n                    const actualMh = sorted.reduce((s, r) => s + (r.actual_manhour || 0), 0);\n                    const planMh = sum.total_manhour || 1;\n                    const planDuration = sum.project_duration || n;\n                    const workingDays = sorted.filter((r) => r.status !== \"No Progress\").length;\n                    const plannedProgressAtDay = (workingDays / planDuration) * 100;\n                    const pgi = plannedProgressAtDay > 0 ? actualProgress / plannedProgressAtDay : 0;\n                    const pdi = (actualMh > 0 && planMh > 0) ? (actualProgress / 100) / (actualMh / planMh) : 0;\n                    results.push({ job_no: job.job_no, job_name: job.job_name, pdi, pgi });\n                }\n                catch { }\n            }\n            setScatterData(results);\n            setLoading(false);\n        };\n        if (activeJobs.length > 0)\n            compute();\n        else {\n            setScatterData([]);\n            setLoading(false);\n        }\n    }, [activeJobs]);\n    const axisRange = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {\n        if (scatterData.length === 0)\n            return { minX: -0.2, maxX: 2.2, minY: -0.2, maxY: 2.2 };\n        const allPdi = scatterData.map(d => d.pdi);\n        const allPgi = scatterData.map(d => d.pgi);\n        const padX = Math.max((Math.max(...allPdi) - Math.min(...allPdi)) * 0.3, 0.4);\n        const padY = Math.max((Math.max(...allPgi) - Math.min(...allPgi)) * 0.3, 0.4);\n        return {\n            minX: Math.floor(Math.min(Math.min(...allPdi) - padX, 0) * 10) / 10,\n            maxX: Math.ceil(Math.max(Math.max(...allPdi) + padX, 1.5) * 10) / 10,\n            minY: Math.floor(Math.min(Math.min(...allPgi) - padY, 0) * 10) / 10,\n            maxY: Math.ceil(Math.max(Math.max(...allPgi) + padY, 1.5) * 10) / 10,\n        };\n    }, [scatterData]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {\n        if (!chartRef.current)\n            return;\n        if (chartInst.current)\n            chartInst.current.destroy();\n        const isDark = document.documentElement.getAttribute(\"data-theme\") !== \"light\";\n        const grid = isDark ? \"rgba(255,255,255,0.06)\" : \"rgba(0,0,0,0.06)\";\n        const txt = isDark ? \"#8B90A5\" : \"#5F6577\";\n        const points = scatterData.map(d => ({ x: d.pdi, y: d.pgi }));\n        const bgColors = scatterData.map(d => (d.pdi >= 0.8 && d.pdi <= 1.2 && d.pgi >= 0.8 && d.pgi <= 1.2) ? \"#4ADE80\" : \"#FF6B6B\");\n        const bdColors = scatterData.map(d => (d.pdi >= 0.8 && d.pdi <= 1.2 && d.pgi >= 0.8 && d.pgi <= 1.2) ? \"#34B86A\" : \"#E05252\");\n        chartInst.current = new chart_js__WEBPACK_IMPORTED_MODULE_3__.Chart(chartRef.current, {\n            type: \"scatter\",\n            data: {\n                datasets: [{\n                        label: \"Jobs\",\n                        data: points,\n                        backgroundColor: bgColors,\n                        borderColor: bdColors,\n                        borderWidth: 2,\n                        pointRadius: 10,\n                        pointHoverRadius: 14,\n                    }],\n            },\n            options: {\n                responsive: true,\n                maintainAspectRatio: false,\n                scales: {\n                    x: {\n                        title: { display: true, text: \"PDI (Productivity Index)\", color: txt, font: { size: 13, weight: \"bold\" } },\n                        grid: { color: grid }, ticks: { color: txt, stepSize: 0.2 },\n                        min: axisRange.minX, max: axisRange.maxX,\n                    },\n                    y: {\n                        title: { display: true, text: \"PGI (Progress Index)\", color: txt, font: { size: 13, weight: \"bold\" } },\n                        grid: { color: grid }, ticks: { color: txt, stepSize: 0.2 },\n                        min: axisRange.minY, max: axisRange.maxY,\n                    },\n                },\n                plugins: {\n                    legend: { display: false },\n                    tooltip: {\n                        backgroundColor: isDark ? \"#1C2030\" : \"#FFFFFF\",\n                        titleColor: isDark ? \"#E8EAF0\" : \"#1A1D26\",\n                        bodyColor: isDark ? \"#8B90A5\" : \"#5F6577\",\n                        borderColor: isDark ? \"#2A2E3F\" : \"#D8DAE0\",\n                        borderWidth: 1, padding: 12,\n                        callbacks: {\n                            title: (items) => { const d = scatterData[items[0]?.dataIndex]; return d ? d.job_no : \"\"; },\n                            label: (ctx) => { const d = scatterData[ctx.dataIndex]; return d ? d.job_name : \"\"; },\n                            afterLabel: (ctx) => {\n                                const d = scatterData[ctx.dataIndex];\n                                if (!d)\n                                    return \"\";\n                                const ok = d.pdi >= 0.8 && d.pdi <= 1.2 && d.pgi >= 0.8 && d.pgi <= 1.2;\n                                return [\"PDI: \" + d.pdi.toFixed(3), \"PGI: \" + d.pgi.toFixed(3), ok ? \"✅ Healthy\" : \"⚠️ Attention\"];\n                            },\n                        },\n                    },\n                },\n            },\n            plugins: [\n                {\n                    id: \"quadrants\",\n                    beforeDraw: (chart) => {\n                        const { ctx, scales } = chart;\n                        const xS = scales.x;\n                        const yS = scales.y;\n                        const cx = xS.getPixelForValue(1);\n                        const cy = yS.getPixelForValue(1);\n                        ctx.save();\n                        // Quadrant backgrounds\n                        ctx.fillStyle = isDark ? \"rgba(74,222,128,0.04)\" : \"rgba(74,222,128,0.06)\";\n                        ctx.fillRect(cx, yS.top, xS.right - cx, cy - yS.top);\n                        ctx.fillStyle = isDark ? \"rgba(255,184,77,0.04)\" : \"rgba(255,184,77,0.05)\";\n                        ctx.fillRect(xS.left, yS.top, cx - xS.left, cy - yS.top);\n                        ctx.fillStyle = isDark ? \"rgba(255,107,107,0.04)\" : \"rgba(255,107,107,0.05)\";\n                        ctx.fillRect(xS.left, cy, cx - xS.left, yS.bottom - cy);\n                        ctx.fillStyle = isDark ? \"rgba(108,142,255,0.04)\" : \"rgba(108,142,255,0.05)\";\n                        ctx.fillRect(cx, cy, xS.right - cx, yS.bottom - cy);\n                        // Green zone\n                        const gx1 = xS.getPixelForValue(0.8);\n                        const gx2 = xS.getPixelForValue(1.2);\n                        const gy1 = yS.getPixelForValue(1.2);\n                        const gy2 = yS.getPixelForValue(0.8);\n                        ctx.fillStyle = isDark ? \"rgba(74,222,128,0.06)\" : \"rgba(74,222,128,0.1)\";\n                        ctx.fillRect(gx1, gy1, gx2 - gx1, gy2 - gy1);\n                        ctx.strokeStyle = isDark ? \"rgba(74,222,128,0.25)\" : \"rgba(74,222,128,0.35)\";\n                        ctx.lineWidth = 1.5;\n                        ctx.setLineDash([5, 5]);\n                        ctx.strokeRect(gx1, gy1, gx2 - gx1, gy2 - gy1);\n                        // Crosshair\n                        ctx.strokeStyle = isDark ? \"rgba(255,255,255,0.15)\" : \"rgba(0,0,0,0.1)\";\n                        ctx.lineWidth = 1.5;\n                        ctx.setLineDash([]);\n                        ctx.beginPath();\n                        ctx.moveTo(cx, yS.top);\n                        ctx.lineTo(cx, yS.bottom);\n                        ctx.stroke();\n                        ctx.beginPath();\n                        ctx.moveTo(xS.left, cy);\n                        ctx.lineTo(xS.right, cy);\n                        ctx.stroke();\n                        // Quadrant labels\n                        const la = isDark ? 0.35 : 0.25;\n                        ctx.font = \"bold 13px Inter, sans-serif\";\n                        ctx.textAlign = \"center\";\n                        ctx.fillStyle = \"rgba(74,222,128,\" + la + \")\";\n                        ctx.fillText(\"EFFICIENT\", (cx + xS.right) / 2, (yS.top + cy) / 2 - 10);\n                        ctx.font = \"11px Inter, sans-serif\";\n                        ctx.fillText(\"& AHEAD (Best)\", (cx + xS.right) / 2, (yS.top + cy) / 2 + 8);\n                        ctx.font = \"bold 13px Inter, sans-serif\";\n                        ctx.fillStyle = \"rgba(255,184,77,\" + la + \")\";\n                        ctx.fillText(\"INEFFICIENT\", (xS.left + cx) / 2, (yS.top + cy) / 2 - 10);\n                        ctx.font = \"11px Inter, sans-serif\";\n                        ctx.fillText(\"but AHEAD (Watch MH)\", (xS.left + cx) / 2, (yS.top + cy) / 2 + 8);\n                        ctx.font = \"bold 13px Inter, sans-serif\";\n                        ctx.fillStyle = \"rgba(255,107,107,\" + la + \")\";\n                        ctx.fillText(\"INEFFICIENT\", (xS.left + cx) / 2, (cy + yS.bottom) / 2 - 10);\n                        ctx.font = \"11px Inter, sans-serif\";\n                        ctx.fillText(\"& BEHIND (Worst)\", (xS.left + cx) / 2, (cy + yS.bottom) / 2 + 8);\n                        ctx.font = \"bold 13px Inter, sans-serif\";\n                        ctx.fillStyle = \"rgba(108,142,255,\" + la + \")\";\n                        ctx.fillText(\"EFFICIENT\", (cx + xS.right) / 2, (cy + yS.bottom) / 2 - 10);\n                        ctx.font = \"11px Inter, sans-serif\";\n                        ctx.fillText(\"but BEHIND (Watch Schedule)\", (cx + xS.right) / 2, (cy + yS.bottom) / 2 + 8);\n                        // Axis labels\n                        ctx.font = \"bold 10px Inter, sans-serif\";\n                        ctx.fillStyle = isDark ? \"rgba(255,255,255,0.3)\" : \"rgba(0,0,0,0.2)\";\n                        ctx.textAlign = \"left\";\n                        ctx.fillText(\"PDI = 1.0\", cx + 4, yS.bottom - 4);\n                        ctx.textAlign = \"right\";\n                        ctx.fillText(\"PGI = 1.0\", xS.right - 4, cy - 4);\n                        ctx.font = \"9px Inter, sans-serif\";\n                        ctx.fillStyle = isDark ? \"rgba(74,222,128,0.4)\" : \"rgba(34,184,106,0.5)\";\n                        ctx.textAlign = \"center\";\n                        ctx.fillText(\"Healthy Zone (0.8–1.2)\", (gx1 + gx2) / 2, gy2 + 12);\n                        ctx.restore();\n                    },\n                },\n                {\n                    id: \"jobLabels\",\n                    afterDraw: (chart) => {\n                        const { ctx } = chart;\n                        ctx.save();\n                        ctx.font = \"bold 9px Inter, sans-serif\";\n                        ctx.textAlign = \"center\";\n                        const meta = chart.getDatasetMeta(0);\n                        meta.data.forEach((pt, idx) => {\n                            const d = scatterData[idx];\n                            if (!d)\n                                return;\n                            ctx.fillStyle = (d.pdi >= 0.8 && d.pdi <= 1.2 && d.pgi >= 0.8 && d.pgi <= 1.2) ? \"#34B86A\" : \"#E05252\";\n                            ctx.fillText(d.job_no, pt.x, pt.y - 14);\n                        });\n                        ctx.restore();\n                    },\n                },\n            ],\n        });\n    }, [scatterData, axisRange]);\n    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", style: { padding: \"12px 16px\", marginBottom: 20 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { display: \"flex\", gap: 8, flexWrap: \"wrap\", alignItems: \"flex-end\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fAsset, onChange: e => { setFAsset(e.target.value); setFPlatform(\"\"); }, style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Assets\" }), uniqueAssets.map(a => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: a, children: a }, a))] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fPlatform, onChange: e => setFPlatform(e.target.value), style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Platforms\" }), uniquePlatforms.map(p => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: p, children: p }, p))] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fCompany, onChange: e => setFCompany(e.target.value), style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Companies\" }), activeCompanies.map(c => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: c, children: c }, c))] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fJobType, onChange: e => { setFJobType(e.target.value); setFSub1(\"\"); setFSub2(\"\"); }, style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Job Types\" }), uniqueL1.map(l => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: l, children: l }, l))] }) }), fJobType && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fSub1, onChange: e => { setFSub1(e.target.value); setFSub2(\"\"); }, style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Sub 1\" }), uniqueL2.map(l => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: l, children: l }, l))] }) }), fSub1 && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fSub2, onChange: e => setFSub2(e.target.value), style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Sub 2\" }), uniqueL3.map(l => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: l, children: l }, l))] }) }), hasFilters && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"btn btn-secondary btn-sm\", onClick: clearFilters, style: { height: 34 }, children: \"Clear\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { fontSize: 11, color: \"var(--color-text-dim)\", marginTop: 8, fontFamily: \"var(--font-family)\" }, children: [scatterData.length, \" active job(s)\", hasFilters && \" (filtered)\"] })] }), loading && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"empty-state\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"p\", { children: \"Computing...\" }) }), !loading && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", style: { marginBottom: 16 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card-header\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"h2\", { children: \"PDI vs PGI \\u2014 All Active Jobs\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { fontSize: 11, color: \"var(--color-text-dim)\" }, children: [scatterData.length, \" job(s)\"] })] }), scatterData.length === 0 ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"empty-state\", style: { padding: 32 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"empty-icon\", children: \"\\uD83D\\uDCC8\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"p\", { children: \"No active jobs with data.\" })] })) : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { height: 520 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"canvas\", { ref: chartRef }) })), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { display: \"flex\", gap: 16, justifyContent: \"center\", fontSize: 11, color: \"var(--color-text-dim)\", marginTop: 12, flexWrap: \"wrap\", padding: \"0 16px 12px\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"span\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { display: \"inline-block\", width: 10, height: 10, borderRadius: \"50%\", background: \"#4ADE80\", marginRight: 4 } }), \"Healthy (0.8\\u20131.2)\"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"span\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { display: \"inline-block\", width: 10, height: 10, borderRadius: \"50%\", background: \"#FF6B6B\", marginRight: 4 } }), \"Attention\"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"span\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { display: \"inline-block\", width: 20, height: 10, background: \"rgba(74,222,128,0.15)\", border: \"1px dashed rgba(74,222,128,0.4)\", marginRight: 4 } }), \"Green Zone\"] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", style: { marginBottom: 16 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"card-header\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"h2\", { children: \"How to Read This Chart\" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { padding: \"12px 16px\", fontSize: 12, lineHeight: 1.8 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { display: \"grid\", gridTemplateColumns: \"1fr 1fr\", gap: 16 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { fontWeight: 700, color: \"var(--color-warning)\", marginBottom: 4 }, children: \"\\u2196 Top-Left: INEFFICIENT but AHEAD\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { color: \"var(--color-text-muted)\" }, children: \"PDI < 1, PGI > 1. Ahead but using too much MH.\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { fontWeight: 700, color: \"var(--color-success)\", marginBottom: 4 }, children: \"\\u2197 Top-Right: EFFICIENT & AHEAD\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { color: \"var(--color-text-muted)\" }, children: \"PDI > 1, PGI > 1. Best. Less MH and ahead of schedule.\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { fontWeight: 700, color: \"var(--color-danger)\", marginBottom: 4 }, children: \"\\u2199 Bottom-Left: INEFFICIENT & BEHIND\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { color: \"var(--color-text-muted)\" }, children: \"PDI < 1, PGI < 1. Worst. Behind and overspending MH.\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { fontWeight: 700, color: \"var(--color-primary)\", marginBottom: 4 }, children: \"\\u2198 Bottom-Right: EFFICIENT but BEHIND\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { color: \"var(--color-text-muted)\" }, children: \"PDI > 1, PGI < 1. Efficient but behind. Need more resources.\" })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { marginTop: 12, padding: \"8px 12px\", background: \"var(--color-surface-2)\", borderRadius: 6, fontSize: 11 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"strong\", { children: \"PGI\" }), \" = Actual Progress / Planned Progress \\u2192 Schedule\", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"br\", {}), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"strong\", { children: \"PDI\" }), \" = (Actual Progress / 100) / (Actual MH / Plan MH) \\u2192 Productivity\", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"br\", {}), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"strong\", { children: \"Healthy\" }), \" = 0.8 to 1.2 for both\"] })] })] }), scatterData.length > 0 && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"card-header\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"h2\", { children: \"Job Summary\" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"table-wrapper\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"table\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"thead\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Job No\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Name\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\" }, children: \"PDI\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\" }, children: \"PGI\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Quadrant\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Status\" })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"tbody\", { children: scatterData.sort((a, b) => {\n                                                const aOk = a.pdi >= 0.8 && a.pdi <= 1.2 && a.pgi >= 0.8 && a.pgi <= 1.2;\n                                                const bOk = b.pdi >= 0.8 && b.pdi <= 1.2 && b.pgi >= 0.8 && b.pgi <= 1.2;\n                                                if (aOk === bOk)\n                                                    return a.job_no.localeCompare(b.job_no);\n                                                return aOk ? 1 : -1;\n                                            }).map(d => {\n                                                const pdiOk = d.pdi >= 0.8 && d.pdi <= 1.2;\n                                                const pgiOk = d.pgi >= 0.8 && d.pgi <= 1.2;\n                                                let quadrant = \"\";\n                                                let qColor = \"\";\n                                                if (d.pdi >= 1 && d.pgi >= 1) {\n                                                    quadrant = \"Efficient & Ahead\";\n                                                    qColor = \"var(--color-success)\";\n                                                }\n                                                else if (d.pdi < 1 && d.pgi >= 1) {\n                                                    quadrant = \"Inefficient but Ahead\";\n                                                    qColor = \"var(--color-warning)\";\n                                                }\n                                                else if (d.pdi < 1 && d.pgi < 1) {\n                                                    quadrant = \"Inefficient & Behind\";\n                                                    qColor = \"var(--color-danger)\";\n                                                }\n                                                else {\n                                                    quadrant = \"Efficient but Behind\";\n                                                    qColor = \"var(--color-primary)\";\n                                                }\n                                                return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontFamily: \"var(--font-mono)\" }, children: d.job_no }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { children: d.job_name }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", fontWeight: 600, color: pdiOk ? \"var(--color-success)\" : \"var(--color-danger)\" }, children: d.pdi.toFixed(3) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", fontWeight: 600, color: pgiOk ? \"var(--color-success)\" : \"var(--color-danger)\" }, children: d.pgi.toFixed(3) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontSize: 12, color: qColor, fontWeight: 600 }, children: quadrant }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { children: pdiOk && pgiOk ? (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { className: \"badge badge-active\", children: \"\\u2705 Healthy\" }) : (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { className: \"badge badge-inactive\", children: \"\\u26A0\\uFE0F Attention\" }) })] }, d.job_no));\n                                            }) })] }) })] }))] }))] }));\n};\nconst root = document.getElementById(\"react-root\");\nif (root)\n    (0,react_dom_client__WEBPACK_IMPORTED_MODULE_2__.createRoot)(root).render((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(PdiVsPgiPage, {}));\n\n\n//# sourceURL=webpack://pace-frontend/./islands/dashboard-2/index.tsx?\n}");

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
/******/ 			"dashboard-2": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendor"], () => (__webpack_require__("./islands/dashboard-2/index.tsx")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;