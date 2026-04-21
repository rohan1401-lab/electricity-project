"""Filesystem paths for the project root. All paths are read-only."""
from __future__ import annotations

from pathlib import Path

# backend/app/config.py -> project root is parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = PROJECT_ROOT / "models"
DATA_DIR = PROJECT_ROOT / "data" / "processed"

# Specific artifacts (do not write to any of these)
HOURLY_FULL_PARQUET = DATA_DIR / "hourly_full.parquet"
APPLIANCE_SPECS_PARQUET = DATA_DIR / "appliance_specs.parquet"
TARIFF_LOOKUP_PARQUET = DATA_DIR / "tariff_lookup.parquet"
SAMPLE_FORECAST_PARQUET = DATA_DIR / "sample_forecast.parquet"
SHAP_VALUES_PARQUET = DATA_DIR / "shap_values_test.parquet"
NOISE_EVAL_PARQUET = DATA_DIR / "noise_eval.parquet"

WINNER_MODEL_JOBLIB = MODELS_DIR / "winner_model.joblib"
WINNER_META_JOBLIB = MODELS_DIR / "winner_meta.joblib"
RESIDUAL_QUANTILES_JOBLIB = MODELS_DIR / "residual_quantiles.joblib"
EXPLAINER_JOBLIB = MODELS_DIR / "explainer.joblib"

CORS_ORIGINS = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    # keep the old port allow-listed too in case the user flips it back
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
