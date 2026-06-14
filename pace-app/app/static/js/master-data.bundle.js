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

/***/ "./islands/master-data/index.tsx"
/*!***************************************!*\
  !*** ./islands/master-data/index.tsx ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ \"./node_modules/react/jsx-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-dom/client */ \"./node_modules/react-dom/client.js\");\n\n\n\nconst ALL_TABS = [\n    { key: \"assets\", label: \"Asset\", feature: \"master_data.asset\" },\n    { key: \"working-platforms\", label: \"Working Platform\", feature: \"master_data.working_platform\" },\n    { key: \"wp-mappings\", label: \"WP Mapping\", feature: \"master_data.working_platform_mapping\" },\n    { key: \"quarter-platforms\", label: \"Quarter Platform\", feature: \"master_data.quarter_platform\" },\n    { key: \"qp-mappings\", label: \"QP Mapping\", feature: \"master_data.quarter_platform_mapping\" },\n    { key: \"job-types\", label: \"Job Type\", feature: \"master_data.job_type\" },\n    { key: \"groups\", label: \"Group\", feature: \"master_data.group\" },\n    { key: \"companies\", label: \"Company\", feature: \"master_data.company\" },\n    { key: \"positions\", label: \"Position\", feature: \"master_data.position\" },\n    { key: \"rate-types\", label: \"Rate Type\", feature: \"master_data.rate_type\" },\n    { key: \"contractors\", label: \"Contractor\", feature: \"master_data.contractor\" },\n    { key: \"contractor-rates\", label: \"Contractor Rate\", feature: \"master_data.contractor_rate\" },\n    { key: \"equipment\", label: \"Equipment\", feature: \"master_data.equipment\" },\n    { key: \"equipment-rates\", label: \"Equipment Rate\", feature: \"master_data.equipment_rate\" },\n    { key: \"std-manhour\", label: \"Std Manhour\", feature: \"master_data.std_manhour\" },\n    { key: \"roles\", label: \"Role\", feature: \"master_data.role\" },\n    { key: \"user-roles\", label: \"User Role\", feature: \"master_data.user_role\" },\n    { key: \"role-permissions\", label: \"Role Permission\", feature: \"master_data.role_permission\" },\n];\nconst STATUS_OPTIONS = [{ value: \"Active\", label: \"Active\" }, { value: \"Inactive\", label: \"Inactive\" }];\n/* ══════════════════════════════════════ HELPERS ══════════════════════════════════════ */\nconst apiH = () => ({\n    \"Content-Type\": \"application/json\",\n    \"X-User-Role\": localStorage.getItem(\"pace-role\") || \"administrator\",\n    \"X-User-Name\": localStorage.getItem(\"pace-user-name\") || \"Dev User\",\n});\nconst api = (path, opts) => fetch(path, { headers: apiH(), ...opts }).then(r => {\n    if (r.status === 403)\n        throw new Error(\"Access denied\");\n    return r.json();\n});\nfunction fmtDate(val) {\n    if (!val)\n        return \"—\";\n    try {\n        const d = new Date(val);\n        const M = [\"Jan\", \"Feb\", \"Mar\", \"Apr\", \"May\", \"Jun\", \"Jul\", \"Aug\", \"Sep\", \"Oct\", \"Nov\", \"Dec\"];\n        return String(d.getDate()).padStart(2, \"0\") + \" \" + M[d.getMonth()] + \" \" + d.getFullYear();\n    }\n    catch {\n        return val;\n    }\n}\nfunction statusBadge(s) {\n    return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { className: \"badge \" + (s === \"Active\" ? \"badge-active\" : \"badge-inactive\"), children: s });\n}\nfunction StatusSelect({ value, onChange }) {\n    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"select\", { className: \"form-control\", value: value, onChange: e => onChange(e.target.value), children: STATUS_OPTIONS.map(s => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: s.value, children: s.label }, s.value)) }));\n}\n/* ══════════════════════════════════════ SCROLLABLE TABS ══════════════════════════════════════ */\nconst ScrollableTabs = ({ tabs, activeTab, onSelect }) => {\n    const scrollRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    const [showLeft, setShowLeft] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [showRight, setShowRight] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const checkScroll = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(() => {\n        const el = scrollRef.current;\n        if (!el)\n            return;\n        setShowLeft(el.scrollLeft > 5);\n        setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);\n    }, []);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {\n        checkScroll();\n        const el = scrollRef.current;\n        if (el) {\n            el.addEventListener(\"scroll\", checkScroll);\n            window.addEventListener(\"resize\", checkScroll);\n        }\n        return () => {\n            if (el)\n                el.removeEventListener(\"scroll\", checkScroll);\n            window.removeEventListener(\"resize\", checkScroll);\n        };\n    }, [checkScroll, tabs]);\n    const scroll = (dir) => {\n        const el = scrollRef.current;\n        if (el)\n            el.scrollBy({ left: dir * 200, behavior: \"smooth\" });\n    };\n    // Auto-scroll active tab into view\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {\n        const el = scrollRef.current;\n        if (!el)\n            return;\n        const activeBtn = el.querySelector(\".tab-btn.active\");\n        if (activeBtn) {\n            const elRect = el.getBoundingClientRect();\n            const btnRect = activeBtn.getBoundingClientRect();\n            if (btnRect.left < elRect.left) {\n                el.scrollBy({ left: btnRect.left - elRect.left - 20, behavior: \"smooth\" });\n            }\n            else if (btnRect.right > elRect.right) {\n                el.scrollBy({ left: btnRect.right - elRect.right + 20, behavior: \"smooth\" });\n            }\n        }\n    }, [activeTab]);\n    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"tabs-container\", children: [showLeft && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"tabs-arrow\", onClick: () => scroll(-1), title: \"Scroll left\", children: \"\\u25C0\" })), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"tabs\", ref: scrollRef, style: { marginBottom: 0 }, children: tabs.map(tab => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"tab-btn \" + (activeTab === tab.key ? \"active\" : \"\"), onClick: () => onSelect(tab.key), children: tab.label }, tab.key))) }), showRight && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"tabs-arrow\", onClick: () => scroll(1), title: \"Scroll right\", children: \"\\u25B6\" }))] }));\n};\n/* ══════════════════════════════════════ GENERIC CRUD TAB ══════════════════════════════════════ */\nconst CrudTab = ({ endpoint, editable, cols }) => {\n    const [rows, setRows] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);\n    const [showForm, setShowForm] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [form, setForm] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});\n    const [editId, setEditId] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const load = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(() => {\n        api(endpoint).then(setRows).catch(() => setRows([]));\n    }, [endpoint]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => { load(); }, [load]);\n    const updateField = (key, value) => {\n        const next = { ...form };\n        next[key] = value;\n        setForm(next);\n    };\n    const save = async () => {\n        try {\n            if (editId) {\n                await api(endpoint + \"/\" + editId, { method: \"PUT\", body: JSON.stringify(form) });\n            }\n            else {\n                await api(endpoint, { method: \"POST\", body: JSON.stringify(form) });\n            }\n            setShowForm(false);\n            setForm({});\n            setEditId(null);\n            load();\n        }\n        catch {\n            alert(\"Access denied or save failed.\");\n        }\n    };\n    const del = async (id) => {\n        if (!confirm(\"Delete this record?\"))\n            return;\n        try {\n            await api(endpoint + \"/\" + id, { method: \"DELETE\" });\n            load();\n        }\n        catch {\n            alert(\"Access denied or delete failed.\");\n        }\n    };\n    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [editable && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"toolbar\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", {}), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"btn btn-primary btn-sm\", onClick: () => { setForm({ status: \"Active\" }); setEditId(null); setShowForm(true); }, children: \"+ Add\" })] })), showForm && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"card\", style: { marginBottom: 16 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"form-row\", children: [cols.map(c => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"form-group\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"label\", { children: c.label }), c.options ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"select\", { className: \"form-control\", value: form[c.key] || \"\", onChange: e => updateField(c.key, e.target.value), children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: \"\", children: \"-- Select --\" }), c.options.map(o => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: o, children: o }, o))] })) : c.type === \"number\" ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"input\", { className: \"form-control\", type: \"number\", step: \"0.01\", value: form[c.key] ?? \"\", onChange: e => updateField(c.key, parseFloat(e.target.value) || 0) })) : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"input\", { className: \"form-control\", value: form[c.key] || \"\", onChange: e => updateField(c.key, e.target.value) }))] }, c.key))), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"form-group\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"label\", { children: \"Status\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(StatusSelect, { value: form.status || \"Active\", onChange: v => updateField(\"status\", v) })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { display: \"flex\", gap: 8, marginTop: 8 }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"btn btn-primary btn-sm\", onClick: save, children: \"Save\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"btn btn-secondary btn-sm\", onClick: () => setShowForm(false), children: \"Cancel\" })] })] })), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"table-wrapper\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"table\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"thead\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { width: 40 }, children: \"#\" }), cols.map(c => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: c.label }, c.key)), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Status\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Created\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Updated\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"By\" }), editable && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { children: \"Actions\" })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tbody\", { children: [rows.length === 0 && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"tr\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { colSpan: cols.length + (editable ? 5 : 4), style: { textAlign: \"center\", color: \"var(--color-text-dim)\", padding: 24 }, children: \"No data\" }) })), rows.map((r, idx) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { color: \"var(--color-text-dim)\", fontSize: 11 }, children: idx + 1 }), cols.map(c => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: c.type === \"number\" ? { fontFamily: \"var(--font-mono)\" } : {}, children: c.type === \"number\" ? (r[c.key] != null ? Number(r[c.key]).toFixed(2) : \"0.00\") : (r[c.key] || \"—\") }, c.key))), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { children: statusBadge(r.status) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { children: fmtDate(r.created_date) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { children: fmtDate(r.updated_date) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { children: r.updated_by || \"—\" }), editable && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"td\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"btn btn-secondary btn-sm\", style: { marginRight: 4 }, onClick: () => { setForm({ ...r }); setEditId(r.id); setShowForm(true); }, children: \"Edit\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"button\", { className: \"btn btn-danger btn-sm\", onClick: () => del(r.id), children: \"Del\" })] }))] }, r.id)))] })] }) })] }));\n};\n/* ══════════════════════════════════════ ROLE PERMISSION TAB ══════════════════════════════════════ */\nconst ACCESS_COLORS = { edit: \"var(--color-success)\", view: \"var(--color-primary)\", disabled: \"var(--color-danger)\" };\nconst ACCESS_BG = { edit: \"rgba(74,222,128,0.08)\", view: \"rgba(108,142,255,0.08)\", disabled: \"rgba(255,107,107,0.06)\" };\nconst RolePermissionTab = () => {\n    const [data, setData] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [saving, setSaving] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const load = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(() => { api(\"/api/auth/permissions\").then(setData).catch(() => { }); }, []);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => { load(); }, [load]);\n    const updatePerm = async (role, feature, access_level) => {\n        setSaving(role + \".\" + feature);\n        try {\n            await api(\"/api/auth/permissions\", { method: \"POST\", body: JSON.stringify({ role, feature, access_level }) });\n            load();\n        }\n        catch {\n            alert(\"Only administrators can change permissions.\");\n        }\n        finally {\n            setSaving(\"\");\n        }\n    };\n    if (!data)\n        return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"empty-state\", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"p\", { children: \"Loading...\" }) });\n    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { style: { marginBottom: 12, fontSize: 12, color: \"var(--color-text-muted)\" }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { color: ACCESS_COLORS.edit, fontWeight: 600 }, children: \"Edit\" }), \" \\u00B7 \", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { color: ACCESS_COLORS.view, fontWeight: 600 }, children: \"View\" }), \" \\u00B7 \", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { color: ACCESS_COLORS.disabled, fontWeight: 600 }, children: \"Disabled\" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"table-wrapper\", style: { overflowX: \"auto\" }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"table\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"thead\", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { position: \"sticky\", left: 0, background: \"var(--color-surface-2)\", zIndex: 2, minWidth: 220 }, children: \"Feature\" }), data.roles.map(r => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"th\", { style: { textAlign: \"center\", minWidth: 80 }, children: r }, r))] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"tbody\", { children: data.features.map(feat => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"tr\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { position: \"sticky\", left: 0, background: \"var(--color-surface)\", zIndex: 1, fontSize: 12, fontWeight: feat.key.includes(\".\") ? 400 : 600, paddingLeft: feat.key.includes(\".\") ? 24 : 14 }, children: feat.label }), data.roles.map(role => {\n                                        const perm = data.permissions[role]?.[feat.key];\n                                        const level = perm?.access_level || \"disabled\";\n                                        const key = role + \".\" + feat.key;\n                                        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"td\", { style: { textAlign: \"center\", padding: \"4px 6px\", background: ACCESS_BG[level] }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"select\", { className: \"form-control\", value: level, disabled: saving === key, onChange: e => updatePerm(role, feat.key, e.target.value), style: { fontSize: 11, padding: \"3px 6px\", textAlign: \"center\", color: ACCESS_COLORS[level], fontWeight: 600, width: \"100%\", minWidth: 70 }, children: data.access_levels.map(al => (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"option\", { value: al, children: al.charAt(0).toUpperCase() + al.slice(1) }, al)) }) }, role));\n                                    })] }, feat.key))) })] }) })] }));\n};\n/* ══════════════════════════════════════ MASTER DATA PAGE ══════════════════════════════════════ */\nconst MasterDataPage = () => {\n    const [activeTab, setActiveTab] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"assets\");\n    const [access, setAccess] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});\n    const [lookups, setLookups] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});\n    const loadAccess = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(() => { api(\"/api/master-data/access\").then(setAccess).catch(() => { }); }, []);\n    const loadLookups = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {\n        try {\n            const [assets, wps, qps, groups, companies, positions, rateTypes, equipment, roles] = await Promise.all([\n                api(\"/api/master-data/assets\"), api(\"/api/master-data/working-platforms\"),\n                api(\"/api/master-data/quarter-platforms\"), api(\"/api/master-data/groups\"),\n                api(\"/api/master-data/companies\"), api(\"/api/master-data/positions\"),\n                api(\"/api/master-data/rate-types\"), api(\"/api/master-data/equipment\"),\n                api(\"/api/master-data/roles\"),\n            ]);\n            setLookups({\n                asset: assets.filter((r) => r.status === \"Active\").map((r) => r.name),\n                working_platform: wps.filter((r) => r.status === \"Active\").map((r) => r.name),\n                quarter_platform: qps.filter((r) => r.status === \"Active\").map((r) => r.name),\n                md_group: groups.filter((r) => r.status === \"Active\").map((r) => r.name),\n                company: companies.filter((r) => r.status === \"Active\").map((r) => r.name),\n                position: positions.filter((r) => r.status === \"Active\").map((r) => r.name),\n                rate_type: rateTypes.filter((r) => r.status === \"Active\").map((r) => r.name),\n                equipment: equipment.filter((r) => r.status === \"Active\").map((r) => r.name),\n                role: roles.filter((r) => r.status === \"Active\").map((r) => r.name),\n                level: [\"Low\", \"Medium\", \"High\"],\n            });\n        }\n        catch { }\n    }, []);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => { loadAccess(); loadLookups(); }, [loadAccess, loadLookups]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {\n        const h = () => { loadAccess(); };\n        window.addEventListener(\"pace-role-change\", h);\n        return () => window.removeEventListener(\"pace-role-change\", h);\n    }, [loadAccess]);\n    const visibleTabs = ALL_TABS.filter(t => { const l = access[t.feature]; return l === \"edit\" || l === \"view\"; });\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {\n        if (visibleTabs.length > 0 && !visibleTabs.find(t => t.key === activeTab))\n            setActiveTab(visibleTabs[0].key);\n    }, [access, visibleTabs, activeTab]);\n    const isEditable = (tab) => {\n        const feat = ALL_TABS.find(t => t.key === tab)?.feature || \"\";\n        return access[feat] === \"edit\";\n    };\n    const getColConfig = (tab) => {\n        switch (tab) {\n            case \"assets\": return [{ key: \"name\", label: \"Name\" }, { key: \"description\", label: \"Description\" }];\n            case \"working-platforms\": return [{ key: \"name\", label: \"Name\" }, { key: \"description\", label: \"Description\" }];\n            case \"wp-mappings\": return [{ key: \"asset\", label: \"Asset\", options: lookups.asset }, { key: \"working_platform\", label: \"Working Platform\", options: lookups.working_platform }];\n            case \"quarter-platforms\": return [{ key: \"name\", label: \"Name\" }, { key: \"description\", label: \"Description\" }];\n            case \"qp-mappings\": return [{ key: \"asset\", label: \"Asset\", options: lookups.asset }, { key: \"quarter_platform\", label: \"Quarter Platform\", options: lookups.quarter_platform }];\n            case \"job-types\": return [{ key: \"description_l1\", label: \"L1\" }, { key: \"description_l2\", label: \"L2\" }, { key: \"description_l3\", label: \"L3\" }];\n            case \"groups\": return [{ key: \"name\", label: \"Name\" }, { key: \"description\", label: \"Description\" }];\n            case \"companies\": return [{ key: \"name\", label: \"Name\" }, { key: \"description\", label: \"Description\" }];\n            case \"positions\": return [{ key: \"md_group\", label: \"Group\", options: lookups.md_group }, { key: \"name\", label: \"Name\" }, { key: \"description\", label: \"Description\" }];\n            case \"rate-types\": return [{ key: \"name\", label: \"Name\" }, { key: \"description\", label: \"Description\" }];\n            case \"contractors\": return [{ key: \"name\", label: \"Name\" }, { key: \"company\", label: \"Company\", options: lookups.company }, { key: \"position\", label: \"Position\", options: lookups.position }];\n            case \"contractor-rates\": return [{ key: \"company\", label: \"Company\", options: lookups.company }, { key: \"position\", label: \"Position\", options: lookups.position }, { key: \"rate_type\", label: \"Rate Type\", options: lookups.rate_type }, { key: \"charge_hour_rate\", label: \"Hourly Rate\", type: \"number\" }];\n            case \"equipment\": return [{ key: \"name\", label: \"Name\" }, { key: \"description\", label: \"Description\" }];\n            case \"equipment-rates\": return [{ key: \"company\", label: \"Company\", options: lookups.company }, { key: \"equipment\", label: \"Equipment\", options: lookups.equipment }, { key: \"rate_type\", label: \"Rate Type\", options: lookups.rate_type }, { key: \"charge_hour_rate\", label: \"Hourly Rate\", type: \"number\" }];\n            case \"std-manhour\": return [{ key: \"md_group\", label: \"Group\", options: lookups.md_group }, { key: \"header\", label: \"L1\" }, { key: \"sub_header\", label: \"L2\" }, { key: \"description\", label: \"L3\" }, { key: \"level\", label: \"Difficulty\", options: lookups.level }, { key: \"unit\", label: \"Unit\" }, { key: \"manhour\", label: \"Manhour\", type: \"number\" }];\n            case \"roles\": return [{ key: \"name\", label: \"Name\" }, { key: \"description\", label: \"Description\" }];\n            case \"user-roles\": return [{ key: \"name\", label: \"Name\" }, { key: \"mail\", label: \"Email\" }, { key: \"role\", label: \"Role\", options: lookups.role }, { key: \"job_title\", label: \"Job Title\" }];\n            default: return [];\n        }\n    };\n    const getEndpoint = (tab) => {\n        const map = {\n            \"assets\": \"/api/master-data/assets\", \"working-platforms\": \"/api/master-data/working-platforms\",\n            \"wp-mappings\": \"/api/master-data/working-platform-mappings\", \"quarter-platforms\": \"/api/master-data/quarter-platforms\",\n            \"qp-mappings\": \"/api/master-data/quarter-platform-mappings\", \"job-types\": \"/api/master-data/job-types\",\n            \"groups\": \"/api/master-data/groups\", \"companies\": \"/api/master-data/companies\",\n            \"positions\": \"/api/master-data/positions\", \"rate-types\": \"/api/master-data/rate-types\",\n            \"contractors\": \"/api/master-data/contractors\", \"contractor-rates\": \"/api/master-data/contractor-rates\",\n            \"equipment\": \"/api/master-data/equipment\", \"equipment-rates\": \"/api/master-data/equipment-rates\",\n            \"std-manhour\": \"/api/master-data/standardize-manhour\", \"roles\": \"/api/master-data/roles\",\n            \"user-roles\": \"/api/master-data/users\", \"role-permissions\": \"\",\n        };\n        return map[tab] || \"\";\n    };\n    const renderTab = () => {\n        if (activeTab === \"role-permissions\")\n            return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(RolePermissionTab, {});\n        return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(CrudTab, { endpoint: getEndpoint(activeTab), editable: isEditable(activeTab), cols: getColConfig(activeTab) }, activeTab);\n    };\n    if (visibleTabs.length === 0) {\n        return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { className: \"empty-state\", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"empty-icon\", children: \"\\uD83D\\uDD12\" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"p\", { children: \"Your role does not have access to any master data.\" })] });\n    }\n    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(\"div\", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(ScrollableTabs, { tabs: visibleTabs.map(t => ({ key: t.key, label: t.label })), activeTab: activeTab, onSelect: key => { setActiveTab(key); loadLookups(); } }), !isEditable(activeTab) && activeTab !== \"role-permissions\" && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"div\", { className: \"card\", style: { marginBottom: 12, padding: \"10px 16px\", borderColor: \"var(--color-warning)\", background: \"rgba(255,184,77,0.06)\" }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(\"span\", { style: { color: \"var(--color-warning)\", fontWeight: 600, fontSize: 13 }, children: \"\\uD83D\\uDD12 View only\" }) })), renderTab()] }));\n};\nconst root = document.getElementById(\"react-root\");\nif (root)\n    (0,react_dom_client__WEBPACK_IMPORTED_MODULE_2__.createRoot)(root).render((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(MasterDataPage, {}));\n\n\n//# sourceURL=webpack://pace-frontend/./islands/master-data/index.tsx?\n}");

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
/******/ 			"master-data": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendor"], () => (__webpack_require__("./islands/master-data/index.tsx")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;