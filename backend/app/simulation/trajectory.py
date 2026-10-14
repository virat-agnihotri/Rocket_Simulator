"""Trajectory Simulation Execution and Telemetry Synthesis."""
import math
from typing import List, Tuple
import numpy as np

from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig
from app.models.state import TelemetryPoint
from app.models.results import SimulationResult
from app.physics.rocket_equation import ideal_delta_v
from app.physics.propulsion import burn_duration, propellant_mass_flow_rate
from app.simulation.dynamics import compute_dynamics_derivatives
from app.simulation.integrator import integrate_trajectory
from app.orbital.analysis import analyze_orbital_state
from app.orbital.evaluator import evaluate_target_orbit_satisfaction


def run_trajectory_simulation(
    vehicle: VehicleConfig,
    mission: MissionConfig,
    max_telemetry_points: int = 600
) -> SimulationResult:
    """
    Run full 2D trajectory flight simulation and produce validated SimulationResult.
    """
    # Theoretical ideal delta-v
    m0 = vehicle.initial_total_mass_kg
    mf = vehicle.burnout_mass_kg
    delta_v_ideal = ideal_delta_v(m0, mf, vehicle.specific_impulse_s)
    
    # Theoretical burn duration
    mdot = propellant_mass_flow_rate(vehicle.thrust_n, vehicle.specific_impulse_s)
    expected_burn_t = burn_duration(vehicle.propellant_mass_kg, mdot)

    # Execute numerical integration
    res = integrate_trajectory(vehicle, mission)
    
    warnings_list: List[str] = []
    assumptions_list: List[str] = [
        "Planar 2D equatorial flight simulation with Earth-centered inertial (ECI) coordinate frame.",
        "Point-mass rocket aerodynamics with constant drag coefficient Cd and frontal area A.",
        "Simplified barometric exponential atmospheric density model with zero drag above 150 km.",
        "Two-body Newtonian gravity without non-spherical Earth perturbations (J2 = 0).",
        "Simplified smooth pitchover guidance profile transitioning thrust vector towards horizontal.",
    ]

    if not res["success"] or res["sol"] is None or len(res["sol"].t) == 0:
        # Construct fallback failure result
        fallback_pos = np.array([6371000.0, 0.0])
        fallback_vel = np.array([0.0, 0.0])
        orb_metrics = analyze_orbital_state(fallback_pos, fallback_vel, mission.target_altitude_m, has_ground_impacted=True)
        orb_satisfied, orb_reasons = evaluate_target_orbit_satisfaction(orb_metrics, mission.target_altitude_m)

        dummy_pt = TelemetryPoint(
            time_s=0.0,
            x_m=fallback_pos[0],
            y_m=fallback_pos[1],
            vx_mps=0.0,
            vy_mps=0.0,
            altitude_m=0.0,
            downrange_distance_m=0.0,
            speed_mps=0.0,
            vertical_speed_mps=0.0,
            horizontal_speed_mps=0.0,
            mass_kg=m0,
            propellant_remaining_kg=vehicle.propellant_mass_kg,
            thrust_n=vehicle.thrust_n,
            drag_n=0.0,
            acceleration_mps2=0.0,
            dynamic_pressure_pa=0.0,
            atmospheric_density_kg_m3=1.225,
            pitch_angle_deg=0.0,
            is_engine_active=True,
        )

        return SimulationResult(
            status=res["status"],
            termination_reason=res["message"],
            telemetry=[dummy_pt],
            telemetry_count=1,
            burnout_state=dummy_pt,
            final_state=dummy_pt,
            peak_altitude_m=0.0,
            peak_speed_mps=0.0,
            peak_acceleration_mps2=0.0,
            maximum_dynamic_pressure_pa=0.0,
            total_flight_time_s=0.0,
            burn_duration_s=expected_burn_t,
            ideal_delta_v_mps=delta_v_ideal,
            orbital_metrics=orb_metrics,
            target_orbit_satisfied=False,
            warnings=[f"Simulation failed: {res['message']}"],
            model_assumptions=assumptions_list,
        )

    sol = res["sol"]
    times = sol.t
    states = sol.y  # Shape (5, N)
    n_pts = len(times)

    # Reconstruct telemetry details
    all_telemetry: List[TelemetryPoint] = []
    peak_alt = 0.0
    peak_spd = 0.0
    peak_acc = 0.0
    max_q = 0.0
    burnout_pt = None

    for i in range(n_pts):
        t_i = float(times[i])
        y_vec = states[:, i]
        _, diag = compute_dynamics_derivatives(t_i, y_vec, vehicle, mission)

        pt = TelemetryPoint(
            time_s=t_i,
            x_m=float(y_vec[0]),
            y_m=float(y_vec[1]),
            vx_mps=float(y_vec[2]),
            vy_mps=float(y_vec[3]),
            altitude_m=diag["altitude_m"],
            downrange_distance_m=diag["downrange_distance_m"],
            speed_mps=diag["speed_mps"],
            vertical_speed_mps=diag["vertical_speed_mps"],
            horizontal_speed_mps=diag["horizontal_speed_mps"],
            mass_kg=diag["mass_kg"],
            propellant_remaining_kg=diag["propellant_remaining_kg"],
            thrust_n=diag["thrust_n"],
            drag_n=diag["drag_n"],
            acceleration_mps2=diag["acceleration_mps2"],
            dynamic_pressure_pa=diag["dynamic_pressure_pa"],
            atmospheric_density_kg_m3=diag["atmospheric_density_kg_m3"],
            pitch_angle_deg=diag["pitch_angle_deg"],
            is_engine_active=diag["is_engine_active"],
        )
        all_telemetry.append(pt)

        # Track maxima
        if pt.altitude_m > peak_alt:
            peak_alt = pt.altitude_m
        if pt.speed_mps > peak_spd:
            peak_spd = pt.speed_mps
        if pt.acceleration_mps2 > peak_acc:
            peak_acc = pt.acceleration_mps2
        if pt.dynamic_pressure_pa > max_q:
            max_q = pt.dynamic_pressure_pa

        # Detect burnout state
        if burnout_pt is None and (not pt.is_engine_active or pt.propellant_remaining_kg <= 1e-3) and t_i > 1.0:
            burnout_pt = pt

    if burnout_pt is None and len(all_telemetry) > 0:
        burnout_pt = all_telemetry[-1]

    final_pt = all_telemetry[-1]

    # Downsample telemetry for API payload size if needed
    if len(all_telemetry) > max_telemetry_points:
        step = int(np.ceil(len(all_telemetry) / max_telemetry_points))
        sampled_telemetry = all_telemetry[::step]
        # Ensure final state is always included
        if sampled_telemetry[-1] != final_pt:
            sampled_telemetry.append(final_pt)
    else:
        sampled_telemetry = all_telemetry

    # Orbital analysis
    final_pos = np.array([final_pt.x_m, final_pt.y_m])
    final_vel = np.array([final_pt.vx_mps, final_pt.vy_mps])
    orbital_metrics = analyze_orbital_state(
        final_pos,
        final_vel,
        mission.target_altitude_m,
        has_ground_impacted=res["impacted"]
    )

    orbit_satisfied, orbit_reasons = evaluate_target_orbit_satisfaction(
        orbital_metrics,
        mission.target_altitude_m
    )

    # Check for engineering warnings
    initial_twr = vehicle.thrust_n / (m0 * 9.80665)
    if initial_twr < 1.05:
        warnings_list.append(f"Low liftoff thrust-to-weight ratio ({initial_twr:.2f} < 1.05); rocket exhibits minimal initial vertical acceleration.")
    if peak_acc > 70.0:  # ~7g
        warnings_list.append(f"High peak acceleration ({peak_acc / 9.80665:.1f} g) experienced; may exceed structural payload limits.")
    if max_q > 50000.0:
        warnings_list.append(f"High maximum dynamic pressure Max-Q ({max_q / 1000.0:.1f} kPa); high aerodynamic stresses.")
    if res["impacted"]:
        warnings_list.append("Rocket trajectory intersected Earth surface (ground impact).")

    warnings_list.extend(orbit_reasons)

    return SimulationResult(
        status=res["status"],
        termination_reason=res["message"],
        telemetry=sampled_telemetry,
        telemetry_count=len(sampled_telemetry),
        burnout_state=burnout_pt,
        final_state=final_pt,
        peak_altitude_m=float(peak_alt),
        peak_speed_mps=float(peak_spd),
        peak_acceleration_mps2=float(peak_acc),
        maximum_dynamic_pressure_pa=float(max_q),
        total_flight_time_s=float(final_pt.time_s),
        burn_duration_s=float(res["burnout_time"] if res["burnout_time"] is not None else expected_burn_t),
        ideal_delta_v_mps=float(delta_v_ideal),
        orbital_metrics=orbital_metrics,
        target_orbit_satisfied=orbit_satisfied,
        warnings=warnings_list,
        model_assumptions=assumptions_list,
    )
