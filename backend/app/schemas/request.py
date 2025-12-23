"""Request schemas."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class SymptomDetail(BaseModel):
    """Additional context for a symptom."""

    name: str = Field(..., min_length=1)
    duration: Optional[str] = Field(
        default=None,
        description="Free text or bucket such as hours/days/weeks/months",
        max_length=50,
    )
    severity: Optional[int] = Field(
        default=None,
        ge=0,
        le=10,
        description="User-perceived severity on a 0-10 scale",
    )


class PredictionRequest(BaseModel):
    """Symptoms payload."""

    symptoms: List[str] = Field(..., min_length=1, description="List of symptoms to evaluate")
    symptom_details: List[SymptomDetail] = Field(
        default_factory=list,
        description="Optional per-symptom duration and severity context",
    )

    @field_validator("symptoms", mode="before")
    @classmethod
    def _ensure_non_empty(cls, values: List[str]):
        if not values:
            raise ValueError("At least one symptom is required")
        cleaned = [value.strip() for value in values if value and value.strip()]
        if not cleaned:
            raise ValueError("All provided symptoms are empty")
        return cleaned
