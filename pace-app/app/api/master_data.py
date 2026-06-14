from flask import Blueprint, request, jsonify, session
from app.models import (
    db, Asset, WorkingPlatform, WorkingPlatformMapping, QuarterPlatform,
    QuarterPlatformMapping, JobType, Group, Company, Position, RateType,
    ContractorList, ContractorRate, Equipment, EquipmentRate,
    PlanStandardizeManhour, Role, UserRole, RolePermission, JobList,
    DailyReportProjectManpower, DailyReportProjectEquipment,
    DailyReportNotificationManpower, DailyReportNotificationEquipment
)
from datetime import datetime
from functools import wraps

master_data_bp = Blueprint("master_data_bp", __name__)


# ═══════════════════════════════════════
#  PERMISSION CHECK
# ═══════════════════════════════════════

def get_user_access(feature):
    user = session.get("user")
    if not user:
        return "disabled"
    perms = user.get("permissions", {})
    level = perms.get(feature, "disabled")
    if user.get("role") == "administrator" and level == "disabled":
        return "edit"
    return level


def require_edit(feature):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            level = get_user_access(feature)
            if level != "edit":
                return jsonify({"error": "Access denied", "message": "No edit access."}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


def get_updated_by():
    user = session.get("user")
    return user.get("name", "system") if user else "system"


def safe_commit():
    try:
        db.session.commit()
        return None
    except Exception as e:
        db.session.rollback()
        return str(e)


# ═══════════════════════════════════════
#  GENERIC CRUD HELPER
# ═══════════════════════════════════════

def generic_get(model, order_col):
    return jsonify([r.to_dict() for r in model.query.order_by(order_col).all()])


def generic_create(model, fields, feature):
    data = request.get_json()
    kwargs = {f: data.get(f, "") for f in fields}
    kwargs["status"] = data.get("status", "Active")
    kwargs["updated_by"] = get_updated_by()
    item = model(**kwargs)
    db.session.add(item)
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict()), 201


def generic_update(model, item_id, fields):
    item = model.query.get_or_404(item_id)
    data = request.get_json()
    old_values = {f: getattr(item, f) for f in fields}
    for f in fields + ["status"]:
        if f in data:
            setattr(item, f, data[f])
    item.updated_by = get_updated_by()
    item.updated_date = datetime.utcnow()
    return item, data, old_values


def generic_delete(model, item_id):
    item = model.query.get_or_404(item_id)
    db.session.delete(item)
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"ok": True})


# ═══════════════════════════════════════
#  1. ASSET
# ═══════════════════════════════════════

@master_data_bp.route("/assets", methods=["GET"])
def get_assets():
    return generic_get(Asset, Asset.name)

@master_data_bp.route("/assets", methods=["POST"])
@require_edit("master_data.asset")
def create_asset():
    return generic_create(Asset, ["name", "description"], "master_data.asset")

@master_data_bp.route("/assets/<int:aid>", methods=["PUT"])
@require_edit("master_data.asset")
def update_asset(aid):
    item, data, old = generic_update(Asset, aid, ["name", "description"])
    if old["name"] != item.name:
        WorkingPlatformMapping.query.filter_by(asset=old["name"]).update({"asset": item.name})
        QuarterPlatformMapping.query.filter_by(asset=old["name"]).update({"asset": item.name})
        JobList.query.filter_by(asset=old["name"]).update({"asset": item.name})
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/assets/<int:aid>", methods=["DELETE"])
@require_edit("master_data.asset")
def delete_asset(aid):
    return generic_delete(Asset, aid)


# ═══════════════════════════════════════
#  2. WORKING PLATFORM
# ═══════════════════════════════════════

@master_data_bp.route("/working-platforms", methods=["GET"])
def get_working_platforms():
    return generic_get(WorkingPlatform, WorkingPlatform.name)

@master_data_bp.route("/working-platforms", methods=["POST"])
@require_edit("master_data.working_platform")
def create_working_platform():
    return generic_create(WorkingPlatform, ["name", "description"], "master_data.working_platform")

