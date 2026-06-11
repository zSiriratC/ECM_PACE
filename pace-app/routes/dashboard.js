var express = require('express');
var auth = require('../middleware/auth');
var dbMod = require('../database/init');
var router = express.Router();

// Calculate MH for a single report from manpower rows
function calcReportMH(db, rid) {
  var mp = db.prepare('SELECT * FROM daily_manpower WHERE report_id=?').all(rid);
  var total = 0;
  mp.forEach(function(m) {
    total += (m.offshore_working || 0) + (m.offshore_overtime || 0) + (m.offshore_standby || 0)
           + (m.onshore_working || 0) + (m.onshore_overtime || 0) + (m.onshore_standby || 0)
           + (m.onshore_standby_50 || 0);
  });
  return Math.round(total * 100) / 100;
}

// Calculate working hours only (not OT/standby) for manpower chart
function calcReportWorkingHours(db, rid) {
  var mp = db.prepare('SELECT * FROM daily_manpower WHERE report_id=?').all(rid);
  var total = 0;
  mp.forEach(function(m) {
    total += (m.offshore_working || 0) + (m.onshore_working || 0);
  });
  return Math.round(total * 100) / 100;
}

// Helper: calculate PGI and PDI for a project
function calcProjectMetrics(db, project) {
  var reports = db.prepare('SELECT * FROM daily_reports WHERE project_id=? ORDER BY report_date').all(project.id);
  var totalPlannedMH = project.total_manhour || 0;
  var planDuration = project.plan_duration || 1;
  var cumProgress = 0;
  var cumActualMH = 0;

  reports.forEach(function(r, idx) {
    var acts = db.prepare('SELECT * FROM report_activities WHERE report_id=?').all(r.id);
    var dayProgress = 0;
    acts.forEach(function(a) { dayProgress += (a.progress_today || 0); });
    cumProgress += dayProgress;
    cumActualMH += calcReportMH(db, r.id);
  });

  var plannedProgressPct = planDuration > 0 ? (reports.length / planDuration) * 100 : 0;
  if (plannedProgressPct > 100) plannedProgressPct = 100;
  var cumPlannedMH = planDuration > 0 ? totalPlannedMH * (reports.length / planDuration) : 0;
  if (cumPlannedMH > totalPlannedMH) cumPlannedMH = totalPlannedMH;

  var pgi = plannedProgressPct > 0 ? cumProgress / plannedProgressPct : 0;
  var pdi = 0;
  if (cumActualMH > 0 && cumPlannedMH > 0 && plannedProgressPct > 0) {
    var denom = cumActualMH * (plannedProgressPct / cumPlannedMH);
    pdi = denom > 0 ? cumProgress / denom : 0;
  }

  return {
    reportDays: reports.length,
    cumProgress: Math.round(cumProgress * 100) / 100,
    cumActualMH: Math.round(cumActualMH * 100) / 100,
    pgi: Math.round(pgi * 1000) / 1000,
    pdi: Math.round(pdi * 1000) / 1000
  };
}

