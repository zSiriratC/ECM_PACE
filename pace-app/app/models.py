from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date

db = SQLAlchemy()

class Asset(db.Model):
    __tablename__ = "asset"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True)
    description = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class WorkingPlatform(db.Model):
    __tablename__ = "working_platform"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True)
    description = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class WorkingPlatformMapping(db.Model):
    __tablename__ = "working_platform_mapping"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    asset = db.Column(db.String(255))
    working_platform = db.Column(db.String(255))
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class QuarterPlatform(db.Model):
    __tablename__ = "quarter_platform"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True)
    description = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class QuarterPlatformMapping(db.Model):
    __tablename__ = "quarter_platform_mapping"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    asset = db.Column(db.String(255))
    quarter_platform = db.Column(db.String(255))
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class JobType(db.Model):
    __tablename__ = "job_type"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    description_l1 = db.Column(db.String(255))
    description_l2 = db.Column(db.String(255))
    description_l3 = db.Column(db.String(255))
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class Group(db.Model):
    __tablename__ = "md_group"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True)
    description = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class Company(db.Model):
    __tablename__ = "company"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True)
    description = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class Position(db.Model):
    __tablename__ = "position"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    md_group = db.Column(db.String(255))
    name = db.Column(db.String(255))
    description = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class RateType(db.Model):
    __tablename__ = "rate_type"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True)
    description = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class ContractorList(db.Model):
    __tablename__ = "contractor_list"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255))
    company = db.Column(db.String(255))
    position = db.Column(db.String(255))
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class ContractorRate(db.Model):
    __tablename__ = "contractor_rate"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    company = db.Column(db.String(255))
    position = db.Column(db.String(255))
    rate_type = db.Column(db.String(255))
    charge_hour_rate = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class Equipment(db.Model):
    __tablename__ = "equipment"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255))
    description = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class EquipmentRate(db.Model):
    __tablename__ = "equipment_rate"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    company = db.Column(db.String(255))
    equipment = db.Column(db.String(255))
    rate_type = db.Column(db.String(255))
    charge_hour_rate = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class PlanStandardizeManhour(db.Model):
    __tablename__ = "plan_standardize_manhour"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    md_group = db.Column(db.String(100), default="")
    header = db.Column(db.String(100))
    sub_header = db.Column(db.String(255))
    description = db.Column(db.Text)
    level = db.Column(db.String(10))
    unit = db.Column(db.String(20))
    manhour = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class Role(db.Model):
    __tablename__ = "role"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True)
    description = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class UserRole(db.Model):
    __tablename__ = "user_role"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mail = db.Column(db.String(255))
    name = db.Column(db.String(255))
    job_title = db.Column(db.String(255))
    role = db.Column(db.String(255))
    status = db.Column(db.String(20), default="Active")
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class RolePermission(db.Model):
    __tablename__ = "role_permission"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    role = db.Column(db.String(50), nullable=False, index=True)
    feature = db.Column(db.String(100), nullable=False, index=True)
    access_level = db.Column(db.String(20), default="disabled")
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), default="")
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class JobList(db.Model):
    __tablename__ = "job_list"
    job_no = db.Column(db.String(32), primary_key=True)
    job_name = db.Column(db.Text)
    job_type = db.Column(db.String(15))
    job_group = db.Column("group", db.String(20))
    discipline = db.Column(db.String(20))
    sub_type = db.Column(db.String(32))
    location = db.Column(db.String(32))
    asset = db.Column(db.String(20))
    working_platform = db.Column(db.String(10))
    sro_no = db.Column(db.String(10))
    project_engineer = db.Column(db.String(255))
    plan_start_date = db.Column(db.Date)
    plan_end_date = db.Column(db.Date)
    actual_start_date = db.Column(db.Date)
    actual_end_date = db.Column(db.Date)
    suspended_day = db.Column(db.Float, default=0)
    total_day = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default="Drafting Plan")
    def to_dict(self):
        def fmt(v):
            if isinstance(v, (datetime, date)): return v.isoformat()
            return v
        return {"job_no":fmt(self.job_no),"job_name":self.job_name,"job_type":self.job_type,"group":self.job_group,"discipline":self.discipline,"sub_type":self.sub_type,"location":self.location,"asset":self.asset,"working_platform":self.working_platform,"sro_no":self.sro_no,"project_engineer":self.project_engineer,"plan_start_date":fmt(self.plan_start_date),"plan_end_date":fmt(self.plan_end_date),"actual_start_date":fmt(self.actual_start_date),"actual_end_date":fmt(self.actual_end_date),"suspended_day":self.suspended_day,"total_day":self.total_day,"status":self.status}

