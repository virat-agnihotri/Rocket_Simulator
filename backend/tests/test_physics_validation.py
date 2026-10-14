"""Comprehensive Mathematical and Physics Validation Tests.

Validates the 8 core aerospace simulation requirements:
1. Analytical gravity-only motion (projectile in vacuum).
2. Constant-thrust, constant-mass, zero-drag acceleration vs analytical kinematics.
3. Propellant consumption rate mdot = T / (Isp * g0), dry mass floor, zero thrust at depletion.
4. Launch pad constraint: vehicle remains stationary when thrust < weight (T < m * g0).
5. Aerodynamic drag direction opposes velocity, scales quadratically with speed, and scales linearly with density.
6. Numerical convergence across step sizes / solver tolerances.
7. Simulated engine failure at configured shutdown time and ballistic transition.
8. Orbital mechanics conservation of specific mechanical energy and angular momentum in vacuum.
"""
import math
import numpy as np
import pytest
from scipy.integrate import solve_ivp

from app.physics.constants import (
    EARTH_RADIUS_M,
    EARTH_MU,
    STANDARD_GRAVITY_G0,
    SEA_LEVEL_DENSITY_RHO0,
    EARTH_ROTATION_RATE_RAD_S,
)
from app.physics.gravity import (
    gravitational_acceleration_vector,
    gravitational_acceleration_scalar,
)
from app.physics.propulsion import (
    effective_exhaust_velocity,
    propellant_mass_flow_rate,
)
from app.atmosphere.aerodynamics import aerodynamic_drag_vector, dynamic_pressure
from app.atmosphere.density import get_density
from app.simulation.dynamics import compute_dynamics_derivatives
from app.simulation.integrator import integrate_trajectory
from app.models.vehicle import VehicleConfig
from app.models.mission import (
    MissionConfig,
    GuidanceConfig,
    NumericalSolverSettings,
    AtmosphereModelType,
)


@pytest.fixture
def base_vehicle() -> VehicleConfig:
    return VehicleConfig(
        name="Validation Rocket",
        dry_mass_kg=25000.0,
        payload_mass_kg=5000.0,
        propellant_mass_kg=150000.0,
        thrust_n=3500000.0,
        specific_impulse_s=310.0,
        drag_coefficient=0.35,
        reference_area_m2=10.5,
    )


@pytest.fixture
def base_mission() -> MissionConfig:
    return MissionConfig(
        target_altitude_m=200000.0,
        simulation_duration_s=120.0,
        output_interval_s=0.5,
        launch_altitude_m=0.0,
        selected_atmosphere_model=AtmosphereModelType.EXPONENTIAL,
        guidance_configuration=GuidanceConfig(
            pitchover_altitude_m=1000.0,
            pitch_end_altitude_m=80000.0,
            target_pitch_deg=85.0,
        ),
    )


