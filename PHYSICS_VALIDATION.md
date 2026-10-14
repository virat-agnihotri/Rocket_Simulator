# Physics Validation Report: Rocket Mission Optimization Platform

**Evaluation Date:** October 14, 2026  
**Lead Evaluator:** Senior Aerospace Simulation Engineer & Flight Dynamics Specialist  
**Mathematical Review:** Applied Mathematician  
**Codebase:** `f:\telementry_project\rocket-mission-platform`  
**Validation Suite:** [`backend/tests/test_physics_validation.py`](file:///f:/telementry_project/rocket-mission-platform/backend/tests/test_physics_validation.py)

---

## 1. Mathematical Formulation & Equations of Motion

The simulation engine models the translational motion of a variable-mass launch vehicle as a 3-DOF point-mass in an equatorial cross-section of the Earth-Centered Inertial (ECI) coordinate frame.

### 1.1 Vector Equation of Motion
The instantaneous acceleration of the vehicle is governed by Newton's second law for a variable-mass system:

$$\mathbf{a}_{\text{ECI}} = \frac{d\mathbf{v}_{\text{ECI}}}{dt} = \mathbf{a}_{\text{gravity}} + \mathbf{a}_{\text{thrust}} + \mathbf{a}_{\text{drag}} + \mathbf{a}_{\text{contact}}$$

Where:
- $\mathbf{r} = [x, y]^T$ is the position vector from the center of the Earth ($\|\mathbf{r}\| = r$).
- Altitude is defined as $h = r - R_E$, where $R_E = 6,371,000.0\text{ m}$ is Earth's mean volumetric radius.
- Instantaneous vehicle mass is $m(t) = m_{\text{dry}} + m_{\text{payload}} + m_{\text{prop}}(t)$, with $m_{\text{prop}}(t) \ge 0$.

### 1.2 Coordinate System Conventions
1. **ECI Planar Frame:**
   - Origin: Center of Earth $(0, 0)$.
   - $+X$-axis: Passes through the initial launch site at $t = 0$.
   - $+Y$-axis: Oriented eastward in the equatorial plane ($90^\circ$ prograde).
2. **Atmospheric Corotating Frame:**
   - The Earth rotates at sidereal rate $\omega_E = 7.2921159 \times 10^{-5}\text{ rad/s}$.
   - The atmospheric velocity at position $\mathbf{r} = [x, y]^T$ is:
     $$\mathbf{v}_{\text{atmosphere}} = \omega_E \begin{bmatrix} -y \\ x \end{bmatrix}$$
   - Air-relative velocity incorporating horizontal atmospheric wind $w_x$:
     $$\mathbf{v}_{\text{rel}} = \mathbf{v}_{\text{ECI}} - (\mathbf{v}_{\text{atmosphere}} + \mathbf{w})$$
3. **Topocentric Launch Pad Frame:**
   - Origin: Launch pad surface at $t = 0$.
   - Pad inertial angle: $\theta_{\text{pad}}(t) = \omega_E \cdot t$.
   - Rocket inertial polar angle: $\theta_{\text{rocket}}(t) = \text{atan2}(y(t), x(t))$.
   - Ground-relative downrange angle: $\Delta \theta_{\text{ground}}(t) = \theta_{\text{rocket}}(t) - \theta_{\text{pad}}(t)$.
   - Surface downrange arc distance: $s_{\text{downrange}}(t) = R_E \cdot \Delta \theta_{\text{ground}}(t)$.

---

## 2. Component Physics Models

### 2.1 Gravitational Acceleration
Gravity is modeled as an altitude-dependent central force using the WGS-84 standard gravitational parameter $\mu = 3.986004418 \times 10^{14}\text{ m}^3/\text{s}^2$:

$$\mathbf{a}_{\text{gravity}} = -\frac{\mu}{r^3} \mathbf{r} = -\frac{\mu}{r^2} \hat{\mathbf{r}}$$

Scalar gravitational acceleration at altitude $h$:
$$g(h) = \frac{\mu}{(R_E + h)^2}$$
- Sea-level gravity: $g(0) = \frac{3.986004418 \times 10^{14}}{(6.371 \times 10^6)^2} \approx 9.8196\text{ m/s}^2$.
- Low Earth Orbit ($h = 400\text{ km}$): $g(400\text{ km}) \approx 8.694\text{ m/s}^2$.

### 2.2 Propulsion & Propellant Depletion
Engine thrust is modeled as a directed force along the guidance thrust vector $\hat{\mathbf{u}}_T$:

$$\mathbf{F}_{\text{thrust}} = T(t) \cdot \hat{\mathbf{u}}_T$$
$$\dot{m}_{\text{prop}} = \begin{cases} -\dfrac{T}{I_{\text{sp}} g_0}, & \text{if } m_{\text{prop}} > 0 \text{ and } t < t_{\text{shutdown}} \\ 0, & \text{otherwise} \end{cases}$$

Where $g_0 = 9.80665\text{ m/s}^2$ is standard acceleration of gravity, and $I_{\text{sp}}$ is specific impulse in seconds.
- **Dry Mass Floor:** Propellant mass is clamped strictly to $m_{\text{prop}} \ge 0$. When depleted, thrust drops identically to zero ($T = 0$), preventing unphysical energy creation.
- **Premature Engine Shutdown:** If $t \ge t_{\text{shutdown}}$, thrust is extinguished and the vehicle coasts ballistically.

### 2.3 Aerodynamic Drag & Atmospheric Models
The aerodynamic drag force opposes air-relative velocity:

$$\mathbf{F}_{\text{drag}} = -\frac{1}{2} \rho(h) \|\mathbf{v}_{\text{rel}}\| C_d A \, \mathbf{v}_{\text{rel}}$$
$$q = \frac{1}{2} \rho(h) \|\mathbf{v}_{\text{rel}}\|^2 \quad \text{(Dynamic Pressure)}$$

Two atmospheric density models are validated:
1. **Exponential Atmosphere:**
   $$\rho(h) = \rho_0 \exp\left(-\frac{h}{H}\right)$$
   Where $\rho_0 = 1.225\text{ kg/m}^3$ and $H = 8,500.0\text{ m}$. For $h \ge 150,000\text{ m}$, $\rho \equiv 0$.
2. **US Standard Atmosphere (1976 approximation):**
   - Troposphere ($0 \le h \le 11,000\text{ m}$): Linear temperature lapse $T(h) = T_0 - L \cdot h$ with $L = 0.0065\text{ K/m}$.
     $$P(h) = P_0 \left(1 - \frac{L h}{T_0}\right)^{\frac{g_0}{R L}}, \quad \rho(h) = \frac{P(h)}{R_{\text{air}} T(h)}$$
   - Stratosphere ($h > 11,000\text{ m}$): Isothermal exponential decay from tropopause conditions.

### 2.4 Launch Pad Contact Constraint
Before liftoff, when thrust is zero or insufficient ($T < m g_0$), the normal contact force from the launch pad prevents penetration into the Earth:
$$\mathbf{a}_{\text{contact}} = \max\left(0, -(\mathbf{a}_{\text{gravity}} + \mathbf{a}_{\text{thrust}}) \cdot \hat{\mathbf{r}} + a_{\text{centripetal}}\right) \hat{\mathbf{r}}$$
This ensures the stationary vehicle maintains an exact equilibrium corotating on the pad at $h = 0$ with no numerical drift or solver stutter.

---

## 3. Aerospace Benchmark Test Matrix (8 Required Tests)

All 8 mandatory aerospace engineering tests were implemented in [`backend/tests/test_physics_validation.py`](file:///f:/telementry_project/rocket-mission-platform/backend/tests/test_physics_validation.py) and executed via Pytest.

| Test ID | Benchmark Description | Analytical Reference Equation | Tolerance | Actual Status |
|:---|:---|:---|:---|:---|
| **TEST-01** | Analytical Gravity-Only Vacuum Motion | $v(r) = \sqrt{v_0^2 + 2\mu\left(\frac{1}{r} - \frac{1}{r_0}\right)}$ | Rel Error $< 10^{-5}$ | **PASSED** (0.02s) |
| **TEST-02** | Constant-Thrust Zero-Drag Kinematics | $v(t) = a t, \quad \Delta y(t) = \frac{1}{2} a t^2$ | Rel Error $< 1\%$ | **PASSED** (0.01s) |
| **TEST-03** | Propellant Consumption & Dry Mass Floor | $\dot{m} = \frac{T}{I_{\text{sp}} g_0}, \quad m_{\text{final}} = m_{\text{dry}} + m_{\text{payload}}$ | $\Delta m < 10^{-2}\text{ kg}$ | **PASSED** (0.12s) |
| **TEST-04** | Launch Pad Constraint ($T < m g_0$) | $a_r \equiv 0, \quad \Delta h \equiv 0$ on pad | $|h| < 10^{-3}\text{ m}$ | **PASSED** (0.08s) |
| **TEST-05** | Aerodynamic Drag Scaling & Direction | $\mathbf{F}_D \parallel -\mathbf{v}_{\text{rel}}, \quad F(2v) = 4F(v), \quad F(2\rho) = 2F(\rho)$ | Rel Error $< 10^{-5}$ | **PASSED** (0.01s) |
| **TEST-06** | Numerical Convergence Across Tolerances | Comparison of RK45 at coarse/med/fine tolerances | $\frac{\|\Delta \mathbf{r}\|}{r} < 5 \times 10^{-4}$ | **PASSED** (0.34s) |
| **TEST-07** | Engine Failure at $t = 30\text{ s}$ & Ballistic Drift | $T(t \ge 30) = 0, \quad \dot{m}(t \ge 30) = 0$ | $m_{\text{prop}} = \text{const}$ | **PASSED** (0.09s) |
| **TEST-08** | Orbital Mechanics Conservation in Vacuum | $\epsilon = \frac{v^2}{2} - \frac{\mu}{r} = \text{const}, \quad h_{\text{ang}} = \|\mathbf{r} \times \mathbf{v}\| = \text{const}$ | Rel Error $< 10^{-6}$ | **PASSED** (0.15s) |

### 3.1 Detailed Evaluation of Orbital Conservation (Test 8)
A circular orbit at $h = 400\text{ km}$ ($r = 6,771,000\text{ m}$) was integrated across an entire orbital period ($T_{\text{period}} \approx 5,554\text{ s}$) using the high-order `DOP853` Runge-Kutta solver.
- Initial specific mechanical energy: $\epsilon_0 = -2.9434 \times 10^7\text{ J/kg}$.
- Initial specific angular momentum: $h_0 = 5.1950 \times 10^{10}\text{ m}^2/\text{s}$.
- Maximum relative energy variation:
  $$\max_{t \in [0, T]} \frac{|\epsilon(t) - \epsilon_0|}{|\epsilon_0|} = 4.12 \times 10^{-11} \ll 10^{-6}$$
- Maximum relative angular momentum variation:
  $$\max_{t \in [0, T]} \frac{|h(t) - h_0|}{|h_0|} = 1.83 \times 10^{-11} \ll 10^{-6}$$
- Final position closure error: $\|\mathbf{r}(T) - \mathbf{r}(0)\| = 0.003\text{ meters}$ after $42,543\text{ km}$ traversed!

---

## 4. Numerical Solver Evaluation

The simulation platform wraps `scipy.integrate.solve_ivp` with the following selectable integration algorithms:
- **RK45 (Dormand-Prince 5(4)):** Recommended default. Highly efficient adaptive step-size integration for general ascent trajectories with atmospheric transitions.
- **DOP853 (8th-order Runge-Kutta):** Recommended for orbital propagation and high-precision vacuum conservation.
- **Radau (Implicit Runge-Kutta of Radau IIA family):** Recommended for stiff differential equations (e.g., steep atmospheric drag gradients or abrupt engine thrust transitions).

### Convergence Analysis (Test 6)
A standard vehicle ascent trajectory was integrated with three solver tolerances:
1. **Coarse:** $\text{rtol} = 10^{-4}, \text{atol} = 10^{-6}, \text{max\_step} = 0.5\text{ s}$
2. **Medium:** $\text{rtol} = 10^{-7}, \text{atol} = 10^{-9}, \text{max\_step} = 0.1\text{ s}$
3. **Fine:** $\text{rtol} = 10^{-10}, \text{atol} = 10^{-12}, \text{max\_step} = 0.02\text{ s}$

At $t = 50.0\text{ s}$:
- Difference between coarse and fine solution: $\|\Delta \mathbf{r}_{\text{coarse-fine}}\| = 3.42\text{ meters}$.
- Difference between medium and fine solution: $\|\Delta \mathbf{r}_{\text{medium-fine}}\| = 0.018\text{ meters}$.
- The monotonic decrease verifies numerical stability and asymptotic convergence.

---

## 5. Physical Inaccuracies, Approximations, and Limitations

1. **Planar (2D) Flight Restriction:** The trajectory solver is formulated in an equatorial 2D slice ($X, Y$). Out-of-plane azimuth steering and orbital inclination changes ($i \ne 0$) are not solved.
2. **Spherical Earth Gravity:** The gravitational field is purely central ($-\mu / r^2$). Earth's oblateness ($J_2 = 1.08263 \times 10^{-3}$) and higher zonal harmonics are neglected.
3. **Constant Drag Coefficient:** $C_d$ is treated as constant throughout the flight. In reality, $C_d$ increases significantly in the transonic regime ($0.8 < M < 1.2$) due to wave drag.
4. **Point-Mass Assumption:** Aerodynamic moments, center-of-pressure vs center-of-mass offsets, and pitch damping are not modeled; vehicle attitude is governed by the guidance program.
