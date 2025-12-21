"""Privacy and data management endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.data import timeline_store
from backend.app.schemas.timeline import PrivacySummary

router = APIRouter(prefix="/privacy", tags=["privacy"])


@router.get("/summary", response_model=PrivacySummary)
def get_privacy_summary() -> PrivacySummary:
    last_entry = timeline_store.last_entry_timestamp()
    return PrivacySummary(
        timeline_entries=timeline_store.entry_count(),
        stored_categories=["symptom_timeline"] if timeline_store.entry_count() else [],
        has_data=timeline_store.has_data(),
        last_entry_at=last_entry,
    )


@router.delete("/timeline", status_code=204)
def purge_timeline() -> None:
    if not timeline_store.has_data():
        raise HTTPException(status_code=404, detail="No timeline data to delete")
    timeline_store.clear_entries()
