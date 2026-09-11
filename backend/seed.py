import datetime
import hashlib
import logging
from backend.database import SessionLocal, engine, Base
from backend.models import ComplaintModel, TimelineEventModel, NotificationModel, UserSettingsModel, DepartmentModel, UserModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civictrack_seed")


INITIAL_DEPARTMENTS = [
    { "name": "Road Maintenance & Engineering", "head_officer": "Er. Sundaram P.", "contact_email": "roads@civictrack.ai", "contact_phone": "+91 44 2888 1001", "resolution_rate": 82.5 },
    { "name": "Electrical Infrastructure", "head_officer": "Er. Meenakshi S.", "contact_email": "electrical@civictrack.ai", "contact_phone": "+91 44 2888 1002", "resolution_rate": 78.0 },
    { "name": "Solid Waste Management", "head_officer": "Officer Rajesh Kumar", "contact_email": "sanitation@civictrack.ai", "contact_phone": "+91 44 2888 1003", "resolution_rate": 91.2 },
    { "name": "Metro Water & Sewage Board", "head_officer": "Er. Anbarasan V.", "contact_email": "sewage@civictrack.ai", "contact_phone": "+91 44 2888 1004", "resolution_rate": 65.4 },
    { "name": "Traffic Police & Signals Division", "head_officer": "Insp. Vikram R.", "contact_email": "traffic@civictrack.ai", "contact_phone": "+91 44 2888 1005", "resolution_rate": 88.0 },
    { "name": "Parks & Urban Forestry", "head_officer": "Officer Deepa M.", "contact_email": "forestry@civictrack.ai", "contact_phone": "+91 44 2888 1006", "resolution_rate": 74.8 }
]

