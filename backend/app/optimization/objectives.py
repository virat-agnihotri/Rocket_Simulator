"""Optimization Objective Functions."""
from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig
from app.models.results import SimulationResult, OptimizationObjective


def evaluate_objective(
    objective_type: OptimizationObjective,
    vehicle: VehicleConfig,
    mission: MissionConfig,
    sim_result: SimulationResult
) -> float:
    """
    Calculate the scalar objective value to be minimized.
    """
    target_alt = mission.target_altitude_m
    orb = sim_result.orbital_metrics

    if objective_type == OptimizationObjective.MINIMIZE_PROPELLANT:
        # Objective is propellant mass in kg, plus penalty for orbit error
        alt_err_frac = abs(orb.target_altitude_error_m) / target_alt
        ecc_penalty = (orb.eccentricity or 1.0) * 10000.0
        return vehicle.propellant_mass_kg + (alt_err_frac * 50000.0) + ecc_penalty

    elif objective_type == OptimizationObjective.MINIMIZE_ORBIT_ERROR:
        # Normalized quadratic error in altitude and eccentricity
        alt_err_norm = (orb.target_altitude_error_m / target_alt) ** 2
        ecc_val = orb.eccentricity if orb.eccentricity is not None else 1.0
        ecc_norm = (ecc_val / 0.05) ** 2
        return alt_err_norm + ecc_norm

    elif objective_type == OptimizationObjective.MAXIMIZE_PAYLOAD:
        # Minimize negative payload fraction
        total_m = vehicle.initial_total_mass_kg
        payload_fraction = vehicle.payload_mass_kg / total_m if total_m > 0 else 0.0
        return -payload_fraction * 100.0

    return 0.0
