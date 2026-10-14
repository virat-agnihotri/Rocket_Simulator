import React, { useState, useEffect } from 'react';
import { GitCompare, Rocket, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { MissionPreset, SimulationResult } from '../types/simulation';
import { fetchMissionPresets, runSimulation } from '../services/api';

export const ComparisonPage: React.FC = () => {
  const [presets, setPresets] = useState<MissionPreset[]>([]);
  const [results, setResults] = useState<{ [id: string]: SimulationResult }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMissionPresets().then((data) => {
      setPresets(data);
      // Auto-run simulation on presets to populate comparison matrix
      setLoading(true);
      Promise.all(
        data.map((p) =>
          runSimulation(p.vehicle, p.mission, undefined, false)
            .then((res) => ({ id: p.id, res }))
            .catch(() => null)
        )
      ).then((sims) => {
        const map: { [id: string]: SimulationResult } = {};
        sims.forEach((item) => {
          if (item) map[item.id] = item.res;
        });
        setResults(map);
        setLoading(false);
      });
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-sky-400" />
            Vehicle & Trajectory Scenario Comparison
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Side-by-side performance benchmarking across vehicle configurations and ascent strategies
          </p>
        </div>
      </div>

      {loading && (
        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-800 text-xs font-mono text-sky-300 flex items-center gap-3">
          <Rocket className="w-4 h-4 animate-bounce" />
          Simulating benchmark presets for comparison table...
        </div>
      )}

      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-left">
                <th className="py-3 px-4 font-bold">Metrics / Specification</th>
                {presets.map((p) => (
                  <th key={p.id} className="py-3 px-4 font-bold text-slate-200">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Payload Mass</td>
                {presets.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-slate-200 font-bold">
                    {p.vehicle.payload_mass_kg.toLocaleString()} kg
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Propellant Mass</td>
                {presets.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-amber-400 font-bold">
                    {(p.vehicle.propellant_mass_kg / 1000).toFixed(1)} t
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Total Liftoff Mass</td>
                {presets.map((p) => {
                  const m0 = p.vehicle.dry_mass_kg + p.vehicle.payload_mass_kg + p.vehicle.propellant_mass_kg;
                  return (
                    <td key={p.id} className="py-3 px-4 text-slate-200">
                      {(m0 / 1000).toFixed(1)} t
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Engine Thrust / Isp</td>
                {presets.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-slate-300">
                    {(p.vehicle.thrust_n / 1000).toFixed(0)} kN / {p.vehicle.specific_impulse_s}s
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Target Altitude</td>
                {presets.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-sky-400 font-bold">
                    {(p.mission.target_altitude_m / 1000).toFixed(0)} km
                  </td>
                ))}
              </tr>

              <tr className="bg-slate-950/30">
                <td className="py-3 px-4 text-slate-400 font-medium">Simulated Peak Altitude</td>
                {presets.map((p) => {
                  const res = results[p.id];
                  return (
                    <td key={p.id} className="py-3 px-4 font-bold text-sky-300">
                      {res ? `${(res.peak_altitude_m / 1000).toFixed(1)} km` : '-'}
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-slate-950/30">
                <td className="py-3 px-4 text-slate-400 font-medium">Peak Inertial Speed</td>
                {presets.map((p) => {
                  const res = results[p.id];
                  return (
                    <td key={p.id} className="py-3 px-4 font-bold text-emerald-400">
                      {res ? `${res.peak_speed_mps.toFixed(0)} m/s` : '-'}
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-slate-950/30">
                <td className="py-3 px-4 text-slate-400 font-medium">Peak Acceleration</td>
                {presets.map((p) => {
                  const res = results[p.id];
                  return (
                    <td key={p.id} className="py-3 px-4 text-orange-400 font-bold">
                      {res ? `${(res.peak_acceleration_mps2 / 9.80665).toFixed(2)} g` : '-'}
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-slate-950/30">
                <td className="py-3 px-4 text-slate-400 font-medium">Max Dynamic Pressure (Max-Q)</td>
                {presets.map((p) => {
                  const res = results[p.id];
                  return (
                    <td key={p.id} className="py-3 px-4 text-purple-400 font-bold">
                      {res ? `${(res.maximum_dynamic_pressure_pa / 1000).toFixed(1)} kPa` : '-'}
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-slate-950/30">
                <td className="py-3 px-4 text-slate-400 font-medium">Orbit Insertion Evaluation</td>
                {presets.map((p) => {
                  const res = results[p.id];
                  if (!res) return <td key={p.id} className="py-3 px-4 text-slate-500">-</td>;
                  return (
                    <td key={p.id} className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                          res.target_orbit_satisfied
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {res.target_orbit_satisfied ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {res.orbital_metrics.orbit_classification.toUpperCase()}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
