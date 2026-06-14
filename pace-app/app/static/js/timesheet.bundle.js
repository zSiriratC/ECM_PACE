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

/***/ "./islands/timesheet/index.tsx"
/*!*************************************!*\
  !*** ./islands/timesheet/index.tsx ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ \"./node_modules/react/jsx-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-dom/client */ \"./node_modules/react-dom/client.js\");\n\n\n\nconst apiH = () => ({ \"Content-Type\": \"application/json\", \"X-User-Role\": localStorage.getItem(\"pace-role\") || \"administrator\" });\nconst api = async (url) => { const r = await fetch(url, { headers: apiH() }); return r.json(); };\nfunction getMonthOptions() {\n    const opts = [];\n    const now = new Date();\n    for (let i = 11; i >= 0; i--) {\n        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);\n        const val = d.getFullYear() + \"-\" + String(d.getMonth() + 1).padStart(2, \"0\");\n        const M = [\"Jan\", \"Feb\", \"Mar\", \"Apr\", \"May\", \"Jun\", \"Jul\", \"Aug\", \"Sep\", \"Oct\", \"Nov\", \"Dec\"];\n        opts.push({ value: val, label: M[d.getMonth()] + \" \" + d.getFullYear() });\n    }\n    return opts.reverse();\n}\nfunction getDaysInMonth(ym) {\n    if (!ym)\n        return [];\n    const [y, m] = ym.split(\"-\").map(Number);\n    const days = [];\n    const d = new Date(y, m - 1, 1);\n    while (d.getMonth() === m - 1) {\n        const dd = String(d.getDate()).padStart(2, \"0\");\n        const mm = String(d.getMonth() + 1).padStart(2, \"0\");\n        days.push(d.getFullYear() + \"-\" + mm + \"-\" + dd);\n        d.setDate(d.getDate() + 1);\n    }\n    return days;\n}\nfunction fmtDay(date) {\n    return String(parseInt(date.split(\"-\")[2]));\n}\nconst TimesheetPage = () => {\n    const [jobs, setJobs] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [wpMappings, setWpMappings] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [jobTypes, setJobTypes] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [companies, setCompanies] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [tab, setTab] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"manpower\");\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [fMonth, setFMonth] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(() => {\n        const now = new Date();\n        return now.getFullYear() + \"-\" + String(now.getMonth() + 1).padStart(2, \"0\");\n    });\n    const [fAsset, setFAsset] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fPlatform, setFPlatform] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fCompany, setFCompany] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fJobType, setFJobType] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fSub1, setFSub1] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [fSub2, setFSub2] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [pivotMp, setPivotMp] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [pivotEq, setPivotEq] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [datesInMonth, setDatesInMonth] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {\n        api(\"/api/planning/jobs\").then(setJobs);\n        api(\"/api/master-data/working-platform-mappings\").then(setWpMappings);\n        api(\"/api/master-data/job-types\").then(setJobTypes);\n        api(\"/api/master-data/companies\").then(setCompanies);\n    }, []);\n    const activeWp = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => (wpMappings || []).filter(m => m.status === \"Active\"), [wpMappings]);\n    const uniqueAssets = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(activeWp.map(m => m.asset))].sort(), [activeWp]);\n    const uniquePlatforms = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(activeWp.filter(m => !fAsset || m.asset === fAsset).map(m => m.working_platform))].sort(), [activeWp, fAsset]);\n    const ajt = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => (jobTypes || []).filter(j => j.status === \"Active\"), [jobTypes]);\n    const uniqueL1 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(ajt.map(j => j.description_l1).filter(Boolean))].sort(), [ajt]);\n    const uniqueL2 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(ajt.filter(j => !fJobType || j.description_l1 === fJobType).map(j => j.description_l2).filter(Boolean))].sort(), [ajt, fJobType]);\n    const uniqueL3 = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => [...new Set(ajt.filter(j => (!fJobType || j.description_l1 === fJobType) && (!fSub1 || j.description_l2 === fSub1)).map(j => j.description_l3).filter(Boolean))].sort(), [ajt, fJobType, fSub1]);\n    const activeCompanies = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => (companies || []).filter(c => c.status === \"Active\").map(c => c.name).sort(), [companies]);\n    const monthOpts = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => getMonthOptions(), []);\n    const hasFilters = fAsset || fPlatform || fCompany || fJobType || fSub1 || fSub2;\n    const clearFilters = () => { setFAsset(\"\"); setFPlatform(\"\"); setFCompany(\"\"); setFJobType(\"\"); setFSub1(\"\"); setFSub2(\"\"); };\n    const filteredJobs = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {\n        return jobs.filter(j => {\n            if (fAsset && j.location !== fAsset)\n                return false;\n            if (fPlatform && j.working_platform !== fPlatform)\n                return false;\n            if (fCompany && j.asset !== fCompany)\n                return false;\n            if (fJobType && j.job_type !== fJobType)\n                return false;\n            if (fSub1 && j.sub_type !== fSub1)\n                return false;\n            if (fSub2 && j.discipline !== fSub2)\n                return false;\n            return true;\n        });\n    }, [jobs, fAsset, fPlatform, fCompany, fJobType, fSub1, fSub2]);\n    const loadData = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {\n        if (!fMonth || filteredJobs.length === 0) {\n            setPivotMp([]);\n            setPivotEq([]);\n            setDatesInMonth([]);\n            return;\n        }\n        setLoading(true);\n        const days = getDaysInMonth(fMonth);\n        setDatesInMonth(days);\n        const monthStart = days[0];\n        const monthEnd = days[days.length - 1];\n        const mpMap = new Map();\n        const eqMap = new Map();\n        for (const job of filteredJobs) {\n            try {\n                const reports = await api(\"/api/daily-report/project/progress?project_no=\" + job.job_no);\n                const monthReports = reports.filter(r => r.progress_date >= monthStart && r.progress_date <= monthEnd && r.status !== \"No Progress\");\n                if (monthReports.length > 0) {\n                    const mpRows = await api(\"/api/daily-report/project/manpower?project_no=\" + job.job_no).catch(() => []);\n                    const eqRows = await api(\"/api/daily-report/project/equipment?project_no=\" + job.job_no).catch(() => []);\n                    const mpTotal = mpRows.reduce((s, r) => s + (r.total || 0), 0);\n                    const eqTotal = eqRows.reduce((s, r) => s + (r.total || 0), 0);\n                    for (const report of monthReports) {\n                        const date = report.progress_date;\n                        const dayMh = report.actual_manhour || 0;\n                        const dayEqMh = report.pdi_project || 0;\n                        // Distribute day's MH proportionally across manpower\n                        for (const mp of mpRows) {\n                            const key = mp.contractor_name + \"|\" + mp.contractor_position + \"|\" + mp.contractor_company;\n                            if (!mpMap.has(key))\n                                mpMap.set(key, {});\n                            const daily = mpMap.get(key);\n                            const ratio = mpTotal > 0 ? (mp.total || 0) / mpTotal : 0;\n                            const val = Math.round(dayMh * ratio * 10) / 10;\n                            daily[date] = (daily[date] || 0) + val;\n                        }\n                        // Distribute day's equipment MH proportionally\n                        for (const eq of eqRows) {\n                            const key = eq.equipment_name + \"|\" + eq.equipment_company + \"|\" + (eq.tag_no || \"\");\n                            if (!eqMap.has(key))\n                                eqMap.set(key, {});\n                            const daily = eqMap.get(key);\n                            const ratio = eqTotal > 0 ? (eq.total || 0) / eqTotal : 0;\n                            const val = Math.round(dayEqMh * ratio * 10) / 10;\n                            daily[date] = (daily[date] || 0) + val;\n                        }\n                    }\n                }\n            }\n            catch { }\n        }\n        const mpArr = [];\n        mpMap.forEach((daily, key) => {\n            const [name, position, company] = key.split(\"|\");\n            const total = Math.round(Object.values(daily).reduce((s, v) => s + v, 0) * 10) / 10;\n            mpArr.push({ name, position, company, daily, total });\n        });\n        mpArr.sort((a, b) => a.name.localeCompare(b.name));\n        const eqArr = [];\n        eqMap.forEach((daily, key) => {\n            const [name, company, tag] = key.split(\"|\");\n            const total = Math.round(Object.values(daily).reduce((s, v) => s + v, 0) * 10) / 10;\n            eqArr.push({ name, company, tag, daily, total });\n        });\n        eqArr.sort((a, b) => a.name.localeCompare(b.name));\n        setPivotMp(mpArr);\n        setPivotEq(eqArr);\n        setLoading(false);\n    }, [fMonth, filteredJobs]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => { loadData(); }, [loadData]);\n    const totalMpMh = pivotMp.reduce((s, r) => s + r.total, 0);\n    const totalEqMh = pivotEq.reduce((s, r) => s + r.total, 0);\n    const exportExcel = async () => {\n        const ExcelJS = await __webpack_require__.e(/*! import() */ \"vendor\").then(__webpack_require__.t.bind(__webpack_require__, /*! exceljs */ \"./node_modules/exceljs/dist/exceljs.min.js\", 23));\n        const { saveAs } = await __webpack_require__.e(/*! import() */ \"vendor\").then(__webpack_require__.t.bind(__webpack_require__, /*! file-saver */ \"./node_modules/file-saver/dist/FileSaver.min.js\", 23));\n        const wb = new ExcelJS.Workbook();\n        const ms = wb.addWorksheet(\"Manpower\");\n        const mpCols = [{ header: \"Company\", key: \"company\", width: 15 }, { header: \"Name\", key: \"name\", width: 25 }, { header: \"Position\", key: \"position\", width: 20 }];\n        datesInMonth.forEach(d => mpCols.push({ header: fmtDay(d), key: d, width: 5 }));\n        mpCols.push({ header: \"Total\", key: \"total\", width: 10 });\n        ms.columns = mpCols;\n        pivotMp.forEach(r => {\n            const row = { company: r.company, name: r.name, position: r.position, total: r.total };\n            datesInMonth.forEach(d => { row[d] = r.daily[d] || 0; });\n            ms.addRow(row);\n        });\n        ms.getRow(1).eachCell(c => { c.font = { bold: true, color: { argb: \"FFFFFFFF\" } }; c.fill = { type: \"pattern\", pattern: \"solid\", fgColor: { argb: \"FF4B6FE0\" } }; });\n        const es = wb.addWorksheet(\"Equipment\");\n        const eqCols = [{ header: \"Company\", key: \"company\", width: 15 }, { header: \"Equipment\", key: \"name\", width: 30 }, { header: \"Tag\", key: \"tag\", width: 12 }];\n        datesInMonth.forEach(d => eqCols.push({ header: fmtDay(d), key: d, width: 5 }));\n        eqCols.push({ header: \"Total\", key: \"total\", width: 10 });\n        es.columns = eqCols;\n        pivotEq.forEach(r => {\n            const row = { company: r.company, name: r.name, tag: r.tag, total: r.total };\n            datesInMonth.forEach(d => { row[d] = r.daily[d] || 0; });\n            es.addRow(row);\n        });\n        es.getRow(1).eachCell(c => { c.font = { bold: true, color: { argb: \"FFFFFFFF\" } }; c.fill = { type: \"pattern\", pattern: \"solid\", fgColor: { argb: \"FF4B6FE0\" } }; });\n        const buf = await wb.xlsx.writeBuffer();\n        saveAs(new Blob([buf]), \"PACE_Timesheet_\" + fMonth + \".xlsx\");\n    };\n    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", style: { padding: \"12px 16px\", marginBottom: 16 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { display: \"flex\", gap: 8, flexWrap: \"wrap\", alignItems: \"flex-end\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 130 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"select\", { className: \"form-control\", value: fMonth, onChange: e => setFMonth(e.target.value), style: { fontFamily: \"var(--font-family)\" }, children: monthOpts.map(m => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: m.value, children: m.label }, m.value)) }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fAsset, onChange: e => { setFAsset(e.target.value); setFPlatform(\"\"); }, style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Assets\" }), uniqueAssets.map(a => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: a, children: a }, a))] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fPlatform, onChange: e => setFPlatform(e.target.value), style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Platforms\" }), uniquePlatforms.map(p => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: p, children: p }, p))] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fCompany, onChange: e => setFCompany(e.target.value), style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Companies\" }), activeCompanies.map(c => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: c, children: c }, c))] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fJobType, onChange: e => { setFJobType(e.target.value); setFSub1(\"\"); setFSub2(\"\"); }, style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Job Types\" }), uniqueL1.map(l => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: l, children: l }, l))] }) }), fJobType && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fSub1, onChange: e => { setFSub1(e.target.value); setFSub2(\"\"); }, style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Sub 1\" }), uniqueL2.map(l => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: l, children: l }, l))] }) }), fSub1 && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { style: { minWidth: 110 }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: fSub2, onChange: e => setFSub2(e.target.value), style: { fontFamily: \"var(--font-family)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"All Sub 2\" }), uniqueL3.map(l => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: l, children: l }, l))] }) }), hasFilters && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"btn btn-secondary btn-sm\", onClick: clearFilters, style: { height: 34 }, children: \"Clear\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"btn btn-primary btn-sm\", onClick: exportExcel, style: { height: 34 }, children: \"\\uD83D\\uDCE5 Export\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { fontSize: 11, color: \"var(--color-text-dim)\", marginTop: 8, fontFamily: \"var(--font-family)\" }, children: [filteredJobs.length, \" project(s) \\u00B7 \", datesInMonth.length, \" days in \", fMonth] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-grid\", style: { marginBottom: 16 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", children: filteredJobs.length }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"Projects\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", children: pivotMp.length }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"Manpower\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", style: { color: \"var(--color-primary)\" }, children: totalMpMh.toFixed(1) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"Manpower MH\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", children: pivotEq.length }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"Equipment\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"kpi-card\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-value\", style: { color: \"var(--color-accent)\" }, children: totalEqMh.toFixed(1) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"kpi-label\", children: \"Equipment MH\" })] })] }), loading && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"empty-state\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"p\", { children: \"Loading...\" }) }), !loading && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"tabs\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"tab-btn \" + (tab === \"manpower\" ? \"active\" : \"\"), onClick: () => setTab(\"manpower\"), children: \"Manpower\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"tab-btn \" + (tab === \"equipment\" ? \"active\" : \"\"), onClick: () => setTab(\"equipment\"), children: \"Equipment\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", children: [tab === \"manpower\" && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"table-wrapper\", style: { overflowX: \"auto\" }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"table\", { style: { minWidth: datesInMonth.length * 36 + 400 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"thead\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { position: \"sticky\", left: 0, background: \"var(--color-surface-2)\", zIndex: 2, fontSize: 11, minWidth: 80 }, children: \"Company\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { fontSize: 11, minWidth: 140 }, children: \"Name\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { fontSize: 11, minWidth: 100 }, children: \"Position\" }), datesInMonth.map(d => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"center\", fontSize: 10, minWidth: 32, padding: \"6px 2px\" }, children: fmtDay(d) }, d))), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\", fontSize: 11, minWidth: 55, fontWeight: 700 }, children: \"Total\" })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tbody\", { children: [pivotMp.length === 0 && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"tr\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { colSpan: 3 + datesInMonth.length + 1, style: { textAlign: \"center\", color: \"var(--color-text-dim)\", padding: 24 }, children: \"No manpower data.\" }) }), pivotMp.map((r, i) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { position: \"sticky\", left: 0, background: \"var(--color-surface)\", zIndex: 1, fontSize: 11 }, children: r.company }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontSize: 12 }, children: r.name }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontSize: 11 }, children: r.position }), datesInMonth.map(d => {\n                                                            const v = r.daily[d] || 0;\n                                                            return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"center\", fontFamily: \"var(--font-mono)\", fontSize: 11, padding: \"4px 2px\", color: v > 0 ? \"var(--color-text)\" : \"var(--color-text-dim)\", background: v > 0 ? \"rgba(74,222,128,0.08)\" : \"transparent\" }, children: v > 0 ? v.toFixed(1) : \"0\" }, d);\n                                                        }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", fontSize: 12, fontWeight: 700, color: \"var(--color-primary)\" }, children: r.total.toFixed(1) })] }, i))), pivotMp.length > 0 && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { style: { background: \"var(--color-surface-2)\", fontWeight: 700 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { position: \"sticky\", left: 0, background: \"var(--color-surface-2)\", zIndex: 1, fontSize: 12 }, colSpan: 3, children: \"Total\" }), datesInMonth.map(d => {\n                                                            const dt = pivotMp.reduce((s, r) => s + (r.daily[d] || 0), 0);\n                                                            return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"center\", fontFamily: \"var(--font-mono)\", fontSize: 11, padding: \"4px 2px\", color: dt > 0 ? \"var(--color-text)\" : \"var(--color-text-dim)\", background: dt > 0 ? \"rgba(74,222,128,0.08)\" : \"transparent\" }, children: dt.toFixed(1) }, d);\n                                                        }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", fontSize: 12, color: \"var(--color-primary)\" }, children: totalMpMh.toFixed(1) })] }))] })] }) })), tab === \"equipment\" && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"table-wrapper\", style: { overflowX: \"auto\" }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"table\", { style: { minWidth: datesInMonth.length * 36 + 400 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"thead\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { position: \"sticky\", left: 0, background: \"var(--color-surface-2)\", zIndex: 2, fontSize: 11, minWidth: 80 }, children: \"Company\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { fontSize: 11, minWidth: 160 }, children: \"Equipment\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { fontSize: 11, minWidth: 60 }, children: \"Tag\" }), datesInMonth.map(d => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"center\", fontSize: 10, minWidth: 32, padding: \"6px 2px\" }, children: fmtDay(d) }, d))), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"right\", fontSize: 11, minWidth: 55, fontWeight: 700 }, children: \"Total\" })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tbody\", { children: [pivotEq.length === 0 && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"tr\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { colSpan: 3 + datesInMonth.length + 1, style: { textAlign: \"center\", color: \"var(--color-text-dim)\", padding: 24 }, children: \"No equipment data.\" }) }), pivotEq.map((r, i) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { position: \"sticky\", left: 0, background: \"var(--color-surface)\", zIndex: 1, fontSize: 11 }, children: r.company }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontSize: 12 }, children: r.name }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { fontSize: 11, fontFamily: \"var(--font-mono)\" }, children: r.tag || \"—\" }), datesInMonth.map(d => {\n                                                            const v = r.daily[d] || 0;\n                                                            return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"center\", fontFamily: \"var(--font-mono)\", fontSize: 11, padding: \"4px 2px\", color: v > 0 ? \"var(--color-text)\" : \"var(--color-text-dim)\", background: v > 0 ? \"rgba(74,222,128,0.08)\" : \"transparent\" }, children: v > 0 ? v.toFixed(1) : \"0\" }, d);\n                                                        }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", fontSize: 12, fontWeight: 700, color: \"var(--color-accent)\" }, children: r.total.toFixed(1) })] }, i))), pivotEq.length > 0 && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { style: { background: \"var(--color-surface-2)\", fontWeight: 700 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { position: \"sticky\", left: 0, background: \"var(--color-surface-2)\", zIndex: 1, fontSize: 12 }, colSpan: 3, children: \"Total\" }), datesInMonth.map(d => {\n                                                            const dt = pivotEq.reduce((s, r) => s + (r.daily[d] || 0), 0);\n                                                            return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"center\", fontFamily: \"var(--font-mono)\", fontSize: 11, padding: \"4px 2px\", color: dt > 0 ? \"var(--color-text)\" : \"var(--color-text-dim)\", background: dt > 0 ? \"rgba(74,222,128,0.08)\" : \"transparent\" }, children: dt.toFixed(1) }, d);\n                                                        }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"right\", fontFamily: \"var(--font-mono)\", fontSize: 12, color: \"var(--color-accent)\" }, children: totalEqMh.toFixed(1) })] }))] })] }) }))] })] }))] }));\n};\nconst root = document.getElementById(\"react-root\");\nif (root)\n    (0,react_dom_client__WEBPACK_IMPORTED_MODULE_2__.createRoot)(root).render((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(TimesheetPage, {}));\n\n\n//# sourceURL=webpack://pace-frontend/./islands/timesheet/index.tsx?\n}");

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
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; (typeof current == 'object' || typeof current == 'function') && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
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
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		// The chunk loading function for additional chunks
/******/ 		// Since all referenced chunks are already included
/******/ 		// in this file, this function is empty here.
/******/ 		__webpack_require__.e = () => (Promise.resolve());
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
/******/ 			"timesheet": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendor"], () => (__webpack_require__("./islands/timesheet/index.tsx")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;