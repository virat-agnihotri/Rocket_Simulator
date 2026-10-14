"""API Endpoint Integration Tests."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_presets_endpoint():
    response = client.get("/api/missions/presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) >= 3
    assert any("Medium-Lift" in p["name"] for p in presets)


def test_mission_crud():
    payload = {
        "name": "Integration Test Mission",
        "description": "Created during automated pytest run",
        "vehicle": {
            "dry_mass_kg": 25000.0,
            "payload_mass_kg": 3000.0,
            "propellant_mass_kg": 300000.0,
            "thrust_n": 5500000.0,
            "specific_impulse_s": 350.0,
            "drag_coefficient": 0.3,
            "reference_area_m2": 10.0,
        },
        "mission": {
            "target_altitude_m": 400000.0,
            "launch_altitude_m": 0.0,
            "simulation_duration_s": 600.0,
            "output_interval_s": 2.0,
        },
    }

    create_res = client.post("/api/missions", json=payload)
    assert create_res.status_code == 200
    created = create_res.json()
    mission_id = created["id"]
    assert created["name"] == "Integration Test Mission"

    # List
    list_res = client.get("/api/missions")
    assert list_res.status_code == 200
    missions = list_res.json()
    assert any(m["id"] == mission_id for m in missions)

    # Get by ID
    get_res = client.get(f"/api/missions/{mission_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == mission_id

    # Delete
    del_res = client.delete(f"/api/missions/{mission_id}")
    assert del_res.status_code == 200


def test_simulation_run_and_export():
    payload = {
        "vehicle": {
            "dry_mass_kg": 20000.0,
            "payload_mass_kg": 2000.0,
            "propellant_mass_kg": 250000.0,
            "thrust_n": 4500000.0,
            "specific_impulse_s": 340.0,
            "drag_coefficient": 0.3,
            "reference_area_m2": 8.0,
        },
        "mission": {
            "target_altitude_m": 300000.0,
            "launch_altitude_m": 0.0,
            "simulation_duration_s": 300.0,
            "output_interval_s": 2.0,
        },
        "persist_result": True,
    }

    sim_res = client.post("/api/simulations", json=payload)
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert data["status"] in ("SUCCESS", "GROUND_IMPACT")
    assert "telemetry" in data
    assert len(data["telemetry"]) > 0
    sim_id = data["simulation_id"]
    assert sim_id is not None

    # Retrieve by ID
    get_sim = client.get(f"/api/simulations/{sim_id}")
    assert get_sim.status_code == 200
    assert get_sim.json()["simulation_id"] == sim_id

    # Export CSV
    csv_res = client.get(f"/api/simulations/{sim_id}/export/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    assert "altitude_m" in csv_res.text


def test_invalid_vehicle_payload_rejected():
    invalid_payload = {
        "vehicle": {
            "dry_mass_kg": -100.0,  # Negative mass is physically invalid
            "payload_mass_kg": 1000.0,
            "propellant_mass_kg": 50000.0,
            "thrust_n": 1000000.0,
            "specific_impulse_s": 300.0,
        },
        "mission": {},
    }
    res = client.post("/api/simulations", json=invalid_payload)
    assert res.status_code == 422
