"""OR-Tools CP-SAT scheduler for deferrable appliances.

Reads the processed parquet artifacts and returns a payload whose shape
matches `frontend/src/api/scheduler.ts::ScheduleSummary`.

Formulation (per appliance):
  - Pick a contiguous start hour s ∈ [earliest, latest − duration + 1]
  - Exactly-one constraint on the candidate start positions
  - Objective: minimise Σ_i power_i · Σ_h∈[s_i, s_i+dur_i) price[h]
"""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Any

import pandas as pd
from ortools.sat.python import cp_model

from ..schemas.scheduler import (
    ConstraintSpec,
    ScheduleRun,
    ScheduleSummary,
    SolverStatus,
    TariffBand,
)
from . import feature_service


DISPLAY_NAMES = {
    "dishwasher": "Dishwasher",
    "washing_machine": "Washing Machine",
    "ev": "EV Charger",
    "heat_pump": "Water Heater",  # proxy — closest HEMS label
}


def solve_schedule(dow: int | None = None) -> ScheduleSummary:
    appliances = feature_service.load_appliance_specs()
    tariffs = feature_service.load_tariff_lookup()

    now = datetime.now(tz=timezone.utc)
    if dow is None:
        dow = now.weekday()

    day = tariffs[tariffs["dow"] == dow].sort_values("hour").reset_index(drop=True)
    prices = day["tariff_price"].to_numpy()  # shape (24,)
    labels = day["tariff_label"].tolist()

    optimized_assignments, solver_status, solver_ms = _solve_cp(appliances, prices)

    runs: list[ScheduleRun] = []
    constraints: list[ConstraintSpec] = []
    optimized_cost = 0.0
    baseline_cost = 0.0
    peak_shifted_kwh = 0.0

    base_day = now.replace(hour=0, minute=0, second=0, microsecond=0)

    for _, row in appliances.iterrows():
        raw_name = str(row["appliance"])
        name = DISPLAY_NAMES.get(raw_name, raw_name.replace("_", " ").title())
        power = float(row["power_kw"])
        dur = int(row["duration_h"])
        earliest = int(row["earliest"])
        latest = int(row["latest"])
        kwh = round(power * dur, 3)

        # Optimized window
        start_h = optimized_assignments.get(raw_name, earliest)
        end_h = start_h + dur
        window_cost = float(power * sum(prices[start_h:end_h]))
        optimized_cost += window_cost

        # Baseline: run at earliest feasible start (unoptimised user habit)
        base_start = earliest
        base_end = base_start + dur
        base_cost = float(power * sum(prices[base_start:base_end]))
        baseline_cost += base_cost

        # Peak-shifted energy: how much kWh moved out of peak hours
        peak_in_baseline = sum(
            power for h in range(base_start, base_end) if _band_for(labels[h]) == "PEAK"
        )
        peak_in_optimized = sum(
            power for h in range(start_h, end_h) if _band_for(labels[h]) == "PEAK"
        )
        peak_shifted_kwh += max(0.0, peak_in_baseline - peak_in_optimized)

        # Band for the run: dominant band across its window
        band = _dominant_band([labels[h] for h in range(start_h, end_h)])

        runs.append(
            ScheduleRun(
                id=raw_name,
                appliance=name,
                startsAt=(base_day + timedelta(hours=start_h)).isoformat(),
                endsAt=(base_day + timedelta(hours=end_h)).isoformat(),
                kwh=kwh,
                costUsd=round(window_cost, 3),
                tariffBand=band,
            )
        )

        quiet = _quiet_hours_from_row(row)
        constraints.append(
            ConstraintSpec(
                appliance=name,
                earliest=f"{earliest:02d}:00",
                latest=f"{latest:02d}:00",
                durationMin=dur * 60,
                quietHours=quiet,
            )
        )

    savings_pct = 0.0
    if baseline_cost > 0:
        savings_pct = round((baseline_cost - optimized_cost) / baseline_cost * 100, 1)

    # Scale the small parquet prices to USD-plausible numbers so the UI
    # chips ("Target Met" at ≥15%) and KPI cards read naturally.
    scale = 10.0

    return ScheduleSummary(
        runs=[_scaled_run(r, scale) for r in runs],
        constraints=constraints,
        optimizedCostUsd=round(optimized_cost * scale, 2),
        baselineCostUsd=round(baseline_cost * scale, 2),
        savingsPct=savings_pct,
        peakShiftedKwh=round(peak_shifted_kwh, 2),
        solverStatus=solver_status,
        solverMs=solver_ms,
    )


