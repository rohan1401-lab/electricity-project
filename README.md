# Smart Home Energy Forecasting & Scheduling System

A Home Energy Management System (HEMS) that forecasts household electricity consumption using LightGBM, optimises appliance schedules under Time-of-Use tariffs with Google OR-Tools, and explains every decision through SHAP — served via a FastAPI backend and a React dashboard.

**Module:** COMP1682 — BSc (Hons) Computing, University of Greenwich
**Author:** Rohan Ohiduzzaman

---

## Features

- **24h load forecasting** — LightGBM and XGBoost models tuned with Optuna walk-forward CV on 5 years of OPSD Konstanz household data (19 engineered features including lags, rolling stats, calendar, TOU, and weather)
- **MILP appliance scheduling** — OR-Tools CP-SAT solver minimises electricity cost by shifting deferrable loads (dishwasher, washing machine, EV charger, heat pump) into off-peak tariff windows while respecting hard comfort constraints
- **Model explainability** — SHAP global/local feature importance with plain-language decision narratives for household users
- **Noise robustness testing** — closed-loop evaluation across 30 days and 4 noise levels (0–20%) demonstrating scheduler resilience to forecast error
- **SQLite persistence** — lightweight database logging all forecasts, schedules, and cost results served via history endpoints
- **Interactive dashboard** — 6-page React frontend with live data visualisation, real-time scheduler re-planning, and accessibility compliance

---

## Project Structure

```
electricity-project/
├── notebooks/                        Jupyter ML pipeline
│   ├── 01_data_and_features.ipynb        Data cleaning, feature engineering, train/test split
│   └── 02_models_scheduler_explainability.ipynb
│                                         Model tuning, baseline comparison, MILP scheduler,
│                                         greedy heuristic, SHAP, 30-day noise robustness
├── data/processed/                   Parquet artefacts (produced by Notebook 01)
│   ├── X_train.parquet, X_test.parquet   19-feature train/test matrices
│   ├── y_train.parquet, y_test.parquet   Target variable (kWh/h)
│   ├── tariff_lookup.parquet             168-row TOU tariff (dow × hour)
│   ├── appliance_specs.parquet           4 deferrable appliance definitions
│   ├── sample_forecast.parquet           24h demo-day forecast
│   ├── shap_values_test.parquet          SHAP attributions on test set
│   └── noise_eval.parquet                Single-day noise evaluation results
├── models/                           Joblib artefacts (produced by Notebook 02)
│   ├── winner_model.joblib               LightGBM best model
│   ├── winner_meta.joblib                Model metadata (name, feature list)
│   ├── explainer.joblib                  SHAP TreeExplainer
│   └── residual_quantiles.joblib         P10/P90 residual bands
├── backend/                          FastAPI service (Python 3.11+)
│   ├── app/main.py                       Entry point, lifespan, health + history endpoints
│   ├── app/database.py                   SQLite persistence layer (4 tables)
│   ├── app/routers/                      overview, forecast, scheduler, explain, robustness
│   ├── app/services/                     model_loader, feature_service, scheduler_service
│   ├── app/schemas/                      Pydantic response models
│   └── hems.db                           SQLite database (auto-created, gitignored)
├── frontend/                         React + Vite + TypeScript + Tailwind (Node 20+)
│   └── src/pages/                        Overview, Forecast, Scheduler, Explain, Robustness, StyleGuide
├── Household Data.xlsx               Primary dataset (OPSD Konstanz, 36 MB)
├── London Tariffs.xlsx               UK Low Carbon London TOU tariff
├── Historical Electricity Data Since 1920.xlsx   UK national stats (optional)
└── requirements.txt                  Python dependencies
```

---

## Quick Start

### Prerequisites

- **Python 3.11 or 3.12** (3.13 has unreliable ortools/lightgbm wheels)
- **Node.js 20 LTS**
- **Git**

### 1. Clone

```bash
git clone https://github.com/rohan1401-lab/electricity-project.git
cd electricity-project
```

### 2. Python environment

```bash
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .\.venv\Scripts\Activate.ps1   # Windows PowerShell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Run the notebooks (first time only)

```bash
jupyter lab
```

Open `notebooks/01_data_and_features.ipynb` and run all cells top-to-bottom.
Then do the same for `notebooks/02_models_scheduler_explainability.ipynb`.

This reads the Excel files, produces parquet artefacts in `data/processed/`, and saves trained models to `models/`.

### 4. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Verify: http://localhost:8000/api/health should return `{"status":"ok"}`
API docs: http://localhost:8000/docs

### 5. Start the frontend

In a second terminal:

```bash
cd frontend
npm install      # first time only
npm run dev
```

Open http://localhost:5174 — the frontend proxies `/api` requests to the backend on port 8000.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/overview/summary` | Dashboard KPIs, forecast, confidence, cheap window |
| GET | `/api/forecast?horizon_h=24` | Hourly load forecast with actuals and prices |
| POST | `/api/scheduler/plan` | Run MILP solver, return optimal appliance schedule |
| GET | `/api/explain/shap?top=10` | Top-N SHAP feature importances |
| GET | `/api/robustness/metrics` | Noise degradation evaluation metrics |
| GET | `/api/history/forecasts` | Last 50 forecast records from SQLite |
| GET | `/api/history/schedules` | Last 50 schedules with cost results from SQLite |

---

## Dashboard Pages

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/` | KPI tiles, 24h forecast chart, confidence gauge, cheap window countdown, upcoming runs |
| Forecast | `/forecast` | XGBoost point forecast with P10–P90 uncertainty band, horizon selector (24/48/72h), accuracy metrics |
| Scheduler | `/scheduler` | 24h Gantt timeline with tariff bands, Re-plan button (live solver), constraints table, run details |
| Explain | `/explain` | Global SHAP importance chart, decision narratives, local force decomposition |
| Robustness | `/robustness` | Noise degradation line chart (XGBoost, LightGBM, Stacking Ensemble), proposal target reference |
| Style Guide | `/style` | Design system tokens, colour palette, typography |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **ML Pipeline** | LightGBM, XGBoost, Optuna, SHAP, scikit-learn, pandas |
| **Optimisation** | Google OR-Tools (CP-SAT in backend, CBC in notebooks) |
| **Backend** | FastAPI, Uvicorn, Pydantic, SQLite |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts, TanStack Query, Axios |
| **Data** | Parquet (pipeline), joblib (models), SQLite (runtime persistence) |

---

## Datasets

| File | Role | Notes |
|------|------|-------|
| `Household Data.xlsx` | Primary dataset | OPSD Konstanz residential4, 5 years hourly, 9 submeters. Required. |
| `London Tariffs.xlsx` | Tariff data | UK Low Carbon London TOU labels. Required. |
| `Historical Electricity Data Since 1920.xlsx` | Optional | UK national stats, used in one exploratory cell only. |

Weather data is fetched live from Open-Meteo inside Notebook 01 — no local weather file is needed.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `pip install` fails on `ortools` | Use Python 3.11 or 3.12, not 3.13 |
| `lightgbm` import error (OpenMP) | Install VC++ runtime: https://aka.ms/vs/17/release/vc_redist.x64.exe |
| PowerShell blocks activation script | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once |
| Jupyter uses wrong kernel | Select "Python (.venv)" or run `python -m ipykernel install --user --name=hems-venv` |
| Port 8000 already in use | Use `--port 8001` with uvicorn |
| macOS: `libomp` missing for LightGBM | Run `brew install libomp` |

---

## License

Open-source dependencies used under MIT / Apache-2.0 / BSD licences. Full list in `requirements.txt` and `frontend/package.json`.
