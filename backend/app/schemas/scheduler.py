"""Response schemas for the /scheduler endpoints.

Mirrors the TypeScript interfaces in `frontend/src/api/scheduler.ts` exactly.
The Scheduler page consumes `ScheduleSummary` directly.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


TariffBand = Literal["OFF_PEAK", "SHOULDER", "PEAK"]
SolverStatus = Literal["OPTIMAL", "FEASIBLE", "INFEASIBLE"]


class ScheduleRun(BaseModel):
    id: str
    appliance: str
    startsAt: str = Field(..., description="ISO 8601 UTC")
    endsAt: str = Field(..., description="ISO 8601 UTC")
    kwh: float
    costUsd: float
    tariffBand: TariffBand


class ConstraintSpec(BaseModel):
    appliance: str
    earliest: str = Field(..., description="HH:MM")
    latest: str = Field(..., description="HH:MM")
    durationMin: int
    quietHours: Optional[tuple[str, str]] = None


class ScheduleSummary(BaseModel):
    runs: list[ScheduleRun]
    constraints: list[ConstraintSpec]
    optimizedCostUsd: float
    baselineCostUsd: float
    savingsPct: float
    peakShiftedKwh: float
    solverStatus: SolverStatus
    solverMs: int
