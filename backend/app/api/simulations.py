"""Simulation Endpoints."""
import json
import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import SimulationRecordDB, MissionDB
from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig
from app.models.results import SimulationResult
from app.simulation.trajectory import run_trajectory_simulation

router = APIRouter(prefix="/simulations", tags=["Simulations"])


class SimulationRunRequest(BaseModel):
    vehicle: VehicleConfig
    mission: MissionConfig
    mission_id: Optional[str] = Field(None, description="Optional linked mission scenario ID")
    persist_result: bool = Field(default=True, description="Save simulation outcome to database")


@router.post("", response_model=SimulationResult)
def create_simulation(
    request: SimulationRunRequest,
    db: Session = Depends(get_db)
):
    """
    Run 2D trajectory simulation with configured vehicle and mission parameters.
    """
    # Execute physics trajectory calculation
    result = run_trajectory_simulation(request.vehicle, request.mission)

    # Persist if requested
    if request.persist_result:
        # Check if mission_id valid if provided
        mission_fk = None
        if request.mission_id:
            db_mission = db.query(MissionDB).filter(MissionDB.id == request.mission_id).first()
            if db_mission:
                mission_fk = db_mission.id

        telemetry_dicts = [pt.model_dump() for pt in result.telemetry]
        summary_dict = {
            "status": result.status,
            "termination_reason": result.termination_reason,
            "peak_altitude_m": result.peak_altitude_m,
            "peak_speed_mps": result.peak_speed_mps,
            "peak_acceleration_mps2": result.peak_acceleration_mps2,
            "maximum_dynamic_pressure_pa": result.maximum_dynamic_pressure_pa,
            "total_flight_time_s": result.total_flight_time_s,
            "burn_duration_s": result.burn_duration_s,
            "ideal_delta_v_mps": result.ideal_delta_v_mps,
            "orbital_metrics": result.orbital_metrics.model_dump(),
            "target_orbit_satisfied": result.target_orbit_satisfied,
            "warnings": result.warnings,
            "model_assumptions": result.model_assumptions,
        }

        rec = SimulationRecordDB(
            mission_id=mission_fk,
            status=result.status,
            termination_reason=result.termination_reason,
            peak_altitude_m=result.peak_altitude_m,
            peak_speed_mps=result.peak_speed_mps,
            peak_acceleration_mps2=result.peak_acceleration_mps2,
            max_q_pa=result.maximum_dynamic_pressure_pa,
            total_flight_time_s=result.total_flight_time_s,
            burn_duration_s=result.burn_duration_s,
            ideal_delta_v_mps=result.ideal_delta_v_mps,
            orbit_classification=result.orbital_metrics.orbit_classification.value,
            target_orbit_satisfied=result.target_orbit_satisfied,
            summary_json=json.dumps(summary_dict),
            telemetry_json=json.dumps(telemetry_dicts),
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        result.simulation_id = rec.id

    return result


@router.get("/{sim_id}", response_model=SimulationResult)
def get_simulation(sim_id: str, db: Session = Depends(get_db)):
    """
    Retrieve previous simulation run and telemetry by ID.
    """
    rec = db.query(SimulationRecordDB).filter(SimulationRecordDB.id == sim_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    summary = json.loads(rec.summary_json)
    telemetry = json.loads(rec.telemetry_json) if rec.telemetry_json else []

    burnout_pt = telemetry[-1] if telemetry else None
    final_pt = telemetry[-1] if telemetry else None

    return SimulationResult(
        simulation_id=rec.id,
        status=rec.status,
        termination_reason=rec.termination_reason,
        telemetry=telemetry,
        telemetry_count=len(telemetry),
        burnout_state=burnout_pt,
        final_state=final_pt,
        peak_altitude_m=rec.peak_altitude_m,
        peak_speed_mps=rec.peak_speed_mps,
        peak_acceleration_mps2=rec.peak_acceleration_mps2,
        maximum_dynamic_pressure_pa=rec.max_q_pa,
        total_flight_time_s=rec.total_flight_time_s,
        burn_duration_s=rec.burn_duration_s,
        ideal_delta_v_mps=rec.ideal_delta_v_mps,
        orbital_metrics=summary["orbital_metrics"],
        target_orbit_satisfied=rec.target_orbit_satisfied,
        warnings=summary.get("warnings", []),
        model_assumptions=summary.get("model_assumptions", []),
    )


@router.get("/{sim_id}/export/csv")
def export_simulation_csv(sim_id: str, db: Session = Depends(get_db)):
    """
    Export simulation telemetry as a downloadable CSV file.
    """
    rec = db.query(SimulationRecordDB).filter(SimulationRecordDB.id == sim_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    telemetry = json.loads(rec.telemetry_json) if rec.telemetry_json else []
    if not telemetry:
        raise HTTPException(status_code=400, detail="No telemetry available for this simulation.")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=telemetry[0].keys())
    writer.writeheader()
    for row in telemetry:
        writer.writerow(row)

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=telemetry_{sim_id[:8]}.csv"},
    )
