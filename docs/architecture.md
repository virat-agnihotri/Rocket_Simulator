# System Architecture Documentation

## 1. Overview

The **Rocket Mission Simulation & Optimization Platform** is a college-level, full-stack scientific computing web application designed to simulate launch vehicle ascent trajectories, analyze two-body orbital insertion conditions, and execute constrained differential evolution optimization.

```
┌─────────────────────────────────────────────────────────────┐
│                 React + TypeScript Frontend                 │
│  - Dashboard & Controls        - 2D/3D Trajectory Canvas    │
│  - Recharts Telemetry Streams  - Optimization Workbench     │
│  - Scenario Comparison Matrix  - Scientific Docs            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Router                   │
│  - /api/simulations  - /api/optimizations  - /api/missions  │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌───────────────┐       ┌───────────────┐
│ Flight       │       │ Keplerian     │       │ Differential  │
│ Dynamics     │       │ Orbital Engine│       │ Evolution     │
│ & solve_ivp  │       │ & Evaluator   │       │ Optimizer     │
└──────┬───────┘       └───────┬───────┘       └───────┬───────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                SQLite / SQLAlchemy Database                 │
│  - Mission Scenarios         - Simulation Telemetry Runs    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Directory Structure

```text
rocket-mission-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app and lifespan initialization
│   │   ├── config.py            # Application settings and CORS origins
│   │   ├── models/              # Pydantic data schemas (Vehicle, Mission, State, Results)
│   │   ├── physics/             # Gravitational, propulsion, and rocket equations
│   │   ├── atmosphere/          # Density, pressure, wind, and aerodynamic drag
│   │   ├── simulation/          # State derivatives, RK45 integrator, guidance
│   │   ├── orbital/             # Keplerian mechanics, analysis, insertion evaluator
│   │   ├── optimization/        # Objectives, constraints, differential evolution
│   │   ├── api/                 # Endpoint route handlers (simulations, optimizations, missions)
│   │   └── database/            # SQLAlchemy database models and session factory
│   ├── tests/                   # 34 automated scientific and API pytest tests
│   └── pyproject.toml           # Backend packaging and test configuration
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, TrajectoryVisualizer, TelemetryCharts
│   │   ├── pages/               # Dashboard, Configure, Simulation, Optimization, Compare, Saved, Docs
│   │   ├── services/            # Typed REST API client
│   │   ├── types/               # TypeScript data models
│   │   ├── App.tsx              # React router and state container
│   │   └── main.tsx             # React DOM entrypoint
│   └── package.json             # Frontend dependencies
├── docs/                        # Architecture, physics, API, limitations
└── README.md                    # Startup guides and user documentation
```

## 3. Data Flow Pipeline

1. **User Input / Preset Loading**: Configuration parameters are specified via the React interface or chosen from validated educational presets.
2. **Analytical Pre-computation**: Ideal Tsiolkovsky $\Delta v$, mass ratio, and liftoff TWR are computed instantly on the client for initial feasibility checking.
3. **Trajectory Simulation Request**: A validated JSON payload is posted to `POST /api/simulations`.
4. **Numerical Integration**: `scipy.integrate.solve_ivp` integrates the 5-state vector $[x, y, v_x, v_y, m_{\text{prop}}]$ with event monitoring for ground impact and burnout.
5. **Orbital State Extraction**: Final cutoff position and velocity vectors are evaluated using two-body Keplerian mechanics.
6. **Insertion Evaluation**: The orbital evaluator determines whether true insertion conditions are satisfied based on periapsis, eccentricity, and energy.
7. **Interactive Presentation**: Telemetry points and curves are rendered via Recharts, while trajectory arcs and Earth geometry are rendered dynamically in the visualizer canvas.
