"""Scientific Tests: Numerical Optimization Engine."""
import pytest
from app.models.vehicle import VehicleConfig
from app.models.mission import MissionConfig, GuidanceConfig
from app.models.results import OptimizationObjective
from app.optimization.optimizer import run_mission_optimization


@pytest.fixture
def base_vehicle():
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
def fast_mission():
    return MissionConfig(
        target_altitude_m=400000.0,
        simulation_duration_s=300.0,
        output_interval_s=2.0,
        guidance_configuration=GuidanceConfig(
            pitchover_altitude_m=500.0,
            pitch_end_altitude_m=80000.0,
            target_pitch_deg=85.0,
            pitch_exponent=0.5,
        ),
    )


class TestOptimization:
    def test_optimizer_seed_reproducibility(self, base_vehicle, fast_mission):
        """Fixed seed must produce identical objective value."""
        res1 = run_mission_optimization(
            baseline_vehicle=base_vehicle,
            baseline_mission=fast_mission,
            objective=OptimizationObjective.MINIMIZE_ORBIT_ERROR,
            max_evaluations=12,
            seed=42,
        )
        res2 = run_mission_optimization(
            baseline_vehicle=base_vehicle,
            baseline_mission=fast_mission,
            objective=OptimizationObjective.MINIMIZE_ORBIT_ERROR,
            max_evaluations=12,
            seed=42,
        )
        assert res1.evaluation_count == res2.evaluation_count
        assert pytest.approx(res1.baseline_candidate.objective_value, rel=1e-4) == res2.baseline_candidate.objective_value

    def test_optimizer_evaluates_candidates(self, base_vehicle, fast_mission):
        res = run_mission_optimization(
            baseline_vehicle=base_vehicle,
            baseline_mission=fast_mission,
            objective=OptimizationObjective.MINIMIZE_PROPELLANT,
            max_evaluations=15,
            seed=123,
        )
        assert res.evaluation_count >= 10
        assert len(res.candidate_history) > 0
        assert res.baseline_candidate is not None
