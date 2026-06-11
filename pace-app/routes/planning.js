var express = require('express');
var auth = require('../middleware/auth');
var dbMod = require('../database/init');
var router = express.Router();

var SCOPE = [
  { no:'1', name:'Mobilization', basis:'5% of Total MH', type:'percent', pct:5 },
  { no:'2', name:'Demolition', type:'header' },
  { no:'2.1', name:'Piping and Structure Demolition', basis:'Input Table 2', type:'input' },
  { no:'2.2', name:'IE Bulk Demolition', basis:'Input Table 1', type:'input' },
  { no:'2.3', name:'IE Tag Demolition', basis:'Input Table 1', type:'input' },
  { no:'2.4', name:'Mechanical & Equipment Demolition', basis:'Input Table 2', type:'input' },
  { no:'3', name:'Installation', type:'header' },
  { no:'3.1', name:'Piping Installation', basis:'Input Table 2', type:'input' },
  { no:'3.2', name:'Pipe Support Installation', basis:'Input Table 2', type:'input' },
  { no:'3.3', name:'Structure Installation', basis:'Input Table 2', type:'input' },
  { no:'3.4', name:'IE Bulk Installation', basis:'Input Table 1', type:'input' },
  { no:'3.5', name:'IE Tag Installation', basis:'Input Table 1', type:'input' },
  { no:'3.6', name:'Mechanical & Equipment Installation', basis:'Input Table 2', type:'input' },
  { no:'4', name:'Scaffolding & Habitat', type:'header' },
  { no:'4.1', name:'Scaffolding Erection', basis:'Input Table 3', type:'input' },
  { no:'4.2', name:'Scaffolding Dismantling', basis:'Input Table 3', type:'input' },
  { no:'4.3', name:'Pressurize Habitat', basis:'Input Table 3', type:'input' },
  { no:'5', name:'Other', type:'header' },
  { no:'5.1', name:'Insulation work (by POCT)', basis:'Input Table 4', type:'input' },
  { no:'5.2', name:'Isolation support', basis:'Input Table 4', type:'input' },
  { no:'5.3', name:'Site Survey', basis:'Input Table 4', type:'input' },
  { no:'5.4', name:'Pls Specific', basis:'Input Table 4', type:'input' },
  { no:'5.5', name:'Pls Specific', basis:'Input Table 4', type:'input' },
  { no:'5.6', name:'Pls Specific', basis:'Input Table 4', type:'input' },
  { no:'6', name:'Pre-Commissioning and Commissioning', type:'header' },
  { no:'6.1', name:'Testing and Pre-Commissioning', basis:'Input Table 1', type:'input' },
  { no:'6.2', name:'Function Test and Commissioning', basis:'Input Table 1', type:'input' },
  { no:'7', name:'Painting & Touch-up Paint', basis:'Input Table 3', type:'input' },
  { no:'8', name:'Area Cleaning', basis:'5% of Total MH', type:'percent', pct:5 },
  { no:'9', name:'Demobilization', basis:'5% of Total MH', type:'percent', pct:5 }
];

router.get('/', auth.isAuthenticated, function(req, res) {
  var d = dbMod.getDb();
  var projects = d.prepare('SELECT * FROM projects ORDER BY id DESC').all();
  var jobTypes = d.prepare('SELECT * FROM job_types ORDER BY name').all();
  var companies = d.prepare('SELECT * FROM companies ORDER BY name').all();
  var counts = { draft:0, pending_approval:0, approved:0, in_progress:0, completed:0 };
  projects.forEach(function(p) { if (counts[p.status] !== undefined) counts[p.status]++; });
  res.render('planning', { title:'Planning', projects:projects, jobTypes:jobTypes, companies:companies, counts:counts, mode:'list' });
});