INITIAL_DEMO_COMPLAINTS = [
  {
    "id": "CT-2026-001284",
    "category": "Pothole",
    "category_icon": "🕳️",
    "title": "Large deep pothole at Anna Nagar 2nd Avenue",
    "description": "Dangerous 8-inch deep pothole near main junction causing severe traffic slowdown and rim damage to vehicles.",
    "address": "2nd Avenue, Near Anna Arch, Anna Nagar, Chennai",
    "latitude": 13.0850,
    "longitude": 80.2101,
    "zone": "Zone 8 - Anna Nagar",
    "severity": "HIGH",
    "priority_score": 87,
    "status": "IN_PROGRESS",
    "created_at": datetime.datetime(2026, 8, 29, 10, 30),
    "assigned_department": "Road Maintenance & Engineering",
    "sla_days": 3,
    "sla_due_date": datetime.datetime(2026, 9, 1, 10, 30),
    "image": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    "ai_detection": "Pothole detected",
    "ai_confidence": 94,
    "ai_severity": "HIGH",
    "ai_recommendation": "Immediate cold-mix asphalt patch required. Inspect sub-base for water seepage.",
    "citizen_verification_prompt_active": False,
    "citizen_verification_status": "PENDING",
    "timeline": [
      { "status": "SUBMITTED", "label": "Complaint Submitted", "time": "2026-08-29 10:30 AM", "icon": "📝", "updated_by": "Citizen (Karthik R.)" },
      { "status": "AI_VERIFIED", "label": "AI Prototype Verified", "time": "2026-08-29 10:31 AM", "icon": "✨", "updated_by": "CivicTrack AI Engine" },
      { "status": "ASSIGNED", "label": "Assigned to Road Maintenance", "time": "2026-08-29 11:00 AM", "icon": "👷", "updated_by": "Zonal Officer" },
      { "status": "IN_PROGRESS", "label": "Repair Work In Progress", "time": "2026-08-29 02:00 PM", "icon": "🚜", "updated_by": "Contractor Crew #4" }
    ]
  },
  {
    "id": "CT-2026-001285",
    "category": "Streetlight",
    "category_icon": "💡",
    "title": "Broken LED streetlight near Central Station Metro",
    "description": "Streetlight #L-42 is completely dark for 3 days. Creates safety risk for pedestrians walking at night.",
    "address": "EVR Periyar Salai, Opposite Central Railway Station",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "zone": "Zone 5 - Royapuram",
    "severity": "MEDIUM",
    "priority_score": 65,
    "status": "RESOLVED",
    "created_at": datetime.datetime(2026, 8, 27, 18, 15),
    "assigned_department": "Electrical Infrastructure",
    "sla_days": 5,
    "sla_due_date": datetime.datetime(2026, 9, 1, 18, 15),
    "image": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80",
    "ai_detection": "Broken Luminaire / Power Failure",
    "ai_confidence": 89,
    "ai_severity": "MEDIUM",
    "ai_recommendation": "Replace driver module and 120W LED fixture on pole L-42.",
    "citizen_verification_prompt_active": True,
    "citizen_verification_status": "PENDING",
    "timeline": [
      { "status": "SUBMITTED", "label": "Complaint Submitted", "time": "2026-08-27 06:15 PM", "icon": "📝", "updated_by": "Citizen (Priya S.)" },
      { "status": "AI_VERIFIED", "label": "AI Prototype Verified", "time": "2026-08-27 06:16 PM", "icon": "✨", "updated_by": "CivicTrack AI Engine" },
      { "status": "ASSIGNED", "label": "Assigned to Electrical Dept", "time": "2026-08-28 09:00 AM", "icon": "👷", "updated_by": "Discom Admin" },
      { "status": "IN_PROGRESS", "label": "Maintenance Crew Dispatched", "time": "2026-08-28 11:30 AM", "icon": "🔧", "updated_by": "Electrician Line 2" },
      { "status": "RESOLVED", "label": "Marked Fixed by Authority", "time": "2026-08-28 04:45 PM", "icon": "✅", "updated_by": "Electrical Dept Overseer" }
    ]
  },
  {
    "id": "CT-2026-001286",
    "category": "Garbage",
    "category_icon": "🗑️",
    "title": "Overflowing commercial garbage bins on Usman Road",
    "description": "Trash dumped outside bins blocking shop entrance. Odor issue and stray animals gathering.",
    "address": "Usman Road Flyover Junction, T. Nagar",
    "latitude": 13.0418,
    "longitude": 80.2341,
    "zone": "Zone 10 - T. Nagar",
    "severity": "HIGH",
    "priority_score": 91,
    "status": "CITIZEN_VERIFIED",
    "created_at": datetime.datetime(2026, 8, 25, 7, 45),
    "assigned_department": "Solid Waste Management",
    "sla_days": 3,
    "sla_due_date": datetime.datetime(2026, 8, 28, 7, 45),
    "image": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
    "ai_detection": "Solid Waste Overflow & Biohazard",
    "ai_confidence": 96,
    "ai_severity": "HIGH",
    "ai_recommendation": "Deploy heavy compactor truck unit #9 immediately.",
    "citizen_verification_prompt_active": False,
    "citizen_verification_status": "CONFIRMED",
    "citizen_verification_notes": "Area cleaned thoroughly and disinfected. Verified!",
    "timeline": [
      { "status": "SUBMITTED", "label": "Complaint Submitted", "time": "2026-08-25 07:45 AM", "icon": "📝", "updated_by": "Citizen (Venkatesh)" },
      { "status": "AI_VERIFIED", "label": "AI Prototype Verified", "time": "2026-08-25 07:46 AM", "icon": "✨", "updated_by": "CivicTrack AI Engine" },
      { "status": "ASSIGNED", "label": "Assigned to Sanitation Wing", "time": "2026-08-25 08:30 AM", "icon": "👷", "updated_by": "Sanitation Inspector" },
      { "status": "IN_PROGRESS", "label": "Compactor Unit Dispatched", "time": "2026-08-25 10:00 AM", "icon": "🚛", "updated_by": "Sanitation Supervisor" },
      { "status": "RESOLVED", "label": "Cleared & Sanitized", "time": "2026-08-25 01:15 PM", "icon": "✅", "updated_by": "Sanitation Inspector" },
      { "status": "CITIZEN_VERIFIED", "label": "Citizen Verified Solution", "time": "2026-08-25 03:00 PM", "icon": "🤝", "updated_by": "Citizen (Venkatesh)" }
    ]
  },
  {
    "id": "CT-2026-001287",
    "category": "Drainage",
    "category_icon": "🌊",
    "title": "Blocked storm water drain causing sewage water overflow",
    "description": "Black foul water overflowing onto road after light rains near Velachery Main Road.",
    "address": "100 Feet Bypass Road, Near Railway Station, Velachery",
    "latitude": 12.9756,
    "longitude": 80.2206,
    "zone": "Zone 13 - Velachery",
    "severity": "CRITICAL",
    "priority_score": 98,
    "status": "REOPENED",
    "created_at": datetime.datetime(2026, 8, 20, 9, 0),
    "assigned_department": "Metro Water & Sewage Board",
    "sla_days": 1,
    "sla_due_date": datetime.datetime(2026, 8, 21, 9, 0),
    "image": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80",
    "ai_detection": "Stormwater Drain Obstruction / Sewage Leakage",
    "ai_confidence": 97,
    "ai_severity": "CRITICAL",
    "ai_recommendation": "High-pressure jetting machine & suction vehicle required.",
    "citizen_verification_prompt_active": False,
    "citizen_verification_status": "REJECTED",
    "citizen_verification_notes": "Sewage is still overflowing! The workers only cleared top debris.",
    "timeline": [
      { "status": "SUBMITTED", "label": "Complaint Submitted", "time": "2026-08-20 09:00 AM", "icon": "📝", "updated_by": "Citizen (Anitha K.)" },
      { "status": "AI_VERIFIED", "label": "AI Verified Critical Issue", "time": "2026-08-20 09:01 AM", "icon": "✨", "updated_by": "CivicTrack AI Engine" },
      { "status": "ASSIGNED", "label": "Assigned to Sewage Board", "time": "2026-08-20 09:30 AM", "icon": "👷", "updated_by": "Zonal Engineer" },
      { "status": "RESOLVED", "label": "Authority Marked Resolved", "time": "2026-08-21 04:00 PM", "icon": "✅", "updated_by": "Board Field Officer" },
      { "status": "REOPENED", "label": "Citizen Verification Failed", "time": "2026-08-22 09:00 AM", "icon": "⚠️", "updated_by": "Citizen (Anitha K.)" }
    ]
  }
]

