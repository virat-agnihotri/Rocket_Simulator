"""Optimization Constraints and Feasibility Checking."""
from typing import Dict, Tuple
from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig
from app.models.results import SimulationResult


class OptimizationConstraintsConfig:
    def __init__(
        self,
        max_acceleration_mps2: float = 75.0,
        max_dynamic_pressure_pa: float = 60000.0,
        min_liftoff_twr: float = 1.05,
        max_eccentricity: float = 0.10,
        min_periapsis_altitude_m: float = 140000.0,
        max_altitude_error_fraction: float = 0.20,
    ):
        self.max_acceleration_mps2 = max_acceleration_mps2
        self.max_dynamic_pressure_pa = max_dynamic_pressure_pa
        self.min_liftoff_twr = min_liftoff_twr
        self.max_eccentricity = max_eccentricity
        self.min_periapsis_altitude_m = min_periapsis_altitude_m
        self.max_altitude_error_fraction = max_altitude_error_fraction


def evaluate_constraints(
    vehicle: VehicleConfig,
    mission: MissionConfig,
    sim_result: SimulationResult,
    config: OptimizationConstraintsConfig = OptimizationConstraintsConfig()
) -> Tuple[bool, Dict[str, float]]:
    """
    Evaluate constraint violations.
    
    A violation value > 0 indicates non-compliance.
    Returns:
        (is_feasible: bool, violations: Dict[str, float])
    """
    violations: Dict[str, float] = {}

    # 1. Liftoff TWR
    g0 = 9.80665
    liftoff_twr = vehicle.thrust_n / (vehicle.initial_total_mass_kg * g0)
    if liftoff_twr < config.min_liftoff_twr:
        violations["min_liftoff_twr"] = config.min_liftoff_twr - liftoff_twr

    # 2. Peak acceleration
    if sim_result.peak_acceleration_mps2 > config.max_acceleration_mps2:
        violations["max_acceleration_mps2"] = (
            sim_result.peak_acceleration_mps2 - config.max_acceleration_mps2
        )

    # 3. Max dynamic pressure (Max-Q)
    if sim_result.maximum_dynamic_pressure_pa > config.max_dynamic_pressure_pa:
        violations["max_dynamic_pressure_pa"] = (
            sim_result.maximum_dynamic_pressure_pa - config.max_dynamic_pressure_pa
        )

    # 4. Target orbit conditions
    orb = sim_result.orbital_metrics

    # Periapsis clearance
    if orb.periapsis_altitude_m is None or orb.periapsis_altitude_m < config.min_periapsis_altitude_m:
        actual_peri = orb.periapsis_altitude_m if orb.periapsis_altitude_m is not None else -100000.0
        violations["min_periapsis_altitude_m"] = config.min_periapsis_altitude_m - actual_peri

    # Eccentricity
    ecc = orb.eccentricity if orb.eccentricity is not None else 1.0
    if ecc > config.max_eccentricity:
        violations["max_eccentricity"] = ecc - config.max_eccentricity

    # Target altitude error
    allowed_alt_err = mission.target_altitude_m * config.max_altitude_error_fraction
    if orb.target_altitude_error_m > allowed_alt_err:
        violations["max_altitude_error_m"] = orb.target_altitude_error_m - allowed_alt_err

    is_feasible = (len(violations) == 0) and (sim_result.status == "SUCCESS")
    return is_feasible, violations