@master_data_bp.route("/working-platforms/<int:wid>", methods=["PUT"])
@require_edit("master_data.working_platform")
def update_working_platform(wid):
    item, data, old = generic_update(WorkingPlatform, wid, ["name", "description"])
    if old["name"] != item.name:
        WorkingPlatformMapping.query.filter_by(working_platform=old["name"]).update({"working_platform": item.name})
        JobList.query.filter_by(working_platform=old["name"]).update({"working_platform": item.name})
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/working-platforms/<int:wid>", methods=["DELETE"])
@require_edit("master_data.working_platform")
def delete_working_platform(wid):
    return generic_delete(WorkingPlatform, wid)


# ═══════════════════════════════════════
#  3. WORKING PLATFORM MAPPING
# ═══════════════════════════════════════

@master_data_bp.route("/working-platform-mappings", methods=["GET"])
def get_wp_mappings():
    return generic_get(WorkingPlatformMapping, WorkingPlatformMapping.asset)

@master_data_bp.route("/working-platform-mappings", methods=["POST"])
@require_edit("master_data.working_platform_mapping")
def create_wp_mapping():
    return generic_create(WorkingPlatformMapping, ["asset", "working_platform"], "master_data.working_platform_mapping")

@master_data_bp.route("/working-platform-mappings/<int:mid>", methods=["PUT"])
@require_edit("master_data.working_platform_mapping")
def update_wp_mapping(mid):
    item, data, old = generic_update(WorkingPlatformMapping, mid, ["asset", "working_platform"])
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/working-platform-mappings/<int:mid>", methods=["DELETE"])
@require_edit("master_data.working_platform_mapping")
def delete_wp_mapping(mid):
    return generic_delete(WorkingPlatformMapping, mid)


# ═══════════════════════════════════════
#  4. QUARTER PLATFORM
# ═══════════════════════════════════════

@master_data_bp.route("/quarter-platforms", methods=["GET"])
def get_quarter_platforms():
    return generic_get(QuarterPlatform, QuarterPlatform.name)

@master_data_bp.route("/quarter-platforms", methods=["POST"])
@require_edit("master_data.quarter_platform")
def create_quarter_platform():
    return generic_create(QuarterPlatform, ["name", "description"], "master_data.quarter_platform")

@master_data_bp.route("/quarter-platforms/<int:qid>", methods=["PUT"])
@require_edit("master_data.quarter_platform")
def update_quarter_platform(qid):
    item, data, old = generic_update(QuarterPlatform, qid, ["name", "description"])
    if old["name"] != item.name:
        QuarterPlatformMapping.query.filter_by(quarter_platform=old["name"]).update({"quarter_platform": item.name})
        DailyReportProjectManpower.query.filter_by(quarter_platform=old["name"]).update({"quarter_platform": item.name})
        DailyReportNotificationManpower.query.filter_by(quarter_platform=old["name"]).update({"quarter_platform": item.name})
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/quarter-platforms/<int:qid>", methods=["DELETE"])
@require_edit("master_data.quarter_platform")
def delete_quarter_platform(qid):
    return generic_delete(QuarterPlatform, qid)


# ═══════════════════════════════════════
#  5. QUARTER PLATFORM MAPPING
# ═══════════════════════════════════════

@master_data_bp.route("/quarter-platform-mappings", methods=["GET"])
def get_qp_mappings():
    return generic_get(QuarterPlatformMapping, QuarterPlatformMapping.asset)

@master_data_bp.route("/quarter-platform-mappings", methods=["POST"])
@require_edit("master_data.quarter_platform_mapping")
def create_qp_mapping():
    return generic_create(QuarterPlatformMapping, ["asset", "quarter_platform"], "master_data.quarter_platform_mapping")

