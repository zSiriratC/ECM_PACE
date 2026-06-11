var express = require('express');
var bcrypt = require('bcryptjs');
var auth = require('../middleware/auth');
var dbMod = require('../database/init');
var router = express.Router();

router.get('/', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb();
  res.render('setup', {
    title: 'Setup',
    equipment: db.prepare('SELECT * FROM equipment ORDER BY name').all(),
    contractors: db.prepare('SELECT * FROM contractors ORDER BY name').all(),
    contractorPersonnel: db.prepare('SELECT * FROM contractor_personnel ORDER BY contractor_name, person_name').all(),
    rates: db.prepare('SELECT * FROM rates ORDER BY contractor_name, position').all(),
    stdManhour: db.prepare('SELECT * FROM std_manhour ORDER BY work_type, work_item').all(),
    users: db.prepare('SELECT * FROM users ORDER BY id').all(),
    jobTypes: db.prepare('SELECT * FROM job_types ORDER BY name').all(),
    subTypes1: db.prepare('SELECT s.id, s.name, s.job_type_id, j.name AS jt_name FROM sub_types_1 s JOIN job_types j ON s.job_type_id=j.id ORDER BY j.name, s.name').all(),
    subTypes2: db.prepare('SELECT s.id, s.name, s.sub_type_1_id, t.name AS st1_name FROM sub_types_2 s JOIN sub_types_1 t ON s.sub_type_1_id=t.id ORDER BY t.name, s.name').all(),
    companies: db.prepare('SELECT * FROM companies ORDER BY name').all(),
    positions: db.prepare('SELECT * FROM positions ORDER BY name').all(),
    qps: db.prepare('SELECT * FROM quarter_platforms ORDER BY name').all(),
    defaultItems: db.prepare('SELECT * FROM default_items ORDER BY id').all(),
    scopeDefaults: db.prepare('SELECT * FROM scope_default_items ORDER BY scope_ref, id').all(),
    isAdmin: req.session.user.role === 'it_admin' || req.session.user.role === 'procurement_skl'
  });
});

// Equipment
router.post('/equipment/save', auth.isAuthenticated, auth.roleCheck('it_admin','procurement_skl'), function(req, res) {
  var b = req.body; var db = dbMod.getDb();
  if (b.id) db.prepare('UPDATE equipment SET name=?,type=?,description=?,is_active=? WHERE id=?').run(b.name, b.type||'', b.description||'', b.is_active?1:0, parseInt(b.id));
  else db.prepare('INSERT INTO equipment(name,type,description) VALUES(?,?,?)').run(b.name, b.type||'', b.description||'');
  dbMod.saveToDisk(); req.session.success='Saved.'; res.redirect('/setup#tab-equipment');
});
router.post('/equipment/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('DELETE FROM equipment WHERE id=?').run(parseInt(req.params.id));
  dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-equipment');
});

// Contractors
router.post('/contractor/save', auth.isAuthenticated, auth.roleCheck('it_admin','procurement_skl'), function(req, res) {
  var b = req.body; var db = dbMod.getDb();
  if (b.id) db.prepare('UPDATE contractors SET name=?,company=?,contact_person=?,phone=?,is_active=? WHERE id=?').run(b.name, b.company||'', b.contact_person||'', b.phone||'', b.is_active?1:0, parseInt(b.id));
  else db.prepare('INSERT INTO contractors(name,company,contact_person,phone) VALUES(?,?,?,?)').run(b.name, b.company||'', b.contact_person||'', b.phone||'');
  dbMod.saveToDisk(); req.session.success='Saved.'; res.redirect('/setup#tab-contractors');
});
router.post('/contractor/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('DELETE FROM contractors WHERE id=?').run(parseInt(req.params.id));
  dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-contractors');
});

// Contractor Personnel
router.post('/personnel/save', auth.isAuthenticated, auth.roleCheck('it_admin','procurement_skl'), function(req, res) {
  var b = req.body; var db = dbMod.getDb();
  if (b.id) db.prepare('UPDATE contractor_personnel SET contractor_name=?,person_name=?,position=?,is_active=? WHERE id=?').run(b.contractor_name, b.person_name, b.position||'', b.is_active?1:0, parseInt(b.id));
  else db.prepare('INSERT INTO contractor_personnel(contractor_name,person_name,position) VALUES(?,?,?)').run(b.contractor_name, b.person_name, b.position||'');
  dbMod.saveToDisk(); req.session.success='Saved.'; res.redirect('/setup#tab-personnel');
});
router.post('/personnel/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('DELETE FROM contractor_personnel WHERE id=?').run(parseInt(req.params.id));
  dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-personnel');
});

// Rates
router.post('/rate/save', auth.isAuthenticated, auth.roleCheck('it_admin','procurement_skl'), function(req, res) {
  var b = req.body; var db = dbMod.getDb();
  var cid = parseInt(b.contractor_id) || null;
  var cn = cid ? (db.prepare('SELECT name FROM contractors WHERE id=?').get(cid) || {}).name || '' : '';
  if (b.id) db.prepare('UPDATE rates SET contractor_id=?,contractor_name=?,position=?,daily_rate=?,hourly_rate=?,currency=?,effective_date=? WHERE id=?').run(cid,cn,b.position||'',parseFloat(b.daily_rate)||0,parseFloat(b.hourly_rate)||0,b.currency||'THB',b.effective_date||'',parseInt(b.id));
  else db.prepare('INSERT INTO rates(contractor_id,contractor_name,position,daily_rate,hourly_rate,currency,effective_date) VALUES(?,?,?,?,?,?,?)').run(cid,cn,b.position||'',parseFloat(b.daily_rate)||0,parseFloat(b.hourly_rate)||0,b.currency||'THB',b.effective_date||'');
  dbMod.saveToDisk(); req.session.success='Saved.'; res.redirect('/setup#tab-rates');
});
router.post('/rate/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('DELETE FROM rates WHERE id=?').run(parseInt(req.params.id));
  dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-rates');
});