router.get('/', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb();
  var allProjects = db.prepare('SELECT * FROM projects ORDER BY project_no').all();
  var jobTypes = db.prepare('SELECT DISTINCT name FROM job_types ORDER BY name').all().map(function(r) { return r.name; });
  var fields = [];
  allProjects.forEach(function(p) { if (p.field && fields.indexOf(p.field) === -1) fields.push(p.field); });

  var fJT = req.query.job_type || '';
  var fST1 = req.query.sub_type_1 || '';
  var fST2 = req.query.sub_type_2 || '';
  var fField = req.query.field || '';

  var st1List = [];
  var st2List = [];
  if (fJT) {
    var jt = db.prepare('SELECT id FROM job_types WHERE name=?').get(fJT);
    if (jt) st1List = db.prepare('SELECT DISTINCT name FROM sub_types_1 WHERE job_type_id=? ORDER BY name').all(jt.id).map(function(r) { return r.name; });
  } else {
    st1List = db.prepare('SELECT DISTINCT name FROM sub_types_1 ORDER BY name').all().map(function(r) { return r.name; });
  }
  if (fST1) {
    var s1 = db.prepare('SELECT id FROM sub_types_1 WHERE name=?').get(fST1);
    if (s1) st2List = db.prepare('SELECT DISTINCT name FROM sub_types_2 WHERE sub_type_1_id=? ORDER BY name').all(s1.id).map(function(r) { return r.name; });
  }

  var filtered = allProjects;
  if (fJT) filtered = filtered.filter(function(p) { return p.job_type === fJT; });
  if (fST1) filtered = filtered.filter(function(p) { return p.sub_type_1 === fST1; });
  if (fST2) filtered = filtered.filter(function(p) { return p.sub_type_2 === fST2; });
  if (fField) filtered = filtered.filter(function(p) { return p.field === fField; });

  // PDI vs PGI scatter (active projects only)
  var pdiPgiData = [];
  filtered.forEach(function(p) {
    var m = calcProjectMetrics(db, p);
    if (m.reportDays === 0) return;
    pdiPgiData.push({
      id: p.id,
      name: p.project_no + ' - ' + (p.title || ''),
      status: p.status,
      field: p.field || '',
      pgi: m.pgi,
      pdi: m.pdi
    });
  });

  // Progress index scatter (all projects)
  var progressData = [];
  filtered.forEach(function(p) {
    var m = calcProjectMetrics(db, p);
    progressData.push({
      id: p.id,
      name: p.project_no + ' - ' + (p.title || ''),
      status: p.status,
      planDuration: Math.round((p.plan_duration || 0) * 10) / 10,
      totalManhour: Math.round((p.total_manhour || 0) * 10) / 10,
      reportDays: m.reportDays,
      progressIndex: m.pgi
    });
  });

  res.render('dashboard', {
    title: 'Dashboard',
    allProjects: allProjects,
    progressData: progressData,
    pdiPgiData: pdiPgiData,
    jobTypes: jobTypes,
    fields: fields,
    st1List: st1List,
    st2List: st2List,
    fJT: fJT,
    fST1: fST1,
    fST2: fST2,
    fField: fField
  });
});

