import numpy as np

from app.models.mission import MissionConfig
from app.models.vehicle import VehicleConfig
from app.physics.constants import EARTH_RADIUS_M, EARTH_ROTATION_RATE_RAD_S
from app.simulation.dynamics import compute_dynamics_derivatives


def test_supported_corotating_vehicle_has_zero_radius_acceleration():
    vehicle = VehicleConfig(
        dry_mass_kg=50000, payload_mass_kg=10000,
        propellant_mass_kg=400000, thrust_n=2000000,
        specific_impulse_s=300, drag_coefficient=.3, reference_area_m2=10,
    )
    tangential_speed = EARTH_ROTATION_RATE_RAD_S * EARTH_RADIUS_M
    state = np.array([EARTH_RADIUS_M, 0, 0, tangential_speed, 400000.])
    derivative, _ = compute_dynamics_derivatives(0, state, vehicle, MissionConfig())
    radius_acceleration = derivative[2] + tangential_speed ** 2 / EARTH_RADIUS_M
    assert abs(radius_acceleration) < 1e-10
