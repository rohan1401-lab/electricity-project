from __future__ import annotations

from fastapi import APIRouter

from ..config import SHAP_VALUES_PARQUET
import pandas as pd

router = APIRouter()


@router.get("/shap")
def get_shap_top_features(top: int = 10) -> dict:
    """Return mean-absolute SHAP importance across the test set.

    Placeholder for the `design pending` Explain page.
    """
    if not SHAP_VALUES_PARQUET.exists():
        return {"features": []}

    df = pd.read_parquet(SHAP_VALUES_PARQUET)
    # Take mean absolute value per column as a simple importance proxy
    imp = df.abs().mean().sort_values(ascending=False).head(top)
    return {
        "features": [
            {"name": str(name), "importance": float(value)}
            for name, value in imp.items()
        ]
    }
