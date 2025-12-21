"""Timeline management endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from backend.app.data import timeline_store
from backend.app.schemas.timeline import TimelineCreateRequest, TimelineEntry

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("", response_model=list[TimelineEntry])
def list_timeline_entries() -> list[TimelineEntry]:
    entries = timeline_store.list_entries()
    return [TimelineEntry(**entry) for entry in entries]


@router.post("", response_model=TimelineEntry, status_code=201)
def create_timeline_entry(request: TimelineCreateRequest) -> TimelineEntry:
    occurred_at = request.occurred_at or datetime.now(timezone.utc)
    entry = {
        "id": str(uuid.uuid4()),
        "symptoms": request.symptoms,
        "notes": request.notes,
        "occurred_at": occurred_at.isoformat(),
    }
    timeline_store.add_entry(entry)
    return TimelineEntry(**entry)


@router.delete("/{entry_id}", status_code=204)
def delete_timeline_entry(entry_id: str) -> None:
    deleted = timeline_store.delete_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Timeline entry not found")
