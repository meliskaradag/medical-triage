"""Prediction endpoints."""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException

from backend.app.ml import inference
from backend.app.ml.preprocess import normalize_symptom
from backend.app.schemas.request import PredictionRequest
from backend.app.schemas.response import PredictionResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    normalized: List[str] = [normalize_symptom(symptom) for symptom in request.symptoms]
    normalized = [symptom for symptom in normalized if symptom]
    normalized = list(dict.fromkeys(normalized))  # preserve order but drop duplicates
    if not normalized:
        raise HTTPException(status_code=400, detail="No valid symptoms were provided.")

    bundle = inference.get_diagnosis_bundle()
    vocab = set(bundle["symptom_to_index"])
    unmapped_symptoms = [symptom for symptom in normalized if symptom not in vocab]

    severity_overrides = {}
    if request.symptom_details:
        for detail in request.symptom_details:
            normalized_name = normalize_symptom(detail.name)
            if normalized_name and detail.severity is not None:
                severity_overrides[normalized_name] = float(detail.severity)

    try:
        results = inference.predict_diseases(normalized, severity_overrides=severity_overrides)
    except ValueError as exc:  # input validation errors during encoding
        logger.warning("Prediction rejected: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # unexpected failure
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed.") from exc

    red_flags = inference.detect_red_flags(normalized)
    follow_up = inference.suggest_follow_up_questions(normalized)

    return PredictionResponse(
        results=results,
        normalized_symptoms=normalized,
        unmapped_symptoms=unmapped_symptoms,
        red_flags=red_flags,
        follow_up_questions=follow_up,
    )
