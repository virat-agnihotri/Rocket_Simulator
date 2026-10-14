"""Target Orbit Satisfaction Evaluator."""
from typing import Tuple, List
from app.models.results import OrbitalMetrics, OrbitClassification


def evaluate_target_orbit_satisfaction(
    metrics: OrbitalMetrics,
    target_altitude_m: float,
    altitude_tolerance_fraction: float = 0.15,
    max_eccentricity: float = 0.08,
    min_periapsis_altitude_m: float = 140000.0,
) -> Tuple[bool, List[str]]:
    """
    Evaluate whether the simulated final trajectory satisfies target orbital insertion conditions.
    
    CRITICAL RULE:
        Reaching the target altitude during flight DOES NOT constitute orbital success.
        The spacecraft must achieve orbital velocity, bound specific energy, a periapsis
        clearing the dense atmosphere (>= 140 km), and a small eccentricity.
        
    Args:
        metrics: Computed OrbitalMetrics from Keplerian analysis.
        target_altitude_m: Target orbital altitude in meters.
        altitude_tolerance_fraction: Allowed fractional deviation of apoapsis (default: 15%).
        max_eccentricity: Maximum acceptable eccentricity for near-circular orbit (default: 0.08).
        min_periapsis_altitude_m: Minimum altitude required for sustainable orbit (m).
        
    Returns:
        (is_satisfied: bool, reasons: List[str])
    """
    reasons: List[str] = []

    if metrics.orbit_classification in (OrbitClassification.GROUND_IMPACT, OrbitClassification.INVALID):
        return False, ["Trajectory impacted ground or is physically invalid."]

    if metrics.orbit_classification == OrbitClassification.ESCAPE_HYPERBOLIC:
        return False, ["Vehicle exceeded escape velocity and entered an unbound hyperbolic trajectory."]

    if metrics.periapsis_altitude_m is None or metrics.periapsis_altitude_m < min_periapsis_altitude_m:
        actual_peri = metrics.periapsis_altitude_m if metrics.periapsis_altitude_m is not None else -1
        reasons.append(
            f"Periapsis ({actual_peri / 1000.0:.1f} km) is below safe orbital altitude ({min_periapsis_altitude_m / 1000.0:.1f} km); trajectory re-enters atmosphere."
        )

    if metrics.eccentricity is None or metrics.eccentricity > max_eccentricity:
        ecc_val = metrics.eccentricity if metrics.eccentricity is not None else 1.0
        reasons.append(f"Eccentricity ({ecc_val:.4f}) exceeds circular tolerance threshold ({max_eccentricity}).")

    allowed_alt_error = max(target_altitude_m * altitude_tolerance_fraction, 30000.0)
    if metrics.apoapsis_altitude_m is None or abs(metrics.apoapsis_altitude_m - target_altitude_m) > allowed_alt_error:
        actual_apo = metrics.apoapsis_altitude_m if metrics.apoapsis_altitude_m is not None else 0
        reasons.append(
            f"Apoapsis altitude ({actual_apo / 1000.0:.1f} km) deviates from target ({target_altitude_m / 1000.0:.1f} km) by more than allowed tolerance (±{allowed_alt_error / 1000.0:.1f} km)."
        )

    is_satisfied = (len(reasons) == 0)
    if is_satisfied:
        reasons.append(
            f"Target circular orbit at {target_altitude_m / 1000.0:.1f} km achieved successfully with e={metrics.eccentricity:.4f} and periapsis at {metrics.periapsis_altitude_m / 1000.0:.1f} km."
        )

    return is_satisfied, reasons