@master_data_bp.route("/quarter-platform-mappings/<int:mid>", methods=["PUT"])
@require_edit("master_data.quarter_platform_mapping")
def update_qp_mapping(mid):
    item, data, old = generic_update(QuarterPlatformMapping, mid, ["asset", "quarter_platform"])
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/quarter-platform-mappings/<int:mid>", methods=["DELETE"])
@require_edit("master_data.quarter_platform_mapping")
def delete_qp_mapping(mid):
    return generic_delete(QuarterPlatformMapping, mid)


# ═══════════════════════════════════════
#  6. JOB TYPE
# ═══════════════════════════════════════

@master_data_bp.route("/job-types", methods=["GET"])
def get_job_types():
    return generic_get(JobType, JobType.description_l1)

@master_data_bp.route("/job-types", methods=["POST"])
@require_edit("master_data.job_type")
def create_job_type():
    return generic_create(JobType, ["description_l1", "description_l2", "description_l3"], "master_data.job_type")

@master_data_bp.route("/job-types/<int:jid>", methods=["PUT"])
@require_edit("master_data.job_type")
def update_job_type(jid):
    item, data, old = generic_update(JobType, jid, ["description_l1", "description_l2", "description_l3"])
    if old["description_l1"] != item.description_l1:
        JobList.query.filter_by(job_type=old["description_l1"]).update({"job_type": item.description_l1})
    if old["description_l2"] != item.description_l2:
        JobList.query.filter_by(sub_type=old["description_l2"]).update({"sub_type": item.description_l2})
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/job-types/<int:jid>", methods=["DELETE"])
@require_edit("master_data.job_type")
def delete_job_type(jid):
    return generic_delete(JobType, jid)


# ═══════════════════════════════════════
#  7. GROUP
# ═══════════════════════════════════════

@master_data_bp.route("/groups", methods=["GET"])
def get_groups():
    return generic_get(Group, Group.name)

@master_data_bp.route("/groups", methods=["POST"])
@require_edit("master_data.group")
def create_group():
    return generic_create(Group, ["name", "description"], "master_data.group")

@master_data_bp.route("/groups/<int:gid>", methods=["PUT"])
@require_edit("master_data.group")
def update_group(gid):
    item, data, old = generic_update(Group, gid, ["name", "description"])
    if old["name"] != item.name:
        Position.query.filter_by(md_group=old["name"]).update({"md_group": item.name})
        PlanStandardizeManhour.query.filter_by(md_group=old["name"]).update({"md_group": item.name})
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/groups/<int:gid>", methods=["DELETE"])
@require_edit("master_data.group")
def delete_group(gid):
    return generic_delete(Group, gid)


# ═══════════════════════════════════════
#  8. COMPANY
# ═══════════════════════════════════════

@master_data_bp.route("/companies", methods=["GET"])
def get_companies():
    return generic_get(Company, Company.name)

@master_data_bp.route("/companies", methods=["POST"])
@require_edit("master_data.company")
def create_company():
    return generic_create(Company, ["name", "description"], "master_data.company")

@master_data_bp.route("/companies/<int:cid>", methods=["PUT"])
@require_edit("master_data.company")
def update_company(cid):
    item, data, old = generic_update(Company, cid, ["name", "description"])
    if old["name"] != item.name:
        ContractorList.query.filter_by(company=old["name"]).update({"company": item.name})
        ContractorRate.query.filter_by(company=old["name"]).update({"company": item.name})
        EquipmentRate.query.filter_by(company=old["name"]).update({"company": item.name})
        JobList.query.filter_by(asset=old["name"]).update({"asset": item.name})
        DailyReportProjectManpower.query.filter_by(contractor_company=old["name"]).update({"contractor_company": item.name})
        DailyReportProjectEquipment.query.filter_by(equipment_company=old["name"]).update({"equipment_company": item.name})
        DailyReportNotificationManpower.query.filter_by(contractor_company=old["name"]).update({"contractor_company": item.name})
        DailyReportNotificationEquipment.query.filter_by(equipment_company=old["name"]).update({"equipment_company": item.name})
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/companies/<int:cid>", methods=["DELETE"])
@require_edit("master_data.company")
def delete_company(cid):
    return generic_delete(Company, cid)