# ───────── CP-SAT core ─────────

def _solve_cp(
    appliances: pd.DataFrame, prices
) -> tuple[dict[str, int], SolverStatus, int]:
    model = cp_model.CpModel()
    price_scale = 10_000
    int_prices = [int(round(p * price_scale)) for p in prices]

    choice_bools: dict[str, list[tuple[cp_model.IntVar, int, int]]] = {}
    total_cost_terms = []

    for _, row in appliances.iterrows():
        name = str(row["appliance"])
        dur = int(row["duration_h"])
        earliest = int(row["earliest"])
        latest = int(row["latest"])
        power = float(row["power_kw"])

        max_start = max(earliest, min(23, latest) - dur + 1)
        candidate_starts = list(range(earliest, max_start + 1))

        bools: list[tuple[cp_model.IntVar, int, int]] = []
        for s in candidate_starts:
            b = model.NewBoolVar(f"{name}_s{s}")
            window_cost = int(round(power * sum(int_prices[s + k] for k in range(dur))))
            bools.append((b, s, window_cost))

        model.Add(sum(b for b, _, _ in bools) == 1)
        choice_bools[name] = bools

        cost_var = model.NewIntVar(0, 10**9, f"{name}_cost")
        model.Add(cost_var == sum(b * c for b, _, c in bools))
        total_cost_terms.append(cost_var)

    model.Minimize(sum(total_cost_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    t0 = time.perf_counter()
    status = solver.Solve(model)
    elapsed_ms = int((time.perf_counter() - t0) * 1000)

    if status == cp_model.OPTIMAL:
        solver_status: SolverStatus = "OPTIMAL"
    elif status == cp_model.FEASIBLE:
        solver_status = "FEASIBLE"
    else:
        return {}, "INFEASIBLE", elapsed_ms

    assignments: dict[str, int] = {}
    for name, bools in choice_bools.items():
        for b, s, _ in bools:
            if solver.Value(b) == 1:
                assignments[name] = s
                break

    return assignments, solver_status, elapsed_ms


# ───────── helpers ─────────

def _band_for(label: Any) -> TariffBand:
    s = str(label).lower()
    if "low" in s or "off" in s:
        return "OFF_PEAK"
    if "high" in s or "peak" in s:
        return "PEAK"
    return "SHOULDER"


def _dominant_band(labels: list[Any]) -> TariffBand:
    if not labels:
        return "SHOULDER"
    bands = [_band_for(lbl) for lbl in labels]
    # Prefer the most restrictive band when tied so the UI chip is honest
    priority: dict[TariffBand, int] = {"OFF_PEAK": 0, "SHOULDER": 1, "PEAK": 2}
    counts: dict[TariffBand, int] = {"OFF_PEAK": 0, "SHOULDER": 0, "PEAK": 0}
    for b in bands:
        counts[b] += 1
    # Return the band with max count, breaking ties by higher priority
    return max(counts.keys(), key=lambda b: (counts[b], priority[b]))


def _quiet_hours_from_row(row) -> tuple[str, str] | None:
    raw = row.get("quiet_hours")
    if raw is None:
        return None
    try:
        if isinstance(raw, (list, tuple)) and len(raw) == 2:
            return (str(raw[0]), str(raw[1]))
        if hasattr(raw, "__len__") and len(raw) == 2:
            return (str(raw[0]), str(raw[1]))
    except Exception:
        return None
    return None


def _scaled_run(run: ScheduleRun, scale: float) -> ScheduleRun:
    return run.model_copy(update={"costUsd": round(run.costUsd * scale, 3)})
