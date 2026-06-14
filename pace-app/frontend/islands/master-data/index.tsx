import React, { useEffect, useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";

/* ══════════════════════════════════════ TYPES ══════════════════════════════════════ */
interface PermData {
  roles: string[];
  features: { key: string; label: string }[];
  access_levels: string[];
  permissions: Record<string, Record<string, { id: number; access_level: string }>>;
}

type TabKey = "assets" | "working-platforms" | "wp-mappings" | "quarter-platforms" | "qp-mappings" | "job-types" | "groups" | "companies" | "positions" | "rate-types" | "contractors" | "contractor-rates" | "equipment" | "equipment-rates" | "std-manhour" | "roles" | "user-roles" | "role-permissions";

const ALL_TABS: { key: TabKey; label: string; feature: string }[] = [
  { key: "assets", label: "Asset", feature: "master_data.asset" },
  { key: "working-platforms", label: "Working Platform", feature: "master_data.working_platform" },
  { key: "wp-mappings", label: "WP Mapping", feature: "master_data.working_platform_mapping" },
  { key: "quarter-platforms", label: "Quarter Platform", feature: "master_data.quarter_platform" },
  { key: "qp-mappings", label: "QP Mapping", feature: "master_data.quarter_platform_mapping" },
  { key: "job-types", label: "Job Type", feature: "master_data.job_type" },
  { key: "groups", label: "Group", feature: "master_data.group" },
  { key: "companies", label: "Company", feature: "master_data.company" },
  { key: "positions", label: "Position", feature: "master_data.position" },
  { key: "rate-types", label: "Rate Type", feature: "master_data.rate_type" },
  { key: "contractors", label: "Contractor", feature: "master_data.contractor" },
  { key: "contractor-rates", label: "Contractor Rate", feature: "master_data.contractor_rate" },
  { key: "equipment", label: "Equipment", feature: "master_data.equipment" },
  { key: "equipment-rates", label: "Equipment Rate", feature: "master_data.equipment_rate" },
  { key: "std-manhour", label: "Std Manhour", feature: "master_data.std_manhour" },
  { key: "roles", label: "Role", feature: "master_data.role" },
  { key: "user-roles", label: "User Role", feature: "master_data.user_role" },
  { key: "role-permissions", label: "Role Permission", feature: "master_data.role_permission" },
];

const STATUS_OPTIONS = [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }];

/* ══════════════════════════════════════ HELPERS ══════════════════════════════════════ */
const apiH = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "X-User-Role": localStorage.getItem("pace-role") || "administrator",
  "X-User-Name": localStorage.getItem("pace-user-name") || "Dev User",
});

const api = (path: string, opts?: RequestInit) =>
  fetch(path, { headers: apiH(), ...opts }).then(r => {
    if (r.status === 403) throw new Error("Access denied");
    return r.json();
  });

function fmtDate(val: string | null): string {
  if (!val) return "—";
  try {
    const d = new Date(val);
    const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return String(d.getDate()).padStart(2, "0") + " " + M[d.getMonth()] + " " + d.getFullYear();
  } catch {
    return val;
  }
}

function statusBadge(s: string) {
  return <span className={"badge " + (s === "Active" ? "badge-active" : "badge-inactive")}>{s}</span>;
}

function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="form-control" value={value} onChange={e => onChange(e.target.value)}>
      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  );
}

/* ══════════════════════════════════════ COLUMN CONFIG ══════════════════════════════════════ */
interface ColConfig {
  key: string;
  label: string;
  type?: string;
  options?: string[];
}

