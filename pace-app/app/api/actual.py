from flask import Blueprint, request, jsonify
from app.models import db, PlanActivity, DailyReportProjectManpower
from sqlalchemy import func

actual_bp = Blueprint("actual_bp", __name__)


@actual_bp.route("/activities", methods=["GET"])
def get_activities():
    """Get plan activities with actual data for a job."""
    job_no = request.args.get("job_no")
    if not job_no:
        return jsonify({"error": "job_no required"}), 400

    rows = PlanActivity.query.filter_by(job_no=job_no).order_by(PlanActivity.id).all()
    return jsonify([r.to_dict() for r in rows])


@actual_bp.route("/activities/<int:aid>", methods=["PUT"])
def update_activity(aid):
    """Update actual quantity and manhour for an activity."""
    item = PlanActivity.query.get_or_404(aid)
    data = request.get_json()

    if "actual_quantity" in data:
        item.actual_quantity = data["actual_quantity"]
    if "actual_manhour" in data:
        item.actual_manhour = data["actual_manhour"]

    db.session.commit()
    return jsonify(item.to_dict())


@actual_bp.route("/compute-manhour", methods=["GET"])
def compute_manhour():
    """
    Compute actual manhour from daily report manpower
    summed from project beginning to now.
    """
    job_no = request.args.get("job_no")
    if not job_no:
        return jsonify({"error": "job_no required"}), 400

    result = (
        db.session.query(
            func.sum(DailyReportProjectManpower.total).label("total_manhour")
        )
        .filter_by(project_no=job_no)
        .first()
    )

    total = round(result.total_manhour or 0, 2) if result else 0
    return jsonify({"job_no": job_no, "actual_manhour_from_daily": total})