router.get('/api/subtypes1/:jt', auth.isAuthenticated, function(req, res) {
  var d = dbMod.getDb(); var jt = d.prepare('SELECT id FROM job_types WHERE name=?').get(req.params.jt);
  res.json(jt ? d.prepare('SELECT * FROM sub_types_1 WHERE job_type_id=? ORDER BY name').all(jt.id) : []);
});
router.get('/api/subtypes2/:st1', auth.isAuthenticated, function(req, res) {
  var d = dbMod.getDb(); var s = d.prepare('SELECT id FROM sub_types_1 WHERE name=?').get(req.params.st1);
  res.json(s ? d.prepare('SELECT * FROM sub_types_2 WHERE sub_type_1_id=? ORDER BY name').all(s.id) : []);
});

router.post('/create', auth.isAuthenticated, function(req, res) {
  var b = req.body;
  if (!b.project_no || !b.project_no.trim()) { req.session.error = 'Project No required.'; return res.redirect('/planning'); }
  var d = dbMod.getDb();
  var r = d.prepare('INSERT INTO projects(project_no,title,field,platform,job_type,sub_type_1,sub_type_2,company,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run(b.project_no.trim(), b.title||'', b.field||'', b.platform||'', b.job_type||'', b.sub_type_1||'', b.sub_type_2||'', b.company||'', 'draft', req.session.user.full_name);
  var pid = r.lastInsertRowid;
  var defs = d.prepare('SELECT * FROM scope_default_items ORDER BY scope_ref, id').all();
  var ins = d.prepare('INSERT INTO planning_activities(project_id,scope_ref,work_item,quantity,unit,difficulty,std_mh_per_unit,planned_mh,remark) VALUES(?,?,?,?,?,?,?,?,?)');
  defs.forEach(function(df) { ins.run(pid, df.scope_ref, df.work_item, 0, df.unit, df.difficulty, df.std_mh_per_unit, 0, ''); });
  dbMod.saveToDisk(); dbMod.calculateProject(pid); dbMod.syncJobActualQty(pid);
  req.session.success = 'Project created.';
  res.redirect('/planning/' + pid);
});

// Delete project
router.post('/:id/delete', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.params.id);
  var role = req.session.user.role;
  if (role !== 'project_engineer' && role !== 'it_admin') {
    req.session.error = 'No permission to delete.';
    return res.redirect('/planning/' + pid);
  }
  var d = dbMod.getDb();
  d.prepare('DELETE FROM planning_activities WHERE project_id=?').run(pid);
  d.prepare('DELETE FROM job_actual_qty WHERE project_id=?').run(pid);
  d.prepare('DELETE FROM projects WHERE id=?').run(pid);
  dbMod.saveToDisk();
  req.session.success = 'Project deleted.';
  res.redirect('/planning');
});

// Summary
router.get('/:id', auth.isAuthenticated, function(req, res) {
  var d = dbMod.getDb();
  var project = d.prepare('SELECT * FROM projects WHERE id=?').get(parseInt(req.params.id));
  if (!project) { req.session.error = 'Not found.'; return res.redirect('/planning'); }
  var items = d.prepare('SELECT * FROM planning_activities WHERE project_id=?').all(project.id);
  var jobTypes = d.prepare('SELECT * FROM job_types ORDER BY name').all();
  var companies = d.prepare('SELECT * FROM companies ORDER BY name').all();
  var role = req.session.user.role;
  var editable = project.status === 'draft' && (role === 'project_engineer' || role === 'it_admin');
  var canSubmit = (role === 'project_engineer' || role === 'it_admin') && project.status === 'draft';
  var canApprove = (role === 'construction_supervisor' || role === 'it_admin') && project.status === 'pending_approval';
  var canReject = canApprove;
  var canStart = (role === 'assistant_supervisor' || role === 'construction_supervisor' || role === 'it_admin') && project.status === 'approved';
  var canComplete = (role === 'assistant_supervisor' || role === 'construction_supervisor' || role === 'it_admin') && project.status === 'in_progress';
  var refSums = {};
  var inputTotal = 0;
  items.forEach(function(it) {
    if (!refSums[it.scope_ref]) refSums[it.scope_ref] = 0;
    refSums[it.scope_ref] += (it.planned_mh || 0);
    inputTotal += (it.planned_mh || 0);
  });
  res.render('planning', {
    title:'Planning', projects:null, jobTypes:jobTypes, companies:companies, counts:null,
    project:project, mode:'summary', SCOPE:SCOPE, refSums:refSums, inputTotal:inputTotal,
    editable:editable, canSubmit:canSubmit, canApprove:canApprove, canReject:canReject, canStart:canStart, canComplete:canComplete
  });
});

