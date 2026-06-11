var initSqlJs = require('sql.js');
var fs = require('fs');
var path = require('path');
var bcrypt = require('bcryptjs');

var DB_PATH = path.join(__dirname, '..', 'pace.db');
var _db = null;

function Stmt(db, sql) { this._db = db; this._sql = sql; }
Stmt.prototype.all = function() {
  var params = [];
  for (var i = 0; i < arguments.length; i++) {
    if (Array.isArray(arguments[i])) params = params.concat(arguments[i]);
    else params.push(arguments[i]);
  }
  try {
    var r = this._db.exec(this._sql, params);
    if (!r.length) return [];
    var cols = r[0].columns;
    return r[0].values.map(function(row) {
      var o = {}; cols.forEach(function(c, idx) { o[c] = row[idx]; }); return o;
    });
  } catch (e) { console.error('SQL all:', e.message, '|', this._sql); return []; }
};
Stmt.prototype.get = function() { var rows = this.all.apply(this, arguments); return rows[0] || undefined; };
Stmt.prototype.run = function() {
  var params = [];
  for (var i = 0; i < arguments.length; i++) {
    if (Array.isArray(arguments[i])) params = params.concat(arguments[i]);
    else params.push(arguments[i]);
  }
  try {
    this._db.run(this._sql, params);
    var lid = this._db.exec("SELECT last_insert_rowid()");
    return { lastInsertRowid: (lid[0] && lid[0].values[0]) ? lid[0].values[0][0] : 0, changes: this._db.getRowsModified() };
  } catch (e) { console.error('SQL run:', e.message, '|', this._sql); return { lastInsertRowid: 0, changes: 0 }; }
};
function DbWrapper(db) { this._db = db; }
DbWrapper.prototype.prepare = function(sql) { return new Stmt(this._db, sql); };
DbWrapper.prototype.exec = function(sql) { this._db.exec(sql); };

function saveToDisk() { if (_db) fs.writeFileSync(DB_PATH, Buffer.from(_db.export())); }
function getDb() { if (!_db) throw new Error('DB not init'); return new DbWrapper(_db); }

