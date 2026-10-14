"""Mission Scenarios and Persistence Endpoints."""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import MissionDB, SimulationRecordDB
from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig, GuidanceConfig, AtmosphereModelType

router = APIRouter(prefix="/missions", tags=["Missions"])


class MissionCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    description: Optional[str] = Field(None, max_length=1000)
    vehicle: VehicleConfig
    mission: MissionConfig


class MissionSummaryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str
    dry_mass_kg: float
    payload_mass_kg: float
    propellant_mass_kg: float
    thrust_n: float
    specific_impulse_s: float
    target_altitude_m: float
    simulation_runs_count: int


class MissionDetailResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str
    vehicle: VehicleConfig
    mission: MissionConfig
    recent_simulations: List[Dict[str, Any]]


PRESETS: List[Dict[str, Any]] = [
    {
        "id": "preset-medium-orbital",
        "name": "Medium-Lift Single-Stage-to-LEO (Hypothetical)",
        "description": "Hypothetical heavy single-stage orbital booster configured to demonstrate LEO insertion trajectory around 350-400 km.",
        "vehicle": {
            "dry_mass_kg": 25000.0,
            "payload_mass_kg": 4000.0,
            "propellant_mass_kg": 380000.0,
            "thrust_n": 5800000.0,
            "specific_impulse_s": 360.0,
            "drag_coefficient": 0.28,
            "reference_area_m2": 10.5,
        },
        "mission": {
            "target_altitude_m": 400000.0,
            "launch_altitude_m": 0.0,
            "launch_latitude_deg": 28.5,
            "simulation_duration_s": 900.0,
            "output_interval_s": 1.0,
            "selected_atmosphere_model": "exponential",
            "wind_velocity_x_mps": 0.0,
            "guidance_configuration": {
                "pitchover_altitude_m": 600.0,
                "pitch_end_altitude_m": 85000.0,
                "target_pitch_deg": 87.2,
                "pitch_exponent": 0.52,
            },
            "numerical_solver_settings": {
                "method": "RK45",
                "rtol": 1e-6,
                "atol": 1e-8,
                "max_step_s": 1.0,
            },
        },
    },
    {
        "id": "preset-smallsat-launcher",
        "name": "SmallSat Light Launcher (Hypothetical)",
        "description": "Lightweight hypothetical rocket targeting a 300 km low Earth orbit with high-efficiency vacuum engine.",
        "vehicle": {
            "dry_mass_kg": 2500.0,
            "payload_mass_kg": 220.0,
            "propellant_mass_kg": 28000.0,
            "thrust_n": 420000.0,
            "specific_impulse_s": 345.0,
            "drag_coefficient": 0.32,
            "reference_area_m2": 2.1,
        },
        "mission": {
            "target_altitude_m": 300000.0,
            "launch_altitude_m": 0.0,
            "launch_latitude_deg": 28.5,
            "simulation_duration_s": 750.0,
            "output_interval_s": 1.0,
            "selected_atmosphere_model": "exponential",
            "wind_velocity_x_mps": 0.0,
            "guidance_configuration": {
                "pitchover_altitude_m": 800.0,
                "pitch_end_altitude_m": 75000.0,
                "target_pitch_deg": 86.8,
                "pitch_exponent": 0.55,
            },
            "numerical_solver_settings": {
                "method": "RK45",
                "rtol": 1e-6,
                "atol": 1e-8,
                "max_step_s": 1.0,
            },
        },
    },
    {
        "id": "preset-suborbital-sounding",
        "name": "Suborbital Scientific Sounding Rocket",
        "description": "Solid/liquid sounding rocket designed to reach the mesosphere and lower thermosphere (120 km) for scientific atmospheric sampling.",
        "vehicle": {
            "dry_mass_kg": 800.0,
            "payload_mass_kg": 150.0,
            "propellant_mass_kg": 4500.0,
            "thrust_n": 160000.0,
            "specific_impulse_s": 265.0,
            "drag_coefficient": 0.35,
            "reference_area_m2": 0.8,
        },
        "mission": {
            "target_altitude_m": 120000.0,
            "launch_altitude_m": 0.0,
            "launch_latitude_deg": 28.5,
            "simulation_duration_s": 500.0,
            "output_interval_s": 0.5,
            "selected_atmosphere_model": "exponential",
            "wind_velocity_x_mps": 0.0,
            "guidance_configuration": {
                "pitchover_altitude_m": 5000.0,
                "pitch_end_altitude_m": 60000.0,
                "target_pitch_deg": 35.0,
                "pitch_exponent": 0.8,
            },
            "numerical_solver_settings": {
                "method": "RK45",
                "rtol": 1e-6,
                "atol": 1e-8,
                "max_step_s": 1.0,
            },
        },
    },
]


