"""Application configuration module."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Medical Triage Service"
    cors_origins: List[str] = Field(default_factory=lambda: ["*"])
    base_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[3])

    data_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[3] / "data")
    models_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[1] / "models")
    diagnosis_model_path: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[1] / "models" / "diagnosis_model.pkl"
    )
    triage_model_path: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[1] / "models" / "triage_model.pkl"
    )
    timeline_log_path: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[1] / "data" / "timeline_log.json"
    )
    user_store_path: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[1] / "data" / "users.json"
    )

    @property
    def dataset_path(self) -> Path:
        return self.data_dir / "dataset.csv"

    @property
    def severity_path(self) -> Path:
        return self.data_dir / "Symptom-severity.csv"

    @property
    def description_path(self) -> Path:
        return self.data_dir / "symptom_Description.csv"

    @property
    def precaution_path(self) -> Path:
        return self.data_dir / "symptom_precaution.csv"


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