// Auto-save params (called via fetch from frontend)
router.post('/:id/params-auto', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.params.id);
  var b = req.body;
  dbMod.getDb().prepare('UPDATE projects SET contingency=?,productive_time=?,manpower_count=?,plan_start=? WHERE id=?')
    .run(parseFloat(b.contingency)||10, parseFloat(b.productive_time)||8, parseInt(b.manpower_count)||5, b.plan_start||'', pid);
  dbMod.saveToDisk();
  dbMod.calculateProject(pid);
  var p = dbMod.getDb().prepare('SELECT * FROM projects WHERE id=?').get(pid);
  res.json({ success:true, total_manhour:p.total_manhour, plan_duration:p.plan_duration, plan_end:p.plan_end });
});

// Detail
router.get('/:id/detail/:ref', auth.isAuthenticated, function(req, res) {
  var d = dbMod.getDb();
  var project = d.prepare('SELECT * FROM projects WHERE id=?').get(parseInt(req.params.id));
  if (!project) { req.session.error = 'Not found.'; return res.redirect('/planning'); }
  var scopeRef = decodeURIComponent(req.params.ref);
  var items = d.prepare('SELECT * FROM planning_activities WHERE project_id=? AND scope_ref=? ORDER BY id').all(project.id, scopeRef);
  var scopeLine = null;
  SCOPE.forEach(function(s) { if (s.no === scopeRef) scopeLine = s; });
  var role = req.session.user.role;
  var editable = project.status === 'draft' && (role === 'project_engineer' || role === 'it_admin');
  res.render('planning', {
    title:'Planning', projects:null, jobTypes:null, companies:null, counts:null,
    project:project, mode:'detail', items:items, scopeRef:scopeRef, scopeLine:scopeLine, editable:editable,
    canSubmit:false, canApprove:false, canReject:false, canStart:false, canComplete:false
  });
});

// Auto-save single item (called via fetch)
router.post('/:id/item-auto', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.params.id);
  var b = req.body;
  var qty = parseFloat(b.quantity) || 0;
  var mh = parseFloat(b.std_mh_per_unit) || 0;
  var planned = Math.round(qty * mh * 100) / 100;
  dbMod.getDb().prepare('UPDATE planning_activities SET quantity=?,difficulty=?,planned_mh=?,remark=? WHERE id=? AND project_id=?')
    .run(qty, b.difficulty || 'Normal', planned, b.remark || '', parseInt(b.id), pid);
  dbMod.saveToDisk();
  dbMod.calculateProject(pid);
  dbMod.syncJobActualQty(pid);
  res.json({ success:true, planned_mh:planned });
});

// Save all items (kept for backward compat)
router.post('/:id/items', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.params.id);
  var items = req.body.items || [];
  var d = dbMod.getDb();
  items.forEach(function(i) {
    var qty = parseFloat(i.quantity) || 0;
    var mh = parseFloat(i.std_mh_per_unit) || 0;
    d.prepare('UPDATE planning_activities SET quantity=?,difficulty=?,planned_mh=?,remark=? WHERE id=? AND project_id=?')
      .run(qty, i.difficulty || 'Normal', Math.round(qty * mh * 100) / 100, i.remark || '', parseInt(i.id), pid);
  });
  dbMod.saveToDisk(); dbMod.calculateProject(pid); dbMod.syncJobActualQty(pid);
  res.json({ success: true });
});

