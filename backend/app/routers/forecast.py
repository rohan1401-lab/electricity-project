from __future__ import annotations

import logging

from fastapi import APIRouter

from ..services import feature_service
from .. import database

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("")
def get_forecast(horizon_h: int = 24) -> dict:
    """Return the sample 24h forecast with quantile columns if available.

    Placeholder — the Forecast page is `design pending`, so this route
    returns raw rows from sample_forecast.parquet. When designs land this
    will be reshaped to match the new page contract.
    """
    df = feature_service.load_sample_forecast().head(horizon_h)
    points = [
        {
            "timestamp": str(row["timestamp"]),
            "forecast": float(row["forecast"]),
            "actual": float(row["actual"]),
            "price": float(row["price"]),
        }
        for _, row in df.iterrows()
    ]

    # Fire-and-forget: persist forecast rows to SQLite
    try:
        for pt in points:
            database.insert_forecast(
                timestamp=pt["timestamp"],
                household="residential4",
                baseline_load_kwh=pt["actual"],
                predicted_load_kwh=pt["forecast"],
                model_name="LightGBM",
            )
    except Exception:
        logger.exception("Failed to persist forecast to database")

    return {"horizon_h": int(horizon_h), "points": points}
