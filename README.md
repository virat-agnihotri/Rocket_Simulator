# Rocket Mission Simulation & Optimization Platform

A college-level, full-stack scientific simulation and constrained optimization platform for launch vehicle ascent trajectories and Keplerian orbital insertion.

![Platform Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-brightgreen.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)
![React](https://img.shields.io/badge/react-19+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 1. System Overview

This platform models the physical ascent of hypothetical rockets from Earth liftoff into low Earth orbit (LEO). It couples classical mechanics, barometric atmospheric aerodynamics, numerical initial-value ODE integration, and global differential evolution optimization into an intuitive, mission-control web interface.

### Key Capabilities

- **Flight Dynamics Integration**: 2D Earth-Centered Inertial (ECI) numerical trajectory integration using `scipy.integrate.solve_ivp` (RK45) tracking altitude, speed, acceleration, and dynamic pressure.
- **Two-Body Keplerian Mechanics**: Analytical calculation of specific orbital energy, angular momentum, Runge-Lenz eccentricity vector, semi-major axis, apoapsis, and periapsis.
- **Strict Orbital Insertion Evaluation**: Distinguishes high-altitude suborbital ballistic arcs from sustainable orbital insertion (evaluates atmospheric clearance $\ge 140\text{ km}$, low eccentricity, and target altitude error).
- **Constrained Optimization**: Differential evolution optimization to minimize propellant consumption, minimize orbit error, or maximize payload fraction while strictly enforcing peak acceleration and dynamic pressure constraints.
- **Mission Digital Twin & Visualization**: Planar ECI canvas visualizer featuring Earth geometry, target orbit bounds, trajectory arcs, timeline scrubber, and speed controls.
- **Telemetry Analysis**: Real-time charts for altitude, velocity components (inertial, tangential, radial), g-loads, propellant consumption, and dynamic pressure (Max-Q).
- **Scenario Persistence & Comparison**: SQLite database via SQLAlchemy with CSV telemetry export and side-by-side scenario benchmarking.

---

## 2. Technology Stack

### Backend
- **Python 3.11+ / 3.14**
- **FastAPI**: Asynchronous REST API framework
- **Pydantic v2**: Strongly typed data validation
- **NumPy & SciPy**: Scientific vector calculations and `solve_ivp` Runge-Kutta numerical integration
- **SQLAlchemy & SQLite**: Relational database persistence
- **pytest & pytest-cov**: Automated test suite (34 unit and integration tests)

### Frontend
- **React 19 & TypeScript**
- **Vite**: Rapid frontend build tooling
- **Tailwind CSS v4**: Aerospace mission-control design system
- **React Router v7**: Client-side navigation
- **Recharts**: Telemetry charting (altitude, speed, acceleration, mass, Max-Q)
- **HTML5 Canvas**: 2D/3D planar ECI visualizer with Earth globe and trajectory scrubber
- **Lucide React**: Engineering icons

---

## 3. Quick Start & Startup Instructions

### Prerequisites
- Python 3.11+ installed
- Node.js v18+ and npm installed

### Step 1: Clone and Set Up Backend
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at:
- **Base URL**: `http://127.0.0.1:8000`
- **Interactive OpenAPI Documentation**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

### Step 2: Set Up and Run Frontend
In a separate terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```
Open your browser and navigate to:
**`http://localhost:5173`**

---

## 4. Running Automated Tests

### Backend Scientific & API Tests
Run the complete suite of 34 tests covering gravitational physics, aerodynamics, orbital mechanics, numerical integration, differential evolution, and API endpoints:
```bash
python -m pytest backend/tests
```
Expected output:
```text
======================= 34 passed in ~4.5s =======================
```

### Frontend Type Checking & Production Build
```bash
cd frontend
npm run build
```

---

## 5. End-to-End Mission Workflow

1. **Dashboard Overview**: Launch the app at `http://localhost:5173` to inspect current system status, active vehicle parameters, and quick metrics.
2. **Configure Mission**: Navigate to **Configure** (`/configure`). Select a preset (e.g. *Medium-Lift Single-Stage-to-LEO*) or customize mass, thrust, Isp, and ascent pitch guidance. Observe the real-time analytical Tsiolkovsky preview.
3. **Run Simulation**: Click **Run Flight Simulation**. The system calls `POST /api/simulations`, integrates equations of motion, and opens the **Simulation** view.
4. **Analyze Results**: Review peak altitude, peak g-load, Max-Q dynamic pressure, and Keplerian orbit status. Scrub the timeline to watch the ascent trajectory.
5. **Optimize Trajectory**: Open **Optimization** (`/optimization`). Select an objective (e.g. *Minimize Propellant Mass*), set the evaluation budget, and click **Run Differential Evolution**. Review baseline vs. best feasible candidate comparisons.
6. **Compare Scenarios**: Open **Compare** (`/compare`) to benchmark all vehicle configurations and simulation outcomes side-by-side.
7. **Export & Save**: Export raw telemetry as a CSV file or save mission profiles to the local SQLite database.

---

## 6. Project Architecture

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
│   └── requirements.txt         # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, TrajectoryVisualizer, TelemetryCharts
│   │   ├── pages/               # Dashboard, Configure, Simulation, Optimization, Compare, Saved, Docs
│   │   ├── services/            # Typed REST API client
│   │   ├── types/               # TypeScript data models
│   │   ├── App.tsx              # React router and state container
│   │   └── main.tsx             # React DOM entrypoint
│   └── package.json             # Frontend dependencies
├── docs/                        # Complete technical and scientific documentation
│   ├── architecture.md
│   ├── physics-model.md
│   ├── api.md
│   └── limitations.md
├── .env.example
├── .gitignore
└── README.md
```

---

## 7. Model Assumptions & Educational Disclosures

- **Educational Purpose**: Developed for college aerospace engineering coursework and trajectory exploration; not certified for real-world spaceflight operations.
- **2D Planar ECI Dynamics**: Trajectory integration is computed in a 2D Earth-centered inertial equatorial plane; arbitrary orbital inclinations and out-of-plane plane changes are not modeled.
- **3-DOF Point Mass**: Vehicle attitude dynamics, moment of inertia tensors, and aeroelastic bending are simplified to a point mass.
- **Atmospheric Model**: Barometric exponential density model is used with zero drag above 150 km.
- **Zero Fabrication Guarantee**: All telemetry curves, peak parameters, and optimization candidates are computed directly through numerical simulation.

## Space experience and current startup

The home page now contains the animated introduction, synchronized solver playback, and validated rocket experiments. The previous dashboard remains at `/dashboard`. See [startup, coordinate conversion, and limitations](docs/space-experience.md).
