# REST API Reference Documentation

Base URL: `http://localhost:8000` (or `http://127.0.0.1:8000`)
Interactive OpenAPI Docs: `http://localhost:8000/docs`

---

## 1. System Health

### `GET /health`
Returns backend health status and operational parameters.
- **Response 200**:
  ```json
  {
    "status": "healthy",
    "service": "Rocket Mission Simulation & Optimization Platform",
    "version": "1.0.0"
  }
  ```

---

## 2. Flight Trajectory Simulations

### `POST /api/simulations`
Executes real-time 2D Runge-Kutta numerical flight integration and returns sampled telemetry, cutoff state, and Keplerian orbital metrics.

- **Request Body**:
  ```json
  {
    "vehicle": {
      "dry_mass_kg": 25000.0,
      "payload_mass_kg": 4000.0,
      "propellant_mass_kg": 380000.0,
      "thrust_n": 5800000.0,
      "specific_impulse_s": 360.0,
      "drag_coefficient": 0.28,
      "reference_area_m2": 10.5
    },
    "mission": {
      "target_altitude_m": 400000.0,
      "launch_altitude_m": 0.0,
      "simulation_duration_s": 900.0,
      "output_interval_s": 1.0,
      "selected_atmosphere_model": "exponential",
      "wind_velocity_x_mps": 0.0,
      "guidance_configuration": {
        "pitchover_altitude_m": 600.0,
        "pitch_end_altitude_m": 85000.0,
        "target_pitch_deg": 87.2,
        "pitch_exponent": 0.52
      }
    },
    "persist_result": true
  }
  ```

- **Response 200**:
  Returns `SimulationResult` object containing:
  - `status`: `"SUCCESS"` | `"GROUND_IMPACT"` | `"SOLVER_ERROR"`
  - `telemetry`: Array of sampled `TelemetryPoint` records
  - `peak_altitude_m`, `peak_speed_mps`, `peak_acceleration_mps2`, `maximum_dynamic_pressure_pa`
  - `orbital_metrics`: Keplerian semi-major axis, eccentricity, apoapsis, periapsis, classification
  - `target_orbit_satisfied`: Boolean evaluating true insertion criteria
  - `warnings` and `model_assumptions`

### `GET /api/simulations/{id}`
Retrieves previously persisted simulation output by ID.

### `GET /api/simulations/{id}/export/csv`
Downloads full telemetry data as a formatted CSV file.

---

## 3. Constrained Numerical Optimization

### `POST /api/optimizations`
Runs differential evolution parameter search to optimize ascent parameters.

- **Request Body**:
  ```json
  {
    "baseline_vehicle": { ... },
    "baseline_mission": { ... },
    "objective": "minimize_propellant",
    "max_evaluations": 35,
    "seed": 42
  }
  ```

- **Supported Objectives**:
  - `minimize_propellant`
  - `minimize_orbit_error`
  - `maximize_payload`

- **Response 200**:
  Returns `OptimizationResult` containing `baseline_candidate`, `best_feasible_candidate`, evaluation counts, and candidate history.

---

## 4. Mission Profile Scenarios

### `GET /api/missions/presets`
Returns predefined educational benchmark configurations (Medium-Lift LEO, SmallSat Launcher, Suborbital Sounding).

### `GET /api/missions`
Lists all saved mission configurations from the SQLite database.

### `POST /api/missions`
Saves a new vehicle and mission configuration.

### `GET /api/missions/{id}`
Fetches mission specification and previous simulation runs.

### `DELETE /api/missions/{id}`
Deletes a saved mission scenario.
