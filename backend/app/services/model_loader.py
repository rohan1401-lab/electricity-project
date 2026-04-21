"""Lazy, cached loading of joblib model artifacts.

Each getter swallows missing-file errors and returns None so that routes
which don't strictly need a given artifact can still respond. Loading is
read-only; artifacts are never re-written.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any

import joblib

from ..config import (
    EXPLAINER_JOBLIB,
    RESIDUAL_QUANTILES_JOBLIB,
    WINNER_META_JOBLIB,
    WINNER_MODEL_JOBLIB,
)


def _try_load(path) -> Any | None:
    if not path.exists():
        return None
    try:
        return joblib.load(path)
    except Exception:
        return None


@lru_cache(maxsize=1)
def get_winner_model() -> Any | None:
    return _try_load(WINNER_MODEL_JOBLIB)


@lru_cache(maxsize=1)
def get_winner_meta() -> Any | None:
    return _try_load(WINNER_META_JOBLIB)


@lru_cache(maxsize=1)
def get_residual_quantiles() -> Any | None:
    return _try_load(RESIDUAL_QUANTILES_JOBLIB)


@lru_cache(maxsize=1)
def get_explainer() -> Any | None:
    return _try_load(EXPLAINER_JOBLIB)
