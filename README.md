# Medical Triage Platform

End-to-end triage platform that ingests the provided medical datasets to deliver disease predictions, symptom severity scoring, and precaution-informed triage guidance. The stack includes a FastAPI backend with scikit-learn models and a React + TypeScript + Tailwind front-end.

## Repository layout

```
backend/
  app/
    core/              # configuration
    data/              # dataset loaders
    ml/                # preprocessing + training scripts
    models/            # serialized sklearn models
    routes/            # FastAPI routers
    schemas/           # pydantic schemas
    main.py            # ASGI app
frontend/
  src/                 # React application
requirements.txt       # backend/training dependencies
```

All ML models are trained exclusively with the four datasets in `data/`.

## Backend setup

```bash
python3 -m venv .venv && source .venv/bin/activate  # optional but recommended
pip install -r requirements.txt
```

Run the FastAPI server:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Available endpoints:
- `GET /health` – basic status probe
- `GET /symptoms` – normalized symptom vocabulary for autocomplete
- `POST /predict` – body `{"symptoms": ["fever", "nausea"]}` returns the ranked diagnoses, probabilities, severity score, triage level, and precautions.

## Training the models

Two standalone scripts rebuild the ML artifacts using the local CSV files:

```bash
python backend/app/ml/train_diagnosis_model.py   # RandomForest symptom → disease
python backend/app/ml/train_triage_model.py      # Logistic Regression triage classifier
```

Outputs are stored under `backend/app/models/diagnosis_model.pkl` and `backend/app/models/triage_model.pkl` and are automatically loaded by the API on startup.

## Frontend setup

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

The UI provides symptom entry with autocomplete, severity gauge, disease cards with probability bars, and triage badges. Configure the backend URL with the `VITE_API_BASE_URL` environment variable if needed (defaults to `http://localhost:8000`).

## Data processing + triage pipeline

1. **Symptom encoding:** Symptoms are normalized (lowercase, underscores) and encoded into weighted vectors using severity weights from `Symptom-severity.csv`.
2. **Disease prediction:** RandomForest classifier predicts disease probabilities from the encoded vector.
3. **Severity scoring:** Severity score is the sum of the weights for the deduplicated user symptoms so clinicians can gauge acuity.
4. **Triage inference:** Disease descriptions and precautions are combined, tokenized with TF-IDF, and fed to a logistic regression model that was trained on keyword-derived triage labels (High/Medium/Low). Precaution keywords drive initial labels during training.
5. **Precaution delivery:** `symptom_precaution.csv` supplies the recommended actions for each predicted disease, which the API returns verbatim to the frontend.

## Running the full stack

1. Start the FastAPI backend (`uvicorn backend.app.main:app --port 8000`).
2. Launch the frontend (`npm run dev`) and open the printed local URL.
3. Enter symptoms via the input component, submit, and review the probability-ranked diseases, severity meter, color-coded triage badges, and precautions.

## Safety notice

This project is provided for educational demonstration only. It is **not** a medical device and must not be used for diagnosis or treatment decisions without a licensed clinician.
