from flask import Blueprint, request, jsonify
from app.models import (
    db,
    DailyReportProjectProgress, DailyReportProjectManpower,
    DailyReportProjectEquipment,
    DailyReportNotificationProgress, DailyReportNotificationManpower,
    DailyReportNotificationEquipment,
)
from datetime import datetime, date

daily_report_bp = Blueprint("daily_report_bp", __name__)


def _parse_date(val):
    if not val:
        return None
    if isinstance(val, date):
        return val
    try:
        return datetime.strptime(val, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _parse_datetime(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"]:
        try:
            return datetime.strptime(val, fmt)
        except (ValueError, TypeError):
            continue
    return None


def _set_fields(item, data, fields):
    for key in fields:
        if key in data:
            setattr(item, key, data[key])


# ═══════════════════════════════════════
#  PROJECT — PROGRESS
# ═══════════════════════════════════════

@daily_report_bp.route("/project/progress", methods=["GET"])
def get_proj_progress_list():
    project_no = request.args.get("project_no")
    q = DailyReportProjectProgress.query
    if project_no:
        q = q.filter_by(project_no=project_no)
    rows = q.order_by(DailyReportProjectProgress.progress_date.desc()).all()
    return jsonify([r.to_dict() for r in rows])


@daily_report_bp.route("/project/progress", methods=["POST"])
def create_proj_progress():
    data = request.get_json()
    progress_dt = _parse_date(data.get("progress_date"))
    project_no = data.get("project_no")

    if not project_no or not progress_dt:
        return jsonify({"error": "project_no and progress_date are required"}), 400

    existing = DailyReportProjectProgress.query.filter_by(
        project_no=project_no, progress_date=progress_dt
    ).first()
    if existing:
        return jsonify({"error": "Report already exists for this date. Use PUT to update."}), 409

    try:
        item = DailyReportProjectProgress(project_no=project_no, progress_date=progress_dt)
        _set_fields(item, data, [
            "weather_condition", "status", "plan_pob", "actual_pob",
            "plan_manhour", "actual_manhour", "progress_today", "progress_total",
            "downtime_hour", "productive_hour",
            "wrench_time_project", "wrench_time_daily",
            "pdi_project", "pdi_daily", "pgi_project", "pgi_daily",
            "pti_project", "pti_daily",
        ])
        for tk in ["normal_working_time", "lq_departure_time", "pf_arrival_time",
                    "start_working_time", "pf_departure_time", "lq_arrival_time"]:
            if tk in data:
                setattr(item, tk, _parse_datetime(data[tk]))
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@daily_report_bp.route("/project/progress/<int:pid>", methods=["PUT"])
def update_proj_progress(pid):
    item = DailyReportProjectProgress.query.get_or_404(pid)
    data = request.get_json()
    _set_fields(item, data, [
        "weather_condition", "status", "plan_pob", "actual_pob",
        "plan_manhour", "actual_manhour", "progress_today", "progress_total",
        "downtime_hour", "productive_hour",
        "wrench_time_project", "wrench_time_daily",
        "pdi_project", "pdi_daily", "pgi_project", "pgi_daily",
        "pti_project", "pti_daily",
    ])
    if "progress_date" in data:
        item.progress_date = _parse_date(data["progress_date"])
    for tk in ["normal_working_time", "lq_departure_time", "pf_arrival_time",
               "start_working_time", "pf_departure_time", "lq_arrival_time"]:
        if tk in data:
            setattr(item, tk, _parse_datetime(data[tk]))
    try:
        db.session.commit()
        return jsonify(item.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@daily_report_bp.route("/project/progress/<int:pid>", methods=["DELETE"])
def delete_proj_progress(pid):
    item = DailyReportProjectProgress.query.get_or_404(pid)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════
#  PROJECT — MANPOWER
# ═══════════════════════════════════════

@daily_report_bp.route("/project/manpower", methods=["GET"])
def get_proj_manpower():
    project_no = request.args.get("project_no")
    progress_date = request.args.get("progress_date")
    q = DailyReportProjectManpower.query
    if project_no:
        q = q.filter_by(project_no=project_no)
    rows = q.order_by(DailyReportProjectManpower.id).all()
    return jsonify([r.to_dict() for r in rows])


@daily_report_bp.route("/project/manpower", methods=["POST"])
def create_proj_manpower():
    data = request.get_json()
    try:
        item = DailyReportProjectManpower(
            project_no=data.get("project_no"),
            contractor_id=data.get("contractor_id", ""),
            contractor_name=data.get("contractor_name", ""),
            contractor_company=data.get("contractor_company", ""),
            contractor_position=data.get("contractor_position", ""),
            location=data.get("location", ""),
            quarter_platform=data.get("quarter_platform", ""),
            offshore_working=data.get("offshore_working", 0),
            offshore_standby=data.get("offshore_standby", 0),
            offshore_overtime=data.get("offshore_overtime", 0),
            onshore_working=data.get("onshore_working", 0),
            onshore_standby=data.get("onshore_standby", 0),
            onshore_overtime=data.get("onshore_overtime", 0),
            total=data.get("total", 0),
            sse=data.get("sse", False),
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@daily_report_bp.route("/project/manpower/<int:mid>", methods=["PUT"])
def update_proj_manpower(mid):
    item = DailyReportProjectManpower.query.get_or_404(mid)
    data = request.get_json()
    _set_fields(item, data, [
        "contractor_id", "contractor_name", "contractor_company",
        "contractor_position", "location", "quarter_platform",
        "offshore_working", "offshore_standby", "offshore_overtime",
        "onshore_working", "onshore_standby", "onshore_overtime",
        "total", "sse",
    ])
    try:
        db.session.commit()
        return jsonify(item.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@daily_report_bp.route("/project/manpower/<int:mid>", methods=["DELETE"])
def delete_proj_manpower(mid):
    item = DailyReportProjectManpower.query.get_or_404(mid)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════
#  PROJECT — EQUIPMENT
# ═══════════════════════════════════════

@daily_report_bp.route("/project/equipment", methods=["GET"])
def get_proj_equipment():
    project_no = request.args.get("project_no")
    q = DailyReportProjectEquipment.query
    if project_no:
        q = q.filter_by(project_no=project_no)
    rows = q.order_by(DailyReportProjectEquipment.id).all()
    return jsonify([r.to_dict() for r in rows])


@daily_report_bp.route("/project/equipment", methods=["POST"])
def create_proj_equipment():
    data = request.get_json()
    try:
        item = DailyReportProjectEquipment(
            project_no=data.get("project_no"),
            equipment_id=data.get("equipment_id"),
            equipment_name=data.get("equipment_name", ""),
            equipment_company=data.get("equipment_company", ""),
            charge_type=data.get("charge_type", ""),
            tag_no=data.get("tag_no", ""),
            quantity=data.get("quantity", 0),
            offshore_working=data.get("offshore_working", 0),
            offshore_standby=data.get("offshore_standby", 0),
            offshore_overtime=data.get("offshore_overtime", 0),
            onshore_working=data.get("onshore_working", 0),
            onshore_standby=data.get("onshore_standby", 0),
            onshore_overtime=data.get("onshore_overtime", 0),
            total=data.get("total", 0),
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@daily_report_bp.route("/project/equipment/<int:eid>", methods=["PUT"])
def update_proj_equipment(eid):
    item = DailyReportProjectEquipment.query.get_or_404(eid)
    data = request.get_json()
    _set_fields(item, data, [
        "equipment_id", "equipment_name", "equipment_company",
        "charge_type", "tag_no", "quantity",
        "offshore_working", "offshore_standby", "offshore_overtime",
        "onshore_working", "onshore_standby", "onshore_overtime", "total",
    ])
    try:
        db.session.commit()
        return jsonify(item.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@daily_report_bp.route("/project/equipment/<int:eid>", methods=["DELETE"])
def delete_proj_equipment(eid):
    item = DailyReportProjectEquipment.query.get_or_404(eid)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500