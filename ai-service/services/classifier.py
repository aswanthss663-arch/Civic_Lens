import math
from typing import Dict, Any, List, Optional
from models.schemas import PredictRequest, PredictResponse

# AI Classifier Knowledge Base & Heuristic Analysis Engine
# Note: Designed so deep learning / OpenCV / ResNet / YOLO vision models can be plugged in easily.

AI_CATEGORY_MAP = {
    'pothole': {
        'category': 'Road Damage',
        'confidence': 0.94,
        'severity': 'HIGH',
        'recommendation': 'Cold-mix asphalt patch required. Inspect sub-base for water seepage.',
        'detected_objects': ['pothole', 'asphalt crack', 'road surface defect']
    },
    'road damage': {
        'category': 'Road Damage',
        'confidence': 0.92,
        'severity': 'HIGH',
        'recommendation': 'Sub-grade compaction & wet mix asphalt resurfacing required.',
        'detected_objects': ['trench collapse', 'road depression']
    },
    'garbage': {
        'category': 'Garbage / Waste',
        'confidence': 0.96,
        'severity': 'HIGH',
        'recommendation': 'Deploy heavy compactor truck unit immediately and sanitize area.',
        'detected_objects': ['overflowing waste bin', 'litter pile', 'plastic waste']
    },
    'waste': {
        'category': 'Garbage / Waste',
        'confidence': 0.95,
        'severity': 'HIGH',
        'recommendation': 'Deploy municipal sanitation squad for immediate clearance.',
        'detected_objects': ['solid waste', 'dumped debris']
    },
    'water leakage': {
        'category': 'Water Leakage',
        'confidence': 0.93,
        'severity': 'HIGH',
        'recommendation': 'Isolate main supply valve and repair damaged pipeline joint.',
        'detected_objects': ['water gush', 'burst pipe', 'flooded pavement']
    },
    'drainage': {
        'category': 'Drainage Problem',
        'confidence': 0.97,
        'severity': 'CRITICAL',
        'recommendation': 'Dispatch suction tanker & high-pressure water jetting machine.',
        'detected_objects': ['blocked gully inlet', 'sewage overflow', 'standing water']
    },
    'streetlight': {
        'category': 'Streetlight Problem',
        'confidence': 0.91,
        'severity': 'MEDIUM',
        'recommendation': 'Replace LED driver module and inspect overhead wiring relay.',
        'detected_objects': ['unlit luminaire', 'leaning pole', 'exposed wire']
    },
    'illegal dumping': {
        'category': 'Illegal Dumping',
        'confidence': 0.89,
        'severity': 'HIGH',
        'recommendation': 'Clear illegal dump site and post municipal warning notice.',
        'detected_objects': ['construction debris', 'commercial waste']
    },
    'public infrastructure': {
        'category': 'Public Infrastructure Damage',
        'confidence': 0.90,
        'severity': 'MEDIUM',
        'recommendation': 'Inspect structural integrity and repair damaged public fixture.',
        'detected_objects': ['broken handrail', 'damaged bench', 'cracked footway']
    }
}

class AIClassifierService:
    @staticmethod
    def classify_issue(request: PredictRequest) -> PredictResponse:
        """
        Baseline AI Classification Algorithm:
        1. Analyzes category, title, and description text heuristics.
        2. Calculates confidence score (0.80 - 0.98).
        3. Determines priority score (15 - 99) based on severity base + keyword weights.
        """
        text_content = f"{request.category or ''} {request.title or ''} {request.description or ''}".lower()

        matched_key = None
        for key in AI_CATEGORY_MAP.keys():
            if key in text_content:
                matched_key = key
                break

        if matched_key:
            info = AI_CATEGORY_MAP[matched_key]
            category = info['category']
            confidence = info['confidence']
            severity = info['severity']
            recommendation = info['recommendation']
            detected_objects = info['detected_objects']
        else:
            category = request.category or "Public Infrastructure Damage"
            confidence = 0.88
            severity = "HIGH" if "urgent" in text_content or "danger" in text_content else "MEDIUM"
            recommendation = f"Zonal municipal officer inspection required for {category.lower()}."
            detected_objects = ["civic anomaly"]

        # Calculate Priority Score (0-100)
        base = 85 if severity == "CRITICAL" else 70 if severity == "HIGH" else 50
        keyword_bonus = 10 if "danger" in text_content or "overflow" in text_content or "blocking" in text_content else 0
        priority_score = min(base + keyword_bonus + int(confidence * 10), 99)

        return PredictResponse(
            category=category,
            confidence=confidence,
            severity=severity,
            recommendation=recommendation,
            priority_score=priority_score,
            detected_objects=detected_objects
        )
