"""Response schemas for the /overview endpoints.

These Pydantic models are the source of truth for the Overview page JSON
contract. The frontend TypeScript interfaces in
`frontend/src/api/overview.ts` mirror this shape.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class OverviewKpis(BaseModel):
    todaysForecastCostUsd: float = Field(..., description="Sum of forecast·tariff for the next 24h")
    baselineCostUsd: float = Field(..., description="Unoptimized baseline cost for the same window")
    savingsPct: float = Field(..., description="Signed % savings vs baseline")
    peakHourStart: str = Field(..., description="HH:MM of forecasted peak start")
    peakHourEnd: str = Field(..., description="HH:MM of forecasted peak end")


class ForecastConfidence(BaseModel):
    percent: float = Field(..., ge=0, le=100)
    stability: Literal["LOW", "MODERATE", "HIGH"]


class CheapWindow(BaseModel):
    startsAt: str = Field(..., description="ISO 8601")
    endsAt: str = Field(..., description="ISO 8601")
    projectedRateUsdPerKwh: float


class UpcomingRun(BaseModel):
    id: str
    appliance: str
    estCostUsd: float
    progressPct: float = Field(..., ge=0, le=100)


class ForecastPoint(BaseModel):
    time: str = Field(..., description="HH:MM")
    forecast: float
    peakLoad: float


class OverviewSummary(BaseModel):
    kpis: OverviewKpis
    forecast: list[ForecastPoint]
    confidence: ForecastConfidence
    cheapWindow: CheapWindow
    upcomingRuns: list[UpcomingRun]