async function initDatabase() {
  var SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) { _db = new SQL.Database(fs.readFileSync(DB_PATH)); }
  else { _db = new SQL.Database(); }
  _db.run("PRAGMA foreign_keys = ON");
  var db = getDb();

  db.exec(
    "CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE,password TEXT,full_name TEXT,role TEXT,email TEXT,is_active INTEGER DEFAULT 1);" +
    "CREATE TABLE IF NOT EXISTS equipment(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,type TEXT,description TEXT,is_active INTEGER DEFAULT 1);" +
    "CREATE TABLE IF NOT EXISTS contractors(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,company TEXT,contact_person TEXT,phone TEXT,is_active INTEGER DEFAULT 1);" +
    "CREATE TABLE IF NOT EXISTS contractor_personnel(id INTEGER PRIMARY KEY AUTOINCREMENT,contractor_name TEXT,person_name TEXT,position TEXT,is_active INTEGER DEFAULT 1);" +
    "CREATE TABLE IF NOT EXISTS rates(id INTEGER PRIMARY KEY AUTOINCREMENT,contractor_id INTEGER,contractor_name TEXT,position TEXT,daily_rate REAL,hourly_rate REAL,currency TEXT,effective_date TEXT);" +
    "CREATE TABLE IF NOT EXISTS std_manhour(id INTEGER PRIMARY KEY AUTOINCREMENT,work_type TEXT,work_item TEXT,difficulty_level TEXT,std_manhour_per_unit REAL,unit TEXT,is_validated INTEGER DEFAULT 1);" +
    "CREATE TABLE IF NOT EXISTS job_types(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE);" +
    "CREATE TABLE IF NOT EXISTS sub_types_1(id INTEGER PRIMARY KEY AUTOINCREMENT,job_type_id INTEGER,name TEXT);" +
    "CREATE TABLE IF NOT EXISTS sub_types_2(id INTEGER PRIMARY KEY AUTOINCREMENT,sub_type_1_id INTEGER,name TEXT);" +
    "CREATE TABLE IF NOT EXISTS companies(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE);" +
    "CREATE TABLE IF NOT EXISTS positions(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE);" +
    "CREATE TABLE IF NOT EXISTS quarter_platforms(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE);" +
    "CREATE TABLE IF NOT EXISTS default_items(id INTEGER PRIMARY KEY AUTOINCREMENT,item_name TEXT,unit TEXT,manhour_per_unit REAL);" +
    "CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY AUTOINCREMENT,project_no TEXT,title TEXT,field TEXT,platform TEXT,job_type TEXT,sub_type_1 TEXT,sub_type_2 TEXT,company TEXT,contingency REAL DEFAULT 10,productive_time REAL DEFAULT 8,manpower_count INTEGER DEFAULT 5,plan_start TEXT,total_manhour REAL DEFAULT 0,plan_duration REAL DEFAULT 0,plan_end TEXT,status TEXT DEFAULT 'draft',created_by TEXT,created_at TEXT DEFAULT(datetime('now','localtime')));" +
    "CREATE TABLE IF NOT EXISTS planning_activities(id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER,scope_ref TEXT,work_item TEXT,quantity REAL DEFAULT 0,unit TEXT,difficulty TEXT DEFAULT 'Normal',std_mh_per_unit REAL DEFAULT 0,planned_mh REAL DEFAULT 0,remark TEXT);" +
    "CREATE TABLE IF NOT EXISTS scope_default_items(id INTEGER PRIMARY KEY AUTOINCREMENT,scope_ref TEXT,work_item TEXT,unit TEXT,difficulty TEXT DEFAULT 'Normal',std_mh_per_unit REAL DEFAULT 0);" +
    "CREATE TABLE IF NOT EXISTS daily_reports(id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER,report_date TEXT,weather TEXT DEFAULT 'Clear',status TEXT DEFAULT 'draft',planned_pob INTEGER DEFAULT 0,actual_pob INTEGER DEFAULT 0,planned_mh REAL DEFAULT 0,actual_mh REAL DEFAULT 0,progress_today REAL DEFAULT 0,progress_total REAL DEFAULT 0,normal_working_time TEXT DEFAULT '7:00',lq_departure_time TEXT DEFAULT '06:30',pf_arrival_time TEXT DEFAULT '07:00',start_working_time TEXT DEFAULT '07:30',pf_departure_time TEXT DEFAULT '17:30',lq_arrival_time TEXT DEFAULT '18:00',downtime_hour REAL DEFAULT 0,productive_hour REAL DEFAULT 0,wrench_time REAL DEFAULT 0,working_hours REAL DEFAULT 8,remarks TEXT DEFAULT '',sro_number TEXT DEFAULT '',created_by TEXT,created_at TEXT DEFAULT(datetime('now','localtime')));" +
    "CREATE TABLE IF NOT EXISTS daily_manpower(id INTEGER PRIMARY KEY AUTOINCREMENT,report_id INTEGER,person_name TEXT,contractor TEXT,position TEXT,quarter_platform TEXT,scope_ref TEXT DEFAULT '',offshore_working REAL DEFAULT 0,offshore_overtime REAL DEFAULT 0,offshore_standby REAL DEFAULT 0,onshore_working REAL DEFAULT 0,onshore_overtime REAL DEFAULT 0,onshore_standby REAL DEFAULT 0,onshore_standby_50 REAL DEFAULT 0);" +
    "CREATE TABLE IF NOT EXISTS daily_equipment(id INTEGER PRIMARY KEY AUTOINCREMENT,report_id INTEGER,equipment_name TEXT,equipment_tag TEXT,offshore_working REAL DEFAULT 0,offshore_standby REAL DEFAULT 0,onshore_working REAL DEFAULT 0,onshore_standby REAL DEFAULT 0);" +
    "CREATE TABLE IF NOT EXISTS report_activities(id INTEGER PRIMARY KEY AUTOINCREMENT,report_id INTEGER,activity_name TEXT,progress_yesterday REAL DEFAULT 0,progress_today REAL DEFAULT 0,progress_total REAL DEFAULT 0);" +
    "CREATE TABLE IF NOT EXISTS job_actual_qty(id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER,item_id INTEGER,item_name TEXT,unit TEXT,planned_qty REAL DEFAULT 0,actual_qty REAL DEFAULT 0,actual_manhour REAL DEFAULT 0,productivity REAL DEFAULT 0,status TEXT DEFAULT 'draft');"
  );

  function seed(table, rows, sql) {
    var c = db.prepare('SELECT COUNT(*) AS c FROM ' + table).get();
    if (c && c.c > 0) return;
    var stmt = db.prepare(sql);
    rows.forEach(function(r) { stmt.run.apply(stmt, r); });
  }

  var uc = db.prepare('SELECT COUNT(*) AS c FROM users').get();
  if (!uc || uc.c === 0) {
    var pw = bcrypt.hashSync('password123', 10);
    var ins = db.prepare('INSERT INTO users(username,password,full_name,role,email) VALUES(?,?,?,?,?)');
    ins.run('admin', pw, 'System Admin', 'it_admin', 'admin@pace.com');
    ins.run('engineer', pw, 'Project Engineer', 'project_engineer', 'eng@pace.com');
    ins.run('supervisor', pw, 'Construction Supervisor', 'construction_supervisor', 'sup@pace.com');
    ins.run('asst_sup', pw, 'Asst Supervisor', 'assistant_supervisor', 'asst@pace.com');
    ins.run('contractor', pw, 'Contractor User', 'contractor_user', 'con@pace.com');
    ins.run('viewer', pw, 'Management Viewer', 'management_viewer', 'view@pace.com');
    ins.run('procurement', pw, 'Procurement SKL', 'procurement_skl', 'proc@pace.com');
  }

  seed('equipment', [['Crane 25T','Crane','25T Crane'],['Forklift','Forklift','3T'],['Welding Machine','Tools','MIG'],['Generator','Power','500KVA']], 'INSERT INTO equipment(name,type,description) VALUES(?,?,?)');
  seed('contractors', [['Contractor A','Alpha Eng','Mr A','081-111'],['Contractor B','Beta Svc','Mr B','081-222'],['PTTEP','PTTEP','Internal','']], 'INSERT INTO contractors(name,company,contact_person,phone) VALUES(?,?,?,?)');
  seed('contractor_personnel', [
    ['Contractor A','John Smith','Welder'],['Contractor A','Mike Jones','Fitter'],['Contractor A','Tom Lee','Rigger'],
    ['Contractor A','Sam Chen','Electrician'],['Contractor A','Ali Hassan','Supervisor'],
    ['Contractor B','David Kim','Welder'],['Contractor B','James Wong','Fitter'],
    ['PTTEP','Somchai P.','Supervisor'],['PTTEP','Nathachok N.','Safety Officer']
  ], 'INSERT INTO contractor_personnel(contractor_name,person_name,position) VALUES(?,?,?)');
  seed('rates', [[1,'Contractor A','Welder',3500,500,'THB','2026-01-01'],[2,'Contractor B','Electrician',3200,460,'THB','2026-01-01']], 'INSERT INTO rates(contractor_id,contractor_name,position,daily_rate,hourly_rate,currency,effective_date) VALUES(?,?,?,?,?,?,?)');
  seed('std_manhour', [['Piping','Pipe Spool Installation','Normal',4.0,'EA'],['Piping','Valve Installation','Normal',6.0,'EA'],['Electrical','Cable Pulling','Normal',0.3,'M'],['Structure','Scaffolding Erection','Normal',1.2,'SQM'],['Civil','Painting','Easy',0.8,'SQM']], 'INSERT INTO std_manhour(work_type,work_item,difficulty_level,std_manhour_per_unit,unit) VALUES(?,?,?,?,?)');
  seed('job_types', [['Mechanical'],['Electrical'],['Instrument'],['Civil'],['Piping'],['Structure']], 'INSERT INTO job_types(name) VALUES(?)');

  var stc = db.prepare('SELECT COUNT(*) AS c FROM sub_types_1').get();
  if (!stc || stc.c === 0) {
    var jtRows = db.prepare('SELECT * FROM job_types').all();
    var jtMap = {}; jtRows.forEach(function(r) { jtMap[r.name] = r.id; });
    var stIns = db.prepare('INSERT INTO sub_types_1(job_type_id,name) VALUES(?,?)');
    var subs = { Mechanical:['Rotating Equipment','Static Equipment'], Electrical:['Power System','Lighting'], Piping:['Carbon Steel','Stainless Steel'], Structure:['Steel Structure','Handrail'], Civil:['Foundation','Painting'] };
    Object.keys(subs).forEach(function(k) { if (jtMap[k]) subs[k].forEach(function(s) { stIns.run(jtMap[k], s); }); });
  }

  seed('companies', [['PTTEP'],['Contractor A'],['Contractor B'],['Contractor C']], 'INSERT INTO companies(name) VALUES(?)');
  seed('positions', [['Foreman'],['Welder'],['Fitter'],['Rigger'],['Electrician'],['Supervisor'],['Safety Officer']], 'INSERT INTO positions(name) VALUES(?)');
  seed('quarter_platforms', [['QP-A'],['QP-B'],['QP-C'],['LQ']], 'INSERT INTO quarter_platforms(name) VALUES(?)');
  seed('default_items', [['Pipe Spool Installation','EA',4.0],['Valve Installation','EA',6.0],['Cable Pulling','M',0.3],['Painting','SQM',0.8],['Scaffolding Erection','SQM',1.2],['Instrument Tubing','M',0.4]], 'INSERT INTO default_items(item_name,unit,manhour_per_unit) VALUES(?,?,?)');

  var sdi = db.prepare('SELECT COUNT(*) AS c FROM scope_default_items').get();
  if (!sdi || sdi.c === 0) {
    var si = db.prepare('INSERT INTO scope_default_items(scope_ref,work_item,unit,difficulty,std_mh_per_unit) VALUES(?,?,?,?,?)');
    si.run('2.1','Piping removal (Spools)','Spool','Low',4.0); si.run('2.1','Structure Demolition','Pcs','Low',8.0); si.run('2.1','Other (Pls Specific)','MH','N/A',1.0);
    si.run('2.2','Cable','ft','Low',0.1); si.run('2.2','Cable tray','ft','Low',0.2); si.run('2.2','Other (Pls Specific)','MH','N/A',1.0);
    si.run('2.3','Bulkhead plate','ea','Low',1.0); si.run('2.3','Junction Box','ea','Low',0.5); si.run('2.3','Other (Pls Specific)','MH','N/A',1.0);
    si.run('2.4','Equipment Removal','ea','Low',16.0); si.run('2.4','Other (Pls Specific)','MH','N/A',1.0);
    si.run('3.1','Carbon Steel/Low Temp','DB','Low',8.0); si.run('3.1','Stainless Steel','DB','Low',10.0); si.run('3.1','CuNi','DB','Low',12.0); si.run('3.1','Duplex','DB','Low',14.0); si.run('3.1','Other (Pls Specific)','MH','N/A',1.0);
    si.run('3.2','Pipe Support','ea','Low',2.5); si.run('3.2','Other (Pls Specific)','MH','N/A',1.0);
    si.run('3.3','Steel Structure','Point','Low',8.0); si.run('3.3','Other (Pls Specific)','MH','N/A',1.0);
    si.run('3.4','Cable','ft','Low',0.3); si.run('3.4','Cable tray','ft','Low',1.0); si.run('3.4','Conduit','ft','Low',0.4); si.run('3.4','Other (Pls Specific)','MH','N/A',1.0);
    si.run('3.5','Bulkhead plate','ea','Low',1.5); si.run('3.5','Glanding (Device)','ea','Low',1.0); si.run('3.5','Other (Pls Specific)','MH','N/A',1.0);
    si.run('3.6','Equipment Alignment','ea','Low',16.0); si.run('3.6','Bolt Torquing','ea','Low',0.5); si.run('3.6','Other (Pls Specific)','MH','N/A',1.0);
    si.run('4.1','Tower on Deck Floor','m3','Low',1.2); si.run('4.1','Slung (Hanging)','m3','Low',1.5); si.run('4.1','Cantilever','m3','Low',1.8); si.run('4.1','Other (Pls Specific)','MH','N/A',1.0);
    si.run('4.2','Dismantle Scaffolding','Project','Low',0.8); si.run('4.2','Other (Pls Specific)','MH','N/A',1.0);
    si.run('4.3','Pressurize Habitat','ea','Low',40.0); si.run('4.3','Other (Pls Specific)','MH','N/A',1.0);
    si.run('5.1','Insulation work','m','Low',2.0); si.run('5.1','Other (Pls Specific)','MH','N/A',1.0);
    si.run('5.2','Isolation support','ea','Low',4.0); si.run('5.2','Other (Pls Specific)','MH','N/A',1.0);
    si.run('5.3','Site Survey','MH','N/A',1.0);
    si.run('5.4','Pls Specific','MH','N/A',1.0); si.run('5.5','Pls Specific','MH','N/A',1.0); si.run('5.6','Pls Specific','MH','N/A',1.0);
    si.run('6.1','Hydro Test','SET','Low',24.0); si.run('6.1','Leak Test','SET','Low',8.0); si.run('6.1','Other (Pls Specific)','MH','N/A',1.0);
    si.run('6.2','Function Test','SET','Low',16.0); si.run('6.2','Other (Pls Specific)','MH','N/A',1.0);
    si.run('7','System S01 (Structure)','sq.m.','Low',0.8); si.run('7','System S10 (piping)','sq.m.','Low',0.8); si.run('7','Other (Pls Specific)','MH','N/A',1.0);
  }

  saveToDisk();
  console.log('DB initialized OK');
  setInterval(saveToDisk, 30000);
  process.on('SIGINT', function() { saveToDisk(); process.exit(); });
}

