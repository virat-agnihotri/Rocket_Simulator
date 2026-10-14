"""Atmospheric Wind and Relative Velocity Models."""
import numpy as np


def compute_relative_velocity(
    inertial_velocity: np.ndarray,
    wind_vector: np.ndarray = np.array([0.0, 0.0])
) -> np.ndarray:
    """
    Calculate rocket velocity relative to the ambient air mass.
    
    Formula:
        v_rel = v_rocket - v_wind
        
    Args:
        inertial_velocity: 2D array [vx, vy] (m/s)
        wind_vector: 2D array [wx, wy] (m/s)
        
    Returns:
        2D array of air-relative velocity [v_rel_x, v_rel_y] (m/s)
    """
    return inertial_velocity - wind_vector