class TestPhysicsValidationSuite:
    """Rigorous aerospace validation tests covering analytical references and conservation laws."""

    def test_1_analytical_gravity_vacuum_projectile(self):
        """
        Test 1: Projectile motion under gravity in vacuum.
        Verifies acceleration vector matches -mu/r^2 * r_hat and energy conservation holds:
        v(r) = sqrt(v0^2 + 2 * mu * (1/r - 1/r0)).
        """
        r0 = EARTH_RADIUS_M + 300000.0  # 300 km altitude (vacuum)
        v0 = 1200.0  # 1200 m/s radial velocity upward
        pos0 = np.array([r0, 0.0])
        vel0 = np.array([v0, 0.0])

        vehicle = VehicleConfig(
            dry_mass_kg=1000.0,
            payload_mass_kg=0.0,
            propellant_mass_kg=100.0,
            thrust_n=1000.0,
            specific_impulse_s=300.0,
            drag_coefficient=0.0,
            reference_area_m2=1.0,
        )
        mission = MissionConfig(
            simulation_duration_s=50.0,
            output_interval_s=0.1,
            selected_atmosphere_model=AtmosphereModelType.EXPONENTIAL,
            guidance_configuration=GuidanceConfig(pitchover_altitude_m=500000.0, pitch_end_altitude_m=1000000.0),
            engine_shutdown_time_s=0.0,
        )

        state0 = np.array([pos0[0], pos0[1], vel0[0], vel0[1], 100.0])
        derivs, diag = compute_dynamics_derivatives(0.0, state0, vehicle, mission, include_earth_rotation=False)

        # Check instantaneous acceleration
        expected_g = EARTH_MU / (r0 ** 2)
        assert pytest.approx(diag["acceleration_mps2"], rel=1e-5) == expected_g
        assert pytest.approx(derivs[2], rel=1e-5) == -expected_g
        assert pytest.approx(derivs[3], abs=1e-10) == 0.0

        # Integrate for 40 seconds
        def ode(t, y):
            d, _ = compute_dynamics_derivatives(t, y, vehicle, mission, include_earth_rotation=False)
            return d

        sol = solve_ivp(ode, (0.0, 40.0), state0, method="RK45", rtol=1e-10, atol=1e-12)
        assert sol.success

        r_final = np.linalg.norm(sol.y[:2, -1])
        v_final = np.linalg.norm(sol.y[2:4, -1])

        # Analytical velocity from energy conservation
        v_expected = math.sqrt(v0 ** 2 + 2.0 * EARTH_MU * (1.0 / r_final - 1.0 / r0))
        assert pytest.approx(v_final, rel=1e-5) == v_expected

    def test_2_constant_thrust_zero_drag_kinematics(self):
        """
        Test 2: Constant thrust, constant mass, zero drag vertical kinematics.
        Tests that acceleration a = T/m - g0 and kinematics v(t) = a*t, y(t) = 0.5*a*t^2 match.
        """
        dry_mass = 5000.0
        prop_mass = 5000.0
        total_mass = dry_mass + prop_mass  # 10000 kg
        thrust = 250000.0  # N
        g_surf = gravitational_acceleration_scalar(EARTH_RADIUS_M)
        expected_acc = (thrust / total_mass) - g_surf  # 25.0 - 9.82 = 15.18 m/s^2

        vehicle = VehicleConfig(
            dry_mass_kg=dry_mass,
            payload_mass_kg=0.0,
            propellant_mass_kg=prop_mass,
            thrust_n=thrust,
            specific_impulse_s=20000.0,  # high Isp so mdot is negligible over 1-2 s
            drag_coefficient=0.0,
            reference_area_m2=1.0,
        )
        mission = MissionConfig(
            simulation_duration_s=10.0,
            output_interval_s=0.1,
            guidance_configuration=GuidanceConfig(pitchover_altitude_m=500000.0, pitch_end_altitude_m=1000000.0),
        )

        state0 = np.array([EARTH_RADIUS_M + 10.0, 0.0, 0.0, 0.0, prop_mass])
        derivs, diag = compute_dynamics_derivatives(0.0, state0, vehicle, mission, include_earth_rotation=False)

        # Acceleration check
        assert pytest.approx(derivs[2], rel=1e-3) == expected_acc
        assert pytest.approx(diag["acceleration_mps2"], rel=1e-3) == expected_acc

        # Integrate for 1.0 second
        def ode(t, y):
            d, _ = compute_dynamics_derivatives(t, y, vehicle, mission, include_earth_rotation=False)
            return d

        sol = solve_ivp(ode, (0.0, 1.0), state0, method="RK45", rtol=1e-9, atol=1e-11)
        assert sol.success

        t_final = sol.t[-1]
        v_final = sol.y[2, -1]
        delta_r_final = sol.y[0, -1] - state0[0]

        # Analytical comparisons: v = a*t, y = 0.5*a*t^2
        v_analytical = expected_acc * t_final
        delta_r_analytical = 0.5 * expected_acc * (t_final ** 2)

        assert pytest.approx(v_final, rel=1e-2) == v_analytical
        assert pytest.approx(delta_r_final, rel=1e-2) == delta_r_analytical

    def test_3_propellant_consumption_and_dry_mass_floor(self, base_vehicle, base_mission):
        """
        Test 3: Mass flow rate mdot = T / (Isp * g0), dry mass floor, thrust drops to zero at depletion.
        """
        thrust = base_vehicle.thrust_n
        isp = base_vehicle.specific_impulse_s
        prop_mass = base_vehicle.propellant_mass_kg
        dry_mass = base_vehicle.dry_mass_kg + base_vehicle.payload_mass_kg

        # Analytical mass flow rate
        expected_mdot = thrust / (isp * STANDARD_GRAVITY_G0)
        actual_mdot = propellant_mass_flow_rate(thrust, isp)
        assert pytest.approx(actual_mdot, rel=1e-5) == expected_mdot

        expected_burn_time = prop_mass / expected_mdot

        # Simulate past burnout
        mission = base_mission.model_copy(
            update={"simulation_duration_s": expected_burn_time + 40.0, "output_interval_s": 1.0}
        )
        res = integrate_trajectory(base_vehicle, mission)
        assert res["success"]

        sol = res["sol"]
        # Propellant state over time
        m_prop_traj = sol.y[4]
        # Propellant must never be negative
        assert np.all(m_prop_traj >= -1e-6)

        # After burnout, verify vehicle mass equals dry mass + payload
        state_post_burnout = sol.y[:, -1]
        _, diag_post = compute_dynamics_derivatives(sol.t[-1], state_post_burnout, base_vehicle, mission)
        assert diag_post["thrust_n"] == 0.0
        assert diag_post["is_engine_active"] is False
        assert pytest.approx(diag_post["mass_kg"], abs=1e-2) == dry_mass
        assert pytest.approx(diag_post["propellant_remaining_kg"], abs=1e-4) == 0.0

    def test_4_launch_pad_constraint_thrust_less_than_weight(self):
        """
        Test 4: Vehicle with thrust < weight remains stationary on the pad.
        """
        total_mass = 100000.0  # kg
        weight = total_mass * gravitational_acceleration_scalar(EARTH_RADIUS_M)  # ~982 kN
        low_thrust = 400000.0  # 400 kN, well below weight (TWR ~ 0.41)

        vehicle = VehicleConfig(
            dry_mass_kg=20000.0,
            payload_mass_kg=0.0,
            propellant_mass_kg=80000.0,
            thrust_n=low_thrust,
            specific_impulse_s=300.0,
            drag_coefficient=0.3,
            reference_area_m2=10.0,
        )
        mission = MissionConfig(
            simulation_duration_s=10.0,
            output_interval_s=0.5,
            launch_altitude_m=0.0,
            guidance_configuration=GuidanceConfig(pitchover_altitude_m=1000.0),
        )

        res = integrate_trajectory(vehicle, mission)
        assert res["success"]

        sol = res["sol"]
        radii = np.linalg.norm(sol.y[:2], axis=0)
        altitudes = radii - EARTH_RADIUS_M

        # Vehicle must not lift off or sink into the Earth
        assert np.all(np.abs(altitudes) < 1e-3)
        # Radial speed should remain zero
        for i in range(len(sol.t)):
            state_i = sol.y[:, i]
            pos_i = state_i[:2]
            vel_i = state_i[2:4]
            r_hat = pos_i / np.linalg.norm(pos_i)
            v_radial = np.dot(vel_i, r_hat)
            assert abs(v_radial) < 1e-3

    def test_5_aerodynamic_drag_physics(self):
        """
        Test 5: Aerodynamic drag force vector opposes velocity, scales quadratically with speed,
        and scales linearly with atmospheric density.
        """
        cd = 0.4
        area = 8.0
        rho = 1.225
        vel = np.array([120.0, 90.0])  # speed = 150 m/s
        speed = float(np.linalg.norm(vel))

        f_drag = aerodynamic_drag_vector(rho, vel, cd, area)
        f_mag = float(np.linalg.norm(f_drag))

        # 1. Opposes velocity direction
        dot_product = np.dot(f_drag, vel)
        assert dot_product < 0.0
        unit_drag = f_drag / f_mag
        unit_vel = vel / speed
        assert pytest.approx(unit_drag[0], rel=1e-5) == -unit_vel[0]
        assert pytest.approx(unit_drag[1], rel=1e-5) == -unit_vel[1]

        # 2. Formula verification: F_drag = 0.5 * rho * v^2 * cd * A
        expected_f = 0.5 * rho * (speed ** 2) * cd * area
        assert pytest.approx(f_mag, rel=1e-5) == expected_f
        assert pytest.approx(dynamic_pressure(rho, speed), rel=1e-5) == 0.5 * rho * (speed ** 2)

        # 3. Quadratic speed scaling: 2x speed -> 4x drag
        f_drag_double_v = aerodynamic_drag_vector(rho, 2.0 * vel, cd, area)
        assert pytest.approx(np.linalg.norm(f_drag_double_v) / f_mag, rel=1e-5) == 4.0

        # 4. Linear density scaling: 2x density -> 2x drag
        f_drag_double_rho = aerodynamic_drag_vector(2.0 * rho, vel, cd, area)
        assert pytest.approx(np.linalg.norm(f_drag_double_rho) / f_mag, rel=1e-5) == 2.0

    def test_6_numerical_convergence_time_step_sweep(self, base_vehicle, base_mission):
        """
        Test 6: Trajectory convergence across step sizes / solver tolerances.
        Compares coarse, medium, and fine solver tolerances and checks convergence.
        """
        tolerances = [
            (1e-4, 1e-6, 0.5),   # Coarse
            (1e-7, 1e-9, 0.1),   # Medium
            (1e-10, 1e-12, 0.02) # Fine
        ]
        results = []
        mission_base = base_mission.model_copy(
            update={"simulation_duration_s": 60.0, "output_interval_s": 0.5}
        )

        for rtol, atol, max_step in tolerances:
            m = mission_base.model_copy(
                update={
                    "numerical_solver_settings": NumericalSolverSettings(
                        method="RK45",
                        rtol=rtol,
                        atol=atol,
                        max_step_s=max_step,
                    )
                }
            )
            res = integrate_trajectory(base_vehicle, m)
            assert res["success"]
            results.append(res["sol"])

        sol_coarse, sol_medium, sol_fine = results

        # Evaluate at t = 50 s
        idx_coarse = np.argmin(np.abs(sol_coarse.t - 50.0))
        idx_medium = np.argmin(np.abs(sol_medium.t - 50.0))
        idx_fine = np.argmin(np.abs(sol_fine.t - 50.0))

        pos_coarse = sol_coarse.y[:2, idx_coarse]
        pos_medium = sol_medium.y[:2, idx_medium]
        pos_fine = sol_fine.y[:2, idx_fine]

        diff_coarse_fine = np.linalg.norm(pos_coarse - pos_fine)
        diff_medium_fine = np.linalg.norm(pos_medium - pos_fine)

        # Medium-to-fine error must be significantly smaller than coarse-to-fine error (monotonic convergence)
        assert diff_medium_fine < diff_coarse_fine
        # Relative positional difference to fine solution must be tiny (< 0.05%)
        rel_error = diff_medium_fine / np.linalg.norm(pos_fine)
        assert rel_error < 5e-4

    def test_7_simulated_engine_failure_and_ballistic_transition(self, base_vehicle, base_mission):
        """
        Test 7: Engine failure at configured shutdown time (t = 30.0 s).
        Verifies thrust drops to zero, mass flow stops, and vehicle transitions to ballistic flight.
        """
        shutdown_t = 30.0
        mission = base_mission.model_copy(
            update={
                "simulation_duration_s": 70.0,
                "output_interval_s": 0.5,
                "engine_shutdown_time_s": shutdown_t,
            }
        )

        res = integrate_trajectory(base_vehicle, mission)
        assert res["success"]
        sol = res["sol"]

        # Sample before shutdown (t = 20 s)
        idx_pre = np.argmin(np.abs(sol.t - 20.0))
        _, diag_pre = compute_dynamics_derivatives(sol.t[idx_pre], sol.y[:, idx_pre], base_vehicle, mission)
        assert diag_pre["thrust_n"] > 0.0
        assert diag_pre["is_engine_active"] is True

        # Sample after shutdown (t = 40 s and t = 60 s)
        idx_post1 = np.argmin(np.abs(sol.t - 40.0))
        idx_post2 = np.argmin(np.abs(sol.t - 60.0))
        _, diag_post1 = compute_dynamics_derivatives(sol.t[idx_post1], sol.y[:, idx_post1], base_vehicle, mission)
        _, diag_post2 = compute_dynamics_derivatives(sol.t[idx_post2], sol.y[:, idx_post2], base_vehicle, mission)

        assert diag_post1["thrust_n"] == 0.0
        assert diag_post1["is_engine_active"] is False
        assert diag_post2["thrust_n"] == 0.0
        assert diag_post2["is_engine_active"] is False

        # Propellant mass must remain constant after shutdown
        m_prop_post1 = sol.y[4, idx_post1]
        m_prop_post2 = sol.y[4, idx_post2]
        assert pytest.approx(m_prop_post1, rel=1e-6) == m_prop_post2

    def test_8_orbital_mechanics_energy_and_momentum_conservation(self):
        """
        Test 8: Orbital mechanics conservation of specific mechanical energy and angular momentum in vacuum.
        Integrates a circular orbit at 400 km for an entire orbital period (~5554 s).
        Verifies |epsilon(t) - epsilon_0| / |epsilon_0| < 1e-6 and |h(t) - h_0| / |h_0| < 1e-6.
        """
        r_orbit = EARTH_RADIUS_M + 400000.0  # 400 km altitude
        v_circ = math.sqrt(EARTH_MU / r_orbit)  # ~ 7672.6 m/s
        period = 2.0 * math.pi * math.sqrt((r_orbit ** 3) / EARTH_MU)  # ~ 5554 s

        # Vacuum vehicle with no thrust and no drag
        vehicle = VehicleConfig(
            dry_mass_kg=5000.0,
            payload_mass_kg=0.0,
            propellant_mass_kg=100.0,
            thrust_n=1000.0,
            specific_impulse_s=300.0,
            drag_coefficient=0.0,
            reference_area_m2=5.0,
        )
        mission = MissionConfig(
            simulation_duration_s=period,
            output_interval_s=10.0,
            selected_atmosphere_model=AtmosphereModelType.EXPONENTIAL,
            guidance_configuration=GuidanceConfig(pitchover_altitude_m=500000.0, pitch_end_altitude_m=1000000.0),
            engine_shutdown_time_s=0.0,
        )

        state0 = np.array([r_orbit, 0.0, 0.0, v_circ, 100.0])

        def ode(t, y):
            d, _ = compute_dynamics_derivatives(t, y, vehicle, mission, include_earth_rotation=False)
            return d

        sol = solve_ivp(
            ode,
            (0.0, period),
            state0,
            method="DOP853",  # High-order Runge-Kutta for precision orbital motion
            rtol=1e-11,
            atol=1e-13,
            t_eval=np.linspace(0.0, period, 100),
        )
        assert sol.success

        positions = sol.y[:2]  # shape (2, N)
        velocities = sol.y[2:4]  # shape (2, N)

        radii = np.linalg.norm(positions, axis=0)
        speeds = np.linalg.norm(velocities, axis=0)

        # Specific mechanical energy: epsilon = v^2/2 - mu/r
        energies = 0.5 * (speeds ** 2) - (EARTH_MU / radii)
        energy_0 = energies[0]

        # Specific angular momentum: h = |r x v| = |x*vy - y*vx|
        angular_momenta = np.abs(positions[0] * velocities[1] - positions[1] * velocities[0])
        h_0 = angular_momenta[0]

        # Verify conservation across the entire orbit
        max_energy_rel_error = np.max(np.abs(energies - energy_0) / np.abs(energy_0))
        max_momentum_rel_error = np.max(np.abs(angular_momenta - h_0) / h_0)

        assert max_energy_rel_error < 1e-6
        assert max_momentum_rel_error < 1e-6

        # Final position returns to initial position after 1 orbit
        final_pos_err = np.linalg.norm(positions[:, -1] - positions[:, 0])
        assert final_pos_err < 10.0  # within 10 meters over 42,000 km travelled!
