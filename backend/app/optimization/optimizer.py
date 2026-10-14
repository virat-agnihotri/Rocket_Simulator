"""Numerical Optimization Engine using Differential Evolution."""
import time
from typing import List, Dict, Any, Optional
import numpy as np
from scipy.optimize import differential_evolution

from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig, GuidanceConfig
from app.models.results import (
    OptimizationResult,
    OptimizationCandidate,
    OptimizationObjective,
    SimulationResult,
)
from app.simulation.trajectory import run_trajectory_simulation
from app.optimization.objectives import evaluate_objective
from app.optimization.constraints import evaluate_constraints, OptimizationConstraintsConfig


def run_mission_optimization(
    baseline_vehicle: VehicleConfig,
    baseline_mission: MissionConfig,
    objective: OptimizationObjective = OptimizationObjective.MINIMIZE_PROPELLANT,
    max_evaluations: int = 50,
    seed: int = 42,
    propellant_bounds: Optional[tuple] = None,
    pitch_deg_bounds: Optional[tuple] = (75.0, 89.5),
    pitch_exponent_bounds: Optional[tuple] = (0.3, 0.9),
) -> OptimizationResult:
    """
    Run constrained differential evolution optimization on flight parameters.
    """
    start_time = time.time()
    evaluation_counter = 0
    candidate_history: List[OptimizationCandidate] = []
    best_candidate: Optional[OptimizationCandidate] = None

    # Determine propellant search bounds
    if propellant_bounds is None:
        p_base = baseline_vehicle.propellant_mass_kg
        p_min = max(1000.0, p_base * 0.6)
        p_max = p_base * 1.5
        propellant_bounds = (p_min, p_max)

    # Decision variables vector: [propellant_mass_kg, target_pitch_deg, pitch_exponent]
    bounds = [
        propellant_bounds,
        pitch_deg_bounds or (75.0, 89.5),
        pitch_exponent_bounds or (0.3, 0.9),
    ]

    # First, evaluate the baseline configuration
    baseline_sim = run_trajectory_simulation(baseline_vehicle, baseline_mission)
    is_base_feas, base_viol = evaluate_constraints(baseline_vehicle, baseline_mission, baseline_sim)
    base_obj_val = evaluate_objective(objective, baseline_vehicle, baseline_mission, baseline_sim)

    baseline_candidate = OptimizationCandidate(
        vehicle=baseline_vehicle,
        mission=baseline_mission,
        objective_value=base_obj_val,
        is_feasible=is_base_feas,
        constraint_violations=base_viol,
        peak_altitude_m=baseline_sim.peak_altitude_m,
        target_altitude_error_m=baseline_sim.orbital_metrics.target_altitude_error_m,
        peak_acceleration_mps2=baseline_sim.peak_acceleration_mps2,
        max_q_pa=baseline_sim.maximum_dynamic_pressure_pa,
        orbit_classification=baseline_sim.orbital_metrics.orbit_classification,
        target_orbit_satisfied=baseline_sim.target_orbit_satisfied,
    )

    if is_base_feas:
        best_candidate = baseline_candidate

    def loss_function(params: np.ndarray) -> float:
        nonlocal evaluation_counter, best_candidate
        evaluation_counter += 1

        p_mass, pitch_deg, p_exp = params

        # Build candidate vehicle
        cand_vehicle = baseline_vehicle.model_copy(
            update={"propellant_mass_kg": float(p_mass)}
        )

        # Build candidate guidance
        cand_guidance = baseline_mission.guidance_configuration.model_copy(
            update={
                "target_pitch_deg": float(pitch_deg),
                "pitch_exponent": float(p_exp),
            }
        )
        cand_mission = baseline_mission.model_copy(
            update={"guidance_configuration": cand_guidance}
        )

        # Run actual trajectory simulation
        sim = run_trajectory_simulation(cand_vehicle, cand_mission, max_telemetry_points=100)
        is_feas, viol = evaluate_constraints(cand_vehicle, cand_mission, sim)
        raw_obj = evaluate_objective(objective, cand_vehicle, cand_mission, sim)

        # Penalty term for constraint violations
        penalty = 0.0
        for k, v in viol.items():
            penalty += abs(v) * 100.0

        if not is_feas:
            penalty += 100000.0

        total_loss = raw_obj + penalty

        cand_summary = OptimizationCandidate(
            vehicle=cand_vehicle,
            mission=cand_mission,
            objective_value=raw_obj,
            is_feasible=is_feas,
            constraint_violations=viol,
            peak_altitude_m=sim.peak_altitude_m,
            target_altitude_error_m=sim.orbital_metrics.target_altitude_error_m,
            peak_acceleration_mps2=sim.peak_acceleration_mps2,
            max_q_pa=sim.maximum_dynamic_pressure_pa,
            orbit_classification=sim.orbital_metrics.orbit_classification,
            target_orbit_satisfied=sim.target_orbit_satisfied,
        )

        # Retain a sample of candidate evaluations
        if len(candidate_history) < 25 or is_feas:
            candidate_history.append(cand_summary)

        if is_feas:
            if best_candidate is None or raw_obj < best_candidate.objective_value:
                best_candidate = cand_summary

        return float(total_loss)

    # Configure differential evolution budget
    # popsize * len(bounds) * maxiter ~ max_evaluations
    popsize = 5
    maxiter = max(2, int(max_evaluations / (popsize * len(bounds))))

    de_res = differential_evolution(
        func=loss_function,
        bounds=bounds,
        maxiter=maxiter,
        popsize=popsize,
        seed=seed,
        polish=False,
    )

    elapsed_s = time.time() - start_time
    feasible_count = sum(1 for c in candidate_history if c.is_feasible)

    if best_candidate is not None:
        status = "COMPLETED"
        msg = f"Feasible candidate found with objective value {best_candidate.objective_value:.2f} across {evaluation_counter} evaluations."
    else:
        status = "NO_FEASIBLE_SOLUTION"
        msg = f"No candidate met all strict physical constraints within search budget ({evaluation_counter} evaluations)."

    return OptimizationResult(
        status=status,
        objective=objective,
        baseline_candidate=baseline_candidate,
        best_feasible_candidate=best_candidate,
        evaluation_count=evaluation_counter,
        feasible_count=feasible_count,
        algorithm_settings={
            "algorithm": "differential_evolution",
            "seed": seed,
            "maxiter": maxiter,
            "popsize": popsize,
            "bounds": {
                "propellant_mass_kg": list(propellant_bounds),
                "target_pitch_deg": list(bounds[1]),
                "pitch_exponent": list(bounds[2]),
            },
        },
        candidate_history=candidate_history[:30],
        execution_duration_s=elapsed_s,
        message=msg,
    )
