import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";

/* ══════════════════════════════════════ TYPES ══════════════════════════════════════ */
interface Job { job_no: string; job_name: string; job_type: string; group: string; discipline: string; sub_type: string; location: string; asset: string; working_platform: string; sro_no: string; project_engineer: string; plan_start_date: string|null; plan_end_date: string|null; actual_start_date: string|null; actual_end_date: string|null; suspended_day: number; total_day: number; status: string; }
interface WpMapping { id: number; asset: string; working_platform: string; status: string; }
interface JobTypeItem { id: number; description_l1: string; description_l2: string; description_l3: string; status: string; }
interface CompanyItem { id: number; name: string; status: string; }
interface UserItem { id: number; name: string; mail: string; role: string; }
interface PlanActivityItem { id: number; std_mh_id: number|null; job_no: string; structure: string; header: string; sub_header: string; description: string; level: string; unit: string; plan_quantity: number; plan_manhour: number; actual_quantity: number; actual_manhour: number; }
interface StdMhItem { id: number; header: string; sub_header: string; description: string; md_group: string; level: string; unit: string; manhour: number; status: string; }
interface RolePerms { role: string; can_create: boolean; can_edit_plan: boolean; can_delete: boolean; can_submit: boolean; can_approve: boolean; can_revise?: boolean; can_start: boolean; can_complete: boolean; }
interface RevisionItem { id: number; job_no: string; revision: number; status: string; action: string; snapshot: string; created_date: string; created_by: string; }

type Page = "list" | "summary";
const DIFFICULTY_OPTIONS = ["Low", "Medium", "High"] as const;
type Difficulty = typeof DIFFICULTY_OPTIONS[number];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const badgeClass = (s: string) => ({ "Drafting Plan": "badge-draft", "Pending Approval": "badge-pending", "Approved Plan": "badge-approved", "In Progress": "badge-inprogress", "Completed": "badge-completed" }[s] || "badge-draft");
const apiH = (): Record<string, string> => ({ "Content-Type": "application/json", "X-User-Role": localStorage.getItem("pace-role") || "administrator", "X-User-Name": localStorage.getItem("pace-user-name") || "Dev User" });
const api = async (url: string, o?: RequestInit) => { const r = await fetch(url, { headers: apiH(), ...o }); if (!r.ok) { const j = await r.json().catch(() => ({ error: "HTTP " + r.status })); throw new Error(j.message || j.error); } return r.json(); };

function fmtDate(val: string|null|undefined): string {
  if (!val) return "—";
  try { const d = new Date(val); if (isNaN(d.getTime())) return val; const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return String(d.getDate()).padStart(2,"0") + " " + M[d.getMonth()] + " " + d.getFullYear(); } catch { return val; }
}
const fmtNum = (n: number) => n > 0 ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

function useCurrentRole() {
  const [role, setRole] = useState(localStorage.getItem("pace-role") || "administrator");
  useEffect(() => { const h = (e: Event) => setRole((e as CustomEvent).detail); window.addEventListener("pace-role-change", h); return () => window.removeEventListener("pace-role-change", h); }, []);
  return role;
}

/* ── Std MH Grouping ── */
interface StdMhGroup { description: string; unit: string; header: string; sub_header: string; md_group: string; mhByLevel: Record<string, { id: number; manhour: number }>; }
function groupStdMh(items: StdMhItem[]): StdMhGroup[] {
  const map = new Map<string, StdMhGroup>();
  items.forEach(s => { const k = s.header + "||" + s.description; if (!map.has(k)) map.set(k, { description: s.description, unit: s.unit, header: s.header, sub_header: s.sub_header, md_group: s.md_group, mhByLevel: {} }); map.get(k)!.mhByLevel[s.level] = { id: s.id, manhour: s.manhour }; });
  return Array.from(map.values());
}

/* ══════════════════════════════════════ SUMMARY TEMPLATE ══════════════════════════════════════ */
interface SummaryRow { no: string; structure: string; basis: string; key: string; pct?: number; children?: SummaryRow[]; }
const SUMMARY_TEMPLATE: SummaryRow[] = [
  { no: "1", structure: "Mobilization", basis: "5% of Total MH", key: "mobilization", pct: 0.05 },
  { no: "2", structure: "Demolition", basis: "", key: "demolition", children: [
    { no: "2.1", structure: "Piping and Structure Demolition", basis: "Input Table", key: "demolition_piping" },
    { no: "2.2", structure: "IE Bulk Demolition", basis: "Input Table", key: "demolition_ie_bulk" },
    { no: "2.3", structure: "IE Tag Demolition", basis: "Input Table", key: "demolition_ie_tag" },
    { no: "2.4", structure: "Mechanical & Equipment Demolition", basis: "Input Table", key: "demolition_mech" },
  ]},
  { no: "3", structure: "Installation", basis: "", key: "installation", children: [
    { no: "3.1", structure: "Piping Installation", basis: "Input Table", key: "install_piping" },
    { no: "3.2", structure: "Pipe Support Installation", basis: "Input Table", key: "install_pipe_support" },
    { no: "3.3", structure: "Structure Installation", basis: "Input Table", key: "install_structure" },
    { no: "3.4", structure: "IE Bulk Installation", basis: "Input Table", key: "install_ie_bulk" },
    { no: "3.5", structure: "IE Tag Installation", basis: "Input Table", key: "install_ie_tag" },
    { no: "3.6", structure: "Mechanical & Equipment Installation", basis: "Input Table", key: "install_mech" },
  ]},
  { no: "4", structure: "Scaffolding & Habitat", basis: "", key: "scaffolding", children: [
    { no: "4.1", structure: "Scaffolding Erection", basis: "Input Table", key: "scaffold_erection" },
    { no: "4.2", structure: "Scaffolding Dismantling", basis: "Input Table", key: "scaffold_dismantling" },
    { no: "4.3", structure: "Pressurize Habitat", basis: "Input Table", key: "scaffold_habitat" },
  ]},
  { no: "5", structure: "Other", basis: "", key: "other", children: [
    { no: "5.1", structure: "Insulation work (by POCT)", basis: "Input Table", key: "other_insulation" },
    { no: "5.2", structure: "Isolation support", basis: "Input Table", key: "other_isolation" },
    { no: "5.3", structure: "Site Survey", basis: "Input Table", key: "other_survey" },
    { no: "5.4", structure: "Pls Specific", basis: "Input Table", key: "other_spec1" },
    { no: "5.5", structure: "Pls Specific", basis: "Input Table", key: "other_spec2" },
    { no: "5.6", structure: "Pls Specific", basis: "Input Table", key: "other_spec3" },
  ]},
  { no: "6", structure: "Pre-Commissioning and Commissioning", basis: "", key: "commissioning", children: [
    { no: "6.1", structure: "Testing and Pre-Commissioning", basis: "Input Table", key: "comm_testing" },
    { no: "6.2", structure: "Function Test and Commissioning", basis: "Input Table", key: "comm_function" },
  ]},
  { no: "7", structure: "Painting & Touch-up Paint", basis: "Input Table", key: "painting" },
  { no: "8", structure: "Area Cleaning", basis: "5% of Total MH", key: "cleaning", pct: 0.05 },
  { no: "9", structure: "Demobilization", basis: "5% of Total MH", key: "demobilization", pct: 0.05 },
];

const STRUCTURE_TO_L1: Record<string, string> = {};
SUMMARY_TEMPLATE.forEach(r => { if (r.children) r.children.forEach(c => { STRUCTURE_TO_L1[c.key] = c.structure; }); else if (!r.pct) STRUCTURE_TO_L1[r.key] = r.structure; });

/* ══════════════════════════════════════ DETAIL ROW WITH SUB-ITEMS ══════════════════════════════════════ */
interface SubItem { uid: string; tag_name: string; difficulty: Difficulty; quantity: number; manhour: number; total_mh: number; }
interface DetailRow { uid: string; std_mh_group: StdMhGroup|null; description: string; unit: string; is_custom: boolean; custom_mh: number; sub_items: SubItem[]; total_mh: number; }

