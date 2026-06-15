from flask import Flask
from flask_cors import CORS
from datetime import timedelta
from .config import Config
from .models import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.permanent_session_lifetime = timedelta(hours=8)
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config.get("ALLOWED_ORIGINS", "*")}})

    # Security headers
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # Auth
    from .auth import auth_bp
    app.register_blueprint(auth_bp)

    # Pages
    from .pages import pages_bp
    app.register_blueprint(pages_bp)

    # API
    from .api.planning import planning_bp
    app.register_blueprint(planning_bp, url_prefix="/api/planning")
    from .api.daily_report import daily_report_bp
    app.register_blueprint(daily_report_bp, url_prefix="/api/daily-report")
    from .api.dashboard import dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    from .api.timesheet import timesheet_bp
    app.register_blueprint(timesheet_bp, url_prefix="/api/timesheet")
    from .api.master_data import master_data_bp
    app.register_blueprint(master_data_bp, url_prefix="/api/master-data")
    from .api.bigquery import bigquery_bp
    app.register_blueprint(bigquery_bp, url_prefix="/api/bigquery")

    return app