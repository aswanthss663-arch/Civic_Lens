import hashlib
import random
import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.database import get_db, engine, Base
from backend.models import ComplaintModel, TimelineEventModel, NotificationModel, UserSettingsModel, UserModel
from backend.schemas import (
    ComplaintCreateSchema, StatusUpdateSchema, VerifyRequestSchema,
    UserSignUpSchema, UserSignInSchema, UserResponseSchema, AuthResponseSchema
)
from backend.seed import seed_db


# Ensure DB tables exist and are seeded
seed_db()

app = FastAPI(
    title="CivicTrack AI API",
    description="Python FastAPI & PostgreSQL Backend for CivicTrack AI",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: Format model object into JSON structure expected by frontend
def format_complaint_dict(c: ComplaintModel):
    posted_by = format_user_dict(c.user) if c.user else {
        "id": c.user_id,
        "fullName": "Citizen User",
        "email": "",
        "role": "Citizen",
        "avatar": "CU"
    }
    return {
        "id": c.id,
        "userId": c.user_id,
        "postedBy": posted_by,
        "category": c.category,
        "categoryIcon": c.category_icon or "📋",
        "title": c.title,
        "description": c.description,
        "location": {
            "address": c.address,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "zone": c.zone or "Central Zone"
        },
        "severity": c.severity,
        "priorityScore": c.priority_score,
        "status": c.status,
        "createdAt": c.created_at.isoformat() if c.created_at else datetime.datetime.utcnow().isoformat(),
        "assignedDepartment": c.assigned_department,
        "slaDays": c.sla_days,
        "slaDueDate": c.sla_due_date.isoformat() if c.sla_due_date else datetime.datetime.utcnow().isoformat(),
        "image": c.image,
        "aiAnalysis": {
            "detection": c.ai_detection or f"{c.category} detected",
            "confidence": c.ai_confidence or 92,
            "severity": c.ai_severity or c.severity,
            "recommendation": c.ai_recommendation or "Inspection required"
        },
        "timeline": [
            {
                "status": t.status,
                "label": t.label,
                "time": t.time,
                "icon": t.icon or "✓",
                "by": t.updated_by,
                "notes": t.notes
            } for t in c.timeline_events
        ],
        "citizenVerification": {
            "promptActive": c.citizen_verification_prompt_active,
            "status": c.citizen_verification_status or "PENDING",
            "notes": c.citizen_verification_notes or ""
        }
    }


# Helper: Format user object into dict
def format_user_dict(u: UserModel):
    avatar = u.avatar
    if not avatar:
        parts = u.full_name.split()
        avatar = (parts[0][0] + (parts[1][0] if len(parts) > 1 else '')).upper()
    return {
        "id": u.id,
        "fullName": u.full_name,
        "email": u.email,
        "phone": u.phone or "",
        "role": u.role or "Citizen",
        "avatar": avatar
    }


# Helper: Extract authenticated user from Bearer token (returns None if invalid)
def get_user_from_token(authorization: Optional[str], db: Session) -> Optional[UserModel]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    parts = token.split("-")
    # Token format: ct-token-<user_id>-<timestamp>  OR  demo-token-<timestamp>
    try:
        if token.startswith("ct-token-"):
            user_id = int(parts[2])
            return db.query(UserModel).filter(UserModel.id == user_id).first()
    except (IndexError, ValueError):
        pass
    return None


# ==========================================================================
# AUTHENTICATION ENDPOINTS
# ==========================================================================

@app.post("/api/v1/auth/signup")
def auth_signup(data: UserSignUpSchema, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.email.ilike(data.email.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    pwd_hash = hashlib.sha256(data.password.encode()).hexdigest()
    parts = data.fullName.strip().split()
    avatar = (parts[0][0] + (parts[1][0] if len(parts) > 1 else '')).upper()

    user = UserModel(
        full_name=data.fullName.strip(),
        email=data.email.strip().lower(),
        hashed_password=pwd_hash,
        phone=data.phone.strip() if data.phone else "",
        role=data.role if data.role in ["Citizen", "Municipal Officer"] else "Citizen",
        avatar=avatar
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = f"ct-token-{user.id}-{int(datetime.datetime.utcnow().timestamp())}"
    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": format_user_dict(user)
    }


@app.post("/api/v1/auth/signin")
def auth_signin(data: UserSignInSchema, db: Session = Depends(get_db)):
    pwd_hash = hashlib.sha256(data.password.encode()).hexdigest()
    user = db.query(UserModel).filter(UserModel.email.ilike(data.email.strip())).first()

    if not user or user.hashed_password != pwd_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password. Please check your credentials.")

    token = f"ct-token-{user.id}-{int(datetime.datetime.utcnow().timestamp())}"
    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": format_user_dict(user)
    }


@app.get("/api/v1/auth/me")
def auth_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token_parts = authorization.replace("Bearer ", "").split("-")
    if len(token_parts) < 3:
        raise HTTPException(status_code=401, detail="Invalid token format")

    try:
        user_id = int(token_parts[2])
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token user ID")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return format_user_dict(user)


@app.get("/api/v1/users")
def get_all_users(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """List all registered users for admin/officer user management."""
    users = db.query(UserModel).order_by(UserModel.id.asc()).all()
    return [format_user_dict(u) for u in users]


@app.delete("/api/v1/users/{user_id}")
def delete_user(user_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Delete a user or other admin account and all their posted complaints from the database."""
    current_user = get_user_from_token(authorization, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Enforce Admin / Officer permission
    if current_user.role not in ["Admin", "Municipal Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Only administrators and officers can manage and delete user accounts.")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own active session account.")

    # Delete complaints associated with this user
    db.query(ComplaintModel).filter(ComplaintModel.user_id == user_id).delete(synchronize_session=False)

    # Delete user
    db.delete(user)
    db.commit()

    return {"status": "success", "message": f"{user.role} account '{user.full_name}' (ID: {user_id}) and associated complaints deleted successfully from database."}


# ==========================================================================
# REST API ENDPOINTS
# ==========================================================================

@app.get("/api/v1/complaints")
def get_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    query = db.query(ComplaintModel)

    # Scope to current user if authenticated
    current_user = get_user_from_token(authorization, db)
    if current_user:
        query = query.filter(ComplaintModel.user_id == current_user.id)

    if status and status != "ALL":
        query = query.filter(ComplaintModel.status == status)
    if category:
        query = query.filter(ComplaintModel.category == category)
    if search:
        q = f"%{search.lower()}%"
        query = query.filter(
            (ComplaintModel.title.ilike(q)) |
            (ComplaintModel.id.ilike(q)) |
            (ComplaintModel.address.ilike(q))
        )

    complaints = query.order_by(ComplaintModel.created_at.desc()).all()
    return [format_complaint_dict(c) for c in complaints]


@app.get("/api/v1/complaints/{complaint_id}")
def get_complaint_by_id(complaint_id: str, db: Session = Depends(get_db)):
    c = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return format_complaint_dict(c)


@app.post("/api/v1/complaints")
def create_complaint(data: ComplaintCreateSchema, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    complaint_id = data.id or f"CT-2026-{random.randint(100000, 999999)}"
    now = datetime.datetime.utcnow()
    formatted_time = now.strftime("%Y-%m-%d %I:%M %p")

    sla_days = data.slaDays or (1 if data.severity == "CRITICAL" else 3 if data.severity == "HIGH" else 5)
    sla_due_date = now + datetime.timedelta(days=sla_days)

    # Associate with logged-in user if authenticated
    current_user = get_user_from_token(authorization, db)
    user_id = current_user.id if current_user else None
    reporter_name = current_user.full_name if current_user else "Citizen"

    complaint = ComplaintModel(
        id=complaint_id,
        category=data.category,
        category_icon=data.categoryIcon or "📋",
        title=data.title,
        description=data.description,
        address=data.location.address,
        latitude=data.location.latitude,
        longitude=data.location.longitude,
        zone=data.location.zone or "Zone 8 - Anna Nagar",
        severity=data.severity,
        priority_score=data.priorityScore or 85,
        status="SUBMITTED",
        created_at=now,
        assigned_department=data.assignedDepartment or "Road Maintenance & Engineering",
        sla_days=sla_days,
        sla_due_date=sla_due_date,
        image=data.image or "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
        ai_detection=f"{data.category} detected",
        ai_confidence=92,
        ai_severity=data.severity,
        ai_recommendation=f"High priority report for {data.category.lower()} at {data.location.address}.",
        citizen_verification_prompt_active=False,
        citizen_verification_status="PENDING",
        user_id=user_id
    )

    db.add(complaint)
    db.flush()

    # Create Initial Timelines
    t1 = TimelineEventModel(
        complaint_id=complaint.id,
        status="SUBMITTED",
        label="Complaint Submitted",
        time=formatted_time,
        icon="📝",
        updated_by=reporter_name
    )
    t2 = TimelineEventModel(
        complaint_id=complaint.id,
        status="AI_VERIFIED",
        label="AI Prototype Verified & Stored in Database",
        time=formatted_time,
        icon="✨",
        updated_by="CivicTrack AI Engine"
    )
    db.add(t1)
    db.add(t2)
    db.commit()

    return format_complaint_dict(complaint)


@app.patch("/api/v1/complaints/{complaint_id}/status")
def update_complaint_status(complaint_id: str, data: StatusUpdateSchema, db: Session = Depends(get_db)):
    c = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    c.status = data.status
    formatted_time = datetime.datetime.utcnow().strftime("%Y-%m-%d %I:%M %p")

    label = data.status
    icon = "🔄"

    if data.status == "RESOLVED":
        label = "Authority Marked Issue as Resolved"
        icon = "✅"
        c.citizen_verification_prompt_active = True
    elif data.status == "CITIZEN_VERIFIED":
        label = "Citizen Verified Solution"
        icon = "🤝"
        c.citizen_verification_prompt_active = False
        c.citizen_verification_status = "CONFIRMED"
        if data.notes: c.citizen_verification_notes = data.notes
    elif data.status == "REOPENED":
        label = "Citizen Verified Unresolved (Reopened)"
        icon = "⚠️"
        c.citizen_verification_prompt_active = False
        c.citizen_verification_status = "REJECTED"
        if data.notes: c.citizen_verification_notes = data.notes

    t_event = TimelineEventModel(
        complaint_id=c.id,
        status=data.status,
        label=label,
        time=formatted_time,
        icon=icon,
        updated_by=data.byUser or "System",
        notes=data.notes
    )
    db.add(t_event)

    # Add notification
    notif = NotificationModel(
        id=f"notif-{int(datetime.datetime.utcnow().timestamp()*1000)}",
        title=f"Complaint {c.id} Updated",
        message=f"Status changed to: {data.status.replace('_', ' ')}",
        notif_type="VERIFICATION" if data.status == "RESOLVED" else "STATUS",
        complaint_id=c.id,
        time="Just now",
        is_read=False
    )
    db.add(notif)
    db.commit()

    return format_complaint_dict(c)


@app.post("/api/v1/complaints/{complaint_id}/verify")
def verify_complaint(complaint_id: str, data: VerifyRequestSchema, db: Session = Depends(get_db)):
    target_status = "CITIZEN_VERIFIED" if data.isFixed else "REOPENED"
    return update_complaint_status(
        complaint_id,
        StatusUpdateSchema(status=target_status, byUser="Citizen (Verification)", notes=data.notes),
        db
    )


@app.get("/api/v1/stats/public")
def get_public_stats(db: Session = Depends(get_db)):
    complaints = db.query(ComplaintModel).all()
    total = len(complaints)
    resolved = sum(1 for c in complaints if c.status in ["RESOLVED", "CITIZEN_VERIFIED"])
    pending = sum(1 for c in complaints if c.status not in ["RESOLVED", "CITIZEN_VERIFIED"])
    high_priority = sum(1 for c in complaints if c.severity in ["HIGH", "CRITICAL"])
    rate = round((resolved / total * 100), 1) if total > 0 else 0.0

    categories = {}
    areas = {}

    for c in complaints:
        categories[c.category] = categories.get(c.category, 0) + 1
        zone = c.zone or "Central Zone"
        areas[zone] = areas.get(zone, 0) + 1

    return {
        "total": total,
        "resolved": resolved,
        "pending": pending,
        "highPriority": high_priority,
        "resolutionRate": rate,
        "categories": categories,
        "areas": areas
    }


@app.get("/api/v1/insights")
def get_insights(db: Session = Depends(get_db)):
    complaints = db.query(ComplaintModel).all()
    if not complaints:
        return {"topHotspot": "N/A", "mostCommonCategory": "N/A", "recommendationText": "No data available."}

    zone_counts = {}
    category_counts = {}
    for c in complaints:
        z = c.zone or "Central Zone"
        zone_counts[z] = zone_counts.get(z, 0) + 1
        category_counts[c.category] = category_counts.get(c.category, 0) + 1

    top_hotspot = max(zone_counts, key=zone_counts.get) if zone_counts else "Anna Nagar"
    most_common = max(category_counts, key=category_counts.get) if category_counts else "Pothole"

    return {
        "topHotspot": top_hotspot,
        "mostCommonCategory": most_common,
        "highRiskArea": "Central Junction & Anna Nagar 2nd Ave",
        "repeatedCount": zone_counts.get(top_hotspot, 4),
        "recommendationText": f"Priority recommendation: Deploy proactive inspection squad to {top_hotspot}. High density corridor identified in PostgreSQL analytics."
    }


@app.get("/api/v1/notifications")
def get_notifications(db: Session = Depends(get_db)):
    notifs = db.query(NotificationModel).order_by(NotificationModel.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.notif_type,
            "complaintId": n.complaint_id,
            "time": n.time,
            "read": n.is_read
        } for n in notifs
    ]


@app.post("/api/v1/demo/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    db.query(TimelineEventModel).delete()
    db.query(ComplaintModel).delete()
    db.query(NotificationModel).delete()
    db.commit()
    seed_db()
    return {"message": "PostgreSQL database reseeded with demo complaints successfully!"}


@app.get("/api/v1/departments")
def get_departments(db: Session = Depends(get_db)):
    from backend.models import DepartmentModel
    deps = db.query(DepartmentModel).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "headOfficer": d.head_officer,
            "contactEmail": d.contact_email,
            "contactPhone": d.contact_phone,
            "resolutionRate": d.resolution_rate
        } for d in deps
    ]


# ==========================================================================
# HEALTH CHECK & LIVE DASHBOARD ENDPOINTS
# ==========================================================================

@app.get("/api/v1/health")
def health_check():
    """Returns backend health status and active database type."""
    db_type = "sqlite"
    db_url = str(engine.url)
    if "postgresql" in db_url or "postgres" in db_url:
        db_type = "postgresql"
    return {
        "status": "ok",
        "db": db_type,
        "db_url_hint": db_url.split("@")[-1] if "@" in db_url else db_url,
        "version": "1.0.0"
    }


@app.delete("/api/v1/complaints/{complaint_id}")
def delete_complaint(
    complaint_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Delete a complaint owned by the current user."""
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    current_user = get_user_from_token(authorization, db)
    if current_user and complaint.user_id and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this complaint")

    db.delete(complaint)
    db.commit()
    return {"status": "success", "message": f"Complaint {complaint_id} deleted successfully"}


@app.get("/api/v1/dashboard/live")
def get_dashboard_live(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Combined live dashboard endpoint — stats + recent complaints in one call, scoped to authenticated user if present."""
    current_user = get_user_from_token(authorization, db)

    query = db.query(ComplaintModel)
    if current_user:
        query = query.filter(ComplaintModel.user_id == current_user.id)

    complaints = query.all()
    total = len(complaints)
    resolved = sum(1 for c in complaints if c.status in ["RESOLVED", "CITIZEN_VERIFIED"])
    pending = sum(1 for c in complaints if c.status not in ["RESOLVED", "CITIZEN_VERIFIED"])
    high_priority = sum(1 for c in complaints if c.severity in ["HIGH", "CRITICAL"])
    rate = round((resolved / total * 100), 1) if total > 0 else 0.0

    recent = query.order_by(ComplaintModel.created_at.desc()).limit(5).all()

    return {
        "stats": {
            "total": total,
            "resolved": resolved,
            "pending": pending,
            "highPriority": high_priority,
            "resolutionRate": rate
        },
        "recentComplaints": [
            {
                "id": c.id,
                "title": c.title,
                "category": c.category,
                "categoryIcon": c.category_icon or "📋",
                "status": c.status,
                "severity": c.severity,
                "address": c.address,
                "createdAt": c.created_at.isoformat() if c.created_at else None
            } for c in recent
        ]
    }


# Mount Static Frontend Files (serves index.html, css/, js/ directly from backend!)
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")

@app.get("/")
def serve_frontend_index():
    from fastapi.responses import FileResponse
    return FileResponse("index.html")

