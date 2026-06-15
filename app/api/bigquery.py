from flask import Blueprint, request, jsonify
from app.services.bigquery_service import get_project_list, get_notification_list

bigquery_bp = Blueprint("bigquery_bp", __name__)


@bigquery_bp.route("/projects", methods=["GET"])
def projects():
    """
    Fetch project list from GCP BigQuery.
    Optional query params: ?search=keyword&limit=100
    """
    search = request.args.get("search", "").strip()
    limit = request.args.get("limit", 1000, type=int)

    data = get_project_list(search=search, limit=limit)
    return jsonify(data)


@bigquery_bp.route("/notifications", methods=["GET"])
def notifications():
    """
    Fetch notification list from GCP BigQuery.
    Optional query params: ?search=keyword&limit=100
    """
    search = request.args.get("search", "").strip()
    limit = request.args.get("limit", 1000, type=int)

    data = get_notification_list(search=search, limit=limit)
    return jsonify(data)