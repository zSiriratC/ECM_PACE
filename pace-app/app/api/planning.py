from flask import Blueprint, request, jsonify
from app.models import db, JobList, PlanSummary, PlanActivity, PlanRevision
from datetime import datetime, date
from functools import wraps
import json

planning_bp = Blueprint("planning_bp", __name__)

STATUS_OPTIONS = ["Drafting Plan", "Pending Approval", "Approved Plan", "In Progress", "Completed"]

STATUS_TRANSITION_ROLES = {
    ("Drafting Plan", "Pending Approval"):   ["engineer", "assistant_supervisor", "administrator"],
    ("Pending Approval", "Approved Plan"):   ["supervisor", "administrator"],
    ("Pending Approval", "Drafting Plan"):    ["engineer", "assistant_supervisor", "administrator"],
    ("Approved Plan", "In Progress"):        ["contractor", "administrator"],
    ("Approved Plan", "Drafting Plan"):       ["engineer", "assistant_supervisor", "administrator"],
    ("In Progress", "Drafting Plan"):         ["engineer", "assistant_supervisor", "administrator"],
    ("In Progress", "Completed"):            ["contractor", "administrator"],
}

PLAN_EDIT_ROLES = ["engineer", "assistant_supervisor", "administrator"]
JOB_CREATE_ROLES = ["engineer", "assistant_supervisor", "administrator"]
JOB_DELETE_ROLES = ["administrator"]


def get_role():
    return request.headers.get("X-User-Role", "").lower().strip()

def get_user_name():
    return request.headers.get("X-User-Name", "system")