INITIAL_NOTIFICATIONS = [
  {
    "id": "notif-1",
    "title": "Action Required: Verify Resolution",
    "message": "Complaint CT-2026-001285 (Streetlight) has been marked fixed. Has this problem actually been fixed?",
    "notif_type": "VERIFICATION",
    "complaint_id": "CT-2026-001285",
    "time": "10 minutes ago",
    "is_read": False
  },
  {
    "id": "notif-2",
    "title": "Complaint Reopened & Escalated",
    "message": "Complaint CT-2026-001287 (Drainage) was reopened by citizen. SLA SLA-24h exceeded.",
    "notif_type": "ESCALATION",
    "complaint_id": "CT-2026-001287",
    "time": "2 hours ago",
    "is_read": False
  }
]

def seed_db():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed Departments if empty
        if db.query(DepartmentModel).count() == 0:
            for d in INITIAL_DEPARTMENTS:
                db.add(DepartmentModel(**d))
            db.commit()

        # Seed Users if empty
        if db.query(UserModel).count() == 0:
            logger.info("Seeding default user accounts...")
            pwd_hash = hashlib.sha256("password123".encode()).hexdigest()
            db.add(UserModel(
                full_name="Karthik Raja",
                email="karthik.citizen@civictrack.ai",
                hashed_password=pwd_hash,
                phone="+91 98765 43210",
                role="Citizen",
                avatar="KR"
            ))
            db.add(UserModel(
                full_name="Er. Sundaram P.",
                email="officer.sundaram@civictrack.ai",
                hashed_password=pwd_hash,
                phone="+91 44 2888 1001",
                role="Municipal Officer",
                avatar="SP"
            ))
            db.commit()

        # Seed Complaints if empty
        count = db.query(ComplaintModel).count()
        if count == 0:
            logger.info("Seeding initial PostgreSQL demo complaints & departments...")
            for c_data in INITIAL_DEMO_COMPLAINTS:
                timeline_items = c_data.pop("timeline", [])
                complaint = ComplaintModel(**c_data)
                db.add(complaint)
                db.flush()

                for t_item in timeline_items:
                    t_event = TimelineEventModel(complaint_id=complaint.id, **t_item)
                    db.add(t_event)

            for n_data in INITIAL_NOTIFICATIONS:
                db.add(NotificationModel(**n_data))

            db.add(UserSettingsModel(id=1))
            db.commit()
            logger.info("✅ Database seeded successfully with core tables!")
        else:
            logger.info(f"Database already contains {count} complaints.")

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
