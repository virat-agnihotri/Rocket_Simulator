"""Simulation State and Telemetry Point Models."""
from pydantic import BaseModel, Field


class TelemetryPoint(BaseModel):
    """
    Sampled telemetry at a given simulation instant.
    Coordinates are in a 2D Earth-centered inertial (ECI) planar frame.
    """
    time_s: float = Field(..., description="Simulation time in seconds")
    x_m: float = Field(..., description="Earth-centered X coordinate in meters")
    y_m: float = Field(..., description="Earth-centered Y coordinate in meters")
    vx_mps: float = Field(..., description="Inertial velocity X component in m/s")
    vy_mps: float = Field(..., description="Inertial velocity Y component in m/s")
    altitude_m: float = Field(..., description="Altitude above Earth mean surface in meters")
    downrange_distance_m: float = Field(..., description="Surface downrange distance traversed in meters")
    speed_mps: float = Field(..., description="Inertial speed in m/s")
    vertical_speed_mps: float = Field(..., description="Radial / vertical speed component in m/s")
    horizontal_speed_mps: float = Field(..., description="Tangential / horizontal speed component in m/s")
    mass_kg: float = Field(..., description="Total vehicle mass at this instant in kg")
    propellant_remaining_kg: float = Field(..., description="Remaining usable propellant mass in kg")
    thrust_n: float = Field(..., description="Engine thrust magnitude in N")
    drag_n: float = Field(..., description="Aerodynamic drag force magnitude in N")
    acceleration_mps2: float = Field(..., description="Total acceleration magnitude in m/s^2")
    dynamic_pressure_pa: float = Field(..., description="Dynamic pressure q in Pa")
    atmospheric_density_kg_m3: float = Field(..., description="Ambient atmospheric density in kg/m^3")
    pitch_angle_deg: float = Field(..., description="Pitch angle relative to launch vertical in degrees")
    is_engine_active: bool = Field(..., description="Whether engine is burning propellant")


class SimulationStateVector(BaseModel):
    """Internal state vector: [x, y, vx, vy, propellant_mass]."""
    x_m: float
    y_m: float
    vx_mps: float
    vy_mps: float
    propellant_mass_kg: float
