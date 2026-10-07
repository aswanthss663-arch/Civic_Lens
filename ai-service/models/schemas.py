from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PredictRequest(BaseModel):
    category: Optional[str] = Field(None, description="Report category if selected by user")
    title: Optional[str] = Field(None, description="Issue title")
    description: Optional[str] = Field(None, description="User issue description text")
    image_url: Optional[str] = Field(None, description="URL or base64 encoded image string")
    latitude: Optional[float] = Field(None, description="Latitude coordinates")
    longitude: Optional[float] = Field(None, description="Longitude coordinates")

class PredictResponse(BaseModel):
    category: str
    confidence: float
    severity: str
    recommendation: str
    priority_score: int
    detected_objects: List[str] = []

class IssueLocation(BaseModel):
    latitude: float
    longitude: float

class ExistingIssueItem(BaseModel):
    id: str
    category: str
    title: Optional[str] = ""
    description: Optional[str] = ""
    latitude: float
    longitude: float
    image_url: Optional[str] = None

class DuplicateCheckRequest(BaseModel):
    category: str
    latitude: float
    longitude: float
    title: Optional[str] = ""
    description: Optional[str] = ""
    existing_issues: List[ExistingIssueItem] = []
    max_distance_meters: Optional[float] = 500.0

class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    similar_issue_id: Optional[str] = None
    similarity_score: float
    distance_meters: Optional[float] = None
    message: str
