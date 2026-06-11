var express = require('express');
var auth = require('../middleware/auth');
var dbMod = require('../database/init');
var router = express.Router();

function getActualMHByScope(db, pid) {
  var reports = db.prepare('SELECT id FROM daily_reports WHERE project_id=?').all(pid);
  var scopeMH = {}; var totalMH = 0;
  reports.forEach(function(r) {
    var mp = db.prepare('SELECT * FROM daily_manpower WHERE report_id=?').all(r.id);
    mp.forEach(function(m) {
      var mh = (m.offshore_working||0)+(m.offshore_overtime||0)+(m.offshore_standby||0)+(m.onshore_working||0)+(m.onshore_overtime||0)+(m.onshore_standby||0)+(m.onshore_standby_50||0);
      totalMH += mh;
      var scope = m.scope_ref || '';
      if (scope) { if (!scopeMH[scope]) scopeMH[scope] = 0; scopeMH[scope] += mh; }
    });
  });
  return { scopeMH: scopeMH, totalMH: Math.round(totalMH*100)/100 };
}

router.get('/', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb();
  var projects = db.prepare("SELECT * FROM projects WHERE status='in_progress' ORDER BY project_no").all();
  var selPid = req.query.project ? parseInt(req.query.project) : null;
  var selProject = null; var actuals = [];
  var totalPlannedQty=0, totalActualQty=0, totalPlannedMH=0, totalActualMH=0, projectActualMH=0;
  var editable = false; var role = req.session.user.role;

  if (selPid) {
    selProject = db.prepare('SELECT * FROM projects WHERE id=?').get(selPid);
    if (selProject && selProject.status === 'in_progress') {
      editable = (role==='assistant_supervisor'||role==='construction_supervisor'||role==='it_admin');
      dbMod.syncJobActualQty(selPid);
      var mhData = getActualMHByScope(db, selPid);
      projectActualMH = mhData.totalMH;
      var scopeMH = mhData.scopeMH;

      var allItems = db.prepare('SELECT * FROM job_actual_qty WHERE project_id=? ORDER BY id').all(selPid);
      actuals = allItems.filter(function(a) { return (a.planned_qty > 0)||(a.actual_qty > 0)||(!a.item_id); });
      actuals = actuals.map(function(a) {
        var planItem = a.item_id ? db.prepare('SELECT scope_ref,std_mh_per_unit FROM planning_activities WHERE id=?').get(a.item_id) : null;
        a.scope_ref = planItem ? planItem.scope_ref : '';
        a.productivity = (a.actual_qty>0&&a.actual_manhour>0) ? Math.round((a.actual_manhour/a.actual_qty)*100)/100 : 0;
        a.report_mh = a.scope_ref ? Math.round((scopeMH[a.scope_ref]||0)*100)/100 : 0;
        return a;
      });
      actuals.forEach(function(a) { totalPlannedQty+=(a.planned_qty||0); totalActualQty+=(a.actual_qty||0); totalActualMH+=(a.actual_manhour||0); });
      totalPlannedMH = selProject.total_manhour || 0;
    } else { selProject = null; }
  }

  res.render('actual', {
    title:'Project Actual Update', projects:projects, selProject:selProject, selPid:selPid, actuals:actuals, editable:editable,
    totalPlannedQty:totalPlannedQty, totalActualQty:totalActualQty, totalPlannedMH:totalPlannedMH,
    totalActualMH:Math.round(totalActualMH*100)/100, projectActualMH:projectActualMH,
    overallProductivity: totalActualQty>0 ? Math.round((totalActualMH/totalActualQty)*100)/100 : 0,
    completionPct: totalPlannedQty>0 ? Math.round((totalActualQty/totalPlannedQty)*10000)/100 : 0
  });
});

router.post('/save', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.body.project_id); var items = req.body.items||{}; var itemArr = Array.isArray(items)?items:Object.values(items); var db = dbMod.getDb();
  itemArr.forEach(function(i) { var aq=parseFloat(i.actual_qty)||0; var am=parseFloat(i.actual_manhour)||0;
    db.prepare('UPDATE job_actual_qty SET actual_qty=?,actual_manhour=?,productivity=?,status=? WHERE id=?').run(aq,am,aq>0?Math.round((am/aq)*10000)/10000:0,i.status||'draft',parseInt(i.id)); });
  dbMod.saveToDisk(); req.session.success='Saved.'; res.redirect('/actual?project='+pid);
});

router.post('/complete', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.body.project_id); var role = req.session.user.role;
  if (role!=='assistant_supervisor'&&role!=='construction_supervisor'&&role!=='it_admin') { req.session.error='No permission.'; return res.redirect('/actual?project='+pid); }
  var db = dbMod.getDb(); var p = db.prepare('SELECT * FROM projects WHERE id=?').get(pid);
  if (!p||p.status!=='in_progress') { req.session.error='Must be in progress.'; return res.redirect('/actual?project='+pid); }
  db.prepare('UPDATE projects SET status=? WHERE id=?').run('completed', pid); dbMod.saveToDisk();
  req.session.success='Project completed.'; res.redirect('/planning');
});

router.post('/add-row', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.body.project_id); var b = req.body;
  if (!b.item_name||!b.item_name.trim()) { req.session.error='Name required.'; return res.redirect('/actual?project='+pid); }
  var aq=parseFloat(b.actual_qty)||0; var am=parseFloat(b.actual_manhour)||0;
  dbMod.getDb().prepare('INSERT INTO job_actual_qty(project_id,item_id,item_name,unit,planned_qty,actual_qty,actual_manhour,productivity,status) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(pid,null,b.item_name.trim(),b.unit||'EA',0,aq,am,aq>0?Math.round((am/aq)*10000)/10000:0,'draft');
  dbMod.saveToDisk(); req.session.success='Added.'; res.redirect('/actual?project='+pid);
});

router.post('/delete/:id', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb(); var item = db.prepare('SELECT project_id FROM job_actual_qty WHERE id=?').get(parseInt(req.params.id));
  db.prepare('DELETE FROM job_actual_qty WHERE id=?').run(parseInt(req.params.id)); dbMod.saveToDisk();
  req.session.success='Deleted.'; res.redirect('/actual?project='+(item?item.project_id:''));
});

module.exports = router;