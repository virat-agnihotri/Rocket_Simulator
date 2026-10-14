"""Scientific Tests: Gravitational and Propulsion Physics."""
import math
import numpy as np
import pytest

from app.physics.constants import (
    EARTH_RADIUS_M,
    EARTH_MU,
    STANDARD_GRAVITY_G0,
)
from app.physics.gravity import (
    gravitational_acceleration_scalar,
    gravitational_acceleration_at_altitude,
    gravitational_acceleration_vector,
)
from app.physics.propulsion import (
    effective_exhaust_velocity,
    propellant_mass_flow_rate,
    burn_duration,
    thrust_to_weight_ratio,
)
from app.physics.rocket_equation import (
    ideal_delta_v,
    required_mass_ratio,
    ideal_propellant_required,
)


class TestGravity:
    def test_surface_gravity_approx_9_82(self):
        """Gravity at mean Earth surface should be approximately 9.82 m/s^2."""
        g_surface = gravitational_acceleration_scalar(EARTH_RADIUS_M)
        assert pytest.approx(g_surface, rel=1e-2) == 9.82
        assert 9.80 <= g_surface <= 9.83

    def test_gravity_decreases_with_altitude(self):
        """Gravitational acceleration strictly decreases with altitude."""
        g_0 = gravitational_acceleration_at_altitude(0.0)
        g_100km = gravitational_acceleration_at_altitude(100000.0)
        g_400km = gravitational_acceleration_at_altitude(400000.0)
        assert g_0 > g_100km > g_400km

    def test_gravity_vector_points_to_center(self):
        """Gravity vector must oppose position vector directly."""
        pos = np.array([3000000.0, 4000000.0])
        r_mag = np.linalg.norm(pos)
        a_g = gravitational_acceleration_vector(pos)

        # Dot product with position should be negative (inward)
        assert np.dot(a_g, pos) < 0
        # Magnitude should match scalar equation
        expected_mag = EARTH_MU / (r_mag ** 2)
        assert pytest.approx(np.linalg.norm(a_g), rel=1e-5) == expected_mag

    def test_gravity_invalid_radius(self):
        with pytest.raises(ValueError):
            gravitational_acceleration_scalar(0)
        with pytest.raises(ValueError):
            gravitational_acceleration_scalar(-1000.0)


class TestPropulsion:
    def test_exhaust_velocity_and_mass_flow(self):
        isp = 300.0
        thrust = 7000000.0  # 7 MN
        v_e = effective_exhaust_velocity(isp)
        expected_ve = 300.0 * STANDARD_GRAVITY_G0
        assert pytest.approx(v_e, rel=1e-5) == expected_ve

        mdot = propellant_mass_flow_rate(thrust, isp)
        expected_mdot = thrust / expected_ve
        assert pytest.approx(mdot, rel=1e-5) == expected_mdot

    def test_burn_duration(self):
        propellant = 450000.0  # kg
        mdot = 2379.25  # kg/s
        t_burn = burn_duration(propellant, mdot)
        assert pytest.approx(t_burn, rel=1e-3) == (propellant / mdot)

    def test_thrust_to_weight_ratio(self):
        mass = 500000.0
        thrust = 7000000.0
        twr = thrust_to_weight_ratio(thrust, mass, STANDARD_GRAVITY_G0)
        # 7,000,000 / (500,000 * 9.80665) = 1.4275
        assert pytest.approx(twr, abs=0.02) == 1.43

    def test_twr_low_thrust_less_than_one(self):
        mass = 500000.0
        thrust = 4000000.0
        twr = thrust_to_weight_ratio(thrust, mass, STANDARD_GRAVITY_G0)
        assert twr < 1.0
        assert pytest.approx(twr, abs=0.02) == 0.82


class TestRocketEquation:
    def test_ideal_delta_v_matches_day1_test_case(self):
        """Verify DAY1_NOTES Test 1: m0=500000, mf=50000, isp=300 -> ~6774 m/s."""
        m0 = 500000.0
        mf = 50000.0
        isp = 300.0
        dv = ideal_delta_v(m0, mf, isp)
        # Expected: 300 * 9.80665 * ln(10) = 6773.9 m/s
        assert pytest.approx(dv, abs=1.0) == 6774.0

    def test_final_mass_exceeding_initial_mass_raises(self):
        with pytest.raises(ValueError):
            ideal_delta_v(50000.0, 60000.0, 300.0)

    def test_required_mass_ratio_and_propellant(self):
        target_dv = 6773.91
        isp = 300.0
        ratio = required_mass_ratio(target_dv, isp)
        assert pytest.approx(ratio, rel=1e-3) == 10.0

        mf = 50000.0
        prop_req = ideal_propellant_required(mf, target_dv, isp)
        assert pytest.approx(prop_req, rel=1e-3) == 450000.0
