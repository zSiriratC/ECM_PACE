var express = require('express');
var auth = require('../middleware/auth');
var dbMod = require('../database/init');
var router = express.Router();

router.get('/', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb();
  var contractors = db.prepare('SELECT * FROM contractors WHERE is_active=1 ORDER BY name').all();
  var projects = db.prepare('SELECT * FROM projects ORDER BY project_no').all();

  // Get all unique months from daily_reports
  var months = db.prepare("SELECT DISTINCT substr(report_date,1,7) AS m FROM daily_reports ORDER BY m DESC").all().map(function(r) { return r.m; });

  var fContractor = req.query.contractor || '';
  var fMonth = req.query.month || '';
  var fProject = req.query.project || '';

  // Manpower summary
  var mpSql = 'SELECT dm.person_name, dm.contractor, dm.position, dr.report_date, dr.project_id,' +
    'dm.offshore_working, dm.offshore_overtime, dm.offshore_standby,' +
    'dm.onshore_working, dm.onshore_overtime, dm.onshore_standby, dm.onshore_standby_50,' +
    'p.project_no, p.title ' +
    'FROM daily_manpower dm ' +
    'JOIN daily_reports dr ON dm.report_id = dr.id ' +
    'JOIN projects p ON dr.project_id = p.id ' +
    'WHERE 1=1';
  var params = [];
  if (fContractor) { mpSql += ' AND dm.contractor = ?'; params.push(fContractor); }
  if (fMonth) { mpSql += ' AND dr.report_date LIKE ?'; params.push(fMonth + '%'); }
  if (fProject) { mpSql += ' AND dr.project_id = ?'; params.push(parseInt(fProject)); }
  mpSql += ' ORDER BY dm.contractor, dm.person_name, dr.report_date';
  var mpRows = db.prepare(mpSql).all.apply(db.prepare(mpSql), params);

  // Aggregate manpower by person
  var mpSummary = {};
  mpRows.forEach(function(r) {
    var key = r.contractor + '|' + r.person_name + '|' + r.position;
    if (!mpSummary[key]) {
      mpSummary[key] = {
        contractor: r.contractor, person_name: r.person_name, position: r.position,
        work_days: 0, dates: {},
        offshore_working: 0, offshore_overtime: 0, offshore_standby: 0,
        onshore_working: 0, onshore_overtime: 0, onshore_standby: 0, onshore_standby_50: 0,
        total_mh: 0
      };
    }
    var s = mpSummary[key];
    if (!s.dates[r.report_date]) { s.dates[r.report_date] = true; s.work_days++; }
    s.offshore_working += (r.offshore_working || 0);
    s.offshore_overtime += (r.offshore_overtime || 0);
    s.offshore_standby += (r.offshore_standby || 0);
    s.onshore_working += (r.onshore_working || 0);
    s.onshore_overtime += (r.onshore_overtime || 0);
    s.onshore_standby += (r.onshore_standby || 0);
    s.onshore_standby_50 += (r.onshore_standby_50 || 0);
    s.total_mh += (r.offshore_working || 0) + (r.offshore_overtime || 0) + (r.offshore_standby || 0)
                + (r.onshore_working || 0) + (r.onshore_overtime || 0) + (r.onshore_standby || 0)
                + (r.onshore_standby_50 || 0);
  });
  var mpList = Object.values(mpSummary).map(function(s) {
    delete s.dates;
    s.total_mh = Math.round(s.total_mh * 100) / 100;
    return s;
  });

  // Equipment summary
  var eqSql = 'SELECT de.equipment_name, de.equipment_tag, dr.report_date, dr.project_id,' +
    'de.offshore_working, de.offshore_standby, de.onshore_working, de.onshore_standby,' +
    'p.project_no, p.title ' +
    'FROM daily_equipment de ' +
    'JOIN daily_reports dr ON de.report_id = dr.id ' +
    'JOIN projects p ON dr.project_id = p.id ' +
    'WHERE 1=1';
  var eqParams = [];
  if (fMonth) { eqSql += ' AND dr.report_date LIKE ?'; eqParams.push(fMonth + '%'); }
  if (fProject) { eqSql += ' AND dr.project_id = ?'; eqParams.push(parseInt(fProject)); }
  eqSql += ' ORDER BY de.equipment_name, dr.report_date';
  var eqRows = db.prepare(eqSql).all.apply(db.prepare(eqSql), eqParams);

  var eqSummary = {};
  eqRows.forEach(function(r) {
    var key = r.equipment_name + '|' + (r.equipment_tag || '');
    if (!eqSummary[key]) {
      eqSummary[key] = {
        equipment_name: r.equipment_name, equipment_tag: r.equipment_tag || '',
        work_days: 0, dates: {},
        offshore_working: 0, offshore_standby: 0, onshore_working: 0, onshore_standby: 0,
        total_hours: 0
      };
    }
    var s = eqSummary[key];
    if (!s.dates[r.report_date]) { s.dates[r.report_date] = true; s.work_days++; }
    s.offshore_working += (r.offshore_working || 0);
    s.offshore_standby += (r.offshore_standby || 0);
    s.onshore_working += (r.onshore_working || 0);
    s.onshore_standby += (r.onshore_standby || 0);
    s.total_hours += (r.offshore_working || 0) + (r.offshore_standby || 0)
                   + (r.onshore_working || 0) + (r.onshore_standby || 0);
  });
  var eqList = Object.values(eqSummary).map(function(s) {
    delete s.dates;
    s.total_hours = Math.round(s.total_hours * 100) / 100;
    return s;
  });

  // Rates for cost calculation
  var rates = db.prepare('SELECT * FROM rates').all();
  var rateMap = {};
  rates.forEach(function(r) { rateMap[r.contractor_name + '|' + r.position] = r; });
  mpList.forEach(function(m) {
    var rate = rateMap[m.contractor + '|' + m.position];
    m.hourly_rate = rate ? rate.hourly_rate : 0;
    m.estimated_cost = Math.round(m.total_mh * m.hourly_rate * 100) / 100;
  });

  // Totals
  var totalMH = 0;
  var totalCost = 0;
  mpList.forEach(function(m) { totalMH += m.total_mh; totalCost += m.estimated_cost; });
  var totalEqHours = 0;
  eqList.forEach(function(e) { totalEqHours += e.total_hours; });

  res.render('timesheet', {
    title: 'Timesheet',
    contractors: contractors,
    projects: projects,
    months: months,
    fContractor: fContractor,
    fMonth: fMonth,
    fProject: fProject,
    mpList: mpList,
    eqList: eqList,
    totalMH: Math.round(totalMH * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalEqHours: Math.round(totalEqHours * 100) / 100
  });
});

