from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class TimelineEventBase(BaseModel):
    status: str
    label: str
    time: str
    icon: Optional[str] = "✓"
    by: Optional[str] = "System"
    notes: Optional[str] = None

    class Config:
        orm_mode = True

class CitizenVerificationSchema(BaseModel):
    promptActive: bool = False
    status: str = "PENDING"
    notes: Optional[str] = None

class AIAnalysisSchema(BaseModel):
    detection: Optional[str] = None
    confidence: Optional[int] = 90
    severity: Optional[str] = "HIGH"
    recommendation: Optional[str] = None

class LocationSchema(BaseModel):
    address: str
    latitude: float
    longitude: float
    zone: Optional[str] = "Central Zone"

class ComplaintCreateSchema(BaseModel):
    id: Optional[str] = None
    category: str
    categoryIcon: Optional[str] = "📋"
    title: str
    description: str
    location: LocationSchema
    severity: str = "HIGH"
    priorityScore: Optional[int] = 70
    status: str = "SUBMITTED"
    assignedDepartment: Optional[str] = "Road Maintenance & Engineering"
    slaDays: Optional[int] = 3
    image: Optional[str] = None

class StatusUpdateSchema(BaseModel):
    status: str
    byUser: Optional[str] = "System"
    notes: Optional[str] = None

class VerifyRequestSchema(BaseModel):
    isFixed: bool
    notes: Optional[str] = None


class UserSignUpSchema(BaseModel):
    fullName: str
    email: str
    password: str
    phone: Optional[str] = None
    role: Optional[str] = "Citizen"


class UserSignInSchema(BaseModel):
    email: str
    password: str


class UserResponseSchema(BaseModel):
    id: int
    fullName: str
    email: str
    phone: Optional[str] = None
    role: str
    avatar: Optional[str] = None

    class Config:
        orm_mode = True


class AuthResponseSchema(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserResponseSchema

