"""Response schemas."""
from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class DiseasePrediction(BaseModel):
    disease: str
    probability: float = Field(ge=0.0, le=1.0)
    severity_score: float = Field(ge=0.0)
    triage_level: str
    precautions: List[str]
    description: str | None = None


class PredictionResponse(BaseModel):
    results: List[DiseasePrediction]


class SymptomsResponse(BaseModel):
    symptoms: List[str]
