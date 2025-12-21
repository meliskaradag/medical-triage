"""Request schemas."""
from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field, field_validator


class PredictionRequest(BaseModel):
    """Symptoms payload."""

    symptoms: List[str] = Field(..., min_length=1, description="List of symptoms to evaluate")

    @field_validator("symptoms", mode="before")
    @classmethod
    def _ensure_non_empty(cls, values: List[str]):
        if not values:
            raise ValueError("At least one symptom is required")
        cleaned = [value.strip() for value in values if value and value.strip()]
        if not cleaned:
            raise ValueError("All provided symptoms are empty")
        return cleaned
