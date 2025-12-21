"""Timeline and privacy schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class TimelineEntry(BaseModel):
    id: str
    symptoms: List[str]
    notes: Optional[str] = None
    occurred_at: datetime


class TimelineCreateRequest(BaseModel):
    symptoms: List[str] = Field(..., min_length=1)
    notes: Optional[str] = Field(default=None, max_length=2000)
    occurred_at: Optional[datetime] = None

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
