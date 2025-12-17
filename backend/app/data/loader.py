"""Utilities for loading application datasets."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

import pandas as pd

from backend.app.core.config import get_settings
from backend.app.ml.preprocess import normalize_symptom


def _read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Required data file not found: {path}")
    return pd.read_csv(path)


@lru_cache
def load_dataset() -> pd.DataFrame:
    """Load the disease-symptom dataset."""
    settings = get_settings()
    return _read_csv(settings.dataset_path)


@lru_cache
def load_symptom_severity() -> pd.DataFrame:
    """Load the symptom severity weights."""
    settings = get_settings()
    df = _read_csv(settings.severity_path)
    df.columns = [col.strip() for col in df.columns]
    return df


@lru_cache
def load_precautions() -> pd.DataFrame:
    """Load disease precaution recommendations."""
    settings = get_settings()
    return _read_csv(settings.precaution_path)


@lru_cache
def load_descriptions() -> pd.DataFrame:
    """Load disease descriptions."""
    settings = get_settings()
    return _read_csv(settings.description_path)


@lru_cache
def get_symptom_vocabulary() -> List[str]:
    """Return a sorted list of normalized symptoms available in the dataset."""
    dataset = load_dataset()
    symptom_columns = [col for col in dataset.columns if col.lower().startswith("symptom")]
    symptoms: set[str] = set()
    for column in symptom_columns:
        symptoms.update(
            normalize_symptom(str(symptom))
            for symptom in dataset[column].dropna().astype(str)
            if symptom.strip()
        )
    return sorted(symptoms)
