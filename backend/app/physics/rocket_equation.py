"""Tsiolkovsky Ideal Rocket Equation and Analytical Calculations.

Note on Limitations:
    The Tsiolkovsky rocket equation assumes idealized vacuum flight with no gravitational
    attraction (zero gravity losses), no atmospheric drag (zero drag losses), and perfectly
    aligned thrust along the velocity vector (zero steering losses). Real ascent trajectories
    incur substantial losses (typically 1,000 to 2,000 m/s for low Earth orbit ascent).
"""
import math
from app.physics.constants import STANDARD_GRAVITY_G0
from app.physics.propulsion import effective_exhaust_velocity


def ideal_delta_v(initial_mass_kg: float, final_mass_kg: float, specific_impulse_s: float, g0: float = STANDARD_GRAVITY_G0) -> float:
    """
    Calculate ideal velocity increment using the Tsiolkovsky rocket equation.
    
    Formula:
        Δv = Isp * g0 * ln(m0 / mf)
        
    Args:
        initial_mass_kg: Starting mass (structure + payload + propellant) (kg)
        final_mass_kg: Burnout mass (structure + payload) (kg)
        specific_impulse_s: Engine Isp (s)
        g0: Standard gravitational acceleration (m/s^2)
        
    Returns:
        Ideal delta-v in m/s.
    """
    if initial_mass_kg <= 0 or final_mass_kg <= 0:
        raise ValueError("Initial and final mass must be strictly positive.")
    if final_mass_kg > initial_mass_kg:
        raise ValueError(f"Final mass ({final_mass_kg} kg) cannot exceed initial mass ({initial_mass_kg} kg).")
    
    v_e = effective_exhaust_velocity(specific_impulse_s, g0)
    mass_ratio = initial_mass_kg / final_mass_kg
    return v_e * math.log(mass_ratio)


def required_mass_ratio(target_delta_v_mps: float, specific_impulse_s: float, g0: float = STANDARD_GRAVITY_G0) -> float:
    """
    Calculate the mass ratio (m0 / mf) required to achieve a target ideal delta-v.
    
    Formula:
        m0 / mf = exp(Δv / (Isp * g0))
    """
    if target_delta_v_mps <= 0:
        return 1.0
    v_e = effective_exhaust_velocity(specific_impulse_s, g0)
    return math.exp(target_delta_v_mps / v_e)


def ideal_propellant_required(dry_plus_payload_kg: float, target_delta_v_mps: float, specific_impulse_s: float, g0: float = STANDARD_GRAVITY_G0) -> float:
    """
    Calculate the propellant mass required to achieve a target ideal delta-v.
    
    Formula:
        m_prop = mf * (exp(Δv / v_e) - 1)
    """
    if dry_plus_payload_kg <= 0:
        raise ValueError("Dry plus payload mass must be strictly positive.")
    mass_ratio = required_mass_ratio(target_delta_v_mps, specific_impulse_s, g0)
    return dry_plus_payload_kg * (mass_ratio - 1.0)
