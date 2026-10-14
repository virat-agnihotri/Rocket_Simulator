"""Simulation and Optimization Result Models."""
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.models.state import TelemetryPoint
from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig


class OrbitClassification(str, Enum):
    SUBORBITAL = "suborbital"
    CIRCULAR = "circular"
    ELLIPTICAL = "elliptical"
    ESCAPE_HYPERBOLIC = "escape_hyperbolic"
    GROUND_IMPACT = "ground_impact"
    INVALID = "invalid"


class OrbitalMetrics(BaseModel):
    """
    Orbital parameters calculated from the final trajectory state vector.
    Calculated using standard two-body Keplerian mechanics.
    """
    semi_major_axis_m: Optional[float] = Field(None, description="Semi-major axis a in meters")
    eccentricity: Optional[float] = Field(None, description="Orbital eccentricity e (dimensionless)")
    apoapsis_altitude_m: Optional[float] = Field(None, description="Apoapsis altitude above mean Earth surface (m)")
    periapsis_altitude_m: Optional[float] = Field(None, description="Periapsis altitude above mean Earth surface (m)")
    orbital_period_s: Optional[float] = Field(None, description="Orbital period in seconds (if bound orbit)")
    specific_energy_j_kg: float = Field(..., description="Specific orbital energy ε = v^2/2 - μ/r in J/kg")
    specific_angular_momentum_m2_s: float = Field(..., description="Specific angular momentum h = |r x v| in m^2/s")
    target_circular_velocity_mps: float = Field(..., description="Theoretical circular speed at target altitude in m/s")
    target_altitude_error_m: float = Field(..., description="Deviation between target altitude and achieved apoapsis (m)")
    target_velocity_error_mps: float = Field(..., description="Speed error relative to circular velocity at final altitude (m/s)")
    orbit_classification: OrbitClassification = Field(..., description="Classification of the resulting Keplerian orbit")


class SimulationResult(BaseModel):
    """
    Complete output package for a trajectory flight simulation.
    """
    simulation_id: Optional[str] = Field(None, description="Unique simulation identifier if persisted")
    status: str = Field(..., description="SUCCESS, GROUND_IMPACT, MAX_TIME_REACHED, or SOLVER_ERROR")
    termination_reason: str = Field(..., description="Descriptive termination message")
    telemetry: List[TelemetryPoint] = Field(default_factory=list, description="Downsampled telemetry stream for UI/charts")
    telemetry_count: int = Field(..., description="Total points in returned telemetry")
    burnout_state: Optional[TelemetryPoint] = Field(None, description="Telemetry at engine burnout")
    final_state: TelemetryPoint = Field(..., description="Telemetry at simulation conclusion")
    peak_altitude_m: float = Field(..., description="Maximum altitude reached during flight in meters")
    peak_speed_mps: float = Field(..., description="Maximum inertial speed achieved in m/s")
    peak_acceleration_mps2: float = Field(..., description="Maximum total acceleration experienced in m/s^2")
    maximum_dynamic_pressure_pa: float = Field(..., description="Maximum dynamic pressure (Max-Q) in Pascals")
    total_flight_time_s: float = Field(..., description="Total simulated elapsed time in seconds")
    burn_duration_s: float = Field(..., description="Engine burn duration in seconds")
    ideal_delta_v_mps: float = Field(..., description="Ideal Tsiolkovsky delta-v in m/s (no losses)")
    orbital_metrics: OrbitalMetrics = Field(..., description="Keplerian orbital analysis at cutoff/final state")
    target_orbit_satisfied: bool = Field(..., description="True only if altitude and eccentricity criteria are met")
    warnings: List[str] = Field(default_factory=list, description="Physics or numerical warnings")
    model_assumptions: List[str] = Field(default_factory=list, description="Explicit disclosures of physical simplifications")


class OptimizationObjective(str, Enum):
    MINIMIZE_PROPELLANT = "minimize_propellant"
    MINIMIZE_ORBIT_ERROR = "minimize_orbit_error"
    MAXIMIZE_PAYLOAD = "maximize_payload"


class OptimizationCandidate(BaseModel):
    """Evaluated candidate configuration and performance summary."""
    vehicle: VehicleConfig
    mission: MissionConfig
    objective_value: float
    is_feasible: bool
    constraint_violations: Dict[str, float]
    peak_altitude_m: float
    target_altitude_error_m: float
    peak_acceleration_mps2: float
    max_q_pa: float
    orbit_classification: OrbitClassification
    target_orbit_satisfied: bool


class OptimizationResult(BaseModel):
    """
    Summary and candidate comparisons from numerical optimization.
    """
    optimization_id: Optional[str] = None
    status: str = Field(..., description="COMPLETED, NO_FEASIBLE_SOLUTION, or ERROR")
    objective: OptimizationObjective
    baseline_candidate: OptimizationCandidate
    best_feasible_candidate: Optional[OptimizationCandidate] = None
    evaluation_count: int = Field(..., description="Number of simulation evaluations performed")
    feasible_count: int = Field(default=0, description="Count of evaluated configurations meeting all constraints")
    algorithm_settings: Dict[str, Any] = Field(default_factory=dict)
    candidate_history: List[OptimizationCandidate] = Field(default_factory=list, description="Sample of evaluated candidates")
    execution_duration_s: float = Field(..., description="Wall-clock time spent optimizing in seconds")
    message: str = Field(..., description="Result summary message")
