from app import create_app
from app.models import (
    db, Asset, WorkingPlatform, WorkingPlatformMapping, QuarterPlatform,
    QuarterPlatformMapping, JobType, Group, Company, Position, RateType,
    ContractorList, ContractorRate, Equipment, EquipmentRate,
    PlanStandardizeManhour, Role, UserRole, RolePermission
)

app = create_app()

with app.app_context():
    db.create_all()
    print("✅ DB ready:", app.config["SQLALCHEMY_DATABASE_URI"])

    if Company.query.count() == 0:
        print("📦 Seeding default data...")

        # 1. Assets
        assets = ["Arthit", "Bongkot", "Erawan", "Platong", "Satun", "Funan", "Jakrawan", "S1"]
        for a in assets:
            db.session.add(Asset(name=a, description=a + " Asset", status="Active", updated_by="system"))

        # 2. Working Platforms
        wps = ["ARWP", "AREP", "ARWN", "BKPP-A", "BKPP-B", "BKPP-C", "ERWN", "ERWE", "EREP", "PLWP", "PLEP", "STWP", "FNWP", "JKWP", "S1"]
        for w in wps:
            db.session.add(WorkingPlatform(name=w, description=w, status="Active", updated_by="system"))

        # 3. Working Platform Mappings
        wp_map = [("Arthit","ARWP"),("Arthit","AREP"),("Arthit","ARWN"),("Bongkot","BKPP-A"),("Bongkot","BKPP-B"),("Bongkot","BKPP-C"),("Erawan","ERWN"),("Erawan","ERWE"),("Erawan","EREP"),("Platong","PLWP"),("Platong","PLEP"),("Satun","STWP"),("Funan","FNWP"),("Jakrawan","JKWP"),("S1","S1")]
        for a, w in wp_map:
            db.session.add(WorkingPlatformMapping(asset=a, working_platform=w, status="Active", updated_by="system"))

        # 4. Quarter Platforms
        qps = ["ARWP-QP", "BKPP-QP", "ERWN-QP", "PLWP-QP"]
        for q in qps:
            db.session.add(QuarterPlatform(name=q, description=q, status="Active", updated_by="system"))

        # 5. Quarter Platform Mappings
        qp_map = [("Arthit","ARWP-QP"),("Bongkot","BKPP-QP"),("Erawan","ERWN-QP"),("Platong","PLWP-QP")]
        for a, q in qp_map:
            db.session.add(QuarterPlatformMapping(asset=a, quarter_platform=q, status="Active", updated_by="system"))

        # 6. Job Types
        jt_data = [("Modification","Piping","New Installation"),("Modification","Piping","Replacement"),("Modification","Piping","Re-route"),("Modification","Structure","New Installation"),("Modification","Structure","Reinforcement"),("Modification","E&I","New Installation"),("Modification","E&I","Replacement"),("Modification","Mechanical","New Installation"),("Modification","Mechanical","Replacement"),("Maintenance","Piping","Repair"),("Maintenance","Piping","Replacement"),("Maintenance","Structure","Repair"),("Maintenance","E&I","Repair"),("Maintenance","Mechanical","Repair"),("Maintenance","Mechanical","Overhaul"),("Inspection","Piping","NDT"),("Inspection","Structure","Visual Inspection"),("Decommissioning","General","Full Removal"),("Decommissioning","General","Partial Removal")]
        for l1, l2, l3 in jt_data:
            db.session.add(JobType(description_l1=l1, description_l2=l2, description_l3=l3, status="Active", updated_by="system"))

        # 7. Groups
        groups = ["E&I", "Piping", "Scaffolding", "Other", "Mechanical"]
        for g in groups:
            db.session.add(Group(name=g, description=g + " group", status="Active", updated_by="system"))

        # 8. Companies
        companies = ["CES", "PTTEP", "UNI", "TCS", "EXP"]
        for c in companies:
            db.session.add(Company(name=c, description=c, status="Active", updated_by="system"))

        # 9. Positions
        pos_data = [("Piping","Piping & Structural Supervisor"),("Piping","Piping & Structural Foreman"),("Piping","Piping & Structural Fitter"),("Piping","Helper"),("Piping","Multi-coded Welder"),("Piping","Piping Welder"),("Piping","Structural Welder"),("Scaffolding","Scaffolding Inspector"),("Scaffolding","Rigger/Scaffolder"),("Scaffolding","Blaster/Painter"),("Scaffolding","Blaster/Painter with Rope Access"),("Scaffolding","Scaffolding & Painting Foreman"),("Mechanical","Crane Operator Class A"),("Mechanical","Crane Operator Class B+"),("Mechanical","Crane Operator Class B"),("Mechanical","Crane Operator Class C"),("Mechanical","Lead Mechanic/Mechanic Foreman"),("Mechanical","Mechanic"),("E&I","Electrical & Instrumentation Supervisor"),("E&I","Electrical & Instrumentation Foreman"),("E&I","Electrical & Instrumentation Technician"),("Other","Technical Assistant/Project coordinator"),("Other","QA/QC Inspector - Welding"),("Other","QA/QC Inspector - Painting"),("Other","QA/QC Inspector - NDE/Technician"),("Other","QA/QC Inspector - Electrical & Instrumentation"),("Other","Safety Officer")]
        for grp, name in pos_data:
            db.session.add(Position(md_group=grp, name=name, description=name, status="Active", updated_by="system"))

        # 10. Rate Types
        rate_types = ["Offshore Working", "Offshore Overtime", "Offshore Standby", "Onshore Working", "Onshore Overtime", "Onshore Standby"]
        for rt in rate_types:
            db.session.add(RateType(name=rt, description=rt, status="Active", updated_by="system"))

        # 11. Contractor Rates (sample)
        cr_data = [("UNI","Piping & Structural Supervisor","Offshore Working",570.42),("UNI","Piping & Structural Foreman","Offshore Working",470.83),("UNI","Helper","Offshore Working",216.67),("UNI","Multi-coded Welder","Offshore Working",385.83),("TCS","Piping & Structural Supervisor","Offshore Working",550.00),("TCS","Piping & Structural Foreman","Offshore Working",450.00),("TCS","Helper","Offshore Working",200.00),("EXP","Piping & Structural Supervisor","Offshore Working",560.00),("EXP","Piping & Structural Foreman","Offshore Working",460.00),("EXP","Helper","Offshore Working",210.00)]
        for co, po, rt, rate in cr_data:
            db.session.add(ContractorRate(company=co, position=po, rate_type=rt, charge_hour_rate=rate, status="Active", updated_by="system"))

        # 13. Equipment
        eq_names = ["500 AMP Diesel Welding Machine","400 AMP Diesel Welding Machine","200 AMP TIG Welding Machine","Portable Grinding Machine (4 inch)","Portable Grinding Machine (7 inch)","Oxy-Acetylene Cutting Set","Magnetic Drill","Hydraulic Torque Wrench","Chain Block 1 Ton","Chain Block 3 Ton","Air Compressor","Airless Spray Painting Machine","Sand Blasting Machine"]
        for eq in eq_names:
            db.session.add(Equipment(name=eq, description=eq, status="Active", updated_by="system"))

        # 14. Equipment Rates (sample)
        er_data = [("TCS","500 AMP Diesel Welding Machine","Offshore Working",1540.50),("UNI","500 AMP Diesel Welding Machine","Offshore Working",1300.00),("EXP","500 AMP Diesel Welding Machine","Offshore Working",1200.00),("TCS","Air Compressor","Offshore Working",582.00),("UNI","Air Compressor","Offshore Working",700.00),("EXP","Air Compressor","Offshore Working",800.00)]
        for co, eq, rt, rate in er_data:
            db.session.add(EquipmentRate(company=co, equipment=eq, rate_type=rt, charge_hour_rate=rate, status="Active", updated_by="system"))

        # 16. Roles
        roles = [("officer","Officer"),("engineer","Engineer"),("supervisor","Supervisor"),("assistant_supervisor","Asst. Supervisor"),("manager","Manager"),("contractor","Contractor"),("administrator","Administrator")]
        for name, desc in roles:
            db.session.add(Role(name=name, description=desc, status="Active", updated_by="system"))

        # 17. User Roles
        db.session.add(UserRole(mail="admin@pttep.com", name="System Admin", job_title="Administrator", role="administrator", status="Active", updated_by="system"))
        db.session.add(UserRole(mail="nathachokn@pttep.com", name="Nathachok Namwong", job_title="Engineer, Project Support", role="engineer", status="Active", updated_by="system"))

        # 15. Standardize Manhour
        std_mh_base = [
            ("Piping","Piping and Structure Demolition","Piping","Pipe Demolition 2 inch","joint",2.0),
            ("Piping","Piping and Structure Demolition","Piping","Pipe Demolition 4 inch","joint",4.0),
            ("Piping","Piping and Structure Demolition","Piping","Pipe Demolition 6 inch","joint",6.0),
            ("Piping","Piping and Structure Demolition","Piping","Pipe Demolition 8 inch","joint",8.0),
            ("E&I","IE Bulk Demolition","Cable Tray","Cable Tray Removal per meter","m",1.0),
            ("E&I","IE Bulk Demolition","Cable","Cable Removal per meter","m",0.3),
            ("E&I","IE Tag Demolition","Instrument","Instrument Removal per tag","tag",4.0),
            ("E&I","IE Tag Demolition","Motor","Motor Removal per tag","tag",8.0),
            ("Piping","Mechanical & Equipment Demolition","Valve","Valve Removal per ea","ea",4.0),
            ("Piping","Mechanical & Equipment Demolition","Pump","Pump Removal per ea","ea",20.0),
            ("Piping","Piping Installation","Carbon Steel","CS Pipe 2 inch","joint",4.0),
            ("Piping","Piping Installation","Carbon Steel","CS Pipe 3 inch","joint",6.0),
            ("Piping","Piping Installation","Carbon Steel","CS Pipe 4 inch","joint",8.0),
            ("Piping","Piping Installation","Carbon Steel","CS Pipe 6 inch","joint",12.0),
            ("Piping","Piping Installation","Carbon Steel","CS Pipe 8 inch","joint",16.0),
            ("Piping","Piping Installation","Carbon Steel","CS Pipe 10 inch","joint",20.0),
            ("Piping","Piping Installation","Carbon Steel","CS Pipe 12 inch","joint",24.0),
            ("Piping","Piping Installation","Stainless Steel","SS Pipe 2 inch","joint",6.0),
            ("Piping","Piping Installation","Stainless Steel","SS Pipe 4 inch","joint",12.0),
            ("Piping","Piping Installation","Stainless Steel","SS Pipe 6 inch","joint",18.0),
            ("Piping","Pipe Support Installation","Pipe Support","U-Bolt per ea","ea",2.0),
            ("Piping","Pipe Support Installation","Pipe Support","Pipe Clamp per ea","ea",3.0),
            ("Piping","Pipe Support Installation","Pipe Support","Guide per ea","ea",4.0),
            ("Piping","Pipe Support Installation","Pipe Support","Shoe per ea","ea",3.5),
            ("Piping","Structure Installation","Steel","Steel Structure per kg","kg",0.1),
            ("Piping","Structure Installation","Grating","Grating Installation per m2","m2",2.0),
            ("Piping","Structure Installation","Handrail","Handrail Installation per m","m",1.5),
            ("E&I","IE Bulk Installation","Cable Tray","Cable Tray Installation per meter","m",2.0),
            ("E&I","IE Bulk Installation","Cable","Cable Pulling per meter","m",0.5),
            ("E&I","IE Bulk Installation","Conduit","Conduit Installation per meter","m",1.5),
            ("E&I","IE Bulk Installation","Junction Box","JB Installation per ea","ea",4.0),
            ("E&I","IE Tag Installation","Instrument","Instrument Installation per tag","tag",8.0),
            ("E&I","IE Tag Installation","Motor","Motor Installation per tag","tag",16.0),
            ("E&I","IE Tag Installation","Panel","Panel Installation per tag","tag",24.0),
            ("Piping","Mechanical & Equipment Installation","Valve","Valve Installation 2 inch","ea",4.0),
            ("Piping","Mechanical & Equipment Installation","Valve","Valve Installation 4 inch","ea",8.0),
            ("Piping","Mechanical & Equipment Installation","Valve","Valve Installation 6 inch","ea",12.0),
            ("Piping","Mechanical & Equipment Installation","Pump","Pump Installation per ea","ea",40.0),
            ("Piping","Mechanical & Equipment Installation","Vessel","Vessel Installation per ea","ea",80.0),
            ("Scaffolding","Scaffolding Erection","Standard","Standard Scaffolding per m3","m3",1.0),
            ("Scaffolding","Scaffolding Erection","Complex","Complex Scaffolding per m3","m3",1.5),
            ("Scaffolding","Scaffolding Erection","Cantilever","Cantilever Scaffolding per m3","m3",2.0),
            ("Scaffolding","Scaffolding Dismantling","Standard","Standard Dismantling per m3","m3",0.8),
            ("Scaffolding","Scaffolding Dismantling","Complex","Complex Dismantling per m3","m3",1.2),
            ("Scaffolding","Scaffolding Dismantling","Cantilever","Cantilever Dismantling per m3","m3",1.6),
            ("Scaffolding","Pressurize Habitat","Standard","Habitat Erection per m3","m3",2.0),
            ("Other","Insulation work (by POCT)","Insulation","Insulation per meter","m",2.0),
            ("Other","Insulation work (by POCT)","Insulation","Insulation Removal per meter","m",1.0),
            ("Other","Isolation support","Isolation","Isolation Support per ea","ea",4.0),
            ("Other","Site Survey","Survey","Site Survey per day","day",8.0),
            ("E&I","Testing and Pre-Commissioning","Loop Test","Loop Test per loop","loop",4.0),
            ("E&I","Testing and Pre-Commissioning","Megger Test","Megger Test per cable","cable",1.0),
            ("E&I","Function Test and Commissioning","Function Test","Function Test per system","system",16.0),
            ("Scaffolding","Painting & Touch-up Paint","Surface Prep","Surface Preparation per m2","m2",0.5),
            ("Scaffolding","Painting & Touch-up Paint","Primer","Primer Coat per m2","m2",0.3),
            ("Scaffolding","Painting & Touch-up Paint","Top Coat","Top Coat per m2","m2",0.3),
            ("Scaffolding","Painting & Touch-up Paint","Touch-up","Touch-up Paint per m2","m2",0.5),
            ("Scaffolding","Painting & Touch-up Paint","Full Paint","Full Paint System per m2","m2",1.5),
        ]
        level_mult = [("Low", 0.8), ("Medium", 1.0), ("High", 1.3)]
        std_count = 0
        for grp, hdr, sub, desc, unit, base_mh in std_mh_base:
            for lvl, mult in level_mult:
                db.session.add(PlanStandardizeManhour(
                    md_group=grp, header=hdr, sub_header=sub,
                    description=desc, level=lvl,
                    unit=unit, manhour=round(base_mh * mult, 2),
                    status="Active", updated_by="system",
                ))
                std_count += 1

        # 18. Role Permissions
        role_names = [r[0] for r in roles]
        perm_matrix = {
            "home":{"officer":"view","engineer":"view","supervisor":"view","assistant_supervisor":"view","manager":"view","contractor":"view","administrator":"view"},
            "planning":{"officer":"view","engineer":"edit","supervisor":"view","assistant_supervisor":"edit","manager":"view","contractor":"view","administrator":"edit"},
            "planning.create":{"officer":"disabled","engineer":"edit","supervisor":"disabled","assistant_supervisor":"edit","manager":"disabled","contractor":"disabled","administrator":"edit"},
            "planning.edit_plan":{"officer":"disabled","engineer":"edit","supervisor":"disabled","assistant_supervisor":"edit","manager":"disabled","contractor":"disabled","administrator":"edit"},
            "planning.submit":{"officer":"disabled","engineer":"edit","supervisor":"disabled","assistant_supervisor":"edit","manager":"disabled","contractor":"disabled","administrator":"edit"},
            "planning.approve":{"officer":"disabled","engineer":"disabled","supervisor":"edit","assistant_supervisor":"disabled","manager":"disabled","contractor":"disabled","administrator":"edit"},
            "planning.start":{"officer":"disabled","engineer":"disabled","supervisor":"disabled","assistant_supervisor":"disabled","manager":"disabled","contractor":"edit","administrator":"edit"},
            "planning.complete":{"officer":"disabled","engineer":"disabled","supervisor":"disabled","assistant_supervisor":"disabled","manager":"disabled","contractor":"edit","administrator":"edit"},
            "planning.delete":{"officer":"disabled","engineer":"disabled","supervisor":"disabled","assistant_supervisor":"disabled","manager":"disabled","contractor":"disabled","administrator":"edit"},
            "daily_report":{"officer":"view","engineer":"edit","supervisor":"view","assistant_supervisor":"edit","manager":"view","contractor":"edit","administrator":"edit"},
            "manhour":{"officer":"view","engineer":"view","supervisor":"view","assistant_supervisor":"view","manager":"view","contractor":"view","administrator":"edit"},
            "dashboard_1":{"officer":"view","engineer":"view","supervisor":"view","assistant_supervisor":"view","manager":"view","contractor":"view","administrator":"view"},
            "dashboard_2":{"officer":"view","engineer":"view","supervisor":"view","assistant_supervisor":"view","manager":"view","contractor":"view","administrator":"view"},
            "timesheet":{"officer":"view","engineer":"view","supervisor":"view","assistant_supervisor":"view","manager":"view","contractor":"view","administrator":"view"},
            "master_data":{"officer":"view","engineer":"view","supervisor":"disabled","assistant_supervisor":"disabled","manager":"disabled","contractor":"view","administrator":"edit"},
        }
        # Master data sub-features: default all disabled except admin=edit
        md_features = ["master_data.asset","master_data.working_platform","master_data.working_platform_mapping","master_data.quarter_platform","master_data.quarter_platform_mapping","master_data.job_type","master_data.group","master_data.company","master_data.position","master_data.rate_type","master_data.contractor","master_data.contractor_rate","master_data.equipment","master_data.equipment_rate","master_data.std_manhour","master_data.role","master_data.user_role","master_data.role_permission"]
        for feat in md_features:
            perm_matrix[feat] = {r: "disabled" for r in role_names}
            perm_matrix[feat]["administrator"] = "edit"
        # Overrides
        perm_matrix["master_data.company"]["contractor"] = "edit"
        perm_matrix["master_data.contractor"]["contractor"] = "edit"
        perm_matrix["master_data.contractor_rate"]["officer"] = "edit"
        perm_matrix["master_data.equipment_rate"]["officer"] = "edit"
        perm_matrix["master_data.std_manhour"]["engineer"] = "edit"

        perm_count = 0
        for feat, role_map in perm_matrix.items():
            for role, access in role_map.items():
                db.session.add(RolePermission(role=role, feature=feat, access_level=access, updated_by="system"))
                perm_count += 1

        db.session.commit()
        print("✅ Default data seeded!")
        print("   Assets: {}".format(len(assets)))
        print("   Working Platforms: {}".format(len(wps)))
        print("   WP Mappings: {}".format(len(wp_map)))
        print("   Quarter Platforms: {}".format(len(qps)))
        print("   QP Mappings: {}".format(len(qp_map)))
        print("   Job Types: {}".format(len(jt_data)))
        print("   Groups: {}".format(len(groups)))
        print("   Companies: {}".format(len(companies)))
        print("   Positions: {}".format(len(pos_data)))
        print("   Rate Types: {}".format(len(rate_types)))
        print("   Contractor Rates: {}".format(len(cr_data)))
        print("   Equipment: {}".format(len(eq_names)))
        print("   Equipment Rates: {}".format(len(er_data)))
        print("   Std Manhour: {}".format(std_count))
        print("   Roles: {}".format(len(roles)))
        print("   Permissions: {}".format(perm_count))
    else:
        print("ℹ️  Data exists, skipping seed.")

if __name__ == "__main__":
    app.run(debug=True, port=5000)