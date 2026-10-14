"""Scientific Tests: Trajectory Simulation and Integrator."""
import pytest
import numpy as np

from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig, GuidanceConfig, NumericalSolverSettings
from app.simulation.trajectory import run_trajectory_simulation


@pytest.fixture
def test_vehicle():
    return VehicleConfig(
        dry_mass_kg=25000.0,
        payload_mass_kg=4000.0,
        propellant_mass_kg=350000.0,
        thrust_n=5800000.0,
        specific_impulse_s=360.0,
        drag_coefficient=0.28,
        reference_area_m2=10.5,
    )


@pytest.fixture
def test_mission():
    return MissionConfig(
        target_altitude_m=400000.0,
        launch_altitude_m=0.0,
        simulation_duration_s=400.0,
        output_interval_s=2.0,
        guidance_configuration=GuidanceConfig(
            pitchover_altitude_m=500.0,
            pitch_end_altitude_m=80000.0,
            target_pitch_deg=85.0,
            pitch_exponent=0.5,
        ),
        numerical_solver_settings=NumericalSolverSettings(
            method="RK45",
            rtol=1e-5,
            atol=1e-7,
            max_step_s=2.0,
        ),
    )


class TestSimulation:
    def test_trajectory_runs_and_produces_telemetry(self, test_vehicle, test_mission):
        result = run_trajectory_simulation(test_vehicle, test_mission)

        assert result.status in ("SUCCESS", "GROUND_IMPACT")
        assert len(result.telemetry) > 10
        assert result.peak_altitude_m > 0
        assert result.peak_speed_mps > 0
        assert result.maximum_dynamic_pressure_pa >= 0
        assert result.burn_duration_s > 0
        assert result.ideal_delta_v_mps > 0

    def test_propellant_never_negative(self, test_vehicle, test_mission):
        result = run_trajectory_simulation(test_vehicle, test_mission)
        for pt in result.telemetry:
            assert pt.propellant_remaining_kg >= 0.0
            assert pt.mass_kg >= (test_vehicle.dry_mass_kg + test_vehicle.payload_mass_kg)

    def test_burnout_transition(self, test_vehicle, test_mission):
        result = run_trajectory_simulation(test_vehicle, test_mission)
        assert result.burnout_state is not None
        # Engine should shut down after burnout
        if result.total_flight_time_s > result.burn_duration_s + 5.0:
            assert result.final_state.is_engine_active is False
            assert result.final_state.thrust_n == 0.0

    def test_low_thrust_fails_or_impacts(self):
        """A vehicle with insufficient thrust to liftoff should remain on pad or detect termination."""
        weak_vehicle = VehicleConfig(
            dry_mass_kg=50000.0,
            payload_mass_kg=10000.0,
            propellant_mass_kg=400000.0,
            thrust_n=2000000.0,  # 2 MN for 460 tonnes -> TWR ~ 0.44 < 1
            specific_impulse_s=300.0,
            drag_coefficient=0.3,
            reference_area_m2=10.0,
        )
        short_mission = MissionConfig(
            simulation_duration_s=30.0,
            output_interval_s=1.0,
        )
        res = run_trajectory_simulation(weak_vehicle, short_mission)
        # Should stay on pad (altitude near 0)
        assert res.peak_altitude_m < 50.0
        assert any("Low liftoff thrust-to-weight ratio" in w for w in res.warnings)
