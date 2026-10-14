import React from 'react';
import { BookOpen, AlertTriangle } from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-10">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-sky-400" />
          Scientific Physics Model & System Documentation
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Complete mathematical formulation, coordinate frame conventions, and numerical methodologies
        </p>
      </div>

      {/* Disclosures Alert */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/80 text-xs font-mono text-amber-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          Educational Engineering Simulation Notice
        </div>
        <p className="text-slate-300 leading-relaxed">
          This platform is designed for university-level aerospace education and trajectory engineering.
          All calculations are computed using real numerical integration (SciPy solve_ivp) and Keplerian
          two-body mechanics. Reaching the target altitude does NOT count as orbital insertion;
          the vehicle must achieve orbital velocity, bound energy, and clear the atmosphere.
        </p>
      </div>

      {/* Section 1: Propulsion & Rocket Equation */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-sky-400 font-mono">1.</span> Propulsion & Tsiolkovsky Rocket Equation
        </h2>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 text-xs font-mono text-slate-300">
          <p>
            The fundamental velocity increment achievable by a reaction propulsion system in a field-free vacuum is described by Konstantin Tsiolkovsky's equation:
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sky-300 text-sm font-bold">
            Δv = v_e · ln(m₀ / m_f) = (I_sp · g₀) · ln(m₀ / m_f)
          </div>
          <p>Where:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong className="text-slate-200">m₀:</strong> Total initial liftoff mass = m_dry + m_payload + m_propellant (kg)</li>
            <li><strong className="text-slate-200">m_f:</strong> Burnout mass = m_dry + m_payload (kg)</li>
            <li><strong className="text-slate-200">I_sp:</strong> Engine specific impulse (s)</li>
            <li><strong className="text-slate-200">g₀:</strong> Standard sea-level gravitational acceleration = 9.80665 m/s²</li>
            <li><strong className="text-slate-200">v_e:</strong> Effective exhaust velocity = I_sp · g₀ (m/s)</li>
          </ul>
          <p className="text-slate-400">
            <strong className="text-amber-400">Critical Loss Distinction:</strong> In real planetary ascent, the actual velocity gain Δv_actual is significantly lower than ideal Δv due to losses:
            <br />
            <code className="text-sky-300 mt-1 inline-block">Δv_actual = Δv_ideal - Δv_gravity - Δv_aerodynamic - Δv_steering</code>
            <br />
            Typically, 1,200 to 1,800 m/s is consumed overcoming gravity and atmospheric drag for low Earth orbit ascent.
          </p>
        </div>
      </section>

      {/* Section 2: Gravity and Coordinate System */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-sky-400 font-mono">2.</span> Newtonian Inverse-Square Gravity & Coordinate Reference Frame
        </h2>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 text-xs font-mono text-slate-300">
          <p>
            The simulation operates in a 2D Earth-Centered Inertial (ECI) planar reference frame with the coordinate origin at Earth's center of mass.
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sky-300 text-sm font-bold">
            a_g = - (μ · r) / |r|³
          </div>
          <p>Where:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong className="text-slate-200">μ (GM):</strong> Standard gravitational parameter of Earth = 3.986004418 × 10¹⁴ m³/s²</li>
            <li><strong className="text-slate-200">r:</strong> Position vector [x, y] in meters from Earth's center</li>
            <li><strong className="text-slate-200">R_Earth:</strong> Volumetric mean radius = 6,371,000 m</li>
            <li><strong className="text-slate-200">Altitude h:</strong> h = |r| - R_Earth</li>
          </ul>
          <p>
            At the launch pad (h = 0), g = μ / R_Earth² ≈ 9.8199 m/s². The equatorial eastward launch site starts with Earth's tangential surface rotation speed (v_rot ≈ 464.6 m/s), contributing an inertial velocity assist.
          </p>
        </div>
      </section>

      {/* Section 3: Atmospheric Drag and Aerodynamics */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-sky-400 font-mono">3.</span> Atmospheric Density & Aerodynamic Drag
        </h2>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 text-xs font-mono text-slate-300">
          <p>
            Atmospheric density decays exponentially with altitude governed by scale height H = 8,500 m:
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sky-300 text-sm font-bold">
            ρ(h) = ρ₀ · exp(-h / H), &nbsp; where ρ₀ = 1.225 kg/m³
          </div>
          <p>
            Aerodynamic drag opposes air-relative velocity v_rel = v_rocket - v_air:
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sky-300 text-sm font-bold">
            F_drag = - 0.5 · ρ · |v_rel| · v_rel · C_d · A
          </div>
          <p>
            Dynamic pressure q (which peaks at Max-Q) is computed as:
            <code className="text-sky-300 ml-2">q = 0.5 · ρ · |v_rel|²</code>
          </p>
        </div>
      </section>

      {/* Section 4: Keplerian Orbital Analysis */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-sky-400 font-mono">4.</span> Keplerian Orbital Analysis & Orbit Classification
        </h2>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 text-xs font-mono text-slate-300">
          <p>
            At engine cutoff or flight conclusion, two-body orbital elements are determined:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400">
            <li><strong className="text-slate-200">Specific Orbital Energy:</strong> ε = v² / 2 - μ / r</li>
            <li><strong className="text-slate-200">Semi-Major Axis:</strong> a = - μ / (2ε) (for bound orbit ε &lt; 0)</li>
            <li><strong className="text-slate-200">Specific Angular Momentum:</strong> h = x · v_y - y · v_x</li>
            <li><strong className="text-slate-200">Runge-Lenz Eccentricity Vector:</strong> e = (v × h) / μ - r / |r|</li>
            <li><strong className="text-slate-200">Periapsis Altitude:</strong> r_p = a(1 - e) - R_Earth</li>
            <li><strong className="text-slate-200">Apoapsis Altitude:</strong> r_a = a(1 + e) - R_Earth</li>
            <li><strong className="text-slate-200">Circular Orbital Speed:</strong> v_circ = √(μ / r) ≈ 7.67 km/s at 400 km</li>
          </ul>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <strong className="text-sky-400 block mb-1">Orbit Classification Criteria:</strong>
            • <strong className="text-emerald-400">Circular:</strong> ε &lt; 0, e &lt; 0.05, and periapsis ≥ 100 km (above Karman line).<br />
            • <strong className="text-sky-400">Elliptical:</strong> ε &lt; 0, 0.05 ≤ e &lt; 1.0, and periapsis ≥ 100 km.<br />
            • <strong className="text-amber-400">Suborbital:</strong> ε &lt; 0, but periapsis &lt; 100 km (trajectory re-enters atmosphere or intersects surface).<br />
            • <strong className="text-purple-400">Hyperbolic Escape:</strong> ε ≥ 0 and e ≥ 1.0 (exceeds escape speed).
          </div>
        </div>
      </section>

      {/* Section 5: Numerical Optimization */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-sky-400 font-mono">5.</span> Constrained Differential Evolution Optimization
        </h2>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 text-xs font-mono text-slate-300">
          <p>
            The optimization engine utilizes Storn and Price's Differential Evolution algorithm (via SciPy).
            Decision variables include propellant mass, guidance pitch target angle, and pitch profile exponent.
          </p>
          <p>
            Constraint penalties are applied dynamically when a candidate configuration violates physical limits:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Liftoff Thrust-to-Weight Ratio TWR &lt; 1.05</li>
            <li>Peak acceleration &gt; 7.5 g (payload structural limit)</li>
            <li>Max-Q Dynamic Pressure &gt; 60 kPa</li>
            <li>Periapsis altitude &lt; 140 km (sustainable orbit limit)</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
