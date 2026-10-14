"""Ascent Guidance and Pitch Program."""
from __future__ import annotations
import math
import numpy as np
from app.models.mission import GuidanceConfig


def compute_pitch_angle_deg(altitude_m: float, config: GuidanceConfig) -> float:
    """
    Calculate the pitch angle relative to local vertical in degrees.
    
    0° = Local vertical (pointing straight up)
    90° = Local horizontal (tangential eastward)
    
    Profile:
    - Below pitchover_altitude_m: 0° (vertical liftoff)
    - Between pitchover and pitch_end_altitude: continuous curve towards target_pitch_deg
    - Above pitch_end_altitude: target_pitch_deg
    """
    h_start = config.pitchover_altitude_m
    h_end = config.pitch_end_altitude_m

    if altitude_m <= h_start:
        return 0.0

    if altitude_m >= h_end:
        return config.target_pitch_deg

    # Normalized height fraction [0, 1]
    u = (altitude_m - h_start) / (h_end - h_start)
    # Pitch curve using configurable exponent
    return config.target_pitch_deg * (u ** config.pitch_exponent)


def thrust_direction_vector(
    position: np.ndarray,
    altitude_m: float,
    config: GuidanceConfig
) -> Tuple_Vector:
    """
    Calculate the unit direction vector of engine thrust in 2D inertial frame.
    
    Formula:
        u_thrust = cos(pitch) * e_radial + sin(pitch) * e_tangential
    """
    r_mag = float(np.linalg.norm(position))
    if r_mag <= 0:
        return np.array([1.0, 0.0]), 0.0

    e_r = position / r_mag
    e_theta = np.array([-e_r[1], e_r[0]])

    pitch_deg = compute_pitch_angle_deg(altitude_m, config)
    pitch_rad = math.radians(pitch_deg)

    thrust_dir = math.cos(pitch_rad) * e_r + math.sin(pitch_rad) * e_theta
    # Ensure unit norm
    thrust_norm = np.linalg.norm(thrust_dir)
    if thrust_norm > 0:
        thrust_dir = thrust_dir / thrust_norm

    return thrust_dir, pitch_deg


# Helper type annotation
from typing import Tuple
Tuple_Vector = Tuple[np.ndarray, float]
