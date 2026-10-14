"""Flight Dynamics Equations of Motion."""
from typing import Tuple, Dict, Any
import numpy as np

from app.physics.constants import EARTH_RADIUS_M, EARTH_ROTATION_RATE_RAD_S
from app.physics.gravity import gravitational_acceleration_vector
from app.physics.propulsion import propellant_mass_flow_rate
from app.atmosphere.density import get_density
from app.atmosphere.aerodynamics import aerodynamic_drag_vector, dynamic_pressure
from app.simulation.guidance import thrust_direction_vector
from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig


def compute_dynamics_derivatives(
    t: float,
    state: np.ndarray,
    vehicle: VehicleConfig,
    mission: MissionConfig,
    include_earth_rotation: bool = True
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Compute state derivatives [dx/dt, dy/dt, dvx/dt, dvy/dt, dm_prop/dt]
    and instantaneous diagnostic telemetry values.
    
    State:
        state[0]: x position (m)
        state[1]: y position (m)
        state[2]: vx velocity (m/s)
        state[3]: vy velocity (m/s)
        state[4]: m_prop remaining propellant mass (kg)
    """
    x, y, vx, vy, m_prop = state
    pos = np.array([x, y], dtype=float)
    vel = np.array([vx, vy], dtype=float)
    
    r_mag = float(np.linalg.norm(pos))
    altitude = r_mag - EARTH_RADIUS_M
    speed = float(np.linalg.norm(vel))

    # Vehicle mass
    dry_plus_payload = vehicle.dry_mass_kg + vehicle.payload_mass_kg
    clamped_prop = max(0.0, float(m_prop))
    current_mass = dry_plus_payload + clamped_prop

    # 1. Gravity acceleration
    a_gravity = gravitational_acceleration_vector(pos)

    # 2. Atmosphere and relative velocity
    rho = get_density(altitude, model=mission.selected_atmosphere_model.value)
    
    # Earth rotation velocity at current position
    if include_earth_rotation and altitude < 150000.0:
        # Corotation of atmosphere with Earth
        v_atmosphere = EARTH_ROTATION_RATE_RAD_S * np.array([-y, x])
    else:
        v_atmosphere = np.array([0.0, 0.0])

    # Wind vector
    wind = np.array([mission.wind_velocity_x_mps, 0.0])
    v_air = v_atmosphere + wind
    v_rel = vel - v_air
    rel_speed = float(np.linalg.norm(v_rel))

    # Drag force & dynamic pressure
    f_drag = aerodynamic_drag_vector(
        rho,
        v_rel,
        vehicle.drag_coefficient,
        vehicle.reference_area_m2
    )
    drag_mag = float(np.linalg.norm(f_drag))
    q_pa = dynamic_pressure(rho, rel_speed)
    a_drag = f_drag / current_mass

    # 3. Engine propulsion
    is_shutdown = mission.engine_shutdown_time_s is not None and t >= mission.engine_shutdown_time_s
    if clamped_prop > 1e-4 and not is_shutdown:
        is_engine_active = True
        thrust_mag = vehicle.thrust_n
        mdot = propellant_mass_flow_rate(vehicle.thrust_n, vehicle.specific_impulse_s)
        thrust_dir, pitch_deg = thrust_direction_vector(pos, altitude, mission.guidance_configuration)
        f_thrust = thrust_mag * thrust_dir
        dm_prop_dt = -mdot
    else:
        is_engine_active = False
        thrust_mag = 0.0
        pitch_deg = 0.0
        f_thrust = np.array([0.0, 0.0])
        dm_prop_dt = 0.0

    a_thrust = f_thrust / current_mass

    # Total acceleration
    a_total = a_gravity + a_thrust + a_drag

    # Ground support constraint: on launch pad before liftoff, prevent sinking into Earth
    if altitude <= 1e-3:
        # Radial projection of net acceleration
        e_radial = pos / r_mag
        radial_acc = np.dot(a_total, e_radial)
        radial_vel = np.dot(vel, e_radial)
        tangential_vel = vel - radial_vel * e_radial
        contact_acc = -float(np.dot(tangential_vel, tangential_vel)) / r_mag
        if radial_acc < contact_acc and radial_vel <= 1e-4:
            # A supported vehicle corotating with Earth needs centripetal acceleration.
            # Cancelling all radial acceleration creates spurious lift and solver chatter.
            a_total = a_total + (contact_acc - radial_acc) * e_radial
            # Also cancel inward velocity
            vel = vel - radial_vel * e_radial

    acc_mag = float(np.linalg.norm(a_total))

    # Polar velocity components
    e_r = pos / r_mag
    e_theta = np.array([-e_r[1], e_r[0]])
    v_radial = float(np.dot(vel, e_r))
    v_horizontal = float(np.dot(vel, e_theta))

    # Downrange distance along Earth surface relative to the launch site on rotating Earth
    theta_pad = EARTH_ROTATION_RATE_RAD_S * t if include_earth_rotation else 0.0
    theta_rocket = float(np.arctan2(y, x))
    delta_theta_ground = theta_rocket - theta_pad
    # Wrap to [-pi, pi] if needed
    delta_theta_ground = (delta_theta_ground + np.pi) % (2.0 * np.pi) - np.pi
    downrange_m = max(0.0, float(EARTH_RADIUS_M * delta_theta_ground))

    derivatives = np.array([
        vel[0],
        vel[1],
        a_total[0],
        a_total[1],
        dm_prop_dt
    ], dtype=float)

    diagnostics = {
        "altitude_m": altitude,
        "downrange_distance_m": downrange_m,
        "speed_mps": speed,
        "vertical_speed_mps": v_radial,
        "horizontal_speed_mps": v_horizontal,
        "mass_kg": current_mass,
        "propellant_remaining_kg": clamped_prop,
        "thrust_n": thrust_mag,
        "drag_n": drag_mag,
        "acceleration_mps2": acc_mag,
        "dynamic_pressure_pa": q_pa,
        "atmospheric_density_kg_m3": rho,
        "pitch_angle_deg": pitch_deg,
        "is_engine_active": is_engine_active,
    }

    return derivatives, diagnostics
