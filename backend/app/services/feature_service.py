"""Read-only access to the processed parquet datasets.

All dataframes are cached on first read. No write paths are exposed.
"""
from __future__ import annotations

from functools import lru_cache

import pandas as pd

from ..config import (
    APPLIANCE_SPECS_PARQUET,
    HOURLY_FULL_PARQUET,
    SAMPLE_FORECAST_PARQUET,
    TARIFF_LOOKUP_PARQUET,
)


@lru_cache(maxsize=1)
def load_sample_forecast() -> pd.DataFrame:
    """24-row hourly forecast: timestamp, forecast, actual, price, true_base_load."""
    df = pd.read_parquet(SAMPLE_FORECAST_PARQUET)
    return df.copy()


@lru_cache(maxsize=1)
def load_appliance_specs() -> pd.DataFrame:
    """Per-appliance: power_kw, duration_h, earliest, latest, quiet_hours."""
    return pd.read_parquet(APPLIANCE_SPECS_PARQUET).copy()


@lru_cache(maxsize=1)
def load_tariff_lookup() -> pd.DataFrame:
    """168 rows (dow × hour): tariff_label, tariff_price."""
    return pd.read_parquet(TARIFF_LOOKUP_PARQUET).copy()


@lru_cache(maxsize=1)
def load_hourly_full() -> pd.DataFrame:
    """Full 20k-row hourly dataset with features. Used for historical baselines."""
    return pd.read_parquet(HOURLY_FULL_PARQUET).copy()
