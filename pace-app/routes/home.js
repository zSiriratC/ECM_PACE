var express = require('express');
var auth = require('../middleware/auth');
var db = require('../database/init');
var router = express.Router();

router.get('/', auth.isAuthenticated, function(req, res) {
  var d = db.getDb();
  var all = d.prepare('SELECT * FROM projects ORDER BY id DESC').all();
  var counts = { draft:0, pending_approval:0, approved:0, in_progress:0, completed:0 };
  all.forEach(function(p) { if (counts[p.status] !== undefined) counts[p.status]++; });
  var myTasks = [], taskDesc = 'No tasks';
  var role = req.session.user.role;
  if (role === 'project_engineer') { myTasks = all.filter(function(p){return p.status==='draft';}); taskDesc = 'Projects to plan'; }
  else if (role === 'construction_supervisor') { myTasks = all.filter(function(p){return p.status==='pending_approval';}); taskDesc = 'Awaiting approval'; }
  else if (role === 'assistant_supervisor') { myTasks = all.filter(function(p){return p.status==='approved'||p.status==='in_progress';}); taskDesc = 'Active projects'; }
  else if (role === 'it_admin') { myTasks = all; taskDesc = 'All projects'; }
  var completed = all.filter(function(p){return p.status==='completed';});
  var recent = d.prepare('SELECT dr.*,p.project_no,p.title FROM daily_reports dr JOIN projects p ON dr.project_id=p.id ORDER BY dr.report_date DESC LIMIT 5').all();
  res.render('home', { title:'Home', counts:counts, myTasks:myTasks, taskDesc:taskDesc, completed:completed, recent:recent, total:all.length });
});

module.exports = router;