# ═══════════════════════════════════════
#  9. POSITION
# ═══════════════════════════════════════

@master_data_bp.route("/positions", methods=["GET"])
def get_positions():
    return generic_get(Position, Position.name)

@master_data_bp.route("/positions", methods=["POST"])
@require_edit("master_data.position")
def create_position():
    return generic_create(Position, ["md_group", "name", "description"], "master_data.position")

@master_data_bp.route("/positions/<int:pid>", methods=["PUT"])
@require_edit("master_data.position")
def update_position(pid):
    item, data, old = generic_update(Position, pid, ["md_group", "name", "description"])
    if old["name"] != item.name:
        ContractorList.query.filter_by(position=old["name"]).update({"position": item.name})
        ContractorRate.query.filter_by(position=old["name"]).update({"position": item.name})
        DailyReportProjectManpower.query.filter_by(contractor_position=old["name"]).update({"contractor_position": item.name})
        DailyReportNotificationManpower.query.filter_by(contractor_position=old["name"]).update({"contractor_position": item.name})
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/positions/<int:pid>", methods=["DELETE"])
@require_edit("master_data.position")
def delete_position(pid):
    return generic_delete(Position, pid)


# ═══════════════════════════════════════
#  10. RATE TYPE
# ═══════════════════════════════════════

@master_data_bp.route("/rate-types", methods=["GET"])
def get_rate_types():
    return generic_get(RateType, RateType.name)

@master_data_bp.route("/rate-types", methods=["POST"])
@require_edit("master_data.rate_type")
def create_rate_type():
    return generic_create(RateType, ["name", "description"], "master_data.rate_type")

@master_data_bp.route("/rate-types/<int:rid>", methods=["PUT"])
@require_edit("master_data.rate_type")
def update_rate_type(rid):
    item, data, old = generic_update(RateType, rid, ["name", "description"])
    if old["name"] != item.name:
        ContractorRate.query.filter_by(rate_type=old["name"]).update({"rate_type": item.name})
        EquipmentRate.query.filter_by(rate_type=old["name"]).update({"rate_type": item.name})
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/rate-types/<int:rid>", methods=["DELETE"])
@require_edit("master_data.rate_type")
def delete_rate_type(rid):
    return generic_delete(RateType, rid)


# ═══════════════════════════════════════
#  11. CONTRACTOR
# ═══════════════════════════════════════

@master_data_bp.route("/contractors", methods=["GET"])
def get_contractors():
    return generic_get(ContractorList, ContractorList.name)

@master_data_bp.route("/contractors", methods=["POST"])
@require_edit("master_data.contractor")
def create_contractor():
    return generic_create(ContractorList, ["name", "company", "position"], "master_data.contractor")

@master_data_bp.route("/contractors/<int:cid>", methods=["PUT"])
@require_edit("master_data.contractor")
def update_contractor(cid):
    item, data, old = generic_update(ContractorList, cid, ["name", "company", "position"])
    if old["name"] != item.name:
        DailyReportProjectManpower.query.filter_by(contractor_name=old["name"]).update({"contractor_name": item.name})
        DailyReportNotificationManpower.query.filter_by(contractor_name=old["name"]).update({"contractor_name": item.name})
    err = safe_commit()
    if err:
        return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/contractors/<int:cid>", methods=["DELETE"])
@require_edit("master_data.contractor")
def delete_contractor(cid):
    return generic_delete(ContractorList, cid)


# ═══════════════════════════════════════
#  12. CONTRACTOR RATE
# ═══════════════════════════════════════

@master_data_bp.route("/contractor-rates", methods=["GET"])
def get_contractor_rates():
    return generic_get(ContractorRate, ContractorRate.company)

