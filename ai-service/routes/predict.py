from fastapi import APIRouter, HTTPException, Depends
from models.schemas import PredictRequest, PredictResponse
from services.classifier import AIClassifierService

router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
def predict_issue(request: PredictRequest):
    """
    AI Prediction & Classification Endpoint:
    Analyzes issue image reference or text description to return category, confidence score, and severity.
    """
    try:
        return AIClassifierService.classify_issue(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI prediction processing error: {str(e)}")
