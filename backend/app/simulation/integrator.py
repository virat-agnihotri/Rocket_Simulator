"""Numerical Integrator and Event Handling."""
from typing import Tuple, List, Dict, Any
import numpy as np
from scipy.integrate import solve_ivp

from app.physics.constants import EARTH_RADIUS_M
from app.simulation.dynamics import compute_dynamics_derivatives
from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig


def ground_impact_event(t: float, state: np.ndarray, vehicle: VehicleConfig, mission: MissionConfig) -> float:
    """
    Triggers terminal event when rocket impacts Earth after liftoff.
    Only active after 5 seconds to avoid initial launch-pad triggering.
    """
    if t < 5.0:
        return 1.0  # Safe initial period
    x, y = state[0], state[1]
    r = np.sqrt(x * x + y * y)
    alt = r - EARTH_RADIUS_M
    return float(alt)

ground_impact_event.terminal = True
ground_impact_event.direction = -1.0  # Descending through surface


def propellant_burnout_event(t: float, state: np.ndarray, vehicle: VehicleConfig, mission: MissionConfig) -> float:
    """
    Detects propellant exhaustion. Does NOT terminate simulation; allows coasting.
    """
    return float(state[4])

propellant_burnout_event.terminal = False
propellant_burnout_event.direction = -1.0


def integrate_trajectory(
    vehicle: VehicleConfig,
    mission: MissionConfig
) -> Dict[str, Any]:
    """
    Perform numerical integration using scipy.integrate.solve_ivp.
    """
    # Initial conditions
    # Launch pad on the equatorial surface + launch elevation
    r_launch = EARTH_RADIUS_M + mission.launch_altitude_m
    x0 = r_launch
    y0 = 0.0

    # Initial velocity: stationary relative to rotating Earth surface
    # Corotation at equator: v_corot = omega * r_launch in +y direction
    omega_E = 7.2921159e-5
    vx0 = 0.0
    vy0 = omega_E * r_launch  # ~464 m/s eastward assist at equator

    # Propellant mass
    m_prop0 = vehicle.propellant_mass_kg

    initial_state = np.array([x0, y0, vx0, vy0, m_prop0], dtype=float)

    # Time grid
    t_span = (0.0, float(mission.simulation_duration_s))
    dt = float(mission.output_interval_s)
    # Ensure reasonable sampling grid
    num_pts = int(np.ceil(mission.simulation_duration_s / dt)) + 1
    t_eval = np.linspace(0.0, mission.simulation_duration_s, num_pts)

    def ode_system(t_val, y_val):
        derivs, _ = compute_dynamics_derivatives(t_val, y_val, vehicle, mission)
        return derivs

    # Event wrappers
    def ev_impact(t_val, y_val):
        return ground_impact_event(t_val, y_val, vehicle, mission)
    ev_impact.terminal = True
    ev_impact.direction = -1.0

    def ev_burnout(t_val, y_val):
        return propellant_burnout_event(t_val, y_val, vehicle, mission)
    ev_burnout.terminal = False
    ev_burnout.direction = -1.0

    events_list = [ev_impact, ev_burnout]
    if mission.engine_shutdown_time_s is not None:
        def ev_shutdown(t_val, y_val):
            return t_val - mission.engine_shutdown_time_s
        ev_shutdown.terminal = False
        ev_shutdown.direction = 1.0
        events_list.append(ev_shutdown)

    solver_settings = mission.numerical_solver_settings

    try:
        sol = solve_ivp(
            fun=ode_system,
            t_span=t_span,
            y0=initial_state,
            method=solver_settings.method,
            t_eval=t_eval,
            events=events_list,
            rtol=solver_settings.rtol,
            atol=solver_settings.atol,
            max_step=solver_settings.max_step_s,
        )
    except Exception as exc:
        return {
            "success": False,
            "status": "SOLVER_ERROR",
            "message": f"Numerical solver failure: {str(exc)}",
            "sol": None,
            "impacted": False,
            "burnout_time": None
        }

    # Evaluate event occurrences
    impacted = False
    if sol.t_events and len(sol.t_events[0]) > 0:
        impacted = True
        status = "GROUND_IMPACT"
        msg = f"Vehicle impacted ground at t = {sol.t_events[0][0]:.1f} s."
    elif sol.status == 0:
        status = "SUCCESS"
        msg = "Simulation completed target duration."
    else:
        status = "TERMINATED"
        msg = sol.message

    burnout_t = None
    if sol.t_events and len(sol.t_events[1]) > 0:
        burnout_t = float(sol.t_events[1][0])

    return {
        "success": sol.success,
        "status": status,
        "message": msg,
        "sol": sol,
        "impacted": impacted,
        "burnout_time": burnout_t
    }
