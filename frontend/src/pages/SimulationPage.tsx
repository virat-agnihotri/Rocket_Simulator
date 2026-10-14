import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Rocket,
  Download,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Sliders,
  ChevronRight,
  Info,
} from 'lucide-react';
import type { SimulationResult, VehicleConfig, MissionConfig } from '../types/simulation';
import { TrajectoryVisualizer } from '../components/TrajectoryVisualizer';
import { TelemetryCharts } from '../components/TelemetryCharts';
import { getExportCsvUrl } from '../services/api';

interface SimulationPageProps {
  simulationResult: SimulationResult | null;
  vehicle?: VehicleConfig;
  mission: MissionConfig;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  simulationResult,
  mission,
}) => {
  if (!simulationResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <Rocket className="w-8 h-8 text-sky-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">No Active Simulation Results</h2>
        <p className="text-xs text-slate-400 font-mono max-w-md mx-auto mb-6">
          Configure a launch vehicle and ascent profile in the Mission Configuration panel to execute the numerical flight simulation.
        </p>
        <NavLink
          to="/configure"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono transition-colors"
        >
          <Sliders className="w-4 h-4" /> Go to Mission Configuration
        </NavLink>
      </div>
    );
  }

  const {
    status,
    termination_reason,
    peak_altitude_m,
    peak_speed_mps,
    peak_acceleration_mps2,
    maximum_dynamic_pressure_pa,
    burn_duration_s,
    total_flight_time_s,
    ideal_delta_v_mps,
    orbital_metrics,
    target_orbit_satisfied,
    telemetry,
    warnings,
    model_assumptions,
    simulation_id,
  } = simulationResult;

  const handleExportCsv = () => {
    if (simulation_id) {
      window.open(getExportCsvUrl(simulation_id), '_blank');
    } else {
      // Direct client-side CSV download fallback
      const headers = Object.keys(telemetry[0] || {}).join(',');
      const rows = telemetry.map((pt) => Object.values(pt).join(',')).join('\n');
      const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation_telemetry_${Date.now()}.csv`;
      a.click();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Rocket className="w-6 h-6 text-sky-400" />
              Flight Trajectory Telemetry
            </h1>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider ${
                status === 'SUCCESS'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : status === 'GROUND_IMPACT'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">{termination_reason}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Export Telemetry CSV
          </button>

          <NavLink
            to="/configure"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            Modify Vehicle
          </NavLink>
        </div>
      </div>

      {/* Orbit Evaluation Hero Banner */}
      <div
        className={`rounded-xl p-5 border flex flex-wrap items-center justify-between gap-4 ${
          target_orbit_satisfied
            ? 'bg-emerald-950/20 border-emerald-800/80 shadow-[0_0_25px_rgba(16,185,129,0.1)]'
            : 'bg-amber-950/20 border-amber-800/80'
        }`}
      >
        <div className="flex items-start gap-3">
          {target_orbit_satisfied ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Target Orbit Insertion:</span>
              <span className={target_orbit_satisfied ? 'text-emerald-400' : 'text-amber-400'}>
                {target_orbit_satisfied ? 'SATISFIED' : 'NOT SATISFIED'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-slate-300 uppercase">
                {orbital_metrics.orbit_classification}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Target Altitude: {(mission.target_altitude_m / 1000).toFixed(0)} km | Achieved Apoapsis:{' '}
              {orbital_metrics.apoapsis_altitude_m != null
                ? `${(orbital_metrics.apoapsis_altitude_m / 1000).toFixed(1)} km`
                : 'N/A'}{' '}
              | Periapsis:{' '}
              {orbital_metrics.periapsis_altitude_m != null
                ? `${(orbital_metrics.periapsis_altitude_m / 1000).toFixed(1)} km`
                : 'N/A'}{' '}
              | Eccentricity: {orbital_metrics.eccentricity?.toFixed(4) || 'N/A'}
            </p>
          </div>
        </div>

        <NavLink
          to="/optimization"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold transition-all"
        >
          Optimize Ascent Profile <ChevronRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>

      {/* KPI Numerical Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Peak Altitude</span>
          <div className="text-lg font-bold text-sky-400 mt-1">
            {(peak_altitude_m / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <span className="text-[10px] text-slate-500">{(peak_altitude_m).toLocaleString()} m</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Peak Speed</span>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {peak_speed_mps.toFixed(0)} <span className="text-xs font-normal text-slate-400">m/s</span>
          </div>
          <span className="text-[10px] text-slate-500">{(peak_speed_mps * 3.6).toFixed(0)} km/h</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Peak Acceleration</span>
          <div className="text-lg font-bold text-orange-400 mt-1">
            {(peak_acceleration_mps2 / 9.80665).toFixed(2)} <span className="text-xs font-normal text-slate-400">g</span>
          </div>
          <span className="text-[10px] text-slate-500">{peak_acceleration_mps2.toFixed(1)} m/s²</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Max Dynamic Press</span>
          <div className="text-lg font-bold text-purple-400 mt-1">
            {(maximum_dynamic_pressure_pa / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">kPa</span>
          </div>
          <span className="text-[10px] text-slate-500">Max-Q stress</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Burn Duration</span>
          <div className="text-lg font-bold text-amber-400 mt-1">
            {burn_duration_s.toFixed(1)} <span className="text-xs font-normal text-slate-400">s</span>
          </div>
          <span className="text-[10px] text-slate-500">Flight: {total_flight_time_s.toFixed(0)} s</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ideal Delta-v</span>
          <div className="text-lg font-bold text-cyan-400 mt-1">
            {(ideal_delta_v_mps / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">km/s</span>
          </div>
          <span className="text-[10px] text-slate-500">Tsiolkovsky limit</span>
        </div>
      </div>

      {/* Trajectory 2D/3D Interactive Visualizer */}
      <div>
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-sky-400" />
          Interactive 2D Planar ECI Ascent Simulation
        </h2>
        <TrajectoryVisualizer
          telemetry={telemetry}
          targetAltitudeM={mission.target_altitude_m}
        />
      </div>

      {/* Telemetry Charts */}
      <div>
        <TelemetryCharts
          telemetry={telemetry}
          burnDurationS={burn_duration_s}
        />
      </div>

      {/* Warnings & Model Assumptions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warnings.length > 0 && (
          <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 font-mono text-xs">
            <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Physical & Engineering Notes ({warnings.length})
            </h3>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              {warnings.map((w, idx) => (
                <li key={idx} className="text-[11px]">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 font-mono text-xs">
          <h3 className="font-bold text-sky-400 flex items-center gap-2 mb-2">
            <Info className="w-4 h-4" />
            Simulation Disclosures & Assumptions
          </h3>
          <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px]">
            {model_assumptions.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
