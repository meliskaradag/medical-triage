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
    if not normalized:
        raise HTTPException(status_code=400, detail="No valid symptoms were provided.")

    try:
        results = inference.predict_diseases(normalized)
    except ValueError as exc:  # input validation errors during encoding
        logger.warning("Prediction rejected: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # unexpected failure
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed.") from exc

    return PredictionResponse(results=results)
