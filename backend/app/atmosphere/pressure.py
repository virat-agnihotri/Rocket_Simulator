"""Atmospheric Pressure and Temperature Models."""
import math
from app.physics.constants import (
    SEA_LEVEL_PRESSURE_P0,
    ATMOSPHERE_SCALE_HEIGHT_M,
    SEA_LEVEL_TEMPERATURE_T0,
    MAX_ATMOSPHERE_ALTITUDE_M,
)


def exponential_pressure(altitude_m: float, p0: float = SEA_LEVEL_PRESSURE_P0, scale_height_m: float = ATMOSPHERE_SCALE_HEIGHT_M) -> float:
    """
    Calculate hydrostatic atmospheric pressure in Pascals.
    
    Formula:
        P(h) = P0 * exp(-h / H)
    """
    if altitude_m <= 0:
        return p0
    if altitude_m >= MAX_ATMOSPHERE_ALTITUDE_M:
        return 0.0
    return p0 * math.exp(-altitude_m / scale_height_m)


def temperature_at_altitude(altitude_m: float) -> float:
    """
    Standard tropospheric temperature model with lapse rate.
    """
    if altitude_m <= 0:
        return SEA_LEVEL_TEMPERATURE_T0
    if altitude_m >= 11000.0:
        return 216.65  # Tropopause temperature (K)
    return SEA_LEVEL_TEMPERATURE_T0 - 0.0065 * altitude_m
