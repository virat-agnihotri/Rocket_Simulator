"""Scientific Tests: Orbital Mechanics and Classification."""
import math
import numpy as np
import pytest

from app.physics.constants import EARTH_RADIUS_M, EARTH_MU
from app.orbital.mechanics import (
    circular_orbit_velocity,
    circular_orbit_period,
    specific_orbital_energy,
    orbital_elements_from_state,
)
from app.orbital.analysis import analyze_orbital_state
from app.orbital.evaluator import evaluate_target_orbit_satisfaction
from app.models.results import OrbitClassification


class TestOrbitalMechanics:
    def test_circular_velocity_400km(self):
        """At 400 km altitude, circular speed should be ~7.67 km/s."""
        r_400km = EARTH_RADIUS_M + 400000.0  # 6,771,000 m
        v_circ = circular_orbit_velocity(r_400km)
        # sqrt(3.986004418e14 / 6771000) = 7672.56 m/s = 7.67 km/s
        assert pytest.approx(v_circ / 1000.0, abs=0.03) == 7.67

    def test_circular_period_400km(self):
        """At 400 km altitude, orbital period is ~5554 seconds (~92.6 minutes)."""
        r_400km = EARTH_RADIUS_M + 400000.0
        t_circ = circular_orbit_period(r_400km)
        assert pytest.approx(t_circ / 60.0, abs=0.5) == 92.6

    def test_circular_orbit_has_zero_eccentricity(self):
        """State with exact tangential circular velocity must have e ≈ 0."""
        r = EARTH_RADIUS_M + 400000.0
        v_circ = circular_orbit_velocity(r)

        # Position on +x axis, velocity along +y axis
        pos = np.array([r, 0.0])
        vel = np.array([0.0, v_circ])

        elements = orbital_elements_from_state(pos, vel)
        assert pytest.approx(elements["eccentricity"], abs=1e-4) == 0.0
        assert pytest.approx(elements["periapsis_altitude_m"], abs=100.0) == 400000.0
        assert pytest.approx(elements["apoapsis_altitude_m"], abs=100.0) == 400000.0

    def test_vertical_ascent_is_not_circular(self):
        """Pure radial flight must NOT be classified as circular orbit."""
        r = EARTH_RADIUS_M + 400000.0
        pos = np.array([r, 0.0])
        vel = np.array([1000.0, 0.0])  # Pure radial vertical velocity

        metrics = analyze_orbital_state(pos, vel, target_altitude_m=400000.0)
        assert metrics.orbit_classification != OrbitClassification.CIRCULAR
        assert metrics.orbit_classification in (OrbitClassification.SUBORBITAL, OrbitClassification.GROUND_IMPACT)

        satisfied, _ = evaluate_target_orbit_satisfaction(metrics, 400000.0)
        assert satisfied is False

    def test_earth_intersecting_orbit_rejected(self):
        """An orbit that reaches 400 km at apoapsis but has periapsis inside Earth is rejected."""
        # e.g., apoapsis at 400 km, periapsis at -500 km (suborbital ballistic arc)
        r = EARTH_RADIUS_M + 400000.0
        pos = np.array([r, 0.0])
        # Horizontal speed lower than orbital velocity
        vel = np.array([0.0, 4500.0])  # 4.5 km/s instead of 7.67 km/s

        metrics = analyze_orbital_state(pos, vel, target_altitude_m=400000.0)
        assert metrics.orbit_classification == OrbitClassification.SUBORBITAL
        assert metrics.periapsis_altitude_m < 0  # Re-enters Earth

        satisfied, _ = evaluate_target_orbit_satisfaction(metrics, 400000.0)
        assert satisfied is False

    def test_valid_circular_orbit_satisfied(self):
        """Proper circular insertion meets all criteria."""
        r = EARTH_RADIUS_M + 400000.0
        v_circ = circular_orbit_velocity(r)
        pos = np.array([r, 0.0])
        vel = np.array([0.0, v_circ])

        metrics = analyze_orbital_state(pos, vel, target_altitude_m=400000.0)
        assert metrics.orbit_classification == OrbitClassification.CIRCULAR

        satisfied, reasons = evaluate_target_orbit_satisfaction(metrics, 400000.0)
        assert satisfied is True
        assert len(reasons) > 0