def check_plan_edit(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        role = get_role()
        if role not in PLAN_EDIT_ROLES:
            return jsonify({"error": "Access denied", "message": "Role '{}' cannot edit plan details.".format(role)}), 403
        return f(*args, **kwargs)
    return wrapper

def _parse_date(val):
    if not val:
        return None
    if isinstance(val, date):
        return val
    try:
        return datetime.strptime(val, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None

def _create_revision(job_no, status, user_name, action=""):
    """Snapshot current plan and save as revision."""
    summary = PlanSummary.query.filter_by(job_no=job_no).first()
    activities = PlanActivity.query.filter_by(job_no=job_no).all()

    last_rev = PlanRevision.query.filter_by(job_no=job_no).order_by(PlanRevision.revision.desc()).first()
    next_rev = (last_rev.revision + 1) if last_rev else 0

    snapshot = {
        "summary": summary.to_dict() if summary else None,
        "activities": [a.to_dict() for a in activities],
    }

    rev = PlanRevision(
        job_no=job_no,
        revision=next_rev,
        status=status,
        action=action,
        snapshot=json.dumps(snapshot),
        created_by=user_name,
    )
    db.session.add(rev)
    return next_rev

def _empty_summary(job_no):
    """Return empty summary dict when no summary exists."""
    return {
        "id": None, "job_no": job_no, "scope": None,
        "mobilization": 0, "demolition": 0, "installation": 0,
        "scaffolding": 0, "other": 0, "commissioning": 0,
        "painting": 0, "cleaning": 0, "demobilization": 0,
        "contingency": 0, "estimated_productive_time": 0,
        "estimated_pob": 0, "project_duration": 0,
        "plan_start_date": None, "plan_end_date": None,
        "total_productive_manhour": 0, "total_non_productive_manhour": 0,
        "total_manhour": 0, "unit_cost": 0, "exchange_rate": 0,
        "direct_cost_thb": 0, "direct_cost_usd": 0,
        "actual_manhour_activity": 0, "actual_manhour_daily": 0,
    }


# ═══════════════════════════════════════
#  JOB LIST
# ═══════════════════════════════════════

@planning_bp.route("/jobs", methods=["GET"])
def get_jobs():
    return jsonify([r.to_dict() for r in JobList.query.order_by(JobList.job_no).all()])


@planning_bp.route("/jobs", methods=["POST"])
def create_job():
    role = get_role()
    if role not in JOB_CREATE_ROLES:
        return jsonify({"error": "Access denied", "message": "Role '{}' cannot create jobs.".format(role)}), 403
    data = request.get_json()
    job_no = data.get("job_no", "").strip()
    if not job_no:
        return jsonify({"error": "job_no is required"}), 400
    if JobList.query.get(job_no):
        return jsonify({"error": "Job '{}' already exists".format(job_no)}), 409
    try:
        item = JobList(
            job_no=job_no, job_name=data.get("job_name", ""),
            job_type=data.get("job_type", ""), job_group=data.get("group", ""),
            discipline=data.get("discipline", ""), sub_type=data.get("sub_type", ""),
            location=data.get("location", ""), asset=data.get("asset", ""),
            working_platform=data.get("working_platform", ""),
            sro_no=data.get("sro_no", ""), project_engineer=data.get("project_engineer", ""),
            plan_start_date=_parse_date(data.get("plan_start_date")),
            plan_end_date=_parse_date(data.get("plan_end_date")),
            actual_start_date=_parse_date(data.get("actual_start_date")),
            actual_end_date=_parse_date(data.get("actual_end_date")),
            suspended_day=data.get("suspended_day", 0),
            total_day=data.get("total_day", 0),
            status=data.get("status", "Drafting Plan"),
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@planning_bp.route("/jobs/<string:job_no>", methods=["GET"])
def get_job(job_no):
    return jsonify(JobList.query.get_or_404(job_no).to_dict())


@planning_bp.route("/jobs/<string:job_no>", methods=["PUT"])
def update_job(job_no):
    item = JobList.query.get_or_404(job_no)
    data = request.get_json()
    role = get_role()

    if "status" in data and data["status"] != item.status:
        old_status = item.status
        new_status = data["status"]
        transition_key = (old_status, new_status)
        allowed = STATUS_TRANSITION_ROLES.get(transition_key, [])
        if role not in allowed:
            return jsonify({"error": "Access denied", "message": "Role '{}' cannot change status from '{}' to '{}'. Allowed: {}".format(role, old_status, new_status, ", ".join(allowed))}), 403
        
        action_map = {
            ("Drafting Plan", "Pending Approval"): "Submit",
            ("Pending Approval", "Approved Plan"): "Approve",
            ("Pending Approval", "Drafting Plan"): "Revise",
            ("Approved Plan", "In Progress"): "Start",
            ("Approved Plan", "Drafting Plan"): "Revise",
            ("In Progress", "Drafting Plan"): "Revise",
            ("In Progress", "Completed"): "Complete",
        }
        action_name = action_map.get((old_status, new_status), new_status)
        
        _create_revision(job_no, old_status, get_user_name(), action_name)

    non_status_keys = [k for k in data.keys() if k != "status"]
    if non_status_keys and role not in PLAN_EDIT_ROLES:
        if not (len(data) == 1 and "status" in data):
            return jsonify({"error": "Access denied", "message": "Role '{}' cannot edit job details.".format(role)}), 403

    for key in ["job_name", "job_type", "discipline", "sub_type", "location", "asset", "working_platform", "sro_no", "project_engineer", "suspended_day", "total_day", "status"]:
        if key in data:
            setattr(item, key, data[key])
    if "group" in data:
        item.job_group = data["group"]
    for dk in ["plan_start_date", "plan_end_date", "actual_start_date", "actual_end_date"]:
        if dk in data:
            setattr(item, dk, _parse_date(data[dk]))
    try:
        db.session.commit()
        return jsonify(item.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@planning_bp.route("/jobs/<string:job_no>", methods=["DELETE"])
def delete_job(job_no):
    role = get_role()
    if role not in JOB_DELETE_ROLES:
        return jsonify({"error": "Access denied"}), 403
    item = JobList.query.get_or_404(job_no)
    try:
        PlanActivity.query.filter_by(job_no=job_no).delete()
        PlanSummary.query.filter_by(job_no=job_no).delete()
        PlanRevision.query.filter_by(job_no=job_no).delete()
        db.session.delete(item)
        db.session.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════
#  PLAN SUMMARY
# ═══════════════════════════════════════

@planning_bp.route("/plan-summary", methods=["GET"])
def get_plan_summary():
    job_no = request.args.get("job_no")
    if not job_no:
        return jsonify({"error": "job_no required"}), 400
    item = PlanSummary.query.filter_by(job_no=job_no).first()
    if not item:
        return jsonify(_empty_summary(job_no))
    return jsonify(item.to_dict())


@planning_bp.route("/plan-summary", methods=["POST"])
@check_plan_edit
def create_or_update_plan_summary():
    data = request.get_json()
    job_no = data.get("job_no")
    if not job_no:
        return jsonify({"error": "job_no required"}), 400
    try:
        item = PlanSummary.query.filter_by(job_no=job_no).first()
        if not item:
            item = PlanSummary(job_no=job_no)
            db.session.add(item)
        for key in ["scope", "mobilization", "demolition", "installation", "scaffolding", "other", "commissioning", "painting", "cleaning", "demobilization", "contingency", "estimated_productive_time", "estimated_pob", "project_duration", "total_productive_manhour", "total_non_productive_manhour", "total_manhour", "unit_cost", "exchange_rate", "direct_cost_thb", "direct_cost_usd", "actual_manhour_activity", "actual_manhour_daily"]:
            if key in data:
                setattr(item, key, data[key])
        for dk in ["plan_start_date", "plan_end_date"]:
            if dk in data:
                setattr(item, dk, _parse_date(data[dk]))
        db.session.commit()
        return jsonify(item.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════
#  PLAN ACTIVITY
# ═══════════════════════════════════════

@planning_bp.route("/plan-activities", methods=["GET"])
def get_plan_activities():
    job_no = request.args.get("job_no")
    if not job_no:
        return jsonify({"error": "job_no required"}), 400
    return jsonify([r.to_dict() for r in PlanActivity.query.filter_by(job_no=job_no).order_by(PlanActivity.id).all()])


@planning_bp.route("/plan-activities", methods=["POST"])
@check_plan_edit
def create_plan_activity():
    data = request.get_json()
    try:
        item = PlanActivity(
            std_mh_id=data.get("std_mh_id"), job_no=data.get("job_no"),
            structure=data.get("structure", ""), header=data.get("header", ""),
            sub_header=data.get("sub_header", ""), description=data.get("description", ""),
            level=data.get("level", ""), unit=data.get("unit", ""),
            plan_quantity=data.get("plan_quantity", 0), plan_manhour=data.get("plan_manhour", 0),
            actual_quantity=data.get("actual_quantity", 0), actual_manhour=data.get("actual_manhour", 0),
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@planning_bp.route("/plan-activities/<int:aid>", methods=["PUT"])
@check_plan_edit
def update_plan_activity(aid):
    item = PlanActivity.query.get_or_404(aid)
    data = request.get_json()
    for key in ["std_mh_id", "structure", "header", "sub_header", "description", "level", "unit", "plan_quantity", "plan_manhour", "actual_quantity", "actual_manhour"]:
        if key in data:
            setattr(item, key, data[key])
    try:
        db.session.commit()
        return jsonify(item.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@planning_bp.route("/plan-activities/<int:aid>", methods=["DELETE"])
@check_plan_edit
def delete_plan_activity(aid):
    item = PlanActivity.query.get_or_404(aid)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════
#  PLAN REVISIONS
# ═══════════════════════════════════════

@planning_bp.route("/revisions", methods=["GET"])
def get_revisions():
    job_no = request.args.get("job_no")
    if not job_no:
        return jsonify({"error": "job_no required"}), 400
    rows = PlanRevision.query.filter_by(job_no=job_no).order_by(PlanRevision.revision.desc()).all()
    return jsonify([r.to_dict() for r in rows])


@planning_bp.route("/revisions/<int:rid>", methods=["GET"])
def get_revision_detail(rid):
    rev = PlanRevision.query.get_or_404(rid)
    result = rev.to_dict()
    try:
        result["snapshot"] = json.loads(rev.snapshot) if rev.snapshot else None
    except Exception:
        result["snapshot"] = None
    return jsonify(result)


# ═══════════════════════════════════════
#  IMPORT ACTIVITIES
# ═══════════════════════════════════════

@planning_bp.route("/import-activities", methods=["POST"])
@check_plan_edit
def import_activities():
    data = request.get_json()
    job_no = data.get("job_no")
    rows = data.get("rows", [])
    if not job_no:
        return jsonify({"error": "job_no required"}), 400
    if not rows:
        return jsonify({"error": "No rows"}), 400
    try:
        imported = 0
        for row in rows:
            item = PlanActivity(
                job_no=job_no, structure=row.get("structure", ""),
                header=row.get("header", ""), sub_header=row.get("sub_header", ""),
                description=row.get("description", ""), level=row.get("level", "Medium"),
                unit=row.get("unit", ""), plan_quantity=row.get("plan_quantity", 0),
                plan_manhour=row.get("plan_manhour", 0),
            )
            db.session.add(item)
            imported += 1
        db.session.commit()
        return jsonify({"ok": True, "imported": imported})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════
#  STATUS & ROLE INFO
# ═══════════════════════════════════════

@planning_bp.route("/status-options", methods=["GET"])
def get_status_options():
    return jsonify(STATUS_OPTIONS)


@planning_bp.route("/role-permissions", methods=["GET"])
def get_role_permissions():
    role = get_role()
    return jsonify({
        "role": role,
        "can_create": role in JOB_CREATE_ROLES,
        "can_edit_plan": role in PLAN_EDIT_ROLES,
        "can_delete": role in JOB_DELETE_ROLES,
        "can_submit": role in STATUS_TRANSITION_ROLES.get(("Drafting Plan", "Pending Approval"), []),
        "can_approve": role in STATUS_TRANSITION_ROLES.get(("Pending Approval", "Approved Plan"), []),
        "can_revise": role in STATUS_TRANSITION_ROLES.get(("Pending Approval", "Drafting Plan"), []),
        "can_start": role in STATUS_TRANSITION_ROLES.get(("Approved Plan", "In Progress"), []),
        "can_complete": role in STATUS_TRANSITION_ROLES.get(("In Progress", "Completed"), []),
    })