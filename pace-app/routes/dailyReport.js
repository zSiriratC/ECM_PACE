var express = require('express');
var auth = require('../middleware/auth');
var dbMod = require('../database/init');
var router = express.Router();

function todayStr() { var d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function yesterdayStr() { var d = new Date(); d.setDate(d.getDate()-1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function canEdit(user, reportDate) { if (user.role==='it_admin') return true; if (user.role==='assistant_supervisor'||user.role==='construction_supervisor') return reportDate===todayStr(); return false; }

function calcReportMH(db, rid) {
  var mp = db.prepare('SELECT * FROM daily_manpower WHERE report_id=?').all(rid); var total = 0;
  mp.forEach(function(m) { total += (m.offshore_working||0)+(m.offshore_overtime||0)+(m.offshore_standby||0)+(m.onshore_working||0)+(m.onshore_overtime||0)+(m.onshore_standby||0)+(m.onshore_standby_50||0); });
  return Math.round(total*100)/100;
}
function getAccumActualMH(db, pid) {
  var reports = db.prepare('SELECT id FROM daily_reports WHERE project_id=?').all(pid); var total = 0;
  reports.forEach(function(r) { total += calcReportMH(db, r.id); }); return Math.round(total*100)/100;
}

function saveSubs(db, rid, body) {
  db.prepare('DELETE FROM daily_manpower WHERE report_id=?').run(rid);
  db.prepare('DELETE FROM daily_equipment WHERE report_id=?').run(rid);
  db.prepare('DELETE FROM report_activities WHERE report_id=?').run(rid);

  var mpIns = db.prepare('INSERT INTO daily_manpower(report_id,person_name,contractor,position,quarter_platform,scope_ref,offshore_working,offshore_overtime,offshore_standby,onshore_working,onshore_overtime,onshore_standby,onshore_standby_50) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
  var mpArr = Array.isArray(body.manpower) ? body.manpower : Object.values(body.manpower || {});
  mpArr.forEach(function(m) {
    if (m && (m.person_name || m.position)) {
      mpIns.run(rid, m.person_name||'', m.contractor||'', m.position||'', m.quarter_platform||'', m.scope_ref||'',
        parseFloat(m.offshore_working)||0, parseFloat(m.offshore_overtime)||0, parseFloat(m.offshore_standby)||0,
        parseFloat(m.onshore_working)||0, parseFloat(m.onshore_overtime)||0, parseFloat(m.onshore_standby)||0, parseFloat(m.onshore_standby_50)||0);
    }
  });

  var eqIns = db.prepare('INSERT INTO daily_equipment(report_id,equipment_name,equipment_tag,offshore_working,offshore_standby,onshore_working,onshore_standby) VALUES(?,?,?,?,?,?,?)');
  var eqArr = Array.isArray(body.equipment) ? body.equipment : Object.values(body.equipment || {});
  eqArr.forEach(function(e) { if (e&&(e.equipment_name||e.equipment_tag)) eqIns.run(rid, e.equipment_name||'', e.equipment_tag||'', parseFloat(e.offshore_working)||0, parseFloat(e.offshore_standby)||0, parseFloat(e.onshore_working)||0, parseFloat(e.onshore_standby)||0); });

  var actIns = db.prepare('INSERT INTO report_activities(report_id,activity_name,progress_yesterday,progress_today,progress_total) VALUES(?,?,?,?,?)');
  var actArr = Array.isArray(body.activities) ? body.activities : Object.values(body.activities || {});
  actArr.forEach(function(a) { if (a&&a.activity_name&&a.activity_name.trim()) { var py=parseFloat(a.progress_yesterday)||0; var pt=parseFloat(a.progress_today)||0; actIns.run(rid, a.activity_name.trim(), py, pt, py+pt); } });

  var actualMH = calcReportMH(db, rid);
  db.prepare('UPDATE daily_reports SET actual_mh=? WHERE id=?').run(actualMH, rid);
}

// Get scope options for the project
function getScopeOptions(db, pid) {
  var items = db.prepare('SELECT DISTINCT scope_ref FROM planning_activities WHERE project_id=? AND scope_ref IS NOT NULL AND scope_ref != ? ORDER BY scope_ref').all(pid, '');
  return items.map(function(i) { return i.scope_ref; });
}

router.get('/', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb();
  var projects = db.prepare("SELECT * FROM projects WHERE status IN ('approved','in_progress') ORDER BY project_no").all();
  var selPid = req.query.project ? parseInt(req.query.project) : (projects.length>0?projects[0].id:null);
  var selProject = null; var reports = []; var todayReportExists = false; var scopeOptions = [];
  if (selPid) {
    selProject = db.prepare('SELECT * FROM projects WHERE id=?').get(selPid);
    reports = db.prepare('SELECT * FROM daily_reports WHERE project_id=? ORDER BY report_date DESC').all(selPid);
    reports = reports.map(function(r) { r.editable = canEdit(req.session.user, r.report_date); r.actual_mh = calcReportMH(db, r.id); return r; });
    var tr = db.prepare('SELECT id FROM daily_reports WHERE project_id=? AND report_date=?').get(selPid, todayStr());
    todayReportExists = !!tr;
    scopeOptions = getScopeOptions(db, selPid);
  }
  var personnel = []; if (selProject&&selProject.company) personnel = db.prepare('SELECT * FROM contractor_personnel WHERE contractor_name=? AND is_active=1 ORDER BY person_name').all(selProject.company);
  var accumMH = selProject ? getAccumActualMH(db, selPid) : 0;
  res.render('dailyReport', { title:'Daily Report', projects:projects, reports:reports, selProject:selProject, selPid:selPid,
    positions: db.prepare('SELECT * FROM positions ORDER BY name').all(), qps: db.prepare('SELECT * FROM quarter_platforms ORDER BY name').all(),
    eqList: db.prepare('SELECT * FROM equipment WHERE is_active=1 ORDER BY name').all(),
    personnel:personnel, accumMH:accumMH, todayStr:todayStr(), todayReportExists:todayReportExists, scopeOptions:scopeOptions, reportDetail:null });
});

router.get('/view/:id', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb();
  var rpt = db.prepare('SELECT * FROM daily_reports WHERE id=?').get(parseInt(req.params.id));
  if (!rpt) { req.session.error='Not found.'; return res.redirect('/daily-report'); }
  var selProject = db.prepare('SELECT * FROM projects WHERE id=?').get(rpt.project_id);
  var projects = db.prepare("SELECT * FROM projects WHERE status IN ('approved','in_progress') ORDER BY project_no").all();
  var reports = db.prepare('SELECT * FROM daily_reports WHERE project_id=? ORDER BY report_date DESC').all(rpt.project_id);
  reports = reports.map(function(r) { r.editable = canEdit(req.session.user, r.report_date); r.actual_mh = calcReportMH(db, r.id); return r; });
  var manpower = db.prepare('SELECT * FROM daily_manpower WHERE report_id=? ORDER BY id').all(rpt.id);
  var equipment = db.prepare('SELECT * FROM daily_equipment WHERE report_id=? ORDER BY id').all(rpt.id);
  var activities = db.prepare('SELECT * FROM report_activities WHERE report_id=? ORDER BY id').all(rpt.id);
  var personnel = []; if (selProject&&selProject.company) personnel = db.prepare('SELECT * FROM contractor_personnel WHERE contractor_name=? AND is_active=1 ORDER BY person_name').all(selProject.company);
  var accumMH = getAccumActualMH(db, rpt.project_id);
  var scopeOptions = getScopeOptions(db, rpt.project_id);
  res.render('dailyReport', { title:'Report', projects:projects, reports:reports, selProject:selProject, selPid:rpt.project_id,
    positions: db.prepare('SELECT * FROM positions ORDER BY name').all(), qps: db.prepare('SELECT * FROM quarter_platforms ORDER BY name').all(),
    eqList: db.prepare('SELECT * FROM equipment WHERE is_active=1 ORDER BY name').all(),
    personnel:personnel, accumMH:accumMH, todayStr:todayStr(), todayReportExists:true, scopeOptions:scopeOptions,
    reportDetail:{ report:rpt, manpower:manpower, equipment:equipment, activities:activities, editable:canEdit(req.session.user, rpt.report_date) } });
});

router.get('/api/yesterday/:pid', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb(); var yd = yesterdayStr();
  var report = db.prepare('SELECT * FROM daily_reports WHERE project_id=? AND report_date=?').get(parseInt(req.params.pid), yd);
  if (!report) return res.json({ found:false });
  var manpower = db.prepare('SELECT * FROM daily_manpower WHERE report_id=?').all(report.id);
  var equipment = db.prepare('SELECT * FROM daily_equipment WHERE report_id=?').all(report.id);
  var activities = db.prepare('SELECT * FROM report_activities WHERE report_id=?').all(report.id);
  var prev = db.prepare('SELECT id FROM daily_reports WHERE project_id=? AND report_date<=? ORDER BY report_date').all(parseInt(req.params.pid), yd);
  var accum = {}; prev.forEach(function(r) { db.prepare('SELECT * FROM report_activities WHERE report_id=?').all(r.id).forEach(function(a) { accum[a.activity_name]=(accum[a.activity_name]||0)+(a.progress_today||0); }); });
  res.json({ found:true, report:report, manpower:manpower, equipment:equipment, activities:activities, accum:accum });
});

router.get('/api/personnel/:contractor', auth.isAuthenticated, function(req, res) { var db = dbMod.getDb(); res.json(db.prepare('SELECT * FROM contractor_personnel WHERE contractor_name=? AND is_active=1 ORDER BY person_name').all(decodeURIComponent(req.params.contractor))); });

router.post('/create', auth.isAuthenticated, function(req, res) {
  var b = req.body; var pid = parseInt(b.project_id); var td = todayStr(); var db = dbMod.getDb();
  var existing = db.prepare('SELECT * FROM daily_reports WHERE project_id=? AND report_date=?').get(pid, td);
  if (existing) { req.session.error='Today report exists.'; return res.redirect('/daily-report/view/'+existing.id); }
  var r = db.prepare('INSERT INTO daily_reports(project_id,report_date,weather,sro_number,normal_working_time,lq_departure_time,pf_arrival_time,start_working_time,pf_departure_time,lq_arrival_time,downtime_hour,productive_hour,wrench_time,remarks,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(pid, td, b.weather||'Clear', b.sro_number||'', b.normal_working_time||'', b.lq_departure_time||'', b.pf_arrival_time||'', b.start_working_time||'', b.pf_departure_time||'', b.lq_arrival_time||'', parseFloat(b.downtime_hour)||0, parseFloat(b.productive_hour)||0, parseFloat(b.wrench_time)||0, b.remarks||'', req.session.user.full_name);
  saveSubs(db, r.lastInsertRowid, b); dbMod.saveToDisk();
  req.session.success='Report saved.'; res.redirect('/daily-report?project='+pid);
});

router.post('/update/:id', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb(); var rpt = db.prepare('SELECT * FROM daily_reports WHERE id=?').get(parseInt(req.params.id));
  if (!rpt) { req.session.error='Not found.'; return res.redirect('/daily-report'); }
  if (!canEdit(req.session.user, rpt.report_date)) { req.session.error='Cannot edit.'; return res.redirect('/daily-report/view/'+rpt.id); }
  var b = req.body;
  db.prepare('UPDATE daily_reports SET weather=?,sro_number=?,normal_working_time=?,lq_departure_time=?,pf_arrival_time=?,start_working_time=?,pf_departure_time=?,lq_arrival_time=?,downtime_hour=?,productive_hour=?,wrench_time=?,remarks=?,created_by=? WHERE id=?')
    .run(b.weather||'Clear', b.sro_number||'', b.normal_working_time||'', b.lq_departure_time||'', b.pf_arrival_time||'', b.start_working_time||'', b.pf_departure_time||'', b.lq_arrival_time||'', parseFloat(b.downtime_hour)||0, parseFloat(b.productive_hour)||0, parseFloat(b.wrench_time)||0, b.remarks||'', req.session.user.full_name, rpt.id);
  saveSubs(db, rpt.id, b); dbMod.saveToDisk();
  req.session.success='Updated.'; res.redirect('/daily-report/view/'+rpt.id);
});

module.exports = router;