class PlanSummary(db.Model):
    __tablename__ = "plan_summary"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    job_no = db.Column(db.String(32), db.ForeignKey("job_list.job_no"))
    scope = db.Column(db.Text)
    mobilization = db.Column(db.Float, default=0); demolition = db.Column(db.Float, default=0)
    installation = db.Column(db.Float, default=0); scaffolding = db.Column(db.Float, default=0)
    other = db.Column(db.Float, default=0); commissioning = db.Column(db.Float, default=0)
    painting = db.Column(db.Float, default=0); cleaning = db.Column(db.Float, default=0)
    demobilization = db.Column(db.Float, default=0); contingency = db.Column(db.Float, default=0)
    estimated_productive_time = db.Column(db.Float, default=0); estimated_pob = db.Column(db.Float, default=0)
    project_duration = db.Column(db.Integer, default=0)
    plan_start_date = db.Column(db.Date); plan_end_date = db.Column(db.Date)
    total_productive_manhour = db.Column(db.Float, default=0)
    total_non_productive_manhour = db.Column(db.Float, default=0)
    total_manhour = db.Column(db.Float, default=0)
    unit_cost = db.Column(db.Float, default=0); exchange_rate = db.Column(db.Float, default=0)
    direct_cost_thb = db.Column(db.Float, default=0); direct_cost_usd = db.Column(db.Float, default=0)
    actual_manhour_activity = db.Column(db.Float, default=0); actual_manhour_daily = db.Column(db.Float, default=0)
    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class PlanActivity(db.Model):
    __tablename__ = "plan_activity"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    std_mh_id = db.Column(db.Integer, db.ForeignKey("plan_standardize_manhour.id"), nullable=True)
    job_no = db.Column(db.String(32), db.ForeignKey("job_list.job_no"))
    structure = db.Column(db.String(100))
    header = db.Column(db.String(100))
    sub_header = db.Column(db.String(255))
    description = db.Column(db.Text)
    level = db.Column(db.String(10))
    unit = db.Column(db.String(20))
    plan_quantity = db.Column(db.Float, default=0)
    plan_manhour = db.Column(db.Float, default=0)
    actual_quantity = db.Column(db.Float, default=0)
    actual_manhour = db.Column(db.Float, default=0)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class PlanRevision(db.Model):
    __tablename__ = "plan_revision"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    job_no = db.Column(db.String(32), db.ForeignKey("job_list.job_no"))
    revision = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20))
    action = db.Column(db.String(50), default="")
    snapshot = db.Column(db.Text)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(255), default="")

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime, date)) else getattr(self, c.name)) for c in self.__table__.columns}

class DailyReportNotificationProgress(db.Model):
    __tablename__ = "daily_report_notification_progress"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    notification_no = db.Column(db.String(32), index=True)
    weather_condition = db.Column(db.String(20)); status = db.Column(db.String(20))
    plan_pob = db.Column(db.Integer, default=0); actual_pob = db.Column(db.Integer, default=0)
    plan_manhour = db.Column(db.Float, default=0); actual_manhour = db.Column(db.Float, default=0)
    progress_date = db.Column(db.Date); progress_today = db.Column(db.Float, default=0); progress_total = db.Column(db.Float, default=0)
    normal_working_time = db.Column(db.DateTime); lq_departure_time = db.Column(db.DateTime); pf_arrival_time = db.Column(db.DateTime)
    start_working_time = db.Column(db.DateTime); pf_departure_time = db.Column(db.DateTime); lq_arrival_time = db.Column(db.DateTime)
    downtime_hour = db.Column(db.Float, default=0); productive_hour = db.Column(db.Float, default=0)
    wrench_time_project = db.Column(db.Float, default=0); wrench_time_daily = db.Column(db.Float, default=0)
    pdi_project = db.Column(db.Float, default=0); pdi_daily = db.Column(db.Float, default=0)
    pgi_project = db.Column(db.Float, default=0); pgi_daily = db.Column(db.Float, default=0)
    pti_project = db.Column(db.Float, default=0); pti_daily = db.Column(db.Float, default=0)
    def to_dict(self):
        d = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, (datetime, date)): v = v.isoformat()
            d[c.name] = v
        return d

