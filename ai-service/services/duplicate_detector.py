import math
from typing import List, Optional, Tuple
from models.schemas import DuplicateCheckRequest, DuplicateCheckResponse, ExistingIssueItem

class DuplicateDetectorService:
    @staticmethod
    def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate geographic distance between two coordinates in meters using Haversine formula.
        """
        R = 6371000.0 # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(delta_lambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

        return R * c

    @staticmethod
    def calculate_text_similarity(str1: str, str2: str) -> float:
        """Simple Jaccard text similarity between two strings."""
        if not str1 or not str2:
            return 0.0
        words1 = set(str1.lower().split())
        words2 = set(str2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        return len(intersection) / len(union)

    @classmethod
    def check_duplicate(cls, request: DuplicateCheckRequest) -> DuplicateCheckResponse:
        """
        Duplicate Detection Logic:
        Combines Geographic Distance + Category Match + Text Similarity.
        Thresholds: DUPLICATE_DISTANCE_METERS = 500m (or custom max), DUPLICATE_THRESHOLD = 0.80.
        """
        if not request.existing_issues:
            return DuplicateCheckResponse(
                is_duplicate=False,
                similarity_score=0.0,
                message="No nearby existing issues found for comparison."
            )

        max_allowed_distance = request.max_distance_meters or 500.0
        best_match: Optional[ExistingIssueItem] = None
        highest_score = 0.0
        min_distance = float('inf')

        for issue in request.existing_issues:
            dist = cls.calculate_haversine_distance(
                request.latitude, request.longitude,
                issue.latitude, issue.longitude
            )

            # Skip if outside maximum radius
            if dist > max_allowed_distance:
                continue

            # Category similarity (1.0 if match, 0.3 if different)
            category_score = 1.0 if issue.category.strip().lower() == request.category.strip().lower() else 0.3

            # Distance weight (1.0 at 0m, decaying to 0.0 at max_allowed_distance)
            distance_score = max(0.0, 1.0 - (dist / max_allowed_distance))

            # Text similarity
            new_text = f"{request.title or ''} {request.description or ''}"
            existing_text = f"{issue.title or ''} {issue.description or ''}"
            text_score = cls.calculate_text_similarity(new_text, existing_text)

            # Composite Similarity Score Calculation
            composite_score = (category_score * 0.50) + (distance_score * 0.35) + (text_score * 0.15)

            if composite_score > highest_score:
                highest_score = composite_score
                best_match = issue
                min_distance = dist

        # Threshold check (0.75 composite threshold)
        is_duplicate = highest_score >= 0.75 and best_match is not None

        if is_duplicate and best_match:
            msg = f"Potential duplicate detected ({int(highest_score * 100)}% similarity) within {int(min_distance)}m of issue #{best_match.id}."
            return DuplicateCheckResponse(
                is_duplicate=True,
                similar_issue_id=best_match.id,
                similarity_score=round(highest_score, 2),
                distance_meters=round(min_distance, 1),
                message=msg
            )

        return DuplicateCheckResponse(
            is_duplicate=False,
            similarity_score=round(highest_score, 2) if best_match else 0.0,
            distance_meters=round(min_distance, 1) if best_match else None,
            message="No duplicate issues identified."
        )
