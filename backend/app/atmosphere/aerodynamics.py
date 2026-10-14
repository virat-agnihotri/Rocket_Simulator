"""Aerodynamic Drag and Dynamic Pressure."""
import numpy as np


def dynamic_pressure(density_kg_m3: float, relative_speed_mps: float) -> float:
    """
    Calculate dynamic pressure q.
    
    Formula:
        q = 0.5 * ρ * v_rel^2
        
    Args:
        density_kg_m3: Atmospheric density in kg/m^3.
        relative_speed_mps: Air-relative speed in m/s.
        
    Returns:
        Dynamic pressure in Pascals (Pa).
    """
    if density_kg_m3 <= 0 or relative_speed_mps <= 0:
        return 0.0
    return 0.5 * density_kg_m3 * (relative_speed_mps ** 2)


def aerodynamic_drag_magnitude(
    density_kg_m3: float,
    relative_speed_mps: float,
    drag_coefficient: float,
    reference_area_m2: float
) -> float:
    """
    Calculate aerodynamic drag force magnitude in Newtons.
    
    Formula:
        D = 0.5 * ρ * v_rel^2 * Cd * A = q * Cd * A
    """
    q = dynamic_pressure(density_kg_m3, relative_speed_mps)
    return q * drag_coefficient * reference_area_m2


def aerodynamic_drag_vector(
    density_kg_m3: float,
    relative_velocity: np.ndarray,
    drag_coefficient: float,
    reference_area_m2: float
) -> np.ndarray:
    """
    Calculate the 2D aerodynamic drag vector opposing air-relative velocity.
    
    Formula:
        F_drag = -0.5 * ρ * |v_rel| * v_rel * Cd * A
        
    Args:
        density_kg_m3: Atmospheric density in kg/m^3
        relative_velocity: 2D numpy array [v_rel_x, v_rel_y] in m/s
        drag_coefficient: Drag coefficient Cd
        reference_area_m2: Cross-sectional reference area A in m^2
        
    Returns:
        2D drag force vector [Fx_drag, Fy_drag] in Newtons.
    """
    v_mag = float(np.linalg.norm(relative_velocity))
    if density_kg_m3 <= 0 or v_mag <= 1e-6 or drag_coefficient <= 0 or reference_area_m2 <= 0:
        return np.array([0.0, 0.0])
    
    drag_mag = 0.5 * density_kg_m3 * (v_mag ** 2) * drag_coefficient * reference_area_m2
    # Opposes relative velocity unit vector
    unit_v = relative_velocity / v_mag
    return -drag_mag * unit_v