class DailyReportNotificationManpower(db.Model):
    __tablename__ = "daily_report_notification_manpower"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    notification_no = db.Column(db.String(32), index=True)
    contractor_id = db.Column(db.String(10)); contractor_name = db.Column(db.String(255))
    contractor_company = db.Column(db.String(255)); contractor_position = db.Column(db.String(255))
    location = db.Column(db.String(32)); quarter_platform = db.Column(db.String(10))
    offshore_working = db.Column(db.Float, default=0); offshore_standby = db.Column(db.Float, default=0); offshore_overtime = db.Column(db.Float, default=0)
    onshore_working = db.Column(db.Float, default=0); onshore_standby = db.Column(db.Float, default=0); onshore_overtime = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0); sse = db.Column(db.Boolean, default=False)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class DailyReportNotificationEquipment(db.Model):
    __tablename__ = "daily_report_notification_equipment"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    notification_no = db.Column(db.String(32), index=True)
    equipment_id = db.Column(db.Integer); equipment_name = db.Column(db.String(255))
    equipment_company = db.Column(db.String(255)); charge_type = db.Column(db.String(20))
    tag_no = db.Column(db.String(32)); quantity = db.Column(db.Integer, default=0)
    offshore_working = db.Column(db.Float, default=0); offshore_standby = db.Column(db.Float, default=0); offshore_overtime = db.Column(db.Float, default=0)
    onshore_working = db.Column(db.Float, default=0); onshore_standby = db.Column(db.Float, default=0); onshore_overtime = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class DailyReportProjectProgress(db.Model):
    __tablename__ = "daily_report_project_progress"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_no = db.Column(db.String(32), index=True)
    weather_condition = db.Column(db.String(20)); status = db.Column(db.String(20))
    plan_pob = db.Column(db.Integer, default=0); actual_pob = db.Column(db.Integer, default=0)
    plan_manhour = db.Column(db.Float, default=0); actual_manhour = db.Column(db.Float, default=0)
    progress_date = db.Column(db.Date); progress_today = db.Column(db.Float, default=0); progress_total = db.Column(db.Float, default=0)
    normal_working_time = db.Column(db.DateTime); lq_departure_time = db.Column(db.DateTime); pf_arrival_time = db.Column(db.DateTime)
    start_working_time = db.Column(db.DateTime); pf_departure_time = db.Column(db.DateTime); lq_arrival_time = db.Column(db.DateTime)
    downtime_hour = db.Column(db.Float, default=0); productive_hour = db.Column(db.Float, default=0)
    wrench_time_project = db.Column(db.Float, default=0); wrench_time_daily = db.Column(db.Float, default=0)
    pdi_project = db.Column(db.Float, default=0); pdi_daily = db.Column(db.Float, default=0)
    pgi_project = db.Column(db.Float, default=0); pgi_daily = db.Column(db.Float, default=0)
    pti_project = db.Column(db.Float, default=0); pti_daily = db.Column(db.Float, default=0)
    def to_dict(self):
        d = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, (datetime, date)): v = v.isoformat()
            d[c.name] = v
        return d

class DailyReportProjectManpower(db.Model):
    __tablename__ = "daily_report_project_manpower"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_no = db.Column(db.String(32), index=True)
    contractor_id = db.Column(db.String(10)); contractor_name = db.Column(db.String(255))
    contractor_company = db.Column(db.String(255)); contractor_position = db.Column(db.String(255))
    location = db.Column(db.String(32)); quarter_platform = db.Column(db.String(10))
    offshore_working = db.Column(db.Float, default=0); offshore_standby = db.Column(db.Float, default=0); offshore_overtime = db.Column(db.Float, default=0)
    onshore_working = db.Column(db.Float, default=0); onshore_standby = db.Column(db.Float, default=0); onshore_overtime = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0); sse = db.Column(db.Boolean, default=False)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class DailyReportProjectEquipment(db.Model):
    __tablename__ = "daily_report_project_equipment"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_no = db.Column(db.String(32), index=True)
    equipment_id = db.Column(db.Integer); equipment_name = db.Column(db.String(255))
    equipment_company = db.Column(db.String(255)); charge_type = db.Column(db.String(20))
    tag_no = db.Column(db.String(32)); quantity = db.Column(db.Integer, default=0)
    offshore_working = db.Column(db.Float, default=0); offshore_standby = db.Column(db.Float, default=0); offshore_overtime = db.Column(db.Float, default=0)
    onshore_working = db.Column(db.Float, default=0); onshore_standby = db.Column(db.Float, default=0); onshore_overtime = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}