@master_data_bp.route("/contractor-rates", methods=["POST"])
@require_edit("master_data.contractor_rate")
def create_contractor_rate():
    data = request.get_json()
    item = ContractorRate(company=data.get("company",""), position=data.get("position",""), rate_type=data.get("rate_type",""), charge_hour_rate=data.get("charge_hour_rate",0), status=data.get("status","Active"), updated_by=get_updated_by())
    db.session.add(item)
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict()), 201

@master_data_bp.route("/contractor-rates/<int:rid>", methods=["PUT"])
@require_edit("master_data.contractor_rate")
def update_contractor_rate(rid):
    item = ContractorRate.query.get_or_404(rid)
    data = request.get_json()
    for k in ["company","position","rate_type","charge_hour_rate","status"]:
        if k in data: setattr(item, k, data[k])
    item.updated_by = get_updated_by(); item.updated_date = datetime.utcnow()
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/contractor-rates/<int:rid>", methods=["DELETE"])
@require_edit("master_data.contractor_rate")
def delete_contractor_rate(rid):
    return generic_delete(ContractorRate, rid)


# ═══════════════════════════════════════
#  13. EQUIPMENT
# ═══════════════════════════════════════

@master_data_bp.route("/equipment", methods=["GET"])
def get_equipment():
    return generic_get(Equipment, Equipment.name)

@master_data_bp.route("/equipment", methods=["POST"])
@require_edit("master_data.equipment")
def create_equipment():
    return generic_create(Equipment, ["name", "description"], "master_data.equipment")

@master_data_bp.route("/equipment/<int:eid>", methods=["PUT"])
@require_edit("master_data.equipment")
def update_equipment(eid):
    item, data, old = generic_update(Equipment, eid, ["name", "description"])
    if old["name"] != item.name:
        EquipmentRate.query.filter_by(equipment=old["name"]).update({"equipment": item.name})
        DailyReportProjectEquipment.query.filter_by(equipment_name=old["name"]).update({"equipment_name": item.name})
        DailyReportNotificationEquipment.query.filter_by(equipment_name=old["name"]).update({"equipment_name": item.name})
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/equipment/<int:eid>", methods=["DELETE"])
@require_edit("master_data.equipment")
def delete_equipment(eid):
    return generic_delete(Equipment, eid)


# ═══════════════════════════════════════
#  14. EQUIPMENT RATE
# ═══════════════════════════════════════

@master_data_bp.route("/equipment-rates", methods=["GET"])
def get_equipment_rates():
    return generic_get(EquipmentRate, EquipmentRate.company)

@master_data_bp.route("/equipment-rates", methods=["POST"])
@require_edit("master_data.equipment_rate")
def create_equipment_rate():
    data = request.get_json()
    item = EquipmentRate(company=data.get("company",""), equipment=data.get("equipment",""), rate_type=data.get("rate_type",""), charge_hour_rate=data.get("charge_hour_rate",0), status=data.get("status","Active"), updated_by=get_updated_by())
    db.session.add(item)
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict()), 201

@master_data_bp.route("/equipment-rates/<int:rid>", methods=["PUT"])
@require_edit("master_data.equipment_rate")
def update_equipment_rate(rid):
    item = EquipmentRate.query.get_or_404(rid)
    data = request.get_json()
    for k in ["company","equipment","rate_type","charge_hour_rate","status"]:
        if k in data: setattr(item, k, data[k])
    item.updated_by = get_updated_by(); item.updated_date = datetime.utcnow()
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/equipment-rates/<int:rid>", methods=["DELETE"])
@require_edit("master_data.equipment_rate")
def delete_equipment_rate(rid):
    return generic_delete(EquipmentRate, rid)


# ═══════════════════════════════════════
#  15. STANDARDIZE MANHOUR
# ═══════════════════════════════════════

@master_data_bp.route("/standardize-manhour", methods=["GET"])
def get_std_mh():
    return generic_get(PlanStandardizeManhour, PlanStandardizeManhour.header)

