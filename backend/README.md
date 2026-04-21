# HEMS FastAPI backend

Read-only wrapper around the trained models (`../models/`) and processed data
(`../data/processed/`). Serves the React frontend (`../frontend/`).

## Run

```bash
cd backend
../.venv/bin/pip install -r requirements.txt
../.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The frontend (Vite dev server on `:5173`) proxies `/api/*` to `:8000/api/*`.

## Constraints

- **Never modifies** `../models/`, `../data/processed/`, or the
  notebooks. All filesystem access is read-only (except `hems.db` for persistence).
- The OR-Tools scheduler and feature logic are implemented from the parquet
  schemas directly.
- Model artifacts are loaded once at startup by `services/model_loader.py`.
