"""FastAPI entry point for the HEMS backend.

All routes are mounted under `/api`. CORS is restricted to the Vite dev
server in development. The app loads all parquet data and joblib model
artifacts lazily via the singleton services in `app.services`.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS, TARIFF_LOOKUP_PARQUET
from .routers import overview, forecast, scheduler, explain, robustness
from . import database

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise SQLite and seed tariffs."""
    database.init_db()
    database.seed_tariffs_from_parquet(TARIFF_LOOKUP_PARQUET)
    yield


app = FastAPI(
    title="HEMS API",
    version="0.1.0",
    description="Smart Home Energy Forecasting & Scheduling — read-only wrapper over trained models.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(overview.router, prefix="/api/overview", tags=["overview"])
app.include_router(forecast.router, prefix="/api/forecast", tags=["forecast"])
app.include_router(scheduler.router, prefix="/api/scheduler", tags=["scheduler"])
app.include_router(explain.router, prefix="/api/explain", tags=["explain"])
app.include_router(robustness.router, prefix="/api/robustness", tags=["robustness"])


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/history/forecasts", tags=["history"])
def history_forecasts(limit: int = 50) -> list[dict]:
    """Return the last N forecast records from the database."""
    return database.get_forecasts(limit=limit)


@app.get("/api/history/schedules", tags=["history"])
def history_schedules(limit: int = 50) -> list[dict]:
    """Return the last N schedule records with their cost results."""
    return database.get_schedules(limit=limit)
