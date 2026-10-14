# Scientific Physics Model & Equations

## 1. Classical Propulsion & Rocket Dynamics

### 1.1 Effective Exhaust Velocity & Propellant Mass Flow
The effective exhaust velocity $v_e$ and propellant consumption rate $\dot{m}$ are derived from thrust $T$ and specific impulse $I_{\text{sp}}$:
$$v_e = I_{\text{sp}} \cdot g_0$$
$$\dot{m} = \frac{T}{I_{\text{sp}} \cdot g_0}$$
where standard gravitational acceleration $g_0 = 9.80665 \text{ m/s}^2$.

### 1.2 Tsiolkovsky Rocket Equation
For ideal reaction flight in a vacuum field with zero losses:
$$\Delta v_{\text{ideal}} = v_e \ln\left(\frac{m_0}{m_f}\right)$$
where:
- $m_0 = m_{\text{dry}} + m_{\text{payload}} + m_{\text{propellant}}$
- $m_f = m_{\text{dry}} + m_{\text{payload}}$

### 1.3 Flight Losses
Real vehicle ascent velocity is subject to substantial losses:
$$\Delta v_{\text{actual}} = \Delta v_{\text{ideal}} - \Delta v_{\text{gravity}} - \Delta v_{\text{aerodynamic}} - \Delta v_{\text{steering}}$$

---

## 2. Gravitational Models

The platform adopts the Newtonian inverse-square gravity model in an Earth-centered inertial (ECI) coordinate frame:
$$\vec{a}_g = -\frac{\mu}{|\vec{r}|^3} \vec{r}$$
where:
- $\mu = 3.986004418 \times 10^{14} \text{ m}^3/\text{s}^2$ (Earth gravitational parameter $GM$)
- $R_{\text{Earth}} = 6,371,000 \text{ m}$ (mean volumetric radius)
- Altitude $h = |\vec{r}| - R_{\text{Earth}}$

At Earth's surface ($h = 0$):
$$g_{\text{surface}} = \frac{\mu}{R_{\text{Earth}}^2} \approx 9.8199 \text{ m/s}^2$$

---

## 3. Atmospheric & Aerodynamic Engine

### 3.1 Barometric Exponential Density
$$\rho(h) = \rho_0 \exp\left(-\frac{h}{H}\right)$$
where sea-level density $\rho_0 = 1.225 \text{ kg/m}^3$ and scale height $H = 8,500 \text{ m}$. For altitudes $h \ge 150 \text{ km}$, $\rho(h) = 0$.

### 3.2 Dynamic Pressure
$$q = \frac{1}{2} \rho |\vec{v}_{\text{rel}}|^2$$

### 3.3 Aerodynamic Drag
$$\vec{F}_{\text{drag}} = -\frac{1}{2} \rho |\vec{v}_{\text{rel}}| \vec{v}_{\text{rel}} C_d A$$
Drag opposes the air-relative velocity vector $\vec{v}_{\text{rel}} = \vec{v} - \vec{v}_{\text{atmosphere}} - \vec{v}_{\text{wind}}$.

---

## 4. Ascent Guidance & Equations of Motion

### 4.1 State Vector & Derivatives
The state vector $\vec{y}(t) = [x, y, v_x, v_y, m_{\text{prop}}]^T$ evolves under:
$$\frac{d\vec{r}}{dt} = \vec{v}$$
$$\frac{d\vec{v}}{dt} = \vec{a}_g + \frac{\vec{F}_{\text{thrust}}}{m(t)} + \frac{\vec{F}_{\text{drag}}}{m(t)}$$
$$\frac{dm_{\text{prop}}}{dt} = -\dot{m} \quad \text{for } m_{\text{prop}} > 0$$

### 4.2 Guidance Pitch Profile
The thrust direction is parameterized by pitch angle $\theta_p(h)$ from local vertical:
$$\theta_p(h) = \theta_{\text{target}} \left(\frac{h - h_{\text{start}}}{h_{\text{end}} - h_{\text{start}}}\right)^\alpha$$
where $\alpha$ is the pitch curvature exponent, and $\theta_{\text{target}} \approx 85^\circ - 88^\circ$.

---

## 5. Keplerian Orbital Mechanics & Classification

### 5.1 Specific Orbital Energy & Angular Momentum
$$\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}$$
$$h_z = x v_y - y v_x$$

### 5.2 Semi-Major Axis & Eccentricity
$$a = -\frac{\mu}{2\varepsilon}$$
$$\vec{e} = \frac{\vec{v} \times \vec{h}}{\mu} - \frac{\vec{r}}{r}$$
$$r_{\text{periapsis}} = a(1 - e) \implies h_{\text{periapsis}} = r_{\text{periapsis}} - R_{\text{Earth}}$$
$$r_{\text{apoapsis}} = a(1 + e) \implies h_{\text{apoapsis}} = r_{\text{apoapsis}} - R_{\text{Earth}}$$

### 5.3 Classification & Insertion Rule
1. **Escape / Hyperbolic**: $\varepsilon \ge 0$ and $e \ge 1.0$.
2. **Circular Orbit**: $\varepsilon < 0$, $e < 0.05$, and $h_{\text{periapsis}} \ge 100 \text{ km}$.
3. **Elliptical Orbit**: $\varepsilon < 0$, $0.05 \le e < 1.0$, and $h_{\text{periapsis}} \ge 100 \text{ km}$.
4. **Suborbital**: $\varepsilon < 0$, but $h_{\text{periapsis}} < 100 \text{ km}$ (intersects atmosphere or ground).
5. **Ground Impact**: Vehicle trajectory collides with Earth surface during flight.
