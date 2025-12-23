"""Timeline and privacy schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, Field, field_validator


class TimelineEntry(BaseModel):
    id: str
    symptoms: List[str]
    notes: Optional[str] = None
    occurred_at: datetime
    top_prediction: Optional[str] = None
    triage_level: Optional[str] = None
    severity_score: Optional[float] = None
    symptom_severity: Optional[dict[str, float]] = None
    user_id: Optional[str] = None
    entry_type: Literal["case", "tracker"] = "case"


class TimelineCreateRequest(BaseModel):
    symptoms: List[str] = Field(..., min_length=1)
    notes: Optional[str] = Field(default=None, max_length=2000)
    occurred_at: Optional[datetime] = None
    top_prediction: Optional[str] = Field(default=None, max_length=200)
    triage_level: Optional[str] = Field(default=None, max_length=50)
    severity_score: Optional[float] = Field(default=None, ge=0.0)
    symptom_severity: Optional[dict[str, float]] = None
    entry_type: Literal["case", "tracker"] = "case"

    @field_validator("symptoms")
    @classmethod
    def _normalize_symptoms(cls, values: List[str]) -> List[str]:
        cleaned = [value.strip() for value in values if value and value.strip()]
        if not cleaned:
            raise ValueError("At least one symptom must be provided")
        return cleaned


class PrivacySummary(BaseModel):
    timeline_entries: int
    stored_categories: List[str]
    has_data: bool
    last_entry_at: Optional[datetime] = None
