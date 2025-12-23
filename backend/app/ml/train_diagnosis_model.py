"""Training script for the disease prediction model."""
from __future__ import annotations

import logging
import pickle
import sys
from pathlib import Path
from typing import Dict, List

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from backend.app.core.config import get_settings
from backend.app.data.loader import load_dataset, load_symptom_severity
from backend.app.ml.preprocess import encode_symptoms, normalize_symptom


def _build_symptom_index(dataset) -> Dict[str, int]:
    symptom_columns = [col for col in dataset.columns if col.lower().startswith("symptom")]
    vocabulary: set[str] = set()
    for column in symptom_columns:
        column_values = dataset[column].dropna().astype(str)
        for value in column_values:
            normalized = normalize_symptom(value)
            if normalized:
                vocabulary.add(normalized)
    return {symptom: idx for idx, symptom in enumerate(sorted(vocabulary))}


def _extract_samples(dataset, symptom_to_index, severity_map) -> tuple[np.ndarray, List[str]]:
    symptom_columns = [col for col in dataset.columns if col.lower().startswith("symptom")]
    features: List[np.ndarray] = []
    labels: List[str] = []

    for _, row in dataset.iterrows():
        raw_symptoms = [str(row[column]) for column in symptom_columns if str(row[column]).strip() and str(row[column]).lower() != "nan"]
        vector = encode_symptoms(raw_symptoms, symptom_to_index, severity_map)
        if vector.sum() == 0:
            continue
        features.append(vector)
        labels.append(str(row["Disease"]).strip())
    if not features:
        raise RuntimeError("Failed to build any training samples from the dataset.")
    return np.vstack(features), labels


def _dedupe_samples(X: np.ndarray, y: List[str]) -> tuple[np.ndarray, np.ndarray]:
    """Drop exact duplicate feature/label pairs to reduce leakage in the holdout split."""
    keep_vectors: List[np.ndarray] = []
    keep_labels: List[str] = []
    seen: set[tuple[bytes, str]] = set()

    for vector, label in zip(X, y):
        key = (vector.tobytes(), label)
        if key in seen:
            continue
        seen.add(key)
        keep_vectors.append(vector)
        keep_labels.append(label)

    return np.vstack(keep_vectors), np.array(keep_labels)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    settings = get_settings()

    dataset = load_dataset()
    severity_df = load_symptom_severity()
    severity_map = {
        normalize_symptom(str(row["Symptom"])): float(row["weight"])
        for _, row in severity_df.iterrows()
        if normalize_symptom(str(row["Symptom"]))
    }

    symptom_to_index = _build_symptom_index(dataset)
    if not symptom_to_index:
        raise RuntimeError("No symptoms found in dataset.")

    X_raw, y_raw = _extract_samples(dataset, symptom_to_index, severity_map)
    X, y_array = _dedupe_samples(X_raw, y_raw)
    logging.info("Built dataset with %d samples across %d classes (deduped from %d).", len(y_array), len(set(y_array)), len(y_raw))

    clf = RandomForestClassifier(
        n_estimators=400,
        max_depth=None,
        min_samples_leaf=1,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_array, test_size=0.2, stratify=y_array, random_state=42
    )
    clf.fit(X_train, y_train)
    report = classification_report(y_test, clf.predict(X_test))
    logging.info("RandomForest holdout evaluation (20%% stratified split):\n%s", report)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X, y_array, cv=cv, scoring="f1_weighted", n_jobs=1)
    logging.info("5-fold CV weighted F1: mean=%.4f std=%.4f scores=%s", cv_scores.mean(), cv_scores.std(), np.round(cv_scores, 4).tolist())

    clf.fit(X, y_array)

    bundle = {
        "model": clf,
        "symptom_to_index": symptom_to_index,
        "severity_map": severity_map,
    }

    settings.diagnosis_model_path.parent.mkdir(parents=True, exist_ok=True)
    with open(settings.diagnosis_model_path, "wb") as file:
        pickle.dump(bundle, file)
    logging.info("Saved diagnosis model to %s", settings.diagnosis_model_path)


if __name__ == "__main__":
    main()
