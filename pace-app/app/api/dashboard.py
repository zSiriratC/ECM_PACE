from flask import Blueprint, request, jsonify
from app.models import (
    db, DailyReportProjectProgress, DailyReportNotificationProgress, DailyReportProjectManpower
)
from sqlalchemy import func

dashboard_bp = Blueprint("dashboard_bp", __name__)


@dashboard_bp.route("/s-curve", methods=["GET"])
def s_curve():
    """S-curve data: plan vs actual manhour over time for a project."""
    project_no = request.args.get("project_no")
    if not project_no:
        return jsonify({"error": "project_no required"}), 400

    rows = (
        DailyReportProjectProgress.query
        .filter_by(project_no=project_no)
        .order_by(DailyReportProjectProgress.progress_date)
        .all()
    )

    labels = []
    plan_data = []
    actual_data = []
    cumulative_plan = 0
    cumulative_actual = 0

    for r in rows:
        labels.append(r.progress_date.isoformat() if r.progress_date else "")
        cumulative_plan += r.plan_manhour or 0
        cumulative_actual += r.actual_manhour or 0
        plan_data.append(round(cumulative_plan, 2))
        actual_data.append(round(cumulative_actual, 2))

    return jsonify({
        "labels": labels,
        "plan": plan_data,
        "actual": actual_data,
    })


@dashboard_bp.route("/kpi", methods=["GET"])
def kpi():
    """Latest KPI values: wrench time, PDI, PGI, PTI."""
    project_no = request.args.get("project_no")
    if not project_no:
        return jsonify({"error": "project_no required"}), 400

    latest = (
        DailyReportProjectProgress.query
        .filter_by(project_no=project_no)
        .order_by(DailyReportProjectProgress.progress_date.desc())
        .first()
    )

    if not latest:
        return jsonify({
            "wrench_time_project": 0, "wrench_time_daily": 0,
            "pdi_project": 0, "pdi_daily": 0,
            "pgi_project": 0, "pgi_daily": 0,
            "pti_project": 0, "pti_daily": 0,
        })

    return jsonify({
        "wrench_time_project": latest.wrench_time_project or 0,
        "wrench_time_daily": latest.wrench_time_daily or 0,
        "pdi_project": latest.pdi_project or 0,
        "pdi_daily": latest.pdi_daily or 0,
        "pgi_project": latest.pgi_project or 0,
        "pgi_daily": latest.pgi_daily or 0,
        "pti_project": latest.pti_project or 0,
        "pti_daily": latest.pti_daily or 0,
    })


@dashboard_bp.route("/pdi-vs-pgi", methods=["GET"])
def pdi_vs_pgi():
    """PDI vs PGI comparison over time."""
    project_no = request.args.get("project_no")
    if not project_no:
        return jsonify({"error": "project_no required"}), 400

    rows = (
        DailyReportProjectProgress.query
        .filter_by(project_no=project_no)
        .order_by(DailyReportProjectProgress.progress_date)
        .all()
    )

    return jsonify({
        "labels": [r.progress_date.isoformat() if r.progress_date else "" for r in rows],
        "pdi": [r.pdi_project or 0 for r in rows],
        "pgi": [r.pgi_project or 0 for r in rows],
    })


@dashboard_bp.route("/individual-efficiency", methods=["GET"])
def individual_efficiency():
    """Per-contractor manhour totals for a project."""
    project_no = request.args.get("project_no")
    if not project_no:
        return jsonify({"error": "project_no required"}), 400

    rows = (
        db.session.query(
            DailyReportProjectManpower.contractor_name,
            func.sum(DailyReportProjectManpower.total).label("total_hours")
        )
        .filter_by(project_no=project_no)
        .group_by(DailyReportProjectManpower.contractor_name)
        .order_by(func.sum(DailyReportProjectManpower.total).desc())
        .all()
    )

    return jsonify([
        {"contractor_name": r.contractor_name, "total_hours": round(r.total_hours or 0, 2)}
        for r in rows
    ])