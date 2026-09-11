import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class DepartmentModel(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)
    head_officer = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String, nullable=False)
    active_complaints_count = Column(Integer, default=0)
    resolution_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ComplaintModel(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True) # e.g. CT-2026-001284
    category = Column(String, index=True, nullable=False)
    category_icon = Column(String, default="📋")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    
    # Location fields
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    zone = Column(String, default="Central Zone")

    # Priority & Status
    severity = Column(String, default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    priority_score = Column(Integer, default=70) # 0-100
    status = Column(String, default="SUBMITTED", index=True) # SUBMITTED, AI_VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, CITIZEN_VERIFIED, REOPENED
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    assigned_department = Column(String, default="Road Maintenance & Engineering")
    sla_days = Column(Integer, default=3)
    sla_due_date = Column(DateTime)
    image = Column(Text, nullable=True)

    # AI Prototype Analysis Output
    ai_detection = Column(String, nullable=True)
    ai_confidence = Column(Integer, default=90)
    ai_severity = Column(String, default="HIGH")
    ai_recommendation = Column(Text, nullable=True)

    # Citizen Verification Loop
    citizen_verification_prompt_active = Column(Boolean, default=False)
    citizen_verification_status = Column(String, default="PENDING") # PENDING, CONFIRMED, REJECTED
    citizen_verification_notes = Column(Text, nullable=True)

    # Owner user (nullable for seeded/legacy data)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Relationships
    user = relationship("UserModel", backref="complaints")
    timeline_events = relationship("TimelineEventModel", back_populates="complaint", cascade="all, delete-orphan")


class TimelineEventModel(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    status = Column(String, nullable=False)
    label = Column(String, nullable=False)
    time = Column(String, nullable=False)
    icon = Column(String, default="✓")
    updated_by = Column(String, default="System")
    notes = Column(Text, nullable=True)

    complaint = relationship("ComplaintModel", back_populates="timeline_events")


class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notif_type = Column(String, default="STATUS") # VERIFICATION, ESCALATION, STATUS
    complaint_id = Column(String, nullable=True)
    time = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class UserSettingsModel(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, default=1)
    language = Column(String, default="en")
    theme = Column(String, default="dark")
    gps_permission = Column(String, default="prompt")
    user_name = Column(String, default="Karthik Raja")
    user_email = Column(String, default="karthik.citizen@civictrack.ai")
    user_phone = Column(String, default="+91 98765 43210")


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, default="Citizen") # Citizen or Municipal Officer
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

