"""Preprocessing utilities shared across training and inference."""
from __future__ import annotations

import re
from typing import Iterable, Mapping, Sequence

import numpy as np
import pandas as pd

_SYMPTOM_SANITIZER = re.compile(r"[^a-z0-9_\s]")
_TEXT_SANITIZER = re.compile(r"[^a-z0-9\s]")
_WHITESPACE = re.compile(r"\s+")

_HIGH_KEYWORDS = ("emergency", "immediate", "immediately", "hospital", "urgent", "emergently")
_MEDIUM_KEYWORDS = ("consult", "doctor", "physician", "medical", "clinic")


def normalize_symptom(symptom: str) -> str:
    """Return a lowercase underscore-delimited symptom identifier."""
    if not symptom or symptom.strip().lower() in {"nan", "none"}:
        return ""
    value = symptom.strip().lower().replace("-", "_")
    value = _SYMPTOM_SANITIZER.sub(" ", value)
    value = _WHITESPACE.sub("_", value)
    return value.strip("_")


def clean_text(text: str) -> str:
    """Normalize free text for NLP modeling."""
    if not text:
        return ""
    sanitized = text.lower()
    sanitized = _TEXT_SANITIZER.sub(" ", sanitized)
    return _WHITESPACE.sub(" ", sanitized).strip()


def encode_symptoms(
    symptom_list: Sequence[str],
    symptom_to_index: Mapping[str, int],
    severity_map: Mapping[str, float],
) -> np.ndarray:
    """Convert a symptom list into a weighted vector representation."""
    vector = np.zeros(len(symptom_to_index), dtype=float)
    unique_symptoms = set()
    for raw_symptom in symptom_list:
        normalized = normalize_symptom(raw_symptom)
        if normalized:
            unique_symptoms.add(normalized)
    for symptom in unique_symptoms:
        index = symptom_to_index.get(symptom)
        if index is None:
            continue
        vector[index] = severity_map.get(symptom, 1.0)
    return vector


def generate_severity_score(symptom_list: Sequence[str], severity_map: Mapping[str, float]) -> float:
    """Aggregate severity weights for the provided symptoms."""
    unique_symptoms = set()
    for raw_symptom in symptom_list:
        normalized = normalize_symptom(raw_symptom)
        if normalized:
            unique_symptoms.add(normalized)
    return float(sum(severity_map.get(symptom, 1.0) for symptom in unique_symptoms))


def create_triage_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Attach heuristic triage labels based on precaution keywords."""
    precaution_columns = [col for col in df.columns if col.lower().startswith("precaution")]
    labeled_df = df.copy()

    def _label_row(row: pd.Series) -> str:
        joined = " ".join(
            str(row[column]) for column in precaution_columns if pd.notna(row[column]) and str(row[column]).strip()
        ).lower()
        if any(keyword in joined for keyword in _HIGH_KEYWORDS):
            return "High"
        if any(keyword in joined for keyword in _MEDIUM_KEYWORDS):
            return "Medium"
        return "Low"

    labeled_df["triage_level"] = labeled_df.apply(_label_row, axis=1)
    return labeled_df
