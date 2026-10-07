from fastapi import APIRouter, HTTPException
from models.schemas import DuplicateCheckRequest, DuplicateCheckResponse
from services.duplicate_detector import DuplicateDetectorService

router = APIRouter()

@router.post("/duplicate-check", response_model=DuplicateCheckResponse)
def check_duplicate_issue(request: DuplicateCheckRequest):
    """
    Duplicate Detection Endpoint:
    Compares location coordinates, category, and text description with existing issues to flag potential duplicates.
    """
    try:
        return DuplicateDetectorService.check_duplicate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Duplicate detection error: {str(e)}")
