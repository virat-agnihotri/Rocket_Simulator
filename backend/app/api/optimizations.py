"""Optimization Endpoints."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig
from app.models.results import OptimizationResult, OptimizationObjective
from app.optimization.optimizer import run_mission_optimization

router = APIRouter(prefix="/optimizations", tags=["Optimizations"])


class OptimizationRunRequest(BaseModel):
    baseline_vehicle: VehicleConfig
    baseline_mission: MissionConfig
    objective: OptimizationObjective = Field(
        default=OptimizationObjective.MINIMIZE_PROPELLANT,
        description="Target optimization objective function"
    )
    max_evaluations: int = Field(
        default=35,
        ge=10,
        le=100,
        description="Maximum simulation evaluation budget"
    )
    seed: int = Field(
        default=42,
        description="Random seed for reproducible differential evolution search"
    )
    propellant_min_kg: Optional[float] = Field(None, gt=0)
    propellant_max_kg: Optional[float] = Field(None, gt=0)
    pitch_deg_min: Optional[float] = Field(default=75.0, ge=45.0, le=90.0)
    pitch_deg_max: Optional[float] = Field(default=89.5, ge=50.0, le=90.0)


@router.post("", response_model=OptimizationResult)
def create_optimization(request: OptimizationRunRequest):
    """
    Run constrained differential evolution optimization.
    """
    prop_bounds = None
    if request.propellant_min_kg is not None and request.propellant_max_kg is not None:
        if request.propellant_min_kg >= request.propellant_max_kg:
            raise HTTPException(
                status_code=400,
                detail="propellant_min_kg must be strictly less than propellant_max_kg"
            )
        prop_bounds = (request.propellant_min_kg, request.propellant_max_kg)

    pitch_bounds = (request.pitch_deg_min, request.pitch_deg_max)

    try:
        result = run_mission_optimization(
            baseline_vehicle=request.baseline_vehicle,
            baseline_mission=request.baseline_mission,
            objective=request.objective,
            max_evaluations=request.max_evaluations,
            seed=request.seed,
            propellant_bounds=prop_bounds,
            pitch_deg_bounds=pitch_bounds,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Optimization execution failed: {str(exc)}")
