"""Lightweight SQLite persistence layer for HEMS.

Uses Python's built-in sqlite3 — no SQLAlchemy required.  Thread-safe via
threading.local() since FastAPI may serve requests on different threads.
All writes are fire-and-forget; failures are logged but never propagate to
the caller so existing endpoints remain unaffected.
"""
from __future__ import annotations

import logging
import sqlite3
import threading
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parent.parent / "hems.db"

_local = threading.local()

_SCHEMA = """
CREATE TABLE IF NOT EXISTS forecasts (
    id                INTEGER PRIMARY KEY,
    timestamp         TEXT,
    household         TEXT,
    baseline_load_kwh REAL,
    predicted_load_kwh REAL,
    model_name        TEXT,
    created_at        TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedules (
    id          INTEGER PRIMARY KEY,
    forecast_id INTEGER,
    appliance   TEXT,
    start_hour  INTEGER,
    end_hour    INTEGER,
    power_kw    REAL,
    strategy    TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tariffs (
    id        INTEGER PRIMARY KEY,
    dow       INTEGER,
    hour      INTEGER,
    label     TEXT,
    price_kwh REAL
);

CREATE TABLE IF NOT EXISTS cost_results (
    id                  INTEGER PRIMARY KEY,
    schedule_id         INTEGER,
    total_cost          REAL,
    peak_kw             REAL,
    saving_vs_naive_pct REAL,
    violations          INTEGER,
    created_at          TEXT DEFAULT CURRENT_TIMESTAMP
);
"""


def _get_conn() -> sqlite3.Connection:
    """Return a thread-local connection, creating one if needed."""
    conn = getattr(_local, "conn", None)
    if conn is None:
        conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.executescript(_SCHEMA)
        _local.conn = conn
    return conn


def init_db() -> None:
    """Ensure the database and tables exist."""
    _get_conn()
    logger.info("SQLite database initialised at %s", DB_PATH)


# ── Inserts ──────────────────────────────────────────────────────────────

def insert_forecast(
    timestamp: str,
    household: str,
    baseline_load_kwh: float,
    predicted_load_kwh: float,
    model_name: str,
) -> int:
    conn = _get_conn()
    cur = conn.execute(
        "INSERT INTO forecasts (timestamp, household, baseline_load_kwh, "
        "predicted_load_kwh, model_name) VALUES (?, ?, ?, ?, ?)",
        (timestamp, household, baseline_load_kwh, predicted_load_kwh, model_name),
    )
    conn.commit()
    return cur.lastrowid  # type: ignore[return-value]


def insert_schedule(
    forecast_id: int | None,
    appliance: str,
    start_hour: int,
    end_hour: int,
    power_kw: float,
    strategy: str,
) -> int:
    conn = _get_conn()
    cur = conn.execute(
        "INSERT INTO schedules (forecast_id, appliance, start_hour, end_hour, "
        "power_kw, strategy) VALUES (?, ?, ?, ?, ?, ?)",
        (forecast_id, appliance, start_hour, end_hour, power_kw, strategy),
    )
    conn.commit()
    return cur.lastrowid  # type: ignore[return-value]


def insert_cost_result(
    schedule_id: int | None,
    total_cost: float,
    peak_kw: float,
    saving_vs_naive_pct: float,
    violations: int,
) -> int:
    conn = _get_conn()
    cur = conn.execute(
        "INSERT INTO cost_results (schedule_id, total_cost, peak_kw, "
        "saving_vs_naive_pct, violations) VALUES (?, ?, ?, ?, ?)",
        (schedule_id, total_cost, peak_kw, saving_vs_naive_pct, violations),
    )
    conn.commit()
    return cur.lastrowid  # type: ignore[return-value]


# ── Queries ──────────────────────────────────────────────────────────────

def get_forecasts(limit: int = 50) -> list[dict]:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM forecasts ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    return [dict(r) for r in rows]


def get_schedules(limit: int = 50) -> list[dict]:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT s.*, cr.total_cost, cr.peak_kw, cr.saving_vs_naive_pct, "
        "cr.violations AS cost_violations "
        "FROM schedules s "
        "LEFT JOIN cost_results cr ON cr.schedule_id = s.id "
        "ORDER BY s.id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return [dict(r) for r in rows]


# ── Seed ─────────────────────────────────────────────────────────────────

def seed_tariffs_from_parquet(parquet_path: str | Path) -> None:
    """Populate the tariffs table from a parquet file if the table is empty."""
    conn = _get_conn()
    count = conn.execute("SELECT COUNT(*) FROM tariffs").fetchone()[0]
    if count > 0:
        logger.info("Tariffs table already seeded (%d rows), skipping.", count)
        return

    df = pd.read_parquet(parquet_path)
    for _, row in df.iterrows():
        conn.execute(
            "INSERT INTO tariffs (dow, hour, label, price_kwh) VALUES (?, ?, ?, ?)",
            (int(row["dow"]), int(row["hour"]), str(row["tariff_label"]),
             float(row["tariff_price"])),
        )
    conn.commit()
    logger.info("Seeded tariffs table with %d rows from %s", len(df), parquet_path)
