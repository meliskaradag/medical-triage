"""Model loading and inference helpers."""
from __future__ import annotations

import logging
import pickle
from functools import lru_cache
from typing import Dict, List, Mapping, Sequence

import numpy as np
import pandas as pd

from backend.app.core.config import get_settings
from backend.app.data.loader import load_descriptions, load_precautions
from backend.app.ml.preprocess import clean_text, encode_symptoms, generate_severity_score, normalize_symptom

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


_RED_FLAG_RULES = (
    ({"chest_pain", "shortness_of_breath"}, "Chest pain with shortness of breath needs emergency evaluation."),
    ({"loss_of_consciousness"}, "Loss of consciousness requires emergency care."),
    ({"confusion"}, "Sudden confusion is an emergency warning sign."),
    ({"severe_headache", "vision_blurring"}, "Sudden severe headache with vision changes can be an emergency."),
    ({"blood_in_sputum", "coughing"}, "Coughing up blood requires urgent assessment."),
    ({"stiff_neck", "fever"}, "Fever with stiff neck may indicate an emergency."),
)


def detect_red_flags(symptoms: Sequence[str]) -> List[str]:
    normalized = {
        value for symptom in symptoms if (value := normalize_symptom(symptom))
    }
    flags: List[str] = []
    for required, message in _RED_FLAG_RULES:
        if required.issubset(normalized):
            flags.append(message)
    return flags


_FOLLOW_UP_BANK = {
    "chest_pain": [
        "Does the pain worsen with exertion?",
        "Does the pain radiate to arm, jaw, or back?",
        "How long has the pain been present?",
    ],
    "shortness_of_breath": [
        "Do you feel breathless at rest?",
        "Do you wake up at night short of breath?",
    ],
    "fever": [
        "Is the fever above 38°C?",
        "Are there chills or night sweats?",
    ],
    "abdominal_pain": [
        "Has the location of the pain changed?",
        "Is there nausea or vomiting?",
        "Does passing gas or stool relieve the pain?",
    ],
    "headache": [
        "Is this the sudden worst headache of your life?",
        "Is there sensitivity to light or sound?",
    ],
    "vomiting": [
        "Is there blood or coffee-ground material in vomit?",
        "Is severe dizziness present with vomiting?",
    ],
}


def suggest_follow_up_questions(symptoms: Sequence[str], limit: int = 5) -> List[str]:
    questions: List[str] = []
    for symptom in symptoms:
        key = normalize_symptom(symptom)
        if key in _FOLLOW_UP_BANK:
            questions.extend(_FOLLOW_UP_BANK[key])
    # deduplicate while preserving order
    seen = set()
    deduped = []
    for question in questions:
        if question not in seen:
            seen.add(question)
            deduped.append(question)
    return deduped[:limit]


def predict_diseases(
    symptoms: Sequence[str],
    top_k: int = 3,
    severity_overrides: Mapping[str, float] | None = None,
) -> List[Dict]:
    bundle = get_diagnosis_bundle()
    model = bundle["model"]
    symptom_to_index = bundle["symptom_to_index"]
    severity_map = bundle["severity_map"]

    vector = encode_symptoms(symptoms, symptom_to_index, severity_map, severity_overrides).reshape(1, -1)
    if float(vector.sum()) == 0:
        raise ValueError("None of the provided symptoms could be mapped to the model vocabulary.")

    probabilities = model.predict_proba(vector)[0]
    classes = model.classes_
    severity_score = generate_severity_score(symptoms, severity_map, severity_overrides)

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
