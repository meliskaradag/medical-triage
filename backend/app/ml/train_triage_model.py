"""Training script for the triage level classifier."""
from __future__ import annotations

import logging
import pickle
import sys
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from backend.app.core.config import get_settings
from backend.app.data.loader import load_descriptions, load_precautions
from backend.app.ml.preprocess import clean_text, create_triage_labels


def _assemble_text(row) -> str:
    precaution_columns = [col for col in row.index if col.lower().startswith("precaution")]
    segments = [str(row.get("Description", ""))]
    segments.extend(str(row[column]) for column in precaution_columns if str(row[column]).strip() and str(row[column]).lower() != "nan")
    concatenated = " ".join(segment for segment in segments if segment and segment.lower() != "nan")
    return clean_text(concatenated)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    settings = get_settings()

    precautions_df = load_precautions()
    descriptions_df = load_descriptions()
    merged_df = precautions_df.merge(descriptions_df, on="Disease", how="left")
    labeled_df = create_triage_labels(merged_df)
    labeled_df["text"] = labeled_df.apply(_assemble_text, axis=1)
    labeled_df = labeled_df[labeled_df["text"].str.len() > 0].copy()

    X = labeled_df["text"].values
    y = labeled_df["triage_level"].values

    pipeline = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(ngram_range=(1, 2), min_df=2, stop_words="english"),
            ),
            (
                "clf",
                LogisticRegression(max_iter=1000, class_weight="balanced", multi_class="auto"),
            ),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    pipeline.fit(X_train, y_train)
    report = classification_report(y_test, pipeline.predict(X_test))
    logging.info("Triage model evaluation:\n%s", report)

    pipeline.fit(X, y)

    settings.triage_model_path.parent.mkdir(parents=True, exist_ok=True)
    with open(settings.triage_model_path, "wb") as file:
        pickle.dump(pipeline, file)
    logging.info("Saved triage model to %s", settings.triage_model_path)


if __name__ == "__main__":
    main()
