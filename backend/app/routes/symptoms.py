"""Symptom metadata endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from backend.app.data.loader import get_symptom_vocabulary
from backend.app.schemas.response import SymptomsResponse

router = APIRouter(tags=["metadata"])


@router.get("/symptoms", response_model=SymptomsResponse)
def list_symptoms() -> SymptomsResponse:
    return SymptomsResponse(symptoms=get_symptom_vocabulary())
