"""Timeline management endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.auth import get_current_user
from backend.app.data import timeline_store
from backend.app.schemas.timeline import TimelineCreateRequest, TimelineEntry

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("", response_model=list[TimelineEntry])
def list_timeline_entries(current_user=Depends(get_current_user)) -> list[TimelineEntry]:
    entries = timeline_store.list_entries(current_user["id"])
    return [TimelineEntry(**entry) for entry in entries]


@router.post("", response_model=TimelineEntry, status_code=201)
def create_timeline_entry(request: TimelineCreateRequest, current_user=Depends(get_current_user)) -> TimelineEntry:
    occurred_at = request.occurred_at or datetime.now(timezone.utc)
    entry = {
        "id": str(uuid.uuid4()),
        "symptoms": request.symptoms,
        "notes": request.notes,
        "occurred_at": occurred_at.isoformat(),
        "user_id": current_user["id"],
        "entry_type": request.entry_type or "case",
    }
    if request.top_prediction:
        entry["top_prediction"] = request.top_prediction
    if request.triage_level:
        entry["triage_level"] = request.triage_level
    if request.severity_score is not None:
        entry["severity_score"] = request.severity_score
    if request.symptom_severity is not None:
        entry["symptom_severity"] = request.symptom_severity
    timeline_store.add_entry(entry, current_user["id"])
    return TimelineEntry(**entry)


@router.delete("/{entry_id}", status_code=200)
def delete_timeline_entry(entry_id: str, current_user=Depends(get_current_user)) -> dict:
    deleted = timeline_store.delete_entry(entry_id, current_user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Timeline entry not found")
    return {"detail": "Entry removed"}
