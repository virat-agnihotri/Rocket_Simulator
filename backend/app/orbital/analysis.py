"""Orbital Analysis and Classification."""
import numpy as np
from app.physics.constants import EARTH_RADIUS_M, KARMAN_LINE_ALTITUDE_M
from app.models.results import OrbitClassification, OrbitalMetrics
from app.orbital.mechanics import (
    orbital_elements_from_state,
    circular_orbit_velocity,
)


def classify_orbit(
    elements: dict,
    has_ground_impacted: bool = False
) -> OrbitClassification:
    """
    Classify the trajectory into an orbit category based on Keplerian elements.
    
    Rules:
    - If impacted ground during simulation: GROUND_IMPACT
    - If eccentricity >= 1.0 or specific energy >= 0: ESCAPE_HYPERBOLIC
    - If periapsis altitude < 0: GROUND_IMPACT
    - If periapsis altitude < KARMAN_LINE_ALTITUDE_M (100 km): SUBORBITAL
      (Atmospheric reentry will occur within one orbit)
    - If periapsis altitude >= 100 km and eccentricity < 0.05: CIRCULAR
    - If periapsis altitude >= 100 km and eccentricity >= 0.05: ELLIPTICAL
    """
    if has_ground_impacted:
        return OrbitClassification.GROUND_IMPACT

    ecc = elements["eccentricity"]
    eps = elements["specific_energy"]
    h = elements["angular_momentum"]
    periapsis_alt = elements["periapsis_altitude_m"]

    # True hyperbolic escape requires non-negative orbital energy (v >= v_escape)
    if eps >= 0.0:
        return OrbitClassification.ESCAPE_HYPERBOLIC

    # If bound (eps < 0) but angular momentum is near zero or periapsis penetrates Earth:
    # This is a degenerate radial plunge or Earth-intersecting suborbital arc
    if abs(h) < 1.0 or periapsis_alt < 0:
        return OrbitClassification.SUBORBITAL

    if periapsis_alt < KARMAN_LINE_ALTITUDE_M:
        return OrbitClassification.SUBORBITAL

    if ecc < 0.05:
        return OrbitClassification.CIRCULAR

    return OrbitClassification.ELLIPTICAL


def analyze_orbital_state(
    position: np.ndarray,
    velocity: np.ndarray,
    target_altitude_m: float,
    has_ground_impacted: bool = False
) -> OrbitalMetrics:
    """
    Perform complete Keplerian analysis on the final state vector.
    """
    elements = orbital_elements_from_state(position, velocity)
    classification = classify_orbit(elements, has_ground_impacted)

    target_radius = EARTH_RADIUS_M + target_altitude_m
    v_circ_target = circular_orbit_velocity(target_radius)

    apoapsis_alt = elements["apoapsis_altitude_m"]
    if apoapsis_alt is not None:
        target_alt_err = float(abs(apoapsis_alt - target_altitude_m))
    else:
        target_alt_err = float("inf")

    # Final speed deviation from circular speed at current radius
    current_radius = elements["radius_m"]
    v_circ_current = circular_orbit_velocity(current_radius)
    v_err = float(abs(elements["speed_mps"] - v_circ_current))

    return OrbitalMetrics(
        semi_major_axis_m=elements["semi_major_axis_m"],
        eccentricity=elements["eccentricity"],
        apoapsis_altitude_m=elements["apoapsis_altitude_m"],
        periapsis_altitude_m=elements["periapsis_altitude_m"],
        orbital_period_s=elements["orbital_period_s"],
        specific_energy_j_kg=elements["specific_energy"],
        specific_angular_momentum_m2_s=elements["angular_momentum"],
        target_circular_velocity_mps=v_circ_target,
        target_altitude_error_m=target_alt_err,
        target_velocity_error_mps=v_err,
        orbit_classification=classification,
    )