/* ══════════════════════════════════════ TEAM MEMBER INPUT ══════════════════════════════════════ */
const TeamMemberInput: React.FC<{ value: string[]; onChange: (members: string[]) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => {
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [showDd, setShowDd] = useState(false);

  useEffect(() => { api("/api/master-data/users").then((u: any[]) => setAllUsers(u.filter((x: any) => x.status === "Active"))).catch(() => {}); }, []);

  const addMember = (name: string) => { if (!value.includes(name)) onChange([...value, name]); setSearch(""); setShowDd(false); };
  const removeMember = (name: string) => onChange(value.filter(m => m !== name));

  const filtered = search ? allUsers.filter(u => !value.includes(u.name) && ((u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.mail || "").toLowerCase().includes(search.toLowerCase()))) : [];

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: value.length > 0 ? 8 : 0 }}>
        {value.map(m => (
          <span key={m} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 16, fontSize: 12, background: "var(--color-primary-bg)", color: "var(--color-primary)", border: "1px solid rgba(108,142,255,0.2)", fontFamily: "var(--font-family)" }}>
            {m}
            {!disabled && <span style={{ cursor: "pointer", fontWeight: 700, fontSize: 14, lineHeight: 1 }} onClick={() => removeMember(m)}>×</span>}
          </span>
        ))}
      </div>
      {!disabled && (
        <div style={{ position: "relative" }}>
          <input className="form-control" placeholder="Search user to add..." value={search}
            onChange={e => { setSearch(e.target.value); setShowDd(true); }}
            onFocus={() => { if (search) setShowDd(true); }}
            onBlur={() => setTimeout(() => setShowDd(false), 200)}
            style={{ fontSize: 12, fontFamily: "var(--font-family)" }} />
          {showDd && search && filtered.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-md)", maxHeight: 180, overflowY: "auto" }}>
              {filtered.slice(0, 8).map(u => (
                <div key={u.id} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12, display: "flex", justifyContent: "space-between", fontFamily: "var(--font-family)" }}
                  onMouseDown={e => { e.preventDefault(); addMember(u.name); }}>
                  <span style={{ fontWeight: 500 }}>{u.name}</span>
                  <span style={{ fontSize: 10, color: "var(--color-text-dim)" }}>{u.mail} · {u.role}</span>
                </div>
              ))}
            </div>
          )}
          {showDd && search && filtered.length === 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 12, color: "var(--color-text-dim)", fontFamily: "var(--font-family)" }}>No users found.</div>
          )}
        </div>
      )}
    </div>
  );
};


/* ══════════════════════════════════════ CONFIRM MODAL ══════════════════════════════════════ */
const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420, width: "90%" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontFamily: "var(--font-family)", fontSize: 15 }}>{title}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6, fontFamily: "var(--font-family)", margin: 0 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} style={{ fontFamily: "var(--font-family)" }}>Cancel</button>
          <button className="btn" onClick={onConfirm} style={{ fontFamily: "var(--font-family)", background: confirmColor || "var(--color-primary)", color: "#fff", border: "none" }}>{confirmLabel || "Confirm"}</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════ DETAIL MODAL ══════════════════════════════════════ */
