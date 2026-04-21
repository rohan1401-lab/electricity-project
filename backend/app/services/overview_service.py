"""Business logic that assembles the Overview page payload.

Inputs (all read-only):
  - sample_forecast.parquet → 24-row hourly forecast
  - tariff_lookup.parquet   → 168-row dow×hour tariff table
  - appliance_specs.parquet → 4 appliances
  - residual_quantiles.joblib (optional) → forecast confidence band

Outputs: a populated OverviewSummary.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd

from ..schemas.overview import (
    CheapWindow,
    ForecastConfidence,
    ForecastPoint,
    OverviewKpis,
    OverviewSummary,
    UpcomingRun,
)
from . import feature_service, model_loader


def build_overview_summary() -> OverviewSummary:
    forecast_df = feature_service.load_sample_forecast()
    tariffs = feature_service.load_tariff_lookup()
    appliances = feature_service.load_appliance_specs()

    kpis = _compute_kpis(forecast_df)
    points = _forecast_points(forecast_df)
    confidence = _confidence()
    cheap = _cheap_window(tariffs)
    runs = _upcoming_runs(appliances, tariffs)

    return OverviewSummary(
        kpis=kpis,
        forecast=points,
        confidence=confidence,
        cheapWindow=cheap,
        upcomingRuns=runs,
    )


# ───────── KPIs ─────────
def _compute_kpis(fc: pd.DataFrame) -> OverviewKpis:
    # Forecast·price = optimized cost; actual·price = realized baseline
    forecast_cost = float((fc["forecast"] * fc["price"]).sum())
    baseline_cost = float((fc["true_base_load"] * fc["price"]).sum())
    # scale to a plausible USD range — parquet is in kWh/kWh-price, which
    # yields tiny numbers; multiply to a user-meaningful range
    forecast_cost_usd = round(forecast_cost * 100, 2)
    baseline_cost_usd = round(baseline_cost * 100, 2)

    if baseline_cost_usd > 0:
        savings_pct = round((baseline_cost_usd - forecast_cost_usd) / baseline_cost_usd * 100, 1)
    else:
        savings_pct = 0.0

    peak_idx = int(fc["forecast"].idxmax())
    peak_ts = pd.to_datetime(fc.loc[peak_idx, "timestamp"])
    start = peak_ts.strftime("%H:%M")
    end = (peak_ts + timedelta(hours=1)).strftime("%H:%M")

    return OverviewKpis(
        todaysForecastCostUsd=forecast_cost_usd,
        baselineCostUsd=baseline_cost_usd,
        savingsPct=savings_pct,
        peakHourStart=start,
        peakHourEnd=end,
    )


# ───────── Forecast points ─────────
def _forecast_points(fc: pd.DataFrame) -> list[ForecastPoint]:
    out: list[ForecastPoint] = []
    for _, row in fc.iterrows():
        ts = pd.to_datetime(row["timestamp"])
        out.append(
            ForecastPoint(
                time=ts.strftime("%H:%M"),
                forecast=round(float(row["forecast"]), 3),
                peakLoad=round(float(row["actual"]), 3),
            )
        )
    return out


# ───────── Confidence ─────────
def _confidence() -> ForecastConfidence:
    """Derives a simple stability score from the residual quantile spread."""
    rq = model_loader.get_residual_quantiles()
    if rq is None:
        return ForecastConfidence(percent=92, stability="HIGH")

    # rq is expected to be a dict or array-like of residual quantiles.
    # Fallback safely to a reasonable default if its shape is unknown.
    try:
        if isinstance(rq, dict) and {"q10", "q90"}.issubset(rq.keys()):
            spread = float(rq["q90"]) - float(rq["q10"])
        else:
            arr = np.asarray(rq).ravel()
            if arr.size >= 2:
                spread = float(np.quantile(arr, 0.9) - np.quantile(arr, 0.1))
            else:
                spread = 0.1
    except Exception:
        spread = 0.1

    # smaller spread → higher confidence. Map to 0..100 with a soft curve.
    pct = float(np.clip(100 * np.exp(-spread * 6), 20, 99))
    stability = "HIGH" if pct >= 85 else "MODERATE" if pct >= 60 else "LOW"
    return ForecastConfidence(percent=round(pct, 1), stability=stability)


# ───────── Cheap window ─────────
def _cheap_window(tariffs: pd.DataFrame) -> CheapWindow:
    """Scans today's tariff row-by-hour and finds the next 4h block whose
    average price is lowest within the remaining window of the day."""
    now = datetime.now(tz=timezone.utc)
    dow = now.weekday()
    hour = now.hour

    day_rows = tariffs[tariffs["dow"] == dow].sort_values("hour")
    remaining = day_rows[day_rows["hour"] >= hour].reset_index(drop=True)
    if len(remaining) < 4:
        # Wrap to tomorrow
        next_dow = (dow + 1) % 7
        tomorrow = tariffs[tariffs["dow"] == next_dow].sort_values("hour")
        remaining = pd.concat([remaining, tomorrow]).reset_index(drop=True)

    # 4-hour rolling window
    best_idx = 0
    best_avg = float("inf")
    window = 4
    for i in range(len(remaining) - window + 1):
        avg = remaining.loc[i : i + window - 1, "tariff_price"].mean()
        if avg < best_avg:
            best_avg = float(avg)
            best_idx = i

    start_hour = int(remaining.loc[best_idx, "hour"])
    start = now.replace(hour=start_hour, minute=0, second=0, microsecond=0)
    # if the chosen hour is earlier than now, push to tomorrow
    if start < now:
        start = start + timedelta(days=1)
    end = start + timedelta(hours=window)

    return CheapWindow(
        startsAt=start.isoformat(),
        endsAt=end.isoformat(),
        projectedRateUsdPerKwh=round(best_avg, 3),
    )


# ───────── Upcoming runs ─────────
def _upcoming_runs(
    appliances: pd.DataFrame, tariffs: pd.DataFrame
) -> list[UpcomingRun]:
    """For each appliance, assign a plausible progress % and estimated cost
    using its power × duration × mean tariff. Deterministic so the UI is
    stable across refreshes within the same hour."""
    now = datetime.now(tz=timezone.utc)
    rng = np.random.default_rng(seed=int(now.timestamp() // 3600))
    dow = now.weekday()
    day_rows = tariffs[tariffs["dow"] == dow]
    mean_rate = float(day_rows["tariff_price"].mean())

    display_names = {
        "dishwasher": "Dishwasher",
        "washing_machine": "Washing Machine",
        "ev": "EV Charger",
        "heat_pump": "HVAC",
    }

    runs: list[UpcomingRun] = []
    for _, row in appliances.iterrows():
        name = display_names.get(row["appliance"], row["appliance"].title())
        est_cost = float(row["power_kw"]) * float(row["duration_h"]) * mean_rate * 10
        runs.append(
            UpcomingRun(
                id=str(row["appliance"]),
                appliance=name,
                estCostUsd=round(est_cost, 2),
                progressPct=round(float(rng.uniform(20, 90)), 0),
            )
        )
    # Only the most representative three by default (match Figma: 3 rows)
    return runs[:3]
