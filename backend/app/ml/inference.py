"""Model loading and inference helpers."""
from __future__ import annotations

import logging
import pickle
from functools import lru_cache
from typing import Dict, List, Sequence

import numpy as np
import pandas as pd

from backend.app.core.config import get_settings
from backend.app.data.loader import load_descriptions, load_precautions
from backend.app.ml.preprocess import clean_text, encode_symptoms, generate_severity_score

logger = logging.getLogger(__name__)


@lru_cache
def _load_pickle(path) -> object:
    with open(path, "rb") as file:
        return pickle.load(file)


@lru_cache
def get_diagnosis_bundle() -> Dict:
    settings = get_settings()
    bundle = _load_pickle(settings.diagnosis_model_path)
    required_keys = {"model", "symptom_to_index", "severity_map"}
    missing = required_keys - set(bundle.keys())
    if missing:
        raise RuntimeError(f"Diagnosis model bundle is missing keys: {missing}")
    return bundle


@lru_cache
def get_triage_model():
    settings = get_settings()
    return _load_pickle(settings.triage_model_path)


@lru_cache
def get_disease_metadata() -> Dict[str, Dict[str, List[str]]]:
    precautions = load_precautions()
    descriptions = load_descriptions()
    merged = precautions.merge(descriptions, on="Disease", how="left")
    metadata: Dict[str, Dict[str, List[str] | str]] = {}
    precaution_columns = [col for col in precautions.columns if col.lower().startswith("precaution")]

    for _, row in merged.iterrows():
        disease = str(row["Disease"]).strip()
        precaution_values = []
        for column in precaution_columns:
            value = row[column]
            if pd.notna(value):
                text = str(value).strip()
                if text and text.lower() != "nan":
                    precaution_values.append(text)
        description_value = row.get("Description", "")
        description = str(description_value).strip() if pd.notna(description_value) else ""
        metadata[disease] = {
            "description": description,
            "precautions": precaution_values,
        }
    return metadata


def predict_diseases(symptoms: Sequence[str], top_k: int = 3) -> List[Dict]:
    bundle = get_diagnosis_bundle()
    model = bundle["model"]
    symptom_to_index = bundle["symptom_to_index"]
    severity_map = bundle["severity_map"]

    vector = encode_symptoms(symptoms, symptom_to_index, severity_map).reshape(1, -1)
    if float(vector.sum()) == 0:
        raise ValueError("None of the provided symptoms could be mapped to the model vocabulary.")

    probabilities = model.predict_proba(vector)[0]
    classes = model.classes_
    severity_score = generate_severity_score(symptoms, severity_map)

    top_indices = np.argsort(probabilities)[::-1][:top_k]
    metadata = get_disease_metadata()
    triage_model = get_triage_model()

    results: List[Dict] = []
    for index in top_indices:
        disease = classes[index]
        probability = float(probabilities[index])
        disease_info = metadata.get(disease, {})
        precautions = disease_info.get("precautions", [])
        description = disease_info.get("description", "")
        triage_text = clean_text(" ".join([disease, description, " ".join(precautions)]))
        triage_level = triage_model.predict([triage_text])[0]

        results.append(
            {
                "disease": disease,
                "probability": probability,
                "severity_score": severity_score,
                "triage_level": triage_level,
                "precautions": precautions,
                "description": description,
            }
        )

    return results
