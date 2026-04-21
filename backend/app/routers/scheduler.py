from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..schemas.scheduler import ScheduleSummary
from ..services.scheduler_service import solve_schedule
from .. import database

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/plan", response_model=ScheduleSummary)
def plan_schedule() -> ScheduleSummary:
    """Run the MILP scheduler against today's tariff curve."""
    try:
        result = solve_schedule()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # Fire-and-forget: persist schedule and cost result to SQLite
    try:
        first_sched_id = None
        for run in result.runs:
            start_h = int(run.startsAt.split("T")[1].split(":")[0]) if "T" in run.startsAt else 0
            end_h = int(run.endsAt.split("T")[1].split(":")[0]) if "T" in run.endsAt else 0
            duration_h = max(end_h - start_h, 1)
            power_kw = run.kwh / duration_h if duration_h > 0 else 0.0
            sid = database.insert_schedule(
                forecast_id=None,
                appliance=run.appliance,
                start_hour=start_h,
                end_hour=end_h,
                power_kw=power_kw,
                strategy="MILP",
            )
            if first_sched_id is None:
                first_sched_id = sid

        database.insert_cost_result(
            schedule_id=first_sched_id,
            total_cost=result.optimizedCostUsd,
            peak_kw=result.peakShiftedKwh,
            saving_vs_naive_pct=result.savingsPct,
            violations=0 if result.solverStatus == "OPTIMAL" else 1,
        )
    except Exception:
        logger.exception("Failed to persist schedule to database")

    return result
