"""Two-Body Classical Keplerian Orbital Mechanics."""
import math
import numpy as np
from app.physics.constants import EARTH_MU, EARTH_RADIUS_M


def circular_orbit_velocity(radius_m: float) -> float:
    """
    Theoretical speed for a circular orbit at given orbital radius.
    
    Formula:
        v_circ = sqrt(μ / r)
    """
    if radius_m <= 0:
        raise ValueError("Orbital radius must be strictly positive.")
    return math.sqrt(EARTH_MU / radius_m)


def circular_orbit_period(radius_m: float) -> float:
    """
    Orbital period for a circular orbit at given orbital radius.
    
    Formula:
        T = 2π * sqrt(r^3 / μ)
    """
    if radius_m <= 0:
        raise ValueError("Orbital radius must be strictly positive.")
    return 2.0 * math.pi * math.sqrt((radius_m ** 3) / EARTH_MU)


def specific_orbital_energy(radius_m: float, speed_mps: float) -> float:
    """
    Calculate specific orbital energy ε (vis-viva energy per unit mass).
    
    Formula:
        ε = v^2 / 2 - μ / r
    """
    if radius_m <= 0:
        raise ValueError("Orbital radius must be strictly positive.")
    return 0.5 * (speed_mps ** 2) - (EARTH_MU / radius_m)


def specific_angular_momentum_2d(position: np.ndarray, velocity: np.ndarray) -> float:
    """
    Calculate specific angular momentum h for 2D planar motion.
    
    Formula:
        h = x * vy - y * vx
    """
    return float(position[0] * velocity[1] - position[1] * velocity[0])


def eccentricity_vector_2d(position: np.ndarray, velocity: np.ndarray) -> np.ndarray:
    """
    Calculate the 2D Runge-Lenz eccentricity vector e.
    
    Formula:
        e = (v x h) / μ - r / |r|
    """
    r_mag = float(np.linalg.norm(position))
    if r_mag <= 0:
        raise ValueError("Position magnitude must be non-zero.")
    h = specific_angular_momentum_2d(position, velocity)
    # in 2D: v x (h k) = (vy*h) i - (vx*h) j
    v_cross_h = np.array([velocity[1] * h, -velocity[0] * h])
    return (v_cross_h / EARTH_MU) - (position / r_mag)


def orbital_elements_from_state(position: np.ndarray, velocity: np.ndarray):
    """
    Compute Keplerian elements from 2D state vector.
    
    Returns:
        dict containing:
            radius_m, speed_mps, specific_energy, angular_momentum,
            semi_major_axis_m, eccentricity, periapsis_radius_m,
            apoapsis_radius_m, periapsis_altitude_m, apoapsis_altitude_m,
            orbital_period_s
    """
    r_mag = float(np.linalg.norm(position))
    v_mag = float(np.linalg.norm(velocity))
    eps = specific_orbital_energy(r_mag, v_mag)
    h = specific_angular_momentum_2d(position, velocity)
    e_vec = eccentricity_vector_2d(position, velocity)
    ecc = float(np.linalg.norm(e_vec))

    # Semi-major axis from vis-viva equation: ε = -μ / (2a)
    if abs(eps) > 1e-9:
        a = -EARTH_MU / (2.0 * eps)
    else:
        a = float("inf")

    if ecc < 1.0 and a > 0:
        r_periapsis = a * (1.0 - ecc)
        r_apoapsis = a * (1.0 + ecc)
        period_s = 2.0 * math.pi * math.sqrt((a ** 3) / EARTH_MU)
    else:
        # Parabolic or Hyperbolic
        r_periapsis = (h ** 2) / (EARTH_MU * (1.0 + ecc)) if (1.0 + ecc) > 0 else 0.0
        r_apoapsis = float("inf")
        period_s = None

    return {
        "radius_m": r_mag,
        "speed_mps": v_mag,
        "specific_energy": eps,
        "angular_momentum": h,
        "semi_major_axis_m": a if a != float("inf") else None,
        "eccentricity": ecc,
        "periapsis_radius_m": r_periapsis,
        "apoapsis_radius_m": r_apoapsis if r_apoapsis != float("inf") else None,
        "periapsis_altitude_m": r_periapsis - EARTH_RADIUS_M,
        "apoapsis_altitude_m": (r_apoapsis - EARTH_RADIUS_M) if r_apoapsis != float("inf") else None,
        "orbital_period_s": period_s,
    }
