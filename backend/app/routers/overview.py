from __future__ import annotations

from fastapi import APIRouter

from ..schemas.overview import OverviewSummary
from ..services.overview_service import build_overview_summary

router = APIRouter()


@router.get("/summary", response_model=OverviewSummary)
def get_summary() -> OverviewSummary:
    """Assemble the full Overview page payload (KPIs + forecast + gauge + cheap window + upcoming runs)."""
    return build_overview_summary()
