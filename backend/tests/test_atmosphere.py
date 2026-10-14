"""Scientific Tests: Atmosphere and Aerodynamics."""
import numpy as np
import pytest

from app.atmosphere.density import exponential_density, us_standard_simple_density, get_density
from app.atmosphere.pressure import exponential_pressure
from app.atmosphere.aerodynamics import (
    dynamic_pressure,
    aerodynamic_drag_magnitude,
    aerodynamic_drag_vector,
)


class TestAtmosphere:
    def test_density_decreases_with_altitude(self):
        rho_0 = exponential_density(0.0)
        rho_10k = exponential_density(10000.0)
        rho_50k = exponential_density(50000.0)
        rho_150k = exponential_density(150000.0)

        assert rho_0 > rho_10k > rho_50k > rho_150k
        assert pytest.approx(rho_0, rel=1e-3) == 1.225
        assert rho_150k == 0.0

    def test_us_standard_troposphere_lapse(self):
        rho_sea = us_standard_simple_density(0.0)
        rho_5k = us_standard_simple_density(5000.0)
        assert rho_sea > rho_5k > 0.0

    def test_vacuum_model(self):
        assert get_density(0.0, model="vacuum") == 0.0
        assert get_density(50000.0, model="vacuum") == 0.0

    def test_dynamic_pressure_scaling(self):
        rho = 1.225
        v1 = 100.0
        v2 = 200.0  # Double speed
        q1 = dynamic_pressure(rho, v1)
        q2 = dynamic_pressure(rho, v2)

        # q = 0.5 * rho * v^2, doubling speed quadruples q
        assert pytest.approx(q2, rel=1e-5) == 4.0 * q1
        assert pytest.approx(q1, rel=1e-5) == 0.5 * 1.225 * 10000.0

    def test_drag_opposes_relative_motion(self):
        rho = 1.0
        v_rel = np.array([300.0, 400.0])  # Moving diagonally
        cd = 0.3
        area = 10.0

        f_drag = aerodynamic_drag_vector(rho, v_rel, cd, area)

        # Dot product with velocity must be strictly negative
        dot_prod = np.dot(f_drag, v_rel)
        assert dot_prod < 0

        # Vector direction must be exactly opposite
        unit_v = v_rel / np.linalg.norm(v_rel)
        unit_drag = f_drag / np.linalg.norm(f_drag)
        assert np.allclose(unit_drag, -unit_v)

    def test_drag_zero_at_zero_velocity(self):
        f_drag = aerodynamic_drag_vector(1.225, np.array([0.0, 0.0]), 0.3, 10.0)
        assert np.allclose(f_drag, [0.0, 0.0])
