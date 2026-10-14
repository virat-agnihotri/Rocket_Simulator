# Physical Model Limitations & Explicit Disclosures

This platform is developed as an educational flight mechanics and numerical optimization platform. To ensure scientific integrity, the following approximations are explicitly disclosed:

## 1. Dimensionality & Coordinate Frame
- **Planar 2D Motion**: Dynamics are computed in a 2D equatorial Earth-centered inertial (ECI) plane.
- **Orbital Inclination**: The simulator does NOT support 3D out-of-plane plane changes or arbitrary non-equatorial orbital inclinations.
- **Earth Shape**: Earth is modeled as a sphere of mean radius $R = 6,371 \text{ km}$. Non-spherical geopotential oblateness harmonics ($J_2$, $J_3$) are omitted.

## 2. Vehicle Dynamics
- **3-DOF Point Mass**: The rocket is modeled as a point mass without rotational inertia or attitude tensor moments ($I_{xx}, I_{yy}, I_{zz}$).
- **Single-Stage Configuration**: Flight dynamics model a continuous single-stage propulsive burn without multi-stage separation dynamics.
- **Constant Aerodynamics**: The aerodynamic drag coefficient $C_d$ is treated as constant with respect to angle of attack and transonic Mach transitions.

## 3. Atmospheric Modeling
- **Simplified Barometric / US Standard**: Standard density and pressure follow barometric scale-height exponential formulas. Aerodynamic drag is truncated to zero above $150 \text{ km}$.
- **Localized Wind**: Wind is modeled as a planar horizontal atmospheric component. High-altitude shear layers and microburst turbulence are omitted.

## 4. Optimization Engine
- **Local vs Global Optimality**: Differential evolution is a stochastic global heuristic. Solutions found within the evaluation budget represent best feasible candidates and are not guaranteed to be mathematical global extrema.
- **Simulation Evaluations**: Candidate feasibility strictly reflects simulated trajectory integration; no performance metrics are fabricated.
