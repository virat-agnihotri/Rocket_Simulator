"""Rocket Propulsion Dynamics and Engine Performance."""
from app.physics.constants import STANDARD_GRAVITY_G0


def effective_exhaust_velocity(specific_impulse_s: float, g0: float = STANDARD_GRAVITY_G0) -> float:
    """
    Calculate the effective exhaust velocity v_e.
    
    Formula:
        v_e = Isp * g0
    """
    if specific_impulse_s <= 0:
        raise ValueError("Specific impulse must be strictly positive.")
    return specific_impulse_s * g0


def propellant_mass_flow_rate(thrust_n: float, specific_impulse_s: float, g0: float = STANDARD_GRAVITY_G0) -> float:
    """
    Calculate propellant mass flow rate m_dot (kg/s).
    
    Formula:
        m_dot = T / (Isp * g0)
    """
    if thrust_n <= 0:
        raise ValueError("Thrust must be strictly positive.")
    v_e = effective_exhaust_velocity(specific_impulse_s, g0)
    return thrust_n / v_e


def burn_duration(propellant_mass_kg: float, mass_flow_rate_kg_s: float) -> float:
    """
    Calculate the total engine burn duration in seconds.
    
    Formula:
        t_burn = m_prop / m_dot
    """
    if propellant_mass_kg <= 0 or mass_flow_rate_kg_s <= 0:
        raise ValueError("Propellant mass and flow rate must be strictly positive.")
    return propellant_mass_kg / mass_flow_rate_kg_s


def thrust_to_weight_ratio(thrust_n: float, total_mass_kg: float, local_g: float = STANDARD_GRAVITY_G0) -> float:
    """
    Calculate the instantaneous thrust-to-weight ratio (dimensionless).
    
    Formula:
        TWR = T / (m * g)
    """
    if total_mass_kg <= 0:
        raise ValueError("Vehicle mass must be strictly positive.")
    if local_g <= 0:
        raise ValueError("Gravitational acceleration must be strictly positive.")
    return thrust_n / (total_mass_kg * local_g)