@master_data_bp.route("/standardize-manhour", methods=["POST"])
@require_edit("master_data.std_manhour")
def create_std_mh():
    data = request.get_json()
    item = PlanStandardizeManhour(md_group=data.get("md_group",""), header=data.get("header",""), sub_header=data.get("sub_header",""), description=data.get("description",""), level=data.get("level",""), unit=data.get("unit",""), manhour=data.get("manhour",0), status=data.get("status","Active"), updated_by=get_updated_by())
    db.session.add(item)
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict()), 201

@master_data_bp.route("/standardize-manhour/<int:sid>", methods=["PUT"])
@require_edit("master_data.std_manhour")
def update_std_mh(sid):
    item = PlanStandardizeManhour.query.get_or_404(sid)
    data = request.get_json()
    for k in ["md_group","header","sub_header","description","level","unit","manhour","status"]:
        if k in data: setattr(item, k, data[k])
    item.updated_by = get_updated_by(); item.updated_date = datetime.utcnow()
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/standardize-manhour/<int:sid>", methods=["DELETE"])
@require_edit("master_data.std_manhour")
def delete_std_mh(sid):
    return generic_delete(PlanStandardizeManhour, sid)


# ═══════════════════════════════════════
#  16. ROLE
# ═══════════════════════════════════════

@master_data_bp.route("/roles", methods=["GET"])
def get_roles():
    return generic_get(Role, Role.name)

@master_data_bp.route("/roles", methods=["POST"])
@require_edit("master_data.role")
def create_role():
    return generic_create(Role, ["name", "description"], "master_data.role")

@master_data_bp.route("/roles/<int:rid>", methods=["PUT"])
@require_edit("master_data.role")
def update_role(rid):
    item, data, old = generic_update(Role, rid, ["name", "description"])
    if old["name"] != item.name:
        UserRole.query.filter_by(role=old["name"]).update({"role": item.name})
        RolePermission.query.filter_by(role=old["name"]).update({"role": item.name})
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/roles/<int:rid>", methods=["DELETE"])
@require_edit("master_data.role")
def delete_role(rid):
    return generic_delete(Role, rid)


# ═══════════════════════════════════════
#  17. USER ROLE
# ═══════════════════════════════════════

@master_data_bp.route("/users", methods=["GET"])
def get_users():
    return generic_get(UserRole, UserRole.name)

@master_data_bp.route("/users", methods=["POST"])
@require_edit("master_data.user_role")
def create_user():
    data = request.get_json()
    item = UserRole(mail=data.get("mail",""), name=data.get("name",""), job_title=data.get("job_title",""), role=data.get("role",""), status=data.get("status","Active"), updated_by=get_updated_by())
    db.session.add(item)
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict()), 201

@master_data_bp.route("/users/<int:uid>", methods=["PUT"])
@require_edit("master_data.user_role")
def update_user(uid):
    item = UserRole.query.get_or_404(uid)
    data = request.get_json()
    for k in ["mail","name","job_title","role","status"]:
        if k in data: setattr(item, k, data[k])
    item.updated_by = get_updated_by(); item.updated_date = datetime.utcnow()
    err = safe_commit()
    if err: return jsonify({"error": err}), 500
    return jsonify(item.to_dict())

@master_data_bp.route("/users/<int:uid>", methods=["DELETE"])
@require_edit("master_data.user_role")
def delete_user(uid):
    return generic_delete(UserRole, uid)


# ═══════════════════════════════════════
#  ACCESS CHECK API
# ═══════════════════════════════════════

@master_data_bp.route("/access", methods=["GET"])
def get_access():
    features = [
        "home", "master_data",
        "master_data.asset", "master_data.working_platform", "master_data.working_platform_mapping",
        "master_data.quarter_platform", "master_data.quarter_platform_mapping",
        "master_data.job_type", "master_data.group", "master_data.company",
        "master_data.position", "master_data.rate_type",
        "master_data.contractor", "master_data.contractor_rate",
        "master_data.equipment", "master_data.equipment_rate",
        "master_data.std_manhour", "master_data.role",
        "master_data.user_role", "master_data.role_permission",
    ]
    return jsonify({f: get_user_access(f) for f in features})