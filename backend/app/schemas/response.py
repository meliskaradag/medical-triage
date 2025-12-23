"""Response schemas."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class DiseasePrediction(BaseModel):
    disease: str
    probability: float = Field(ge=0.0, le=1.0)
    severity_score: float = Field(ge=0.0)
    triage_level: str
    precautions: List[str]
    description: Optional[str] = None


class PredictionResponse(BaseModel):
    results: List[DiseasePrediction]
    normalized_symptoms: List[str] = Field(default_factory=list)
    unmapped_symptoms: List[str] = Field(default_factory=list)
    red_flags: List[str] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)


class SymptomsResponse(BaseModel):
    symptoms: List[str]