// Export to CSV (Excel-compatible)
router.get('/export', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb();
  var fContractor = req.query.contractor || '';
  var fMonth = req.query.month || '';
  var fProject = req.query.project || '';

  // Manpower data
  var mpSql = 'SELECT dm.person_name, dm.contractor, dm.position, dr.report_date,' +
    'dm.offshore_working, dm.offshore_overtime, dm.offshore_standby,' +
    'dm.onshore_working, dm.onshore_overtime, dm.onshore_standby, dm.onshore_standby_50,' +
    'p.project_no, p.title ' +
    'FROM daily_manpower dm JOIN daily_reports dr ON dm.report_id=dr.id JOIN projects p ON dr.project_id=p.id WHERE 1=1';
  var params = [];
  if (fContractor) { mpSql += ' AND dm.contractor=?'; params.push(fContractor); }
  if (fMonth) { mpSql += ' AND dr.report_date LIKE ?'; params.push(fMonth + '%'); }
  if (fProject) { mpSql += ' AND dr.project_id=?'; params.push(parseInt(fProject)); }
  mpSql += ' ORDER BY dr.report_date, dm.contractor, dm.person_name';
  var mpRows = db.prepare(mpSql).all.apply(db.prepare(mpSql), params);

  // Equipment data
  var eqSql = 'SELECT de.equipment_name, de.equipment_tag, dr.report_date,' +
    'de.offshore_working, de.offshore_standby, de.onshore_working, de.onshore_standby,' +
    'p.project_no, p.title ' +
    'FROM daily_equipment de JOIN daily_reports dr ON de.report_id=dr.id JOIN projects p ON dr.project_id=p.id WHERE 1=1';
  var eqParams = [];
  if (fMonth) { eqSql += ' AND dr.report_date LIKE ?'; eqParams.push(fMonth + '%'); }
  if (fProject) { eqSql += ' AND dr.project_id=?'; eqParams.push(parseInt(fProject)); }
  eqSql += ' ORDER BY dr.report_date, de.equipment_name';
  var eqRows = db.prepare(eqSql).all.apply(db.prepare(eqSql), eqParams);

  // Rates
  var rates = db.prepare('SELECT * FROM rates').all();
  var rateMap = {};
  rates.forEach(function(r) { rateMap[r.contractor_name + '|' + r.position] = r; });

  // Build CSV
  var csv = '\uFEFF'; // BOM for Excel UTF-8
  csv += 'MANPOWER TIMESHEET\r\n';
  csv += 'Date,Project No,Project Title,Contractor,Person Name,Position,Off Working,Off OT,Off Standby,On Working,On OT,On Standby,On SB50%,Total MH,Hourly Rate,Est. Cost\r\n';

  mpRows.forEach(function(r) {
    var totalMH = (r.offshore_working || 0) + (r.offshore_overtime || 0) + (r.offshore_standby || 0)
                + (r.onshore_working || 0) + (r.onshore_overtime || 0) + (r.onshore_standby || 0)
                + (r.onshore_standby_50 || 0);
    var rate = rateMap[r.contractor + '|' + r.position];
    var hr = rate ? rate.hourly_rate : 0;
    var cost = Math.round(totalMH * hr * 100) / 100;
    csv += r.report_date + ',' + r.project_no + ',"' + (r.title || '') + '",' +
           r.contractor + ',' + r.person_name + ',' + r.position + ',' +
           (r.offshore_working || 0) + ',' + (r.offshore_overtime || 0) + ',' + (r.offshore_standby || 0) + ',' +
           (r.onshore_working || 0) + ',' + (r.onshore_overtime || 0) + ',' + (r.onshore_standby || 0) + ',' +
           (r.onshore_standby_50 || 0) + ',' + totalMH + ',' + hr + ',' + cost + '\r\n';
  });

  csv += '\r\n\r\nEQUIPMENT TIMESHEET\r\n';
  csv += 'Date,Project No,Project Title,Equipment,Tag,Off Working,Off Standby,On Working,On Standby,Total Hours\r\n';

  eqRows.forEach(function(r) {
    var totalH = (r.offshore_working || 0) + (r.offshore_standby || 0) + (r.onshore_working || 0) + (r.onshore_standby || 0);
    csv += r.report_date + ',' + r.project_no + ',"' + (r.title || '') + '",' +
           r.equipment_name + ',' + (r.equipment_tag || '') + ',' +
           (r.offshore_working || 0) + ',' + (r.offshore_standby || 0) + ',' +
           (r.onshore_working || 0) + ',' + (r.onshore_standby || 0) + ',' + totalH + '\r\n';
  });

  var filename = 'timesheet';
  if (fMonth) filename += '_' + fMonth;
  if (fContractor) filename += '_' + fContractor.replace(/\s/g, '_');
  filename += '.csv';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
  res.send(csv);
});

module.exports = router;