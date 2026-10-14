"""Atmospheric Density Models."""
import math
from app.physics.constants import (
    SEA_LEVEL_DENSITY_RHO0,
    ATMOSPHERE_SCALE_HEIGHT_M,
    MAX_ATMOSPHERE_ALTITUDE_M,
)


def exponential_density(altitude_m: float, rho0: float = SEA_LEVEL_DENSITY_RHO0, scale_height_m: float = ATMOSPHERE_SCALE_HEIGHT_M) -> float:
    """
    Calculate atmospheric density using the barometric exponential scale height model.
    
    Formula:
        ρ(h) = ρ0 * exp(-h / H)
        
    Args:
        altitude_m: Altitude above mean sea level in meters.
        rho0: Sea-level atmospheric density (kg/m^3).
        scale_height_m: Atmospheric scale height (m).
        
    Returns:
        Atmospheric density in kg/m^3.
    """
    if altitude_m <= 0:
        return rho0
    if altitude_m >= MAX_ATMOSPHERE_ALTITUDE_M:
        return 0.0
    return rho0 * math.exp(-altitude_m / scale_height_m)


def us_standard_simple_density(altitude_m: float) -> float:
    """
    Simplified US 1976 Standard Atmosphere model for troposphere and stratosphere.
    
    Troposphere (0 - 11,000 m):
        T = T0 - L * h, where L = 0.0065 K/m
        P = P0 * (1 - L*h/T0)^(g0 / (R * L))
        ρ = P / (R * T)
    Stratosphere / upper (above 11,000 m):
        Exponential decay from tropopause conditions.
    """
    if altitude_m <= 0:
        return SEA_LEVEL_DENSITY_RHO0
    if altitude_m >= MAX_ATMOSPHERE_ALTITUDE_M:
        return 0.0

    t0 = 288.15
    p0 = 101325.0
    l_lapse = 0.0065
    r_air = 287.05
    g0 = 9.80665

    if altitude_m <= 11000.0:
        t = t0 - l_lapse * altitude_m
        p = p0 * ((t / t0) ** (g0 / (r_air * l_lapse)))
        return p / (r_air * t)
    else:
        # Tropopause (11 km) reference
        t_tropo = t0 - l_lapse * 11000.0  # 216.65 K
        p_tropo = p0 * ((t_tropo / t0) ** (g0 / (r_air * l_lapse)))
        # Isothermal layer above 11km
        h_diff = altitude_m - 11000.0
        p = p_tropo * math.exp(-g0 * h_diff / (r_air * t_tropo))
        return p / (r_air * t_tropo)


def get_density(altitude_m: float, model: str = "exponential") -> float:
    """
    Dispatcher to retrieve atmospheric density by model name.
    """
    if model == "vacuum":
        return 0.0
    elif model == "us_standard_simple":
        return us_standard_simple_density(altitude_m)
    else:
        return exponential_density(altitude_m)
