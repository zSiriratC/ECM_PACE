from flask import Blueprint, redirect, url_for, session, request, render_template, jsonify
from app.models import db, UserRole, RolePermission, Role
from functools import wraps

auth_bp = Blueprint("auth", __name__)

FEATURES = [
    ("home", "Home Page"),
    ("planning", "Planning Page"),
    ("planning.create", "Planning — Create Job"),
    ("planning.edit_plan", "Planning — Edit Plan Details"),
    ("planning.submit", "Planning — Submit for Approval"),
    ("planning.approve", "Planning — Approve Plan"),
    ("planning.start", "Planning — Start Project"),
    ("planning.complete", "Planning — Complete Project"),
    ("planning.delete", "Planning — Delete Job"),
    ("daily_report", "Daily Report Page"),
    ("dashboard_1", "Dashboard — Efficiency"),
    ("dashboard_2", "Dashboard — PDI vs PGI"),
    ("timesheet", "Timesheet Report"),
    ("manhour", "Manhour Summary Report"),
    ("master_data", "Master Data Page"),
    ("master_data.asset", "Master Data — Asset"),
    ("master_data.working_platform", "Master Data — Working Platform"),
    ("master_data.working_platform_mapping", "Master Data — WP Mapping"),
    ("master_data.quarter_platform", "Master Data — Quarter Platform"),
    ("master_data.quarter_platform_mapping", "Master Data — QP Mapping"),
    ("master_data.job_type", "Master Data — Job Type"),
    ("master_data.group", "Master Data — Group"),
    ("master_data.company", "Master Data — Company"),
    ("master_data.position", "Master Data — Position"),
    ("master_data.rate_type", "Master Data — Rate Type"),
    ("master_data.contractor", "Master Data — Contractor"),
    ("master_data.contractor_rate", "Master Data — Contractor Rate"),
    ("master_data.equipment", "Master Data — Equipment"),
    ("master_data.equipment_rate", "Master Data — Equipment Rate"),
    ("master_data.std_manhour", "Master Data — Std Manhour"),
    ("master_data.role", "Master Data — Role"),
    ("master_data.user_role", "Master Data — User Role"),
    ("master_data.role_permission", "Master Data — Role Permission"),
]

ACCESS_LEVELS = ["edit", "view", "disabled"]


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)
    return wrapper


def get_current_user():
    return session.get("user")


def get_permissions(role):
    perms = {}
    rows = RolePermission.query.filter_by(role=role).all()
    for r in rows:
        perms[r.feature] = r.access_level
    if role == "administrator":
        for feat, _ in FEATURES:
            if feat not in perms:
                perms[feat] = "edit"
    return perms


def get_available_roles():
    roles = Role.query.filter_by(status="Active").order_by(Role.name).all()
    return [r.name for r in roles]


# ═══════════════════════════════════════
#  LOGIN
# ═══════════════════════════════════════

@auth_bp.route("/login")
def login():
    if "user" in session:
        return redirect(url_for("pages.index"))
    return render_template("login.html")


@auth_bp.route("/auth/login", methods=["POST"])
def do_login():
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    email = (data.get("email") or "").strip().lower()
    if not email:
        if request.is_json:
            return jsonify({"error": "Email is required."}), 400
        return render_template("login.html", error="Email is required.")

    user_record = UserRole.query.filter(db.func.lower(UserRole.mail) == email).first()
    if not user_record:
        msg = "No account found for '{}'. Please contact administrator.".format(email)
        if request.is_json:
            return jsonify({"error": msg}), 404
        return render_template("login.html", error=msg, email=email)

    if user_record.status != "Active":
        msg = "Your account is inactive. Please contact administrator."
        if request.is_json:
            return jsonify({"error": msg}), 403
        return render_template("login.html", error=msg, email=email)

    role = user_record.role or "officer"
    permissions = get_permissions(role)

    session["user"] = {
        "id": user_record.id,
        "name": user_record.name or email,
        "email": user_record.mail,
        "role": role,
        "job_title": user_record.job_title or "",
        "permissions": permissions,
    }
    session.permanent = True

    if request.is_json:
        return jsonify(session["user"])
    next_url = request.args.get("next") or url_for("pages.index")
    return redirect(next_url)


@auth_bp.route("/auth/logout")
def logout():
    session.clear()
    return redirect(url_for("auth.login"))


# ═══════════════════════════════════════
#  API
# ═══════════════════════════════════════

@auth_bp.route("/api/auth/me")
def get_me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify(user)


@auth_bp.route("/api/auth/users")
def get_login_users():
    users = UserRole.query.filter_by(status="Active").order_by(UserRole.name).all()
    return jsonify([{"id": u.id, "name": u.name, "email": u.mail, "role": u.role, "job_title": u.job_title} for u in users])


@auth_bp.route("/api/auth/features")
def get_features():
    return jsonify([{"key": k, "label": v} for k, v in FEATURES])


@auth_bp.route("/api/auth/roles")
def get_roles_list():
    roles = get_available_roles()
    return jsonify(roles)


@auth_bp.route("/api/auth/permissions")
def get_all_permissions():
    roles = get_available_roles()
    rows = RolePermission.query.order_by(RolePermission.role, RolePermission.feature).all()
    result = {}
    for r in rows:
        if r.role not in result:
            result[r.role] = {}
        result[r.role][r.feature] = {"id": r.id, "access_level": r.access_level}
    return jsonify({
        "roles": roles,
        "features": [{"key": k, "label": v} for k, v in FEATURES],
        "access_levels": ACCESS_LEVELS,
        "permissions": result,
    })


@auth_bp.route("/api/auth/permissions", methods=["POST"])
def update_permission():
    user = get_current_user()
    if not user or user.get("role") != "administrator":
        return jsonify({"error": "Only administrators can manage permissions."}), 403

    data = request.get_json()
    role = data.get("role", "").strip()
    feature = data.get("feature", "").strip()
    access_level = data.get("access_level", "disabled").strip()

    if not any(f[0] == feature for f in FEATURES):
        return jsonify({"error": "Invalid feature."}), 400
    if access_level not in ACCESS_LEVELS:
        return jsonify({"error": "Invalid access level."}), 400

    try:
        item = RolePermission.query.filter_by(role=role, feature=feature).first()
        if item:
            item.access_level = access_level
            item.updated_by = user.get("name", "system")
        else:
            item = RolePermission(role=role, feature=feature, access_level=access_level, updated_by=user.get("name", "system"))
            db.session.add(item)
        db.session.commit()
        if user.get("role") == role:
            session["user"]["permissions"] = get_permissions(role)
        return jsonify(item.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500