/* ══════════════════════════════════════ SCROLLABLE TABS ══════════════════════════════════════ */
const ScrollableTabs: React.FC<{
  tabs: { key: string; label: string }[];
  activeTab: string;
  onSelect: (key: string) => void;
}> = ({ tabs, activeTab, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 5);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, tabs]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  // Auto-scroll active tab into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(".tab-btn.active") as HTMLElement;
    if (activeBtn) {
      const elRect = el.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      if (btnRect.left < elRect.left) {
        el.scrollBy({ left: btnRect.left - elRect.left - 20, behavior: "smooth" });
      } else if (btnRect.right > elRect.right) {
        el.scrollBy({ left: btnRect.right - elRect.right + 20, behavior: "smooth" });
      }
    }
  }, [activeTab]);

  return (
    <div className="tabs-container">
      {showLeft && (
        <button className="tabs-arrow" onClick={() => scroll(-1)} title="Scroll left">◀</button>
      )}
      <div className="tabs" ref={scrollRef} style={{ marginBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={"tab-btn " + (activeTab === tab.key ? "active" : "")}
            onClick={() => onSelect(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {showRight && (
        <button className="tabs-arrow" onClick={() => scroll(1)} title="Scroll right">▶</button>
      )}
    </div>
  );
};

/* ══════════════════════════════════════ GENERIC CRUD TAB ══════════════════════════════════════ */
const CrudTab: React.FC<{
  endpoint: string;
  editable: boolean;
  cols: ColConfig[];
}> = ({ endpoint, editable, cols }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(() => {
    api(endpoint).then(setRows).catch(() => setRows([]));
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const updateField = (key: string, value: any) => {
    const next = { ...form };
    next[key] = value;
    setForm(next);
  };

  const save = async () => {
    try {
      if (editId) {
        await api(endpoint + "/" + editId, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await api(endpoint, { method: "POST", body: JSON.stringify(form) });
      }
      setShowForm(false); setForm({}); setEditId(null); load();
    } catch {
      alert("Access denied or save failed.");
    }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this record?")) return;
    try { await api(endpoint + "/" + id, { method: "DELETE" }); load(); }
    catch { alert("Access denied or delete failed."); }
  };

  return (
    <div>
      {editable && (
        <div className="toolbar"><div /><button className="btn btn-primary btn-sm" onClick={() => { setForm({ status: "Active" }); setEditId(null); setShowForm(true); }}>+ Add</button></div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-row">
            {cols.map(c => (
              <div className="form-group" key={c.key}>
                <label>{c.label}</label>
                {c.options ? (
                  <select className="form-control" value={form[c.key] || ""} onChange={e => updateField(c.key, e.target.value)}>
                    <option value="">-- Select --</option>
                    {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : c.type === "number" ? (
                  <input className="form-control" type="number" step="0.01" value={form[c.key] ?? ""} onChange={e => updateField(c.key, parseFloat(e.target.value) || 0)} />
                ) : (
                  <input className="form-control" value={form[c.key] || ""} onChange={e => updateField(c.key, e.target.value)} />
                )}
              </div>
            ))}
            <div className="form-group"><label>Status</label><StatusSelect value={form.status || "Active"} onChange={v => updateField("status", v)} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              {cols.map(c => <th key={c.key}>{c.label}</th>)}
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th>By</th>
              {editable && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={cols.length + (editable ? 5 : 4)} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: 24 }}>No data</td></tr>
            )}
            {rows.map((r: any, idx: number) => (
              <tr key={r.id}>
                <td style={{ color: "var(--color-text-dim)", fontSize: 11 }}>{idx + 1}</td>
                {cols.map(c => (
                  <td key={c.key} style={c.type === "number" ? { fontFamily: "var(--font-mono)" } : {}}>
                    {c.type === "number" ? (r[c.key] != null ? Number(r[c.key]).toFixed(2) : "0.00") : (r[c.key] || "—")}
                  </td>
                ))}
                <td>{statusBadge(r.status)}</td>
                <td>{fmtDate(r.created_date)}</td>
                <td>{fmtDate(r.updated_date)}</td>
                <td>{r.updated_by || "—"}</td>
                {editable && (
                  <td>
                    <button className="btn btn-secondary btn-sm" style={{ marginRight: 4 }} onClick={() => { setForm({ ...r }); setEditId(r.id); setShowForm(true); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>Del</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════ ROLE PERMISSION TAB ══════════════════════════════════════ */
const ACCESS_COLORS: Record<string, string> = { edit: "var(--color-success)", view: "var(--color-primary)", disabled: "var(--color-danger)" };
const ACCESS_BG: Record<string, string> = { edit: "rgba(74,222,128,0.08)", view: "rgba(108,142,255,0.08)", disabled: "rgba(255,107,107,0.06)" };

const RolePermissionTab: React.FC = () => {
  const [data, setData] = useState<PermData | null>(null);
  const [saving, setSaving] = useState("");

  const load = useCallback(() => { api("/api/auth/permissions").then(setData).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const updatePerm = async (role: string, feature: string, access_level: string) => {
    setSaving(role + "." + feature);
    try { await api("/api/auth/permissions", { method: "POST", body: JSON.stringify({ role, feature, access_level }) }); load(); }
    catch { alert("Only administrators can change permissions."); }
    finally { setSaving(""); }
  };

  if (!data) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 12, color: "var(--color-text-muted)" }}>
        <span style={{ color: ACCESS_COLORS.edit, fontWeight: 600 }}>Edit</span> · <span style={{ color: ACCESS_COLORS.view, fontWeight: 600 }}>View</span> · <span style={{ color: ACCESS_COLORS.disabled, fontWeight: 600 }}>Disabled</span>
      </div>
      <div className="table-wrapper" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, background: "var(--color-surface-2)", zIndex: 2, minWidth: 220 }}>Feature</th>
              {data.roles.map(r => <th key={r} style={{ textAlign: "center", minWidth: 80 }}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.features.map(feat => (
              <tr key={feat.key}>
                <td style={{ position: "sticky", left: 0, background: "var(--color-surface)", zIndex: 1, fontSize: 12, fontWeight: feat.key.includes(".") ? 400 : 600, paddingLeft: feat.key.includes(".") ? 24 : 14 }}>{feat.label}</td>
                {data.roles.map(role => {
                  const perm = data.permissions[role]?.[feat.key];
                  const level = perm?.access_level || "disabled";
                  const key = role + "." + feat.key;
                  return (
                    <td key={role} style={{ textAlign: "center", padding: "4px 6px", background: ACCESS_BG[level] }}>
                      <select className="form-control" value={level} disabled={saving === key} onChange={e => updatePerm(role, feat.key, e.target.value)}
                        style={{ fontSize: 11, padding: "3px 6px", textAlign: "center", color: ACCESS_COLORS[level], fontWeight: 600, width: "100%", minWidth: 70 }}>
                        {data.access_levels.map(al => <option key={al} value={al}>{al.charAt(0).toUpperCase() + al.slice(1)}</option>)}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════ MASTER DATA PAGE ══════════════════════════════════════ */
const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("assets");
  const [access, setAccess] = useState<Record<string, string>>({});
  const [lookups, setLookups] = useState<Record<string, string[]>>({});

  const loadAccess = useCallback(() => { api("/api/master-data/access").then(setAccess).catch(() => {}); }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [assets, wps, qps, groups, companies, positions, rateTypes, equipment, roles] = await Promise.all([
        api("/api/master-data/assets"), api("/api/master-data/working-platforms"),
        api("/api/master-data/quarter-platforms"), api("/api/master-data/groups"),
        api("/api/master-data/companies"), api("/api/master-data/positions"),
        api("/api/master-data/rate-types"), api("/api/master-data/equipment"),
        api("/api/master-data/roles"),
      ]);
      setLookups({
        asset: assets.filter((r: any) => r.status === "Active").map((r: any) => r.name),
        working_platform: wps.filter((r: any) => r.status === "Active").map((r: any) => r.name),
        quarter_platform: qps.filter((r: any) => r.status === "Active").map((r: any) => r.name),
        md_group: groups.filter((r: any) => r.status === "Active").map((r: any) => r.name),
        company: companies.filter((r: any) => r.status === "Active").map((r: any) => r.name),
        position: positions.filter((r: any) => r.status === "Active").map((r: any) => r.name),
        rate_type: rateTypes.filter((r: any) => r.status === "Active").map((r: any) => r.name),
        equipment: equipment.filter((r: any) => r.status === "Active").map((r: any) => r.name),
        role: roles.filter((r: any) => r.status === "Active").map((r: any) => r.name),
        level: ["Low", "Medium", "High"],
      });
    } catch {}
  }, []);

  useEffect(() => { loadAccess(); loadLookups(); }, [loadAccess, loadLookups]);
  useEffect(() => {
    const h = () => { loadAccess(); };
    window.addEventListener("pace-role-change", h);
    return () => window.removeEventListener("pace-role-change", h);
  }, [loadAccess]);

  const visibleTabs = ALL_TABS.filter(t => { const l = access[t.feature]; return l === "edit" || l === "view"; });

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(t => t.key === activeTab)) setActiveTab(visibleTabs[0].key);
  }, [access, visibleTabs, activeTab]);

  const isEditable = (tab: TabKey): boolean => {
    const feat = ALL_TABS.find(t => t.key === tab)?.feature || "";
    return access[feat] === "edit";
  };

  const getColConfig = (tab: TabKey): ColConfig[] => {
    switch (tab) {
      case "assets": return [{ key: "name", label: "Name" }, { key: "description", label: "Description" }];
      case "working-platforms": return [{ key: "name", label: "Name" }, { key: "description", label: "Description" }];
      case "wp-mappings": return [{ key: "asset", label: "Asset", options: lookups.asset }, { key: "working_platform", label: "Working Platform", options: lookups.working_platform }];
      case "quarter-platforms": return [{ key: "name", label: "Name" }, { key: "description", label: "Description" }];
      case "qp-mappings": return [{ key: "asset", label: "Asset", options: lookups.asset }, { key: "quarter_platform", label: "Quarter Platform", options: lookups.quarter_platform }];
      case "job-types": return [{ key: "description_l1", label: "L1" }, { key: "description_l2", label: "L2" }, { key: "description_l3", label: "L3" }];
      case "groups": return [{ key: "name", label: "Name" }, { key: "description", label: "Description" }];
      case "companies": return [{ key: "name", label: "Name" }, { key: "description", label: "Description" }];
      case "positions": return [{ key: "md_group", label: "Group", options: lookups.md_group }, { key: "name", label: "Name" }, { key: "description", label: "Description" }];
      case "rate-types": return [{ key: "name", label: "Name" }, { key: "description", label: "Description" }];
      case "contractors": return [{ key: "name", label: "Name" }, { key: "company", label: "Company", options: lookups.company }, { key: "position", label: "Position", options: lookups.position }];
      case "contractor-rates": return [{ key: "company", label: "Company", options: lookups.company }, { key: "position", label: "Position", options: lookups.position }, { key: "rate_type", label: "Rate Type", options: lookups.rate_type }, { key: "charge_hour_rate", label: "Hourly Rate", type: "number" }];
      case "equipment": return [{ key: "name", label: "Name" }, { key: "description", label: "Description" }];
      case "equipment-rates": return [{ key: "company", label: "Company", options: lookups.company }, { key: "equipment", label: "Equipment", options: lookups.equipment }, { key: "rate_type", label: "Rate Type", options: lookups.rate_type }, { key: "charge_hour_rate", label: "Hourly Rate", type: "number" }];
      case "std-manhour": return [{ key: "md_group", label: "Group", options: lookups.md_group }, { key: "header", label: "L1" }, { key: "sub_header", label: "L2" }, { key: "description", label: "L3" }, { key: "level", label: "Difficulty", options: lookups.level }, { key: "unit", label: "Unit" }, { key: "manhour", label: "Manhour", type: "number" }];
      case "roles": return [{ key: "name", label: "Name" }, { key: "description", label: "Description" }];
      case "user-roles": return [{ key: "name", label: "Name" }, { key: "mail", label: "Email" }, { key: "role", label: "Role", options: lookups.role }, { key: "job_title", label: "Job Title" }];
      default: return [];
    }
  };

  const getEndpoint = (tab: TabKey): string => {
    const map: Record<TabKey, string> = {
      "assets": "/api/master-data/assets", "working-platforms": "/api/master-data/working-platforms",
      "wp-mappings": "/api/master-data/working-platform-mappings", "quarter-platforms": "/api/master-data/quarter-platforms",
      "qp-mappings": "/api/master-data/quarter-platform-mappings", "job-types": "/api/master-data/job-types",
      "groups": "/api/master-data/groups", "companies": "/api/master-data/companies",
      "positions": "/api/master-data/positions", "rate-types": "/api/master-data/rate-types",
      "contractors": "/api/master-data/contractors", "contractor-rates": "/api/master-data/contractor-rates",
      "equipment": "/api/master-data/equipment", "equipment-rates": "/api/master-data/equipment-rates",
      "std-manhour": "/api/master-data/standardize-manhour", "roles": "/api/master-data/roles",
      "user-roles": "/api/master-data/users", "role-permissions": "",
    };
    return map[tab] || "";
  };

  const renderTab = () => {
    if (activeTab === "role-permissions") return <RolePermissionTab />;
    return <CrudTab key={activeTab} endpoint={getEndpoint(activeTab)} editable={isEditable(activeTab)} cols={getColConfig(activeTab)} />;
  };

  if (visibleTabs.length === 0) {
    return <div className="empty-state"><div className="empty-icon">🔒</div><p>Your role does not have access to any master data.</p></div>;
  }

  return (
    <div>
      {/* ── Scrollable Tabs with Arrows ── */}
      <ScrollableTabs
        tabs={visibleTabs.map(t => ({ key: t.key, label: t.label }))}
        activeTab={activeTab}
        onSelect={key => { setActiveTab(key as TabKey); loadLookups(); }}
      />

      {/* ── View Only Banner ── */}
      {!isEditable(activeTab) && activeTab !== "role-permissions" && (
        <div className="card" style={{ marginBottom: 12, padding: "10px 16px", borderColor: "var(--color-warning)", background: "rgba(255,184,77,0.06)" }}>
          <span style={{ color: "var(--color-warning)", fontWeight: 600, fontSize: 13 }}>🔒 View only</span>
        </div>
      )}

      {/* ── Tab Content ── */}
      {renderTab()}
    </div>
  );
};

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<MasterDataPage />);