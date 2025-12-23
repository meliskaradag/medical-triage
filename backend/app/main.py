"""FastAPI application entrypoint."""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import get_settings
from backend.app.ml import inference
from backend.app.routes import auth, healthcheck, predict, privacy, symptoms, timeline

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(healthcheck.router)
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(symptoms.router)
app.include_router(timeline.router)
app.include_router(privacy.router)


@app.on_event("startup")
async def _warm_models() -> None:
    try:
        inference.get_diagnosis_bundle()
        inference.get_triage_model()
        logger.info("Models loaded successfully during startup.")
    except FileNotFoundError as exc:
        logger.error("Model file missing: %s", exc)
    except Exception as exc:
        logger.exception("Model warm-up failed: %s", exc)