const DetailModal: React.FC<{
  jobNo: string; structureKey: string; structureName: string;
  stdMhGroups: StdMhGroup[]; activities: PlanActivityItem[]; canEdit: boolean;
  onSave: (items: Partial<PlanActivityItem>[]) => void; onClose: () => void;
}> = ({ jobNo, structureKey, structureName, stdMhGroups, activities, canEdit, onSave, onClose }) => {
  const [rows, setRows] = useState<DetailRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"std"|"custom">("std");
  const [selStdDesc, setSelStdDesc] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customUnit, setCustomUnit] = useState("ea");
  const [customMh, setCustomMh] = useState(0);

  const relevantGroups = useMemo(() => { const l1 = STRUCTURE_TO_L1[structureKey] || structureName; return stdMhGroups.filter(g => g.header === l1); }, [stdMhGroups, structureKey, structureName]);

  const getMh = (grp: StdMhGroup|null, diff: Difficulty, cm: number): number => grp ? (grp.mhByLevel[diff]?.manhour || grp.mhByLevel["Medium"]?.manhour || 0) : cm;

  useEffect(() => {
    if (activities.length > 0) {
      const grouped = new Map<string, PlanActivityItem[]>();
      activities.forEach(a => { const k = a.sub_header || a.description || "unknown"; if (!grouped.has(k)) grouped.set(k, []); grouped.get(k)!.push(a); });
      const init: DetailRow[] = [];
      grouped.forEach((acts, dk) => {
        const grp = relevantGroups.find(g => g.description === dk) || null;
        const subs: SubItem[] = acts.map(a => {
          const diff = (DIFFICULTY_OPTIONS.includes(a.level as Difficulty) ? a.level : "Medium") as Difficulty;
          let mh = a.plan_quantity > 0 ? a.plan_manhour / a.plan_quantity : 0;
          if (grp && grp.mhByLevel[diff]) mh = grp.mhByLevel[diff].manhour;
          return { uid: "s-" + a.id + "-" + Math.random(), tag_name: a.description || "", difficulty: diff, quantity: a.plan_quantity || 0, manhour: mh, total_mh: a.plan_manhour || 0 };
        });
        init.push({ uid: "r-" + Math.random(), std_mh_group: grp, description: dk, unit: acts[0]?.unit || grp?.unit || "ea", is_custom: !grp, custom_mh: 0, sub_items: subs, total_mh: subs.reduce((s, x) => s + x.total_mh, 0) });
      });
      setRows(init);
    } else {
      setRows(relevantGroups.map(grp => ({ uid: "r-" + Math.random(), std_mh_group: grp, description: grp.description, unit: grp.unit, is_custom: false, custom_mh: 0, sub_items: [{ uid: "s-" + Math.random(), tag_name: "", difficulty: "Medium" as Difficulty, quantity: 0, manhour: grp.mhByLevel["Medium"]?.manhour || 0, total_mh: 0 }], total_mh: 0 })));
    }
  }, [relevantGroups, activities]);

  const updateSubItem = (ri: number, si: number, field: string, value: any) => {
    if (!canEdit) return;
    setRows(prev => {
      const next = [...prev]; const row = { ...next[ri] }; const subs = [...row.sub_items]; const item = { ...subs[si] };
      (item as any)[field] = value;
      if (field === "tag_name" && value && item.quantity === 0) item.quantity = 1;
      item.manhour = getMh(row.std_mh_group, item.difficulty, row.custom_mh);
      item.total_mh = item.quantity * item.manhour;
      subs[si] = item; row.sub_items = subs; row.total_mh = subs.reduce((s, x) => s + x.total_mh, 0); next[ri] = row; return next;
    });
  };

  const addSubItem = (ri: number) => { if (!canEdit) return; setRows(prev => { const next = [...prev]; const row = { ...next[ri] }; const mh = getMh(row.std_mh_group, "Medium", row.custom_mh); row.sub_items = [...row.sub_items, { uid: "s-" + Date.now() + Math.random(), tag_name: "", difficulty: "Medium" as Difficulty, quantity: 0, manhour: mh, total_mh: 0 }]; next[ri] = row; return next; }); };
  const removeSubItem = (ri: number, si: number) => { if (!canEdit) return; setRows(prev => { const next = [...prev]; const row = { ...next[ri] }; row.sub_items = row.sub_items.filter((_, i) => i !== si); row.total_mh = row.sub_items.reduce((s, x) => s + x.total_mh, 0); next[ri] = row; return next; }); };
  const removeRow = (idx: number) => { if (canEdit) setRows(prev => prev.filter((_, i) => i !== idx)); };

  const addStdRow = () => { const grp = relevantGroups.find(g => g.description === selStdDesc); if (!grp) return; setRows(prev => [...prev, { uid: "r-" + Date.now(), std_mh_group: grp, description: grp.description, unit: grp.unit, is_custom: false, custom_mh: 0, sub_items: [{ uid: "s-" + Date.now(), tag_name: "", difficulty: "Medium" as Difficulty, quantity: 0, manhour: grp.mhByLevel["Medium"]?.manhour || 0, total_mh: 0 }], total_mh: 0 }]); setSelStdDesc(""); setShowAdd(false); };
  const addCustomRow = () => { if (!customDesc.trim() || customMh <= 0) return; setRows(prev => [...prev, { uid: "r-" + Date.now(), std_mh_group: null, description: customDesc, unit: customUnit || "ea", is_custom: true, custom_mh: customMh, sub_items: [{ uid: "s-" + Date.now(), tag_name: "", difficulty: "Medium" as Difficulty, quantity: 0, manhour: customMh, total_mh: 0 }], total_mh: 0 }]); setCustomDesc(""); setCustomUnit("ea"); setCustomMh(0); setShowAdd(false); };

  const grandTotal = rows.reduce((s, r) => s + r.total_mh, 0);
  const handleSave = () => { const items: Partial<PlanActivityItem>[] = []; rows.forEach(row => { row.sub_items.forEach(si => { if (si.quantity > 0) items.push({ std_mh_id: row.std_mh_group?.mhByLevel[si.difficulty]?.id || null, job_no: jobNo, structure: structureKey, header: structureName, sub_header: row.description, description: si.tag_name, unit: row.unit, level: si.difficulty, plan_quantity: si.quantity, plan_manhour: si.total_mh }); }); }); onSave(items); };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 1100, width: "96%" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-family)" }}>{structureName}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!canEdit && <span className="badge badge-pending">🔒 View Only</span>}
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontFamily: "var(--font-family)" }}>Total: <strong style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{fmtNum(grandTotal)} MH</strong></span>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          {rows.length === 0 && <div className="empty-state" style={{ padding: 24 }}><p style={{ fontFamily: "var(--font-family)" }}>No items. Click "+ Add Item" below.</p></div>}
          {rows.map((row, ri) => (
            <div key={row.uid} className="card" style={{ marginBottom: 10, padding: 12, background: row.is_custom ? "rgba(108,142,255,0.03)" : "var(--color-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div><span style={{ fontWeight: 600, fontSize: 13, fontFamily: "var(--font-family)" }}>{row.description}</span>{row.is_custom && <span style={{ fontSize: 10, color: "var(--color-warning)", marginLeft: 6 }}>★ Custom</span>}<span style={{ fontSize: 11, color: "var(--color-text-dim)", marginLeft: 8, fontFamily: "var(--font-family)" }}>({row.unit})</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{fmtNum(row.total_mh)} MH</span>{canEdit && <button className="btn btn-danger btn-sm" style={{ padding: "2px 6px", fontSize: 10 }} onClick={() => removeRow(ri)}>✕</button>}</div>
              </div>
              <div className="table-wrapper"><table>
                <thead><tr><th style={{ width: 30, fontSize: 11 }}>#</th><th style={{ fontSize: 11 }}>Tag Name</th><th style={{ width: 100, fontSize: 11 }}>Difficulty</th><th style={{ width: 80, fontSize: 11 }}>MH/Unit</th><th style={{ width: 70, fontSize: 11 }}>Qty</th><th style={{ textAlign: "right", width: 90, fontSize: 11 }}>Total MH</th>{canEdit && <th style={{ width: 40 }}></th>}</tr></thead>
                <tbody>{row.sub_items.map((si, sii) => (
                  <tr key={si.uid}>
                    <td style={{ color: "var(--color-text-dim)", fontSize: 10 }}>{sii + 1}</td>
                    <td><input className="form-control" style={{ fontSize: 12, fontFamily: "var(--font-family)" }} placeholder="e.g. TR-001" value={si.tag_name} disabled={!canEdit} onChange={e => updateSubItem(ri, sii, "tag_name", e.target.value)} /></td>
                    <td><select className="form-control" style={{ fontSize: 12, fontFamily: "var(--font-family)" }} value={si.difficulty} disabled={!canEdit} onChange={e => updateSubItem(ri, sii, "difficulty", e.target.value)}>{DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{si.manhour.toFixed(2)}</td>
                    <td><input className="form-control" type="number" style={{ width: 65, fontSize: 12, fontFamily: "var(--font-mono)" }} value={si.quantity || ""} disabled={!canEdit} onChange={e => updateSubItem(ri, sii, "quantity", parseFloat(e.target.value) || 0)} /></td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: si.total_mh > 0 ? "var(--color-text)" : "var(--color-text-dim)" }}>{si.total_mh > 0 ? si.total_mh.toFixed(2) : "—"}</td>
                    {canEdit && <td><button className="btn btn-danger btn-sm" style={{ padding: "1px 5px", fontSize: 10 }} onClick={() => removeSubItem(ri, sii)}>✕</button></td>}
                  </tr>
                ))}</tbody>
              </table></div>
              {canEdit && <button className="btn btn-secondary btn-sm" style={{ marginTop: 6, fontSize: 11, fontFamily: "var(--font-family)" }} onClick={() => addSubItem(ri)}>+ Add Tag / Row</button>}
            </div>
          ))}
          {canEdit && (
            <div style={{ marginTop: 12 }}>
              {!showAdd ? <button className="btn btn-secondary btn-sm" style={{ fontFamily: "var(--font-family)" }} onClick={() => setShowAdd(true)}>+ Add Item</button> : (
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <button className={"btn btn-sm " + (addMode === "std" ? "btn-primary" : "btn-secondary")} onClick={() => setAddMode("std")}>From Std MH</button>
                    <button className={"btn btn-sm " + (addMode === "custom" ? "btn-primary" : "btn-secondary")} onClick={() => setAddMode("custom")}>Custom</button>
                  </div>
                  {addMode === "std" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                      <div className="form-group" style={{ flex: 1, minWidth: 280, marginBottom: 0 }}><label style={{ fontFamily: "var(--font-family)" }}>Select (filtered for {structureName})</label><select className="form-control" style={{ fontFamily: "var(--font-family)" }} value={selStdDesc} onChange={e => setSelStdDesc(e.target.value)}><option value="">--</option>{relevantGroups.map(g => <option key={g.description} value={g.description}>{g.description} ({g.unit}, Med: {g.mhByLevel["Medium"]?.manhour || 0})</option>)}</select></div>
                      <button className="btn btn-primary btn-sm" onClick={addStdRow} disabled={!selStdDesc}>Add</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
                    </div>
                  )}
                  {addMode === "custom" && (
                    <div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <div className="form-group" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}><label>Description *</label><input className="form-control" value={customDesc} onChange={e => setCustomDesc(e.target.value)} /></div>
                        <div className="form-group" style={{ flex: 0.5, minWidth: 80, marginBottom: 0 }}><label>Unit</label><input className="form-control" value={customUnit} onChange={e => setCustomUnit(e.target.value)} /></div>
                        <div className="form-group" style={{ flex: 0.5, minWidth: 100, marginBottom: 0 }}><label>MH/Unit *</label><input className="form-control" type="number" value={customMh || ""} onChange={e => setCustomMh(parseFloat(e.target.value) || 0)} /></div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="btn btn-primary btn-sm" onClick={addCustomRow} disabled={!customDesc.trim() || customMh <= 0}>Add</button><button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-muted)", fontFamily: "var(--font-family)" }}>Total: <strong style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{fmtNum(grandTotal)} MH</strong></span>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {canEdit && <button className="btn btn-primary" onClick={handleSave}>Save & Calculate</button>}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════ SUMMARY PAGE ══════════════════════════════════════ */
const SummaryPage: React.FC<{ job: Job; perms: RolePerms; onBack: () => void }> = ({ job, perms, onBack }) => {
  const [activities, setActivities] = useState<PlanActivityItem[]>([]);
  const [allStdMh, setAllStdMh] = useState<StdMhItem[]>([]);
  const [contingencyPct, setContingencyPct] = useState<number | "">(50);
  const [prodTimeHrs, setProdTimeHrs] = useState<number | "">(5);
  const [pob, setPob] = useState<number | "">(8);
  const [planStart, setPlanStart] = useState("");
  const [unitCost, setUnitCost] = useState<number | "">(5500);
  const [exchangeRate, setExchangeRate] = useState<number | "">(33);
  const [detailModal, setDetailModal] = useState<{ key: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(job.status);
  const [statusError, setStatusError] = useState("");
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [viewingRevision, setViewingRevision] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmAction, setConfirmAction] = useState<{ status: string; title: string; message: string; label: string; color: string } | null>(null);

  const canEdit = perms.can_edit_plan && currentStatus === "Drafting Plan";

  const load = useCallback(() => {
    Promise.all([
      api("/api/planning/plan-activities?job_no=" + job.job_no).catch(() => []),
      api("/api/master-data/standardize-manhour").catch(() => []),
      api("/api/planning/plan-summary?job_no=" + job.job_no).catch(() => null),
      api("/api/planning/revisions?job_no=" + job.job_no).catch(() => []),
    ]).then(([acts, stdmh, summary, revs]) => {
      setActivities(acts || []);
      setAllStdMh(stdmh || []);
      setRevisions(revs || []);
      if (summary && summary.id) {
        if (summary.contingency > 0) setContingencyPct(summary.contingency);
        if (summary.estimated_productive_time > 0) setProdTimeHrs(summary.estimated_productive_time);
        if (summary.estimated_pob > 0) setPob(summary.estimated_pob);
        if (summary.plan_start_date) setPlanStart(summary.plan_start_date);
        if (summary.unit_cost > 0) setUnitCost(summary.unit_cost);
        if (summary.exchange_rate > 0) setExchangeRate(summary.exchange_rate);
      } else {
        setContingencyPct(""); setProdTimeHrs(""); setPob(""); setPlanStart(""); setUnitCost(""); setExchangeRate("");
      }
      setReady(true);
    });
  }, [job.job_no]);
  useEffect(() => { load(); }, [load]);

  const stdMhGroups = useMemo(() => groupStdMh((allStdMh || []).filter(s => s.status === "Active")), [allStdMh]);
  const mhByStructure = useMemo(() => { const m: Record<string, number> = {}; (activities || []).forEach(a => { m[a.structure] = (m[a.structure] || 0) + (a.plan_manhour || 0); }); return m; }, [activities]);
  const inputTableTotal = useMemo(() => { let s = 0; SUMMARY_TEMPLATE.forEach(r => { if (r.children) r.children.forEach(c => { s += mhByStructure[c.key] || 0; }); else if (!r.pct) s += mhByStructure[r.key] || 0; }); return s; }, [mhByStructure]);

  const cPct = typeof contingencyPct === "number" ? contingencyPct : 0;
  const pHrs = typeof prodTimeHrs === "number" ? prodTimeHrs : 0;
  const pPob = typeof pob === "number" ? pob : 0;
  const uCost = typeof unitCost === "number" ? unitCost : 0;
  const exRate = typeof exchangeRate === "number" ? exchangeRate : 0;
  const pctMh = inputTableTotal * 0.05;
  const totalProductiveMh = inputTableTotal + pctMh * 3;
  const totalWithContingency = totalProductiveMh * (1 + cPct / 100);
  const estDuration = pPob > 0 && pHrs > 0 ? Math.ceil(totalWithContingency / (pPob * pHrs)) : 0;
  const totalMd = estDuration * pPob;
  const totalMh = totalMd * 12;
  const prodMd = pHrs > 0 ? Math.ceil(totalWithContingency / pHrs) : 0;
  const nonProdMd = totalMd > prodMd ? totalMd - prodMd : 0;
  const nonProdMh = nonProdMd * 12;
  const planEndDate = useMemo(() => { if (!planStart || estDuration <= 0) return ""; const d = new Date(planStart); d.setDate(d.getDate() + estDuration); return d.toISOString().split("T")[0]; }, [planStart, estDuration]);
  const directCostThb = totalMd * uCost;
  const directCostUsd = exRate > 0 ? directCostThb / exRate : 0;
  const canSubmit = contingencyPct !== "" && prodTimeHrs !== "" && pob !== "" && planStart !== "" && unitCost !== "" && exchangeRate !== "";

  const buildSaveData = () => ({ job_no: job.job_no, contingency: cPct, estimated_productive_time: pHrs, estimated_pob: pPob, plan_start_date: planStart || null, plan_end_date: planEndDate || null, unit_cost: uCost, exchange_rate: exRate, total_productive_manhour: totalProductiveMh, total_non_productive_manhour: nonProdMh, total_manhour: totalMh, project_duration: estDuration, direct_cost_thb: directCostThb, direct_cost_usd: directCostUsd, mobilization: pctMh, cleaning: pctMh, demobilization: pctMh });

  useEffect(() => {
    if (!job.job_no || !canEdit || !ready) return;
    const t = setTimeout(() => { setSaving(true); api("/api/planning/plan-summary", { method: "POST", body: JSON.stringify(buildSaveData()) }).catch(() => {}).finally(() => setSaving(false)); }, 1000);
    return () => clearTimeout(t);
  }, [contingencyPct, prodTimeHrs, pob, planStart, unitCost, exchangeRate, totalProductiveMh, canEdit, ready]);

  const manualSave = () => { setSaving(true); api("/api/planning/plan-summary", { method: "POST", body: JSON.stringify(buildSaveData()) }).then(() => load()).catch(() => {}).finally(() => setSaving(false)); };
  const getRowMh = (row: SummaryRow): number => { if (row.pct) return pctMh; if (row.children) return row.children.reduce((s, c) => s + (mhByStructure[c.key] || 0), 0); return mhByStructure[row.key] || 0; };

  const handleDetailSave = async (key: string, items: Partial<PlanActivityItem>[]) => {
    for (const a of (activities || []).filter(a => a.structure === key)) { await api("/api/planning/plan-activities/" + a.id, { method: "DELETE" }).catch(() => {}); }
    for (const item of items) { await api("/api/planning/plan-activities", { method: "POST", body: JSON.stringify(item) }).catch(() => {}); }
    setDetailModal(null); load();
  };

  const updateStatus = async (s: string) => {
    setStatusError("");
    try { await api("/api/planning/jobs/" + job.job_no, { method: "PUT", body: JSON.stringify({ status: s }) }); setCurrentStatus(s); load(); }
    catch (e: any) { setStatusError(e.message); }
  };

  const loadRevisionData = async (revId: number) => {
    try { const data = await api("/api/planning/revisions/" + revId); setViewingRevision(data.snapshot); }
    catch { setViewingRevision(null); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0]; if (!ws) { alert("No worksheet."); return; }
      const rows: any[] = [];
      ws.eachRow((row, rn) => { if (rn === 1) return; const v = row.values as any[]; rows.push({ structure: v[1] || "", header: v[2] || "", sub_header: v[3] || "", description: v[4] || "", level: v[5] || "Medium", unit: v[6] || "", plan_quantity: parseFloat(v[7]) || 0, plan_manhour: parseFloat(v[8]) || 0 }); });
      await api("/api/planning/import-activities", { method: "POST", body: JSON.stringify({ job_no: job.job_no, rows }) });
      alert("Imported " + rows.length + " rows!"); load();
    } catch (err: any) { alert("Failed: " + err.message); }
    e.target.value = "";
  };

  const downloadTemplate = async () => {
    const ExcelJS = await import("exceljs"); const { saveAs } = await import("file-saver");
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet("Plan Activities");
    ws.columns = [{ header: "Structure Key", key: "structure", width: 25 }, { header: "Header (L1)", key: "header", width: 30 }, { header: "Sub Header (L2)", key: "sub_header", width: 25 }, { header: "Description / Tag", key: "description", width: 30 }, { header: "Difficulty", key: "level", width: 12 }, { header: "Unit", key: "unit", width: 10 }, { header: "Quantity", key: "plan_quantity", width: 12 }, { header: "Manhour", key: "plan_manhour", width: 12 }];
    ws.getRow(1).eachCell(c => { c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B6FE0" } }; });
    ws.addRow({ structure: "install_piping", header: "Piping Installation", sub_header: "CS Pipe 4 inch", description: "TAG-001", level: "Medium", unit: "joint", plan_quantity: 10, plan_manhour: 80 });
    ws.addRow({ structure: "scaffold_erection", header: "Scaffolding Erection", sub_header: "Standard Scaffolding per m3", description: "Area A", level: "Low", unit: "m3", plan_quantity: 50, plan_manhour: 40 });
    const buf = await wb.xlsx.writeBuffer(); saveAs(new Blob([buf]), "PACE_Import_Template_" + job.job_no + ".xlsx");
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16, fontFamily: "var(--font-family)" }}>{job.job_no} — {job.job_name}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, fontFamily: "var(--font-family)" }}>{[job.location, job.working_platform, job.asset].filter(Boolean).join(" · ")}</div>
        </div>
        <span className={"badge " + badgeClass(currentStatus)}>{currentStatus}</span>
        {revisions.length > 0 && <span className="badge badge-draft" style={{ cursor: "pointer" }} onClick={() => setShowRevisions(!showRevisions)}>Rev {revisions.length}</span>}
        {!canEdit && currentStatus !== "Drafting Plan" && <span className="badge badge-pending">🔒 View Only</span>}
        {saving && <span style={{ fontSize: 11, color: "var(--color-text-dim)", fontFamily: "var(--font-family)" }}>💾 Saving...</span>}
      </div>

      {/* ── Team Members (view only) ── */}
      {job.project_engineer && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--color-text-dim)", marginBottom: 4, fontFamily: "var(--font-family)" }}>Team Members</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {job.project_engineer.split(",").map(m => m.trim()).filter(Boolean).map(m => (
              <span key={m} style={{ padding: "3px 10px", borderRadius: 16, fontSize: 12, background: "var(--color-primary-bg)", color: "var(--color-primary)", border: "1px solid rgba(108,142,255,0.2)", fontFamily: "var(--font-family)" }}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Status Actions ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {currentStatus === "Drafting Plan" && perms.can_submit && (
          <button className="btn btn-primary btn-sm" disabled={!canSubmit}
            onClick={() => setConfirmAction({ status: "Pending Approval", title: "Submit for Approval", message: "This will submit the plan for supervisor approval. You will not be able to edit until it is revised. Are you sure?", label: "Submit", color: "var(--color-primary)" })}
            title={!canSubmit ? "Fill all fields" : ""}>
            Submit{!canSubmit ? " (fill fields)" : ""}
          </button>
        )}
        {currentStatus === "Pending Approval" && perms.can_approve && (
          <button className="btn btn-success btn-sm"
            onClick={() => setConfirmAction({ status: "Approved Plan", title: "Approve Plan", message: "This will approve the plan and allow the contractor to start work. Are you sure?", label: "Approve", color: "var(--color-success)" })}>
            Approve
          </button>
        )}
        {currentStatus === "Approved Plan" && perms.can_start && (
          <button className="btn btn-primary btn-sm"
            onClick={() => setConfirmAction({ status: "In Progress", title: "Start Project", message: "This will change the project status to In Progress. Daily reports can be created after this. Are you sure?", label: "Start Project", color: "var(--color-primary)" })}>
            Start
          </button>
        )}
        {currentStatus === "In Progress" && perms.can_complete && (
          <button className="btn btn-success btn-sm"
            onClick={() => setConfirmAction({ status: "Completed", title: "Complete Project", message: "This will mark the project as completed. All data will be finalized. Are you sure?", label: "Complete", color: "var(--color-success)" })}>
            Complete
          </button>
        )}
        {(currentStatus === "Pending Approval" || currentStatus === "Approved Plan" || currentStatus === "In Progress") && (perms.can_revise || perms.can_edit_plan) && (
          <button className="btn btn-secondary btn-sm"
            onClick={() => setConfirmAction({ status: "Drafting Plan", title: "Revise Plan", message: "This will revert the plan to Drafting status. A revision snapshot will be saved. Are you sure you want to revise?", label: "Revise", color: "var(--color-warning)" })}>
            ↩ Revise
          </button>
        )}
        {canEdit && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={downloadTemplate}>Export Template</button>
            <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>Import</button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleImport} />
          </>
        )}
        {statusError && <span style={{ fontSize: 12, color: "var(--color-danger)", fontFamily: "var(--font-family)" }}>⚠️ {statusError}</span>}
      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        confirmLabel={confirmAction?.label}
        confirmColor={confirmAction?.color}
        onConfirm={async () => {
          if (!confirmAction) return;

          try {
            await updateStatus(confirmAction.status);
            if (confirmAction.status === "Completed") {
              window.location.href = "/manhour?job=" + job.job_no;
              return;
            }

            setConfirmAction(null);

          } catch {}
        }}
        onCancel={() => setConfirmAction(null)}
      />


      {/* ── Revision History ── */}
      {showRevisions && revisions.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 style={{ fontFamily: "var(--font-family)" }}>Revision History</h2></div>
          <div className="table-wrapper" style={{ maxHeight: 200, overflowY: "auto" }}>
            <table>
              <thead><tr><th style={{ fontSize: 11 }}>Rev</th><th style={{ fontSize: 11 }}>Status</th><th style={{ fontSize: 11 }}>Action</th><th style={{ fontSize: 11 }}>Date</th><th style={{ fontSize: 11 }}>By</th><th style={{ fontSize: 11 }}></th></tr></thead>
              <tbody>
                {revisions.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.revision}</td>
                    <td><span className={"badge " + badgeClass(r.status)} style={{ fontSize: 10 }}>{r.status}</span></td>
                    <td><span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-family)", color: r.action === "Revise" ? "var(--color-warning)" : r.action === "Approve" ? "var(--color-success)" : r.action === "Submit" ? "var(--color-primary)" : r.action === "Start" ? "var(--color-accent)" : r.action === "Complete" ? "var(--color-success)" : "var(--color-text-muted)" }}>{r.action || "—"}</span></td>
                    <td style={{ fontSize: 12, fontFamily: "var(--font-family)" }}>{fmtDate(r.created_date)}</td>
                    <td style={{ fontSize: 12, fontFamily: "var(--font-family)" }}>{r.created_by}</td>
                    <td><button className="btn btn-secondary btn-sm" style={{ fontSize: 10 }} onClick={() => loadRevisionData(r.id)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {viewingRevision && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", fontSize: 12, fontFamily: "var(--font-family)" }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--color-text-muted)" }}>Revision Snapshot (View Only)</div>
              {viewingRevision.summary && (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11 }}>
                  <span>Total MH: <strong style={{ fontFamily: "var(--font-mono)" }}>{viewingRevision.summary.total_manhour?.toFixed(0) || 0}</strong></span>
                  <span>Duration: <strong style={{ fontFamily: "var(--font-mono)" }}>{viewingRevision.summary.project_duration || 0} days</strong></span>
                  <span>POB: <strong style={{ fontFamily: "var(--font-mono)" }}>{viewingRevision.summary.estimated_pob || 0}</strong></span>
                  <span>Start: <strong>{fmtDate(viewingRevision.summary.plan_start_date)}</strong></span>
                  <span>End: <strong>{fmtDate(viewingRevision.summary.plan_end_date)}</strong></span>
                  <span>Cost THB: <strong style={{ fontFamily: "var(--font-mono)" }}>{fmtNum(viewingRevision.summary.direct_cost_thb || 0)}</strong></span>
                </div>
              )}
              {viewingRevision.activities && viewingRevision.activities.length > 0 && <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-text-dim)" }}>{viewingRevision.activities.length} plan activities in this revision.</div>}
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, fontSize: 10 }} onClick={() => setViewingRevision(null)}>Close Snapshot</button>
            </div>
          )}
        </div>
      )}

      {/* ── Summary Table ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h2 style={{ fontFamily: "var(--font-family)" }}>Plan Summary</h2></div>
        <div className="table-wrapper"><table>
          <thead><tr><th style={{ width: 50, fontSize: 11 }}>No.</th><th style={{ fontSize: 11 }}>Structure</th><th style={{ fontSize: 11 }}>Basis</th><th style={{ textAlign: "right", width: 120, fontSize: 11 }}>SUM MH</th><th style={{ width: 50, fontSize: 11 }}>Unit</th><th style={{ width: 80 }}></th></tr></thead>
          <tbody>
            {SUMMARY_TEMPLATE.map(row => (
              <React.Fragment key={row.no}>
                <tr style={row.children ? { background: "var(--color-surface-2)", fontWeight: 600 } : {}}>
                  <td style={{ fontFamily: "var(--font-family)" }}>{row.no}</td>
                  <td style={{ fontFamily: "var(--font-family)" }}>{row.structure}</td>
                  <td style={{ color: "var(--color-text-muted)", fontSize: 12, fontFamily: "var(--font-family)" }}>{row.basis}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: getRowMh(row) > 0 ? "var(--color-text)" : "var(--color-text-dim)" }}>{fmtNum(getRowMh(row))}</td>
                  <td style={{ fontFamily: "var(--font-family)" }}>MH</td>
                  <td>{!row.children && !row.pct && <button className="btn btn-primary btn-sm" onClick={() => setDetailModal({ key: row.key, name: row.structure })}>{canEdit ? "Input" : "View"}</button>}</td>
                </tr>
                {row.children?.map(c => (
                  <tr key={c.no}>
                    <td style={{ paddingLeft: 28, color: "var(--color-text-muted)", fontFamily: "var(--font-family)" }}>{c.no}</td>
                    <td style={{ fontFamily: "var(--font-family)" }}>{c.structure}</td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: 12, fontFamily: "var(--font-family)" }}>{c.basis}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: (mhByStructure[c.key] || 0) > 0 ? "var(--color-text)" : "var(--color-text-dim)" }}>{fmtNum(mhByStructure[c.key] || 0)}</td>
                    <td style={{ fontFamily: "var(--font-family)" }}>MH</td>
                    <td><button className="btn btn-primary btn-sm" onClick={() => setDetailModal({ key: c.key, name: c.structure })}>{canEdit ? "Input" : "View"}</button></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* ── Calculation ── */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontFamily: "var(--font-family)" }}>Calculation</h2>
          {canEdit && <button className="btn btn-primary" onClick={manualSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>}
        </div>
        <div className="table-wrapper"><table><tbody>
          <tr><td style={{ fontWeight: 600, fontFamily: "var(--font-family)" }}>Total Productive MH</td><td style={{ color: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-family)" }}>= Σ Input items + 5%×3 (Mob+Clean+Demob)</td><td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-danger)" }}>{fmtNum(totalProductiveMh)}</td><td style={{ fontFamily: "var(--font-family)" }}>MH</td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Contingency</td><td><div style={{ display: "flex", alignItems: "center", gap: 4 }}><input className="form-control" type="number" style={{ width: 80, fontFamily: "var(--font-mono)" }} value={contingencyPct} disabled={!canEdit} placeholder="%" onChange={e => setContingencyPct(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)} /><span style={{ fontFamily: "var(--font-family)" }}>%</span></div></td><td style={{ fontFamily: "var(--font-mono)" }}>{fmtNum(totalWithContingency)}</td><td style={{ fontFamily: "var(--font-family)" }}>MH</td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Productive time</td><td><input className="form-control" type="number" style={{ width: 80, fontFamily: "var(--font-mono)" }} value={prodTimeHrs} disabled={!canEdit} placeholder="hrs" onChange={e => setProdTimeHrs(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)} /></td><td style={{ fontFamily: "var(--font-mono)" }}>{prodTimeHrs}</td><td style={{ fontFamily: "var(--font-family)" }}>Hrs/day</td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>POB/Day</td><td><input className="form-control" type="number" style={{ width: 80, fontFamily: "var(--font-mono)" }} value={pob} disabled={!canEdit} placeholder="POB" onChange={e => setPob(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)} /></td><td style={{ fontFamily: "var(--font-mono)" }}>{pob}</td><td style={{ fontFamily: "var(--font-family)" }}>POBs</td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Duration</td><td style={{ color: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-family)" }}>= ⌈ {fmtNum(totalWithContingency)} ÷ ({pPob} × {pHrs}) ⌉</td><td style={{ fontFamily: "var(--font-mono)" }}>{estDuration}</td><td style={{ fontFamily: "var(--font-family)" }}>Days</td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Total MD</td><td style={{ color: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-family)" }}>= Duration × POB = {estDuration} × {pPob}</td><td style={{ fontFamily: "var(--font-mono)" }}>{totalMd}</td><td style={{ fontFamily: "var(--font-family)" }}>MD</td></tr>
          <tr><td style={{ fontWeight: 600, fontFamily: "var(--font-family)" }}>Total MH</td><td style={{ color: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-family)" }}>= Total MD × 12 hrs/day = {totalMd} × 12</td><td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-danger)" }}>{fmtNum(totalMh)}</td><td style={{ fontFamily: "var(--font-family)" }}>MH</td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Non Productive MD</td><td style={{ color: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-family)" }}>= Total MD − ⌈MH÷Hrs⌉ = {totalMd} − {prodMd}</td><td style={{ fontFamily: "var(--font-mono)" }}>{nonProdMd}</td><td style={{ fontFamily: "var(--font-family)" }}>MD</td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Non Productive MH</td><td style={{ color: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-family)" }}>= {nonProdMd} × 12</td><td style={{ fontFamily: "var(--font-mono)" }}>{nonProdMh}</td><td style={{ fontFamily: "var(--font-family)" }}>MH</td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Plan to start</td><td><input className="form-control" type="date" style={{ width: 160, fontFamily: "var(--font-family)" }} value={planStart} disabled={!canEdit} onChange={e => setPlanStart(e.target.value)} /></td><td style={{ fontFamily: "var(--font-mono)" }}>{fmtDate(planStart)}</td><td></td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Plan to finish</td><td style={{ color: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-family)" }}>= Start + {estDuration} days</td><td style={{ fontFamily: "var(--font-mono)" }}>{fmtDate(planEndDate)}</td><td></td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Unit cost/MD</td><td><input className="form-control" type="number" style={{ width: 120, fontFamily: "var(--font-mono)" }} value={unitCost} disabled={!canEdit} placeholder="THB" onChange={e => setUnitCost(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)} /></td><td style={{ fontFamily: "var(--font-mono)" }}>{unitCost}</td><td style={{ fontFamily: "var(--font-family)" }}>THB/MD</td></tr>
          <tr><td style={{ fontFamily: "var(--font-family)" }}>Exchange Rate</td><td><input className="form-control" type="number" style={{ width: 120, fontFamily: "var(--font-mono)" }} value={exchangeRate} disabled={!canEdit} placeholder="THB/US$" onChange={e => setExchangeRate(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)} /></td><td style={{ fontFamily: "var(--font-mono)" }}>{exchangeRate}</td><td style={{ fontFamily: "var(--font-family)" }}>THB/US$</td></tr>
          <tr><td style={{ fontWeight: 600, fontFamily: "var(--font-family)" }}>Direct Cost THB</td><td style={{ color: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-family)" }}>= Total MD × Unit cost = {totalMd} × {uCost}</td><td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-success)" }}>{fmtNum(directCostThb)}</td><td style={{ fontFamily: "var(--font-family)" }}>THB</td></tr>
          <tr><td style={{ fontWeight: 600, fontFamily: "var(--font-family)" }}>Direct Cost US$</td><td style={{ color: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-family)" }}>= {fmtNum(directCostThb)} ÷ {exRate}</td><td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-success)" }}>{fmtNum(directCostUsd)}</td><td style={{ fontFamily: "var(--font-family)" }}>US$</td></tr>
        </tbody></table></div>
      </div>

      {detailModal && <DetailModal jobNo={job.job_no} structureKey={detailModal.key} structureName={detailModal.name} stdMhGroups={stdMhGroups} activities={(activities || []).filter(a => a.structure === detailModal.key)} canEdit={canEdit} onSave={items => handleDetailSave(detailModal.key, items)} onClose={() => setDetailModal(null)} />}
    </div>
  );
};

