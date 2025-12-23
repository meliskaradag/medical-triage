"""Privacy and data management endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.auth import get_current_user
from backend.app.data import timeline_store
from backend.app.schemas.timeline import PrivacySummary

router = APIRouter(prefix="/privacy", tags=["privacy"])


@router.get("/summary", response_model=PrivacySummary)
def get_privacy_summary(current_user=Depends(get_current_user)) -> PrivacySummary:
    last_entry = timeline_store.last_entry_timestamp(current_user["id"])
    return PrivacySummary(
        timeline_entries=timeline_store.entry_count(current_user["id"]),
        stored_categories=["symptom_timeline"] if timeline_store.entry_count(current_user["id"]) else [],
        has_data=timeline_store.has_data(current_user["id"]),
        last_entry_at=last_entry,
    )


@router.delete("/timeline", status_code=200)
def purge_timeline(current_user=Depends(get_current_user)) -> dict:
    if not timeline_store.has_data(current_user["id"]):
        raise HTTPException(status_code=404, detail="No timeline data to delete")
    timeline_store.clear_entries(current_user["id"])
    return {"detail": "Timeline cleared"}
