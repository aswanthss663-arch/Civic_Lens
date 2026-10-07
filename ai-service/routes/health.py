from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    """Returns AI Service status and version information."""
    return {
        "status": "ok",
        "service": "Civic Lens Python FastAPI AI Service",
        "version": "1.0.0",
        "capabilities": [
            "Automatic issue categorization",
            "Duplicate issue detection",
            "Severity & priority calculation"
        ]
    }
