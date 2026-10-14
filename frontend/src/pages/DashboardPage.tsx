import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Rocket,
  Activity,
  Sliders,
  ShieldCheck,
  Cpu,
  Globe2,
} from 'lucide-react';
import type { VehicleConfig, MissionConfig, SimulationResult } from '../types/simulation';

interface DashboardPageProps {
  vehicle: VehicleConfig;
  mission: MissionConfig;
  simulationResult: SimulationResult | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  vehicle,
  mission,
  simulationResult,
}) => {
  const totalMass = vehicle.dry_mass_kg + vehicle.payload_mass_kg + vehicle.propellant_mass_kg;
  const twr = vehicle.thrust_n / (totalMass * 9.80665);
  const ve = vehicle.specific_impulse_s * 9.80665;
  const idealDeltaV = ve * Math.log(totalMass / (vehicle.dry_mass_kg + vehicle.payload_mass_kg));

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[var(--surface-elevated)] border border-slate-800 p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" /> High-Fidelity Numerical Simulation & Trajectory Optimization
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight mb-3">
            Rocket Mission Digital Twin
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed font-sans mb-6">
            An engineering platform integrating 2D Earth-Centered Newtonian orbital mechanics,
            barometric atmospheric aerodynamics, Runge-Kutta numerical flight integration, and
            constrained differential evolution optimization.
          </p>

          <div className="flex flex-wrap gap-3">
            <NavLink
              to="/configure"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)]"
            >
              <Sliders className="w-4 h-4" /> Configure Vehicle
            </NavLink>
            <NavLink
              to="/simulation"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono border border-slate-700 transition-colors"
            >
              <Rocket className="w-4 h-4 text-sky-400" /> View Telemetry
            </NavLink>
            <NavLink
              to="/optimization"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono border border-slate-700 transition-colors"
            >
              <Activity className="w-4 h-4 text-emerald-400" /> Optimize Mission
            </NavLink>
          </div>
        </div>
      </div>

      {/* Active Vehicle & Mission Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl font-mono text-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-sky-400" /> Active Launch Vehicle
            </h3>
            <span className="text-[10px] text-slate-500">SI Units</span>
          </div>
          <div className="space-y-2.5 divide-y divide-slate-800/60">
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Liftoff Mass:</span>
              <span className="font-bold text-slate-100">{(totalMass / 1000).toFixed(1)} t</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Dry + Payload:</span>
              <span className="font-bold text-slate-100">{((vehicle.dry_mass_kg + vehicle.payload_mass_kg) / 1000).toFixed(1)} t</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Propellant Mass:</span>
              <span className="font-bold text-amber-400">{(vehicle.propellant_mass_kg / 1000).toFixed(1)} t</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Engine Thrust:</span>
              <span className="font-bold text-slate-100">{(vehicle.thrust_n / 1000).toFixed(0)} kN</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Specific Impulse (Isp):</span>
              <span className="font-bold text-slate-100">{vehicle.specific_impulse_s} s</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Initial TWR:</span>
              <span className={`font-bold ${twr >= 1.2 ? 'text-emerald-400' : 'text-amber-400'}`}>{twr.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl font-mono text-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-400" /> Target Mission Profile
            </h3>
            <span className="text-[10px] text-slate-500">Orbit Spec</span>
          </div>
          <div className="space-y-2.5 divide-y divide-slate-800/60">
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Target Altitude:</span>
              <span className="font-bold text-sky-400">{(mission.target_altitude_m / 1000).toFixed(0)} km</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Atmosphere Model:</span>
              <span className="font-bold text-slate-100 uppercase">{mission.selected_atmosphere_model}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Pitchover Initiation:</span>
              <span className="font-bold text-slate-100">{mission.guidance_configuration.pitchover_altitude_m} m</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Target Pitch Angle:</span>
              <span className="font-bold text-slate-100">{mission.guidance_configuration.target_pitch_deg}°</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Pitch Exponent:</span>
              <span className="font-bold text-slate-100">{mission.guidance_configuration.pitch_exponent}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Ideal Delta-v:</span>
              <span className="font-bold text-emerald-400">{(idealDeltaV / 1000).toFixed(2)} km/s</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl font-mono text-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> Latest Trajectory Outcome
            </h3>
            <span className="text-[10px] text-slate-500">Live Status</span>
          </div>
          {simulationResult ? (
            <div className="space-y-2.5 divide-y divide-slate-800/60">
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Solver Status:</span>
                <span className="font-bold text-emerald-400">{simulationResult.status}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Peak Altitude:</span>
                <span className="font-bold text-sky-400">{(simulationResult.peak_altitude_m / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Peak Speed:</span>
                <span className="font-bold text-slate-100">{simulationResult.peak_speed_mps.toFixed(0)} m/s</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Orbit Insertion:</span>
                <span className={simulationResult.target_orbit_satisfied ? 'font-bold text-emerald-400' : 'font-bold text-amber-400'}>
                  {simulationResult.target_orbit_satisfied ? 'ACHIEVED' : 'UNSATISFIED'}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Orbit Class:</span>
                <span className="font-bold text-slate-200 uppercase">{simulationResult.orbital_metrics.orbit_classification}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Apoapsis / Periapsis:</span>
                <span className="font-bold text-slate-200">
                  {simulationResult.orbital_metrics.apoapsis_altitude_m ? `${(simulationResult.orbital_metrics.apoapsis_altitude_m / 1000).toFixed(0)}` : 'N/A'} /{' '}
                  {simulationResult.orbital_metrics.periapsis_altitude_m ? `${(simulationResult.orbital_metrics.periapsis_altitude_m / 1000).toFixed(0)}` : 'N/A'} km
                </span>
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500">
              <p className="mb-3">No simulation run executed yet.</p>
              <NavLink
                to="/configure"
                className="px-3 py-1.5 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-600/40 hover:bg-sky-600/30 text-xs"
              >
                Launch First Simulation
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
