"""Mission Configuration Models."""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class AtmosphereModelType(str, Enum):
    EXPONENTIAL = "exponential"
    VACUUM = "vacuum"
    US_STANDARD_SIMPLE = "us_standard_simple"


class GuidanceConfig(BaseModel):
    """
    Ascent pitch steering profile parameters.
    
    The rocket begins vertically until pitchover_altitude_m, then gradually transitions
    its thrust pitch angle towards target_pitch_deg by pitch_end_altitude_m.
    """
    pitchover_altitude_m: float = Field(
        default=500.0,
        ge=50.0,
        description="Altitude at which gravity turn / pitchover maneuver begins (m)"
    )
    pitch_end_altitude_m: float = Field(
        default=80000.0,
        ge=5000.0,
        description="Altitude at which pitch profile levels out to target_pitch_deg (m)"
    )
    target_pitch_deg: float = Field(
        default=85.0,
        ge=0.0,
        le=90.0,
        description="Final pitch angle relative to local vertical at pitch_end_altitude (90° = horizontal)"
    )
    pitch_exponent: float = Field(
        default=0.5,
        ge=0.1,
        le=2.0,
        description="Curvature exponent of pitch program transitions (0.5 = square root profile)"
    )


class NumericalSolverSettings(BaseModel):
    """Integrator configuration for scipy.integrate.solve_ivp."""
    method: str = Field(default="RK45", description="Integration algorithm (e.g. RK45, DOP853, Radau)")
    rtol: float = Field(default=1e-6, gt=0, le=1e-2, description="Relative tolerance")
    atol: float = Field(default=1e-8, gt=0, le=1e-2, description="Absolute tolerance")
    max_step_s: float = Field(default=1.0, gt=0.01, le=10.0, description="Maximum integration time step in seconds")


class MissionConfig(BaseModel):
    """
    Full mission trajectory simulation specification.
    """
    target_altitude_m: float = Field(
        default=400000.0,
        ge=50000.0,
        le=2000000.0,
        description="Target circular orbit altitude above Earth surface (m) (e.g. 400 km = 400,000 m)"
    )
    launch_altitude_m: float = Field(
        default=0.0,
        ge=0.0,
        le=5000.0,
        description="Launch site elevation above sea level (m)"
    )
    launch_latitude_deg: float = Field(
        default=28.5,
        ge=-90.0,
        le=90.0,
        description="Launch site latitude (e.g. 28.5° for Cape Canaveral)"
    )
    simulation_duration_s: float = Field(
        default=1200.0,
        ge=10.0,
        le=7200.0,
        description="Maximum integration time horizon (s)"
    )
    output_interval_s: float = Field(
        default=1.0,
        ge=0.1,
        le=10.0,
        description="Sampling time interval for returned telemetry points (s)"
    )
    selected_atmosphere_model: AtmosphereModelType = Field(
        default=AtmosphereModelType.EXPONENTIAL,
        description="Atmospheric density model"
    )
    wind_velocity_x_mps: float = Field(
        default=0.0,
        ge=-100.0,
        le=100.0,
        description="Constant horizontal atmospheric wind velocity component (m/s)"
    )
    guidance_configuration: GuidanceConfig = Field(
        default_factory=GuidanceConfig,
        description="Ascent guidance / pitch angle profile"
    )
    numerical_solver_settings: NumericalSolverSettings = Field(
        default_factory=NumericalSolverSettings,
        description="Solver integration settings"
    )
