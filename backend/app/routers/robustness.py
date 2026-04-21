from __future__ import annotations

from fastapi import APIRouter

from ..config import NOISE_EVAL_PARQUET
import pandas as pd

router = APIRouter()


@router.get("/metrics")
def get_robustness_metrics() -> dict:
    """Return the noise-degradation evaluation table.

    Placeholder for the `design pending` Robustness page.
    """
    if not NOISE_EVAL_PARQUET.exists():
        return {"metrics": []}

    df = pd.read_parquet(NOISE_EVAL_PARQUET)
    return {
        "columns": list(df.columns),
        "rows": df.head(50).to_dict(orient="records"),
    }
