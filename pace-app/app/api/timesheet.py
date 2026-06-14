from flask import Blueprint, request, jsonify
from app.models import (
    db, DailyReportProjectManpower, DailyReportProjectEquipment,
    DailyReportNotificationManpower, DailyReportNotificationEquipment,
)
from sqlalchemy import func

timesheet_bp = Blueprint("timesheet_bp", __name__)


@timesheet_bp.route("/manpower-summary", methods=["GET"])
def manpower_summary():
    """Aggregate manpower hours by contractor for a project."""
    project_no = request.args.get("project_no")
    if not project_no:
        return jsonify({"error": "project_no required"}), 400

    rows = (
        db.session.query(
            DailyReportProjectManpower.contractor_id,
            DailyReportProjectManpower.contractor_name,
            DailyReportProjectManpower.contractor_company,
            DailyReportProjectManpower.contractor_position,
            func.sum(DailyReportProjectManpower.offshore_working).label("offshore_working"),
            func.sum(DailyReportProjectManpower.offshore_standby).label("offshore_standby"),
            func.sum(DailyReportProjectManpower.offshore_overtime).label("offshore_overtime"),
            func.sum(DailyReportProjectManpower.onshore_working).label("onshore_working"),
            func.sum(DailyReportProjectManpower.onshore_standby).label("onshore_standby"),
            func.sum(DailyReportProjectManpower.onshore_overtime).label("onshore_overtime"),
            func.sum(DailyReportProjectManpower.total).label("total"),
        )
        .filter_by(project_no=project_no)
        .group_by(
            DailyReportProjectManpower.contractor_id,
            DailyReportProjectManpower.contractor_name,
            DailyReportProjectManpower.contractor_company,
            DailyReportProjectManpower.contractor_position,
        )
        .all()
    )

    return jsonify([{
        "contractor_id": r.contractor_id,
        "contractor_name": r.contractor_name,
        "contractor_company": r.contractor_company,
        "contractor_position": r.contractor_position,
        "offshore_working": round(r.offshore_working or 0, 2),
        "offshore_standby": round(r.offshore_standby or 0, 2),
        "offshore_overtime": round(r.offshore_overtime or 0, 2),
        "onshore_working": round(r.onshore_working or 0, 2),
        "onshore_standby": round(r.onshore_standby or 0, 2),
        "onshore_overtime": round(r.onshore_overtime or 0, 2),
        "total": round(r.total or 0, 2),
    } for r in rows])


@timesheet_bp.route("/equipment-summary", methods=["GET"])
def equipment_summary():
    """Aggregate equipment hours for a project."""
    project_no = request.args.get("project_no")
    if not project_no:
        return jsonify({"error": "project_no required"}), 400

    rows = (
        db.session.query(
            DailyReportProjectEquipment.equipment_name,
            DailyReportProjectEquipment.equipment_company,
            DailyReportProjectEquipment.charge_type,
            func.sum(DailyReportProjectEquipment.offshore_working).label("offshore_working"),
            func.sum(DailyReportProjectEquipment.offshore_standby).label("offshore_standby"),
            func.sum(DailyReportProjectEquipment.offshore_overtime).label("offshore_overtime"),
            func.sum(DailyReportProjectEquipment.onshore_working).label("onshore_working"),
            func.sum(DailyReportProjectEquipment.onshore_standby).label("onshore_standby"),
            func.sum(DailyReportProjectEquipment.onshore_overtime).label("onshore_overtime"),
            func.sum(DailyReportProjectEquipment.total).label("total"),
        )
        .filter_by(project_no=project_no)
        .group_by(
            DailyReportProjectEquipment.equipment_name,
            DailyReportProjectEquipment.equipment_company,
            DailyReportProjectEquipment.charge_type,
        )
        .all()
    )

    return jsonify([{
        "equipment_name": r.equipment_name,
        "equipment_company": r.equipment_company,
        "charge_type": r.charge_type,
        "offshore_working": round(r.offshore_working or 0, 2),
        "offshore_standby": round(r.offshore_standby or 0, 2),
        "offshore_overtime": round(r.offshore_overtime or 0, 2),
        "onshore_working": round(r.onshore_working or 0, 2),
        "onshore_standby": round(r.onshore_standby or 0, 2),
        "onshore_overtime": round(r.onshore_overtime or 0, 2),
        "total": round(r.total or 0, 2),
    } for r in rows])


@timesheet_bp.route("/export-data", methods=["GET"])
def export_data():
    """Return all manpower + equipment data for Excel export."""
    project_no = request.args.get("project_no")
    if not project_no:
        return jsonify({"error": "project_no required"}), 400

    mp = DailyReportProjectManpower.query.filter_by(project_no=project_no).all()
    eq = DailyReportProjectEquipment.query.filter_by(project_no=project_no).all()

    return jsonify({
        "manpower": [r.to_dict() for r in mp],
        "equipment": [r.to_dict() for r in eq],
    })