/* ══════════════════════════════════════ LIST PAGE ══════════════════════════════════════ */
const PlanningPage: React.FC = () => {
  const [page, setPage] = useState<Page>("list");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wpMappings, setWpMappings] = useState<WpMapping[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [cf, setCf] = useState<Record<string, string>>({ type: "project" });
  const [creating, setCreating] = useState(false);
  const [perms, setPerms] = useState<RolePerms>({ role: "", can_create: false, can_edit_plan: false, can_delete: false, can_submit: false, can_approve: false, can_start: false, can_complete: false });
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const currentRole = useCurrentRole();

  // Filters
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("");
  const [fAsset, setFAsset] = useState("");
  const [fPlatform, setFPlatform] = useState("");
  const [fCompany, setFCompany] = useState("");
  const [fJobType, setFJobType] = useState("");
  const [fSub1, setFSub1] = useState("");
  const [fSub2, setFSub2] = useState("");
  const [fStatus, setFStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadPerms = useCallback(() => {
    fetch("/api/planning/role-permissions", { headers: apiH() })
      .then(r => r.json())
      .then(d => { if (d && d.role) setPerms(d); })
      .catch(() => {
        const role = (localStorage.getItem("pace-role") || "").toLowerCase();
        setPerms({
          role,
          can_create: ["engineer", "assistant_supervisor", "administrator"].includes(role),
          can_edit_plan: ["engineer", "assistant_supervisor", "administrator"].includes(role),
          can_delete: role === "administrator",
          can_submit: ["engineer", "assistant_supervisor", "administrator"].includes(role),
          can_approve: ["supervisor", "administrator"].includes(role),
          can_revise: ["engineer", "assistant_supervisor", "administrator"].includes(role),
          can_start: ["contractor", "administrator"].includes(role),
          can_complete: ["contractor", "administrator"].includes(role),
        });
      });
  }, [currentRole]);

  const load = useCallback(() => {
    Promise.all([
      api("/api/planning/jobs"),
      api("/api/master-data/working-platform-mappings"),
      api("/api/master-data/job-types"),
      api("/api/master-data/companies"),
    ]).then(([j, wp, jt, co]) => {
      setJobs(j || []);
      setWpMappings(wp || []);
      setJobTypes(jt || []);
      setCompanies(co || []);
    }).catch(() => {});
    loadPerms();
  }, [loadPerms]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadPerms(); }, [currentRole, loadPerms]);

  // URL param: ?job=XXX
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const jn = p.get("job");
    if (jn && jobs.length > 0) {
      const f = jobs.find(j => j.job_no === jn);
      if (f) { setSelectedJob(f); setPage("summary"); }
    }
  }, [jobs]);

  // Memoized lookups
  const activeWp = useMemo(() => (wpMappings || []).filter(m => m.status === "Active"), [wpMappings]);
  const uniqueAssets = useMemo(() => [...new Set(activeWp.map(m => m.asset))].sort(), [activeWp]);
  const uniquePlatforms = useMemo(() => [...new Set(activeWp.filter(m => !fAsset || m.asset === fAsset).map(m => m.working_platform))].sort(), [activeWp, fAsset]);
  const ajt = useMemo(() => (jobTypes || []).filter(j => j.status === "Active"), [jobTypes]);
  const ac = useMemo(() => (companies || []).filter(c => c.status === "Active"), [companies]);
  const uL1 = useMemo(() => [...new Set(ajt.map(j => j.description_l1).filter(Boolean))].sort(), [ajt]);
  const uL2 = useMemo(() => [...new Set(ajt.filter(j => !fJobType || j.description_l1 === fJobType).map(j => j.description_l2).filter(Boolean))].sort(), [ajt, fJobType]);
  const uL3 = useMemo(() => [...new Set(ajt.filter(j => (!fJobType || j.description_l1 === fJobType) && (!fSub1 || j.description_l2 === fSub1)).map(j => j.description_l3).filter(Boolean))].sort(), [ajt, fJobType, fSub1]);

  // Create form cascading
  const cfL2 = useMemo(() => [...new Set(ajt.filter(j => !cf.job_type || j.description_l1 === cf.job_type).map(j => j.description_l2).filter(Boolean))].sort(), [ajt, cf.job_type]);
  const cfL3 = useMemo(() => [...new Set(ajt.filter(j => (!cf.job_type || j.description_l1 === cf.job_type) && (!cf.sub_type || j.description_l2 === cf.sub_type)).map(j => j.description_l3).filter(Boolean))].sort(), [ajt, cf.job_type, cf.sub_type]);

  // Filter
  const filtered = useMemo(() => (jobs || []).filter(j => {
    if (fStatus && j.status !== fStatus) return false;
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
  }), [jobs, search, fStatus, fType, fAsset, fPlatform, fCompany, fJobType, fSub1, fSub2]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((safePage - 1) * pageSize, safePage * pageSize), [filtered, safePage, pageSize]);
  useEffect(() => { setCurrentPage(1); }, [search, fStatus, fType, fAsset, fPlatform, fCompany, fJobType, fSub1, fSub2, pageSize]);

  const hasFilters = fType || fAsset || fPlatform || fCompany || fJobType || fSub1 || fSub2 || fStatus;
  const clearFilters = () => { setFType(""); setFAsset(""); setFPlatform(""); setFCompany(""); setFJobType(""); setFSub1(""); setFSub2(""); setFStatus(""); setSearch(""); };

  // Create job
  const createJob = async () => {
    const jn = (cf.job_no || "").trim();
    if (!jn) { setError("No is required."); return; }
    if (!cf.job_name?.trim()) { setError("Name is required."); return; }
    if (jobs.find(j => j.job_no === jn)) { setError("\"" + jn + "\" already exists."); return; }
    setError(""); setCreating(true);
    try {
      await api("/api/planning/jobs", { method: "POST", body: JSON.stringify({
        job_no: jn, job_name: cf.job_name || "", job_type: cf.job_type || "",
        sub_type: cf.sub_type || "", discipline: cf.sub_type2 || "",
        location: cf.asset || "", working_platform: cf.platform || "",
        asset: cf.company || "", group: cf.type || "project",
        status: "Drafting Plan", project_engineer: cf.team || "",
      }) });
      const nj = await api("/api/planning/jobs/" + jn);
      setShowCreate(false); setCf({ type: "project" }); load();
      setSelectedJob(nj); setPage("summary");
    } catch (e: any) { setError(e.message); } finally { setCreating(false); }
  };

  // Update job
  const updateJob = async () => {
    if (!editingJob) return;
    try {
      await api("/api/planning/jobs/" + editingJob.job_no, { method: "PUT", body: JSON.stringify({
        job_name: editingJob.job_name, job_type: editingJob.job_type,
        sub_type: editingJob.sub_type, discipline: editingJob.discipline,
        location: editingJob.location, working_platform: editingJob.working_platform,
        asset: editingJob.asset, group: editingJob.group,
        project_engineer: editingJob.project_engineer || "",
      }) });
      setEditingJob(null); load();
    } catch (e: any) { alert("Failed: " + e.message); }
  };

  // Delete job
  const deleteJob = async (jn: string) => {
    if (!confirm("Delete " + jn + "? This will also delete all plan data.")) return;
    try { await api("/api/planning/jobs/" + jn, { method: "DELETE" }); load(); }
    catch (e: any) { alert("Failed: " + e.message); }
  };

  // Summary page
  if (page === "summary" && selectedJob) {
    return <SummaryPage job={selectedJob} perms={perms} onBack={() => { setPage("list"); setSelectedJob(null); load(); window.history.replaceState({}, "", "/planning"); }} />;
  }

  return (
    <div>
      {/* ── Filters ── */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <input className="form-control" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ fontFamily: "var(--font-family)" }} />
          </div>
          <div style={{ minWidth: 100 }}>
            <select className="form-control" value={fType} onChange={e => setFType(e.target.value)} style={{ fontFamily: "var(--font-family)" }}>
              <option value="">All Types</option><option value="project">Project</option><option value="notification">Notification</option>
            </select>
          </div>
          <div style={{ minWidth: 100 }}>
            <select className="form-control" value={fStatus} onChange={e => setFStatus(e.target.value)} style={{ fontFamily: "var(--font-family)" }}>
              <option value="">All Status</option>
              {["Drafting Plan", "Pending Approval", "Approved Plan", "In Progress", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 100 }}>
            <select className="form-control" value={fAsset} onChange={e => { setFAsset(e.target.value); setFPlatform(""); }} style={{ fontFamily: "var(--font-family)" }}>
              <option value="">All Assets</option>{uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 100 }}>
            <select className="form-control" value={fPlatform} onChange={e => setFPlatform(e.target.value)} style={{ fontFamily: "var(--font-family)" }}>
              <option value="">All Platforms</option>{uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 100 }}>
            <select className="form-control" value={fCompany} onChange={e => setFCompany(e.target.value)} style={{ fontFamily: "var(--font-family)" }}>
              <option value="">All Companies</option>{ac.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 100 }}>
            <select className="form-control" value={fJobType} onChange={e => { setFJobType(e.target.value); setFSub1(""); setFSub2(""); }} style={{ fontFamily: "var(--font-family)" }}>
              <option value="">All Job Types</option>{uL1.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {fJobType && (
            <div style={{ minWidth: 100 }}>
              <select className="form-control" value={fSub1} onChange={e => { setFSub1(e.target.value); setFSub2(""); }} style={{ fontFamily: "var(--font-family)" }}>
                <option value="">All Sub 1</option>{uL2.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
          {fSub1 && (
            <div style={{ minWidth: 100 }}>
              <select className="form-control" value={fSub2} onChange={e => setFSub2(e.target.value)} style={{ fontFamily: "var(--font-family)" }}>
                <option value="">All Sub 2</option>{uL3.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
          {(hasFilters || search) && <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ height: 34 }}>Clear</button>}
          {perms.can_create && <button className="btn btn-primary btn-sm" onClick={() => { setShowCreate(true); setError(""); }} style={{ height: 34 }}>+ New</button>}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-dim)", marginTop: 8, fontFamily: "var(--font-family)" }}>
          Showing {paginated.length} of {filtered.length}{filtered.length !== jobs.length && " (from " + jobs.length + ")"}
        </div>
      </div>

      {/* ── Create Form ── */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 style={{ fontFamily: "var(--font-family)" }}>Create New Project</h2></div>
          {error && <div style={{ padding: "8px 12px", marginBottom: 12, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 6, color: "var(--color-danger)", fontSize: 13, fontFamily: "var(--font-family)" }}>⚠️ {error}</div>}
          {/* Line 1: Type, No, Name */}
          <div className="form-row" style={{ marginBottom: 8 }}>
            <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Type *</label><select className="form-control" value={cf.type || "project"} onChange={e => setCf({ ...cf, type: e.target.value })} style={{ fontFamily: "var(--font-family)" }}><option value="project">Project</option><option value="notification">Notification</option></select></div>
            <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>{cf.type === "notification" ? "Notification No *" : "Project No *"}</label><input className="form-control" placeholder="e.g. ER-MOD-26001" value={cf.job_no || ""} onChange={e => setCf({ ...cf, job_no: e.target.value })} style={{ fontFamily: "var(--font-family)" }} /></div>
            <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>{cf.type === "notification" ? "Notification Name *" : "Project Name *"}</label><input className="form-control" placeholder="Enter name..." value={cf.job_name || ""} onChange={e => setCf({ ...cf, job_name: e.target.value })} style={{ fontFamily: "var(--font-family)" }} /></div>
          </div>
          {/* Line 2: Asset, Platform, Company */}
          <div className="form-row" style={{ marginBottom: 8 }}>
            <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Asset</label><select className="form-control" value={cf.asset || ""} onChange={e => setCf({ ...cf, asset: e.target.value, platform: "" })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
            <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Platform</label><select className="form-control" value={cf.platform || ""} onChange={e => setCf({ ...cf, platform: e.target.value })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{activeWp.filter(m => m.asset === cf.asset).map(m => <option key={m.id} value={m.working_platform}>{m.working_platform}</option>)}</select></div>
            <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Company</label><select className="form-control" value={cf.company || ""} onChange={e => setCf({ ...cf, company: e.target.value })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{ac.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          </div>
          {/* Line 3: Job Type, Sub 1, Sub 2 */}
          <div className="form-row" style={{ marginBottom: 8 }}>
            <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Job Type</label><select className="form-control" value={cf.job_type || ""} onChange={e => setCf({ ...cf, job_type: e.target.value, sub_type: "", sub_type2: "" })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{uL1.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Sub Type 1</label><select className="form-control" value={cf.sub_type || ""} onChange={e => setCf({ ...cf, sub_type: e.target.value, sub_type2: "" })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{cfL2.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Sub Type 2</label><select className="form-control" value={cf.sub_type2 || ""} onChange={e => setCf({ ...cf, sub_type2: e.target.value })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{cfL3.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
          </div>
          {/* Line 4: Team Members */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontFamily: "var(--font-family)", fontSize: 12, fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 5, display: "block" }}>Team Members</label>
            <TeamMemberInput
              value={(cf.team || "").split(",").map(s => s.trim()).filter(Boolean)}
              onChange={members => setCf({ ...cf, team: members.join(", ") })}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={createJob} disabled={creating}>{creating ? "Creating..." : "Create"}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setError(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingJob && (
        <div className="modal-overlay open" onClick={() => setEditingJob(null)}>
          <div className="modal" style={{ maxWidth: 640, width: "95%" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: "var(--font-family)" }}>Edit {editingJob.job_no}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingJob(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Line 1 */}
              <div className="form-row" style={{ marginBottom: 8 }}>
                <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Type</label><select className="form-control" value={editingJob.group || "project"} onChange={e => setEditingJob({ ...editingJob, group: e.target.value })} style={{ fontFamily: "var(--font-family)" }}><option value="project">Project</option><option value="notification">Notification</option></select></div>
                <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Name</label><input className="form-control" value={editingJob.job_name || ""} onChange={e => setEditingJob({ ...editingJob, job_name: e.target.value })} style={{ fontFamily: "var(--font-family)" }} /></div>
              </div>
              {/* Line 2 */}
              <div className="form-row" style={{ marginBottom: 8 }}>
                <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Asset</label><select className="form-control" value={editingJob.location || ""} onChange={e => setEditingJob({ ...editingJob, location: e.target.value, working_platform: "" })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Platform</label><select className="form-control" value={editingJob.working_platform || ""} onChange={e => setEditingJob({ ...editingJob, working_platform: e.target.value })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{activeWp.filter(m => m.asset === editingJob.location).map(m => <option key={m.id} value={m.working_platform}>{m.working_platform}</option>)}</select></div>
                <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Company</label><select className="form-control" value={editingJob.asset || ""} onChange={e => setEditingJob({ ...editingJob, asset: e.target.value })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{ac.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              </div>
              {/* Line 3 */}
              <div className="form-row" style={{ marginBottom: 8 }}>
                <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Job Type</label><select className="form-control" value={editingJob.job_type || ""} onChange={e => setEditingJob({ ...editingJob, job_type: e.target.value, sub_type: "", discipline: "" })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{uL1.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Sub 1</label><select className="form-control" value={editingJob.sub_type || ""} onChange={e => setEditingJob({ ...editingJob, sub_type: e.target.value, discipline: "" })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{[...new Set(ajt.filter(j => !editingJob.job_type || j.description_l1 === editingJob.job_type).map(j => j.description_l2).filter(Boolean))].map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                <div className="form-group"><label style={{ fontFamily: "var(--font-family)" }}>Sub 2</label><select className="form-control" value={editingJob.discipline || ""} onChange={e => setEditingJob({ ...editingJob, discipline: e.target.value })} style={{ fontFamily: "var(--font-family)" }}><option value="">--</option>{[...new Set(ajt.filter(j => (!editingJob.job_type || j.description_l1 === editingJob.job_type) && (!editingJob.sub_type || j.description_l2 === editingJob.sub_type)).map(j => j.description_l3).filter(Boolean))].map(l => <option key={l} value={l}>{l}</option>)}</select></div>
              </div>
              {/* Line 4: Team Members */}
              <div style={{ marginTop: 4 }}>
                <label style={{ fontFamily: "var(--font-family)", fontSize: 12, fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 5, display: "block" }}>Team Members</label>
                <TeamMemberInput
                  value={(editingJob.project_engineer || "").split(",").map(s => s.trim()).filter(Boolean)}
                  onChange={members => setEditingJob({ ...editingJob, project_engineer: members.join(", ") })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingJob(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={updateJob}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Job Table ── */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ fontSize: 11 }}>#</th>
                <th style={{ fontSize: 11 }}>Job No</th>
                <th style={{ fontSize: 11 }}>Name</th>
                <th style={{ fontSize: 11 }}>Type</th>
                <th style={{ fontSize: 11 }}>Asset</th>
                <th style={{ fontSize: 11 }}>Platform</th>
                <th style={{ fontSize: 11 }}>Company</th>
                <th style={{ fontSize: 11 }}>Job Type</th>
                <th style={{ fontSize: 11 }}>Team</th>
                <th style={{ fontSize: 11 }}>Status</th>
                <th style={{ fontSize: 11 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: 32, fontFamily: "var(--font-family)" }}>No projects.</td></tr>
              )}
              {paginated.map((j, idx) => (
                <tr key={j.job_no}>
                  <td style={{ color: "var(--color-text-dim)", fontSize: 11 }}>{(safePage - 1) * pageSize + idx + 1}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{j.job_no}</td>
                  <td style={{ fontFamily: "var(--font-family)" }}>{j.job_name}</td>
                  <td><span className="badge badge-draft" style={{ textTransform: "capitalize" }}>{j.group || "project"}</span></td>
                  <td style={{ fontFamily: "var(--font-family)", fontSize: 12 }}>{j.location}</td>
                  <td style={{ fontFamily: "var(--font-family)", fontSize: 12 }}>{j.working_platform}</td>
                  <td style={{ fontFamily: "var(--font-family)", fontSize: 12 }}>{j.asset}</td>
                  <td style={{ fontSize: 12, fontFamily: "var(--font-family)" }}>{j.job_type}{j.sub_type ? " / " + j.sub_type : ""}</td>
                  <td style={{ fontSize: 11, color: "var(--color-text-muted)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-family)" }} title={j.project_engineer}>{j.project_engineer || "—"}</td>
                  <td><span className={"badge " + badgeClass(j.status)}>{j.status}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn btn-primary btn-sm" style={{ marginRight: 4 }} onClick={() => { setSelectedJob(j); setPage("summary"); }}>Detail</button>
                    {perms.can_edit_plan && <button className="btn btn-secondary btn-sm" style={{ marginRight: 4 }} onClick={() => setEditingJob({ ...j })}>Edit</button>}
                    {perms.can_delete && <button className="btn btn-danger btn-sm" onClick={() => deleteJob(j.job_no)}>Del</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, padding: "12px 0", borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-family)" }}>
            <span>Show</span>
            <select className="form-control" value={pageSize} onChange={e => setPageSize(parseInt(e.target.value))} style={{ width: 70, padding: "4px 8px", fontSize: 12 }}>
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>per page</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-family)" }}>Page {safePage} of {totalPages}</div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn btn-secondary btn-sm" disabled={safePage <= 1} onClick={() => setCurrentPage(1)} style={{ padding: "4px 8px", fontSize: 11 }}>««</button>
            <button className="btn btn-secondary btn-sm" disabled={safePage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} style={{ padding: "4px 10px", fontSize: 11 }}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: "4px", fontSize: 11, color: "var(--color-text-dim)" }}>…</span>}
                  <button className={"btn btn-sm " + (p === safePage ? "btn-primary" : "btn-secondary")} onClick={() => setCurrentPage(p)} style={{ padding: "4px 10px", fontSize: 11, minWidth: 32 }}>{p}</button>
                </React.Fragment>
              ))
            }
            <button className="btn btn-secondary btn-sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} style={{ padding: "4px 10px", fontSize: 11 }}>›</button>
            <button className="btn btn-secondary btn-sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage(totalPages)} style={{ padding: "4px 8px", fontSize: 11 }}>»»</button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<PlanningPage />);