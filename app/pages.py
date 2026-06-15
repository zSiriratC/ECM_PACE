from flask import Blueprint, render_template
from .auth import login_required, get_current_user

pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/")
@login_required
def index():
    return render_template("home.html", active_page="home", user=get_current_user())


@pages_bp.route("/planning")
@login_required
def planning():
    return render_template("planning.html", active_page="planning", user=get_current_user())


@pages_bp.route("/daily-report")
@login_required
def daily_report():
    return render_template("daily_report.html", active_page="daily-report", user=get_current_user())


@pages_bp.route("/manhour")
@login_required
def manhour():
    return render_template("manhour.html", active_page="manhour", user=get_current_user())


@pages_bp.route("/dashboard-1")
@login_required
def dashboard_1():
    return render_template("dashboard_1.html", active_page="dashboard-1", user=get_current_user())


@pages_bp.route("/dashboard-2")
@login_required
def dashboard_2():
    return render_template("dashboard_2.html", active_page="dashboard-2", user=get_current_user())


@pages_bp.route("/timesheet")
@login_required
def timesheet():
    return render_template("timesheet.html", active_page="timesheet", user=get_current_user())


@pages_bp.route("/master-data")
@login_required
def master_data():
    return render_template("master_data.html", active_page="master-data", user=get_current_user())