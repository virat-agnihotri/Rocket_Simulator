"""Newtonian Gravitational Models."""
import numpy as np
from app.physics.constants import EARTH_MU, EARTH_RADIUS_M


def gravitational_acceleration_scalar(radius_m: float) -> float:
    """
    Calculate the magnitude of Newtonian gravitational acceleration.
    
    Formula:
        g(r) = μ / r^2
        
    Args:
        radius_m: Distance from Earth's center in meters. Must be > 0.
        
    Returns:
        Gravitational acceleration magnitude in m/s^2.
    """
    if radius_m <= 0:
        raise ValueError("Orbital radius from Earth center must be strictly positive.")
    return EARTH_MU / (radius_m ** 2)


def gravitational_acceleration_at_altitude(altitude_m: float) -> float:
    """
    Calculate gravitational acceleration at a given altitude above sea level.
    """
    radius = EARTH_RADIUS_M + altitude_m
    return gravitational_acceleration_scalar(radius)


def gravitational_acceleration_vector(position: np.ndarray) -> np.ndarray:
    """
    Calculate the 2D gravitational acceleration vector towards Earth's center.
    
    Formula:
        a_g = -μ * r / |r|^3
        
    Args:
        position: 2D numpy array [x, y] in meters from Earth center.
        
    Returns:
        2D numpy array [ax, ay] in m/s^2.
    """
    r_mag = np.linalg.norm(position)
    if r_mag <= 0:
        raise ValueError("Position magnitude must be non-zero.")
    return -EARTH_MU * position / (r_mag ** 3)