@router.get("/presets")
def get_mission_presets():
    """Return verified educational mission presets."""
    return PRESETS


@router.get("", response_model=List[MissionSummaryResponse])
def list_missions(db: Session = Depends(get_db)):
    """List all saved mission configurations."""
    missions = db.query(MissionDB).order_by(MissionDB.created_at.desc()).all()
    results = []
    for m in missions:
        results.append(
            MissionSummaryResponse(
                id=m.id,
                name=m.name,
                description=m.description,
                created_at=m.created_at.isoformat() if m.created_at else "",
                dry_mass_kg=m.dry_mass_kg,
                payload_mass_kg=m.payload_mass_kg,
                propellant_mass_kg=m.propellant_mass_kg,
                thrust_n=m.thrust_n,
                specific_impulse_s=m.specific_impulse_s,
                target_altitude_m=m.target_altitude_m,
                simulation_runs_count=len(m.simulations),
            )
        )
    return results


@router.post("", response_model=MissionDetailResponse)
def create_mission(request: MissionCreateRequest, db: Session = Depends(get_db)):
    """Create and persist a new mission configuration."""
    v = request.vehicle
    m = request.mission
    g = m.guidance_configuration

    db_mission = MissionDB(
        name=request.name,
        description=request.description,
        dry_mass_kg=v.dry_mass_kg,
        payload_mass_kg=v.payload_mass_kg,
        propellant_mass_kg=v.propellant_mass_kg,
        thrust_n=v.thrust_n,
        specific_impulse_s=v.specific_impulse_s,
        drag_coefficient=v.drag_coefficient,
        reference_area_m2=v.reference_area_m2,
        target_altitude_m=m.target_altitude_m,
        launch_altitude_m=m.launch_altitude_m,
        simulation_duration_s=m.simulation_duration_s,
        atmosphere_model=m.selected_atmosphere_model.value,
        wind_velocity_x_mps=m.wind_velocity_x_mps,
        pitchover_altitude_m=g.pitchover_altitude_m,
        pitch_end_altitude_m=g.pitch_end_altitude_m,
        target_pitch_deg=g.target_pitch_deg,
        pitch_exponent=g.pitch_exponent,
    )
    db.add(db_mission)
    db.commit()
    db.refresh(db_mission)

    return get_mission_by_id(db_mission.id, db)


@router.get("/{mission_id}", response_model=MissionDetailResponse)
def get_mission_by_id(mission_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a saved mission."""
    m = db.query(MissionDB).filter(MissionDB.id == mission_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found.")

    v = VehicleConfig(
        dry_mass_kg=m.dry_mass_kg,
        payload_mass_kg=m.payload_mass_kg,
        propellant_mass_kg=m.propellant_mass_kg,
        thrust_n=m.thrust_n,
        specific_impulse_s=m.specific_impulse_s,
        drag_coefficient=m.drag_coefficient,
        reference_area_m2=m.reference_area_m2,
    )

    guidance = GuidanceConfig(
        pitchover_altitude_m=m.pitchover_altitude_m,
        pitch_end_altitude_m=m.pitch_end_altitude_m,
        target_pitch_deg=m.target_pitch_deg,
        pitch_exponent=m.pitch_exponent,
    )

    mission = MissionConfig(
        target_altitude_m=m.target_altitude_m,
        launch_altitude_m=m.launch_altitude_m,
        simulation_duration_s=m.simulation_duration_s,
        selected_atmosphere_model=AtmosphereModelType(m.atmosphere_model),
        wind_velocity_x_mps=m.wind_velocity_x_mps,
        guidance_configuration=guidance,
    )

    sims = [
        {
            "id": s.id,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else "",
            "peak_altitude_m": s.peak_altitude_m,
            "orbit_classification": s.orbit_classification,
            "target_orbit_satisfied": s.target_orbit_satisfied,
        }
        for s in m.simulations
    ]

    return MissionDetailResponse(
        id=m.id,
        name=m.name,
        description=m.description,
        created_at=m.created_at.isoformat() if m.created_at else "",
        vehicle=v,
        mission=mission,
        recent_simulations=sims,
    )


@router.delete("/{mission_id}")
def delete_mission(mission_id: str, db: Session = Depends(get_db)):
    """Delete a saved mission configuration and linked simulation runs."""
    m = db.query(MissionDB).filter(MissionDB.id == mission_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found.")
    db.delete(m)
    db.commit()
    return {"message": f"Mission {mission_id} deleted successfully."}