function calculateProject(pid) {
  var db = getDb(); var p = db.prepare('SELECT * FROM projects WHERE id=?').get(pid); if (!p) return;
  var items = db.prepare('SELECT * FROM planning_activities WHERE project_id=?').all(pid);
  var inputTotal = 0; items.forEach(function(i) { inputTotal += (i.planned_mh || 0); });
  var pctMH = inputTotal * 0.05; var totalProdMH = inputTotal + (pctMH * 3);
  var wc = totalProdMH * (1 + (p.contingency || 0) / 100);
  var pt = p.productive_time > 0 ? p.productive_time : 8;
  var mp = p.manpower_count > 0 ? p.manpower_count : 1;
  var dur = (pt * mp) > 0 ? wc / (pt * mp) : 0;
  var pe = '';
  if (p.plan_start && dur > 0) { var d = new Date(p.plan_start); d.setDate(d.getDate() + Math.ceil(dur) - 1); pe = d.toISOString().split('T')[0]; }
  db.prepare('UPDATE projects SET total_manhour=?,plan_duration=?,plan_end=? WHERE id=?').run(Math.round(wc*100)/100, Math.round(dur*100)/100, pe, pid);
  saveToDisk();
}

function syncJobActualQty(pid) {
  var db = getDb(); var items = db.prepare('SELECT * FROM planning_activities WHERE project_id=?').all(pid);
  items.forEach(function(i) {
    var ex = db.prepare('SELECT * FROM job_actual_qty WHERE project_id=? AND item_id=?').get(pid, i.id);
    if (!ex) db.prepare('INSERT INTO job_actual_qty(project_id,item_id,item_name,unit,planned_qty) VALUES(?,?,?,?,?)').run(pid, i.id, i.work_item, i.unit, i.quantity);
    else db.prepare('UPDATE job_actual_qty SET item_name=?,unit=?,planned_qty=? WHERE project_id=? AND item_id=?').run(i.work_item, i.unit, i.quantity, pid, i.id);
  });
  saveToDisk();
}

module.exports = { getDb: getDb, initDatabase: initDatabase, calculateProject: calculateProject, syncJobActualQty: syncJobActualQty, saveToDisk: saveToDisk };