router.post('/:id/add-item', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.params.id); var b = req.body;
  if (!b.work_item || !b.work_item.trim()) { req.session.error = 'Item required.'; return res.redirect('/planning/' + pid); }
  var qty = parseFloat(b.quantity) || 0; var mh = parseFloat(b.std_mh_per_unit) || 0;
  dbMod.getDb().prepare('INSERT INTO planning_activities(project_id,scope_ref,work_item,quantity,unit,difficulty,std_mh_per_unit,planned_mh,remark) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(pid, b.scope_ref || '', b.work_item.trim(), qty, b.unit || 'EA', b.difficulty || 'Normal', mh, Math.round(qty * mh * 100) / 100, b.remark || '');
  dbMod.saveToDisk(); dbMod.calculateProject(pid); dbMod.syncJobActualQty(pid);
  req.session.success = 'Added.';
  res.redirect('/planning/' + pid + '/detail/' + encodeURIComponent(b.scope_ref || ''));
});

router.post('/:id/delete-item/:iid', auth.isAuthenticated, function(req, res) {
  var d = dbMod.getDb();
  var item = d.prepare('SELECT scope_ref FROM planning_activities WHERE id=?').get(parseInt(req.params.iid));
  d.prepare('DELETE FROM planning_activities WHERE id=? AND project_id=?').run(parseInt(req.params.iid), parseInt(req.params.id));
  dbMod.saveToDisk(); dbMod.calculateProject(parseInt(req.params.id));
  req.session.success = 'Deleted.';
  var ref = (item && item.scope_ref) ? item.scope_ref : '';
  res.redirect('/planning/' + req.params.id + '/detail/' + encodeURIComponent(ref));
});

router.post('/:id/params', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.params.id); var b = req.body;
  dbMod.getDb().prepare('UPDATE projects SET contingency=?,productive_time=?,manpower_count=?,plan_start=? WHERE id=?')
    .run(parseFloat(b.contingency)||10, parseFloat(b.productive_time)||8, parseInt(b.manpower_count)||5, b.plan_start||'', pid);
  dbMod.saveToDisk(); dbMod.calculateProject(pid);
  req.session.success = 'Saved.'; res.redirect('/planning/' + pid);
});

router.post('/:id/status', auth.isAuthenticated, function(req, res) {
  var pid = parseInt(req.params.id), role = req.session.user.role, action = req.body.action;
  var d = dbMod.getDb(); var p = d.prepare('SELECT * FROM projects WHERE id=?').get(pid);
  if (!p) return res.redirect('/planning');
  var ns = p.status, ok = false;
  if (action==='submit' && (role==='project_engineer'||role==='it_admin') && p.status==='draft') { ns='pending_approval'; ok=true; }
  if (action==='approve' && (role==='construction_supervisor'||role==='it_admin') && p.status==='pending_approval') { ns='approved'; ok=true; }
  if (action==='reject' && (role==='construction_supervisor'||role==='it_admin') && p.status==='pending_approval') { ns='draft'; ok=true; }
  if (action==='start' && (role==='assistant_supervisor'||role==='construction_supervisor'||role==='it_admin') && p.status==='approved') { ns='in_progress'; ok=true; }
  
  if (action==='complete' && (role==='assistant_supervisor'||role==='construction_supervisor'||role==='it_admin') && p.status==='in_progress') {
    return res.redirect('/actual?project=' + pid);
  }

  if (ok) { d.prepare('UPDATE projects SET status=? WHERE id=?').run(ns, pid); dbMod.saveToDisk(); req.session.success = 'Status changed.'; }
  else { req.session.error = 'No permission.'; }
  res.redirect('/planning/' + pid);
});

module.exports = router;