// API: project detail with full date range baseline
router.get('/api/project/:id', auth.isAuthenticated, function(req, res) {
  var db = dbMod.getDb();
  var project = db.prepare('SELECT * FROM projects WHERE id=?').get(parseInt(req.params.id));
  if (!project) return res.json({ error: 'Not found' });

  var totalPlannedMH = project.total_manhour || 0;
  var planStart = project.plan_start || '';
  var planEnd = project.plan_end || '';

  // Build full date range from plan_start to max(plan_end, today)
  var allDates = [];
  if (planStart) {
    var startDate = new Date(planStart);
    var today = new Date();
    var endDateObj = planEnd ? new Date(planEnd) : today;
    if (today > endDateObj) endDateObj = today;
    var cursor = new Date(startDate);
    while (cursor <= endDateObj) {
      var yy = cursor.getFullYear();
      var mm = String(cursor.getMonth() + 1).padStart(2, '0');
      var dd = String(cursor.getDate()).padStart(2, '0');
      allDates.push(yy + '-' + mm + '-' + dd);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // Index reports by date
  var reports = db.prepare('SELECT * FROM daily_reports WHERE project_id=? ORDER BY report_date').all(project.id);
  var reportMap = {};
  reports.forEach(function(r) { reportMap[r.report_date] = r; });

  // Plan days for baseline calculation
  var planDays = 0;
  if (planStart && planEnd) {
    var sd = new Date(planStart);
    var ed = new Date(planEnd);
    planDays = Math.round((ed - sd) / (1000 * 60 * 60 * 24)) + 1;
  }
  if (planDays < 1) planDays = Math.max(allDates.length, 1);

  var dailyData = [];
  var cumProgress = 0;
  var cumActualMH = 0;
  var dayIndex = 0;

  allDates.forEach(function(dateStr) {
    dayIndex++;
    var r = reportMap[dateStr];

    // Planned baseline (straight line)
    var plannedProgressPct = Math.min((dayIndex / planDays) * 100, 100);
    var cumPlannedMH = Math.min((dayIndex / planDays) * totalPlannedMH, totalPlannedMH);

    var dayProgress = 0;
    var productiveHour = 0;
    var wrenchTime = 0;
    var downtimeHour = 0;
    var totalMpHours = 0;

    if (r) {
      var acts = db.prepare('SELECT * FROM report_activities WHERE report_id=?').all(r.id);
      acts.forEach(function(a) { dayProgress += (a.progress_today || 0); });

      // Actual MH from manpower
      var mpRows = db.prepare('SELECT * FROM daily_manpower WHERE report_id=?').all(r.id);
      mpRows.forEach(function(m) {
        var personTotal = (m.offshore_working || 0) + (m.offshore_overtime || 0) + (m.offshore_standby || 0)
                        + (m.onshore_working || 0) + (m.onshore_overtime || 0) + (m.onshore_standby || 0)
                        + (m.onshore_standby_50 || 0);
        cumActualMH += personTotal;
        totalMpHours += (m.offshore_working || 0) + (m.onshore_working || 0);
      });

      productiveHour = r.productive_hour || 0;
      wrenchTime = r.wrench_time || 0;
      downtimeHour = r.downtime_hour || 0;
    }

    cumProgress += dayProgress;

    // PGI
    var pgi = plannedProgressPct > 0 ? cumProgress / plannedProgressPct : 0;

    // PDI
    var pdi = 0;
    if (cumActualMH > 0 && cumPlannedMH > 0 && plannedProgressPct > 0) {
      var denom = cumActualMH * (plannedProgressPct / cumPlannedMH);
      pdi = denom > 0 ? cumProgress / denom : 0;
    }

    dailyData.push({
      date: dateStr,
      hasReport: !!r,
      productiveHour: productiveHour,
      wrenchTime: wrenchTime,
      downtimeHour: downtimeHour,
      dayProgress: dayProgress,
      cumProgress: Math.round(cumProgress * 100) / 100,
      cumActualMH: Math.round(cumActualMH * 100) / 100,
      cumPlannedMH: Math.round(cumPlannedMH * 100) / 100,
      plannedProgressPct: Math.round(plannedProgressPct * 100) / 100,
      pgi: Math.round(pgi * 1000) / 1000,
      pdi: Math.round(pdi * 1000) / 1000,
      totalMpHours: Math.round(totalMpHours * 100) / 100
    });
  });

  // Fallback if no plan_start — use report dates only
  if (allDates.length === 0 && reports.length > 0) {
    cumProgress = 0;
    cumActualMH = 0;
    reports.forEach(function(r, idx) {
      var acts = db.prepare('SELECT * FROM report_activities WHERE report_id=?').all(r.id);
      var dayProgress = 0;
      acts.forEach(function(a) { dayProgress += (a.progress_today || 0); });
      cumProgress += dayProgress;
      cumActualMH += calcReportMH(db, r.id);
      var ppct = planDays > 0 ? ((idx + 1) / planDays) * 100 : 0;
      var cpmh = planDays > 0 ? ((idx + 1) / planDays) * totalPlannedMH : 0;
      var wh = calcReportWorkingHours(db, r.id);
      var pgi2 = ppct > 0 ? cumProgress / ppct : 0;
      var pdi2 = 0;
      if (cumActualMH > 0 && cpmh > 0 && ppct > 0) {
        var den2 = cumActualMH * (ppct / cpmh);
        pdi2 = den2 > 0 ? cumProgress / den2 : 0;
      }
      dailyData.push({
        date: r.report_date, hasReport: true,
        productiveHour: r.productive_hour || 0, wrenchTime: r.wrench_time || 0, downtimeHour: r.downtime_hour || 0,
        dayProgress: dayProgress, cumProgress: Math.round(cumProgress * 100) / 100,
        cumActualMH: Math.round(cumActualMH * 100) / 100, cumPlannedMH: Math.round(cpmh * 100) / 100,
        plannedProgressPct: Math.round(ppct * 100) / 100,
        pgi: Math.round(pgi2 * 1000) / 1000, pdi: Math.round(pdi2 * 1000) / 1000,
        totalMpHours: wh
      });
    });
  }

  var lastDay = dailyData.length > 0 ? dailyData[dailyData.length - 1] : null;

  res.json({
    project: project,
    dailyData: dailyData,
    summary: {
      totalPlannedMH: totalPlannedMH,
      cumActualMH: lastDay ? lastDay.cumActualMH : 0,
      completion: lastDay ? lastDay.cumProgress : 0,
      reportDays: reports.length,
      planDays: planDays,
      planStart: planStart,
      planEnd: planEnd,
      pgi: lastDay ? lastDay.pgi : 0,
      pdi: lastDay ? lastDay.pdi : 0
    }
  });
});

module.exports = router;