// Std Manhour
router.post('/stdmanhour/save', auth.isAuthenticated, auth.roleCheck('it_admin','procurement_skl'), function(req, res) {
  var b = req.body; var db = dbMod.getDb();
  if (b.id) db.prepare('UPDATE std_manhour SET work_type=?,work_item=?,difficulty_level=?,std_manhour_per_unit=?,unit=?,is_validated=? WHERE id=?').run(b.work_type||'',b.work_item||'',b.difficulty_level||'Normal',parseFloat(b.std_manhour_per_unit)||0,b.unit||'',b.is_validated?1:0,parseInt(b.id));
  else db.prepare('INSERT INTO std_manhour(work_type,work_item,difficulty_level,std_manhour_per_unit,unit) VALUES(?,?,?,?,?)').run(b.work_type||'',b.work_item||'',b.difficulty_level||'Normal',parseFloat(b.std_manhour_per_unit)||0,b.unit||'');
  dbMod.saveToDisk(); req.session.success='Saved.'; res.redirect('/setup#tab-stdmanhour');
});
router.post('/stdmanhour/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('DELETE FROM std_manhour WHERE id=?').run(parseInt(req.params.id));
  dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-stdmanhour');
});

// Users
router.post('/user/save', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  var b = req.body; var db = dbMod.getDb();
  if (b.id) {
    if (b.password && b.password.trim()) db.prepare('UPDATE users SET username=?,password=?,full_name=?,role=?,email=?,is_active=? WHERE id=?').run(b.username,bcrypt.hashSync(b.password,10),b.full_name||'',b.role||'',b.email||'',b.is_active?1:0,parseInt(b.id));
    else db.prepare('UPDATE users SET username=?,full_name=?,role=?,email=?,is_active=? WHERE id=?').run(b.username,b.full_name||'',b.role||'',b.email||'',b.is_active?1:0,parseInt(b.id));
  } else db.prepare('INSERT INTO users(username,password,full_name,role,email) VALUES(?,?,?,?,?)').run(b.username,bcrypt.hashSync(b.password||'password123',10),b.full_name||'',b.role||'',b.email||'');
  dbMod.saveToDisk(); req.session.success='Saved.'; res.redirect('/setup#tab-users');
});

// Simple table CRUD
var simpleTables = [
  ['job-types','job_types'], ['companies','companies'], ['positions','positions'], ['quarter-platforms','quarter_platforms']
];
simpleTables.forEach(function(t) {
  router.post('/'+t[0]+'/add', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
    if (!req.body.name||!req.body.name.trim()) { req.session.error='Name required.'; return res.redirect('/setup'); }
    try { dbMod.getDb().prepare('INSERT INTO '+t[1]+'(name) VALUES(?)').run(req.body.name.trim()); dbMod.saveToDisk(); req.session.success='Added.'; }
    catch(e) { req.session.error='Already exists or error.'; }
    res.redirect('/setup#tab-'+t[0]);
  });
  router.post('/'+t[0]+'/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
    dbMod.getDb().prepare('DELETE FROM '+t[1]+' WHERE id=?').run(parseInt(req.params.id));
    dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-'+t[0]);
  });
});

// Sub Types 1
router.post('/sub-types-1/add', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('INSERT INTO sub_types_1(job_type_id,name) VALUES(?,?)').run(parseInt(req.body.job_type_id), req.body.name);
  dbMod.saveToDisk(); req.session.success='Added.'; res.redirect('/setup#tab-subtypes1');
});
router.post('/sub-types-1/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('DELETE FROM sub_types_1 WHERE id=?').run(parseInt(req.params.id)); dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-subtypes1');
});

// Sub Types 2
router.post('/sub-types-2/add', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('INSERT INTO sub_types_2(sub_type_1_id,name) VALUES(?,?)').run(parseInt(req.body.sub_type_1_id), req.body.name);
  dbMod.saveToDisk(); req.session.success='Added.'; res.redirect('/setup#tab-subtypes2');
});
router.post('/sub-types-2/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('DELETE FROM sub_types_2 WHERE id=?').run(parseInt(req.params.id)); dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-subtypes2');
});

// Default Items
router.post('/default-items/add', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('INSERT INTO default_items(item_name,unit,manhour_per_unit) VALUES(?,?,?)').run(req.body.item_name, req.body.unit||'EA', parseFloat(req.body.manhour_per_unit)||0);
  dbMod.saveToDisk(); req.session.success='Added.'; res.redirect('/setup#tab-defaultitems');
});
router.post('/default-items/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('DELETE FROM default_items WHERE id=?').run(parseInt(req.params.id)); dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-defaultitems');
});

// Scope Default Items
router.post('/scope-items/add', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  var b = req.body;
  dbMod.getDb().prepare('INSERT INTO scope_default_items(scope_ref,work_item,unit,difficulty,std_mh_per_unit) VALUES(?,?,?,?,?)').run(b.scope_ref, b.work_item, b.unit||'EA', b.difficulty||'Normal', parseFloat(b.std_mh_per_unit)||0);
  dbMod.saveToDisk(); req.session.success='Added.'; res.redirect('/setup#tab-scopeitems');
});
router.post('/scope-items/delete/:id', auth.isAuthenticated, auth.roleCheck('it_admin'), function(req, res) {
  dbMod.getDb().prepare('DELETE FROM scope_default_items WHERE id=?').run(parseInt(req.params.id)); dbMod.saveToDisk(); req.session.success='Deleted.'; res.redirect('/setup#tab-scopeitems');
});

module.exports = router;