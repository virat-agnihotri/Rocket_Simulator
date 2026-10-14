import React, { useState } from 'react';
import {
  Activity,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Cpu,
  Layers,
} from 'lucide-react';
import type {
  VehicleConfig,
  MissionConfig,
  OptimizationResult,
  OptimizationObjective,
} from '../types/simulation';
import { runOptimization } from '../services/api';

interface OptimizationPageProps {
  vehicle: VehicleConfig;
  mission: MissionConfig;
  onApplyOptimized: (v: VehicleConfig, m: MissionConfig) => void;
}

export const OptimizationPage: React.FC<OptimizationPageProps> = ({
  vehicle,
  mission,
  onApplyOptimized,
}) => {
  const [objective, setObjective] = useState<OptimizationObjective>('minimize_propellant');
  const [maxEvaluations, setMaxEvaluations] = useState(30);
  const [seed, setSeed] = useState(42);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartOptimization = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const optResult = await runOptimization(
        vehicle,
        mission,
        objective,
        maxEvaluations,
        seed
      );
      setResult(optResult);
    } catch (err: any) {
      setErrorMsg(err.message || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-400" />
            Constrained Mission Optimization Engine
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Global differential evolution optimizer enforcing strict physical, structural, and orbital constraints
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 font-mono flex items-center gap-3">
          <XCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Objective Selection */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            1. Target Objective Function
          </h3>
          <div className="space-y-2 text-xs font-mono">
            {[
              {
                id: 'minimize_propellant',
                title: 'Minimize Propellant Mass',
                desc: 'Find minimum fuel required to reach safe target orbit.',
              },
              {
                id: 'minimize_orbit_error',
                title: 'Minimize Orbit Deviation',
                desc: 'Optimize guidance pitch to hit circular target altitude.',
              },
              {
                id: 'maximize_payload',
                title: 'Maximize Payload Fraction',
                desc: 'Maximize payload delivery efficiency.',
              },
            ].map((item) => (
              <label
                key={item.id}
                className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                  objective === item.id
                    ? 'bg-sky-500/10 border-sky-500/50 text-slate-100'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="objective"
                    value={item.id}
                    checked={objective === item.id}
                    onChange={(e) => setObjective(e.target.value as any)}
                    className="accent-sky-400"
                  />
                  <span className="font-bold">{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">{item.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Algorithm Settings */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            2. Search Budget & Settings
          </h3>
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Max Simulation Evaluations</label>
              <input
                type="number"
                value={maxEvaluations}
                onChange={(e) => setMaxEvaluations(parseInt(e.target.value) || 20)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                min="10"
                max="80"
              />
              <span className="text-[10px] text-slate-500">Each evaluation executes full numerical RK45 flight dynamics</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Reproducible Random Seed</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              <span className="text-sky-400 font-bold block mb-1">Search Decision Variables:</span>
              • Propellant Mass: ±40% baseline<br />
              • Target Pitch Angle: 75.0° to 89.5°<br />
              • Pitch Transition Exponent: 0.3 to 0.9
            </div>
          </div>
        </div>

        {/* Constraints & Trigger */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              3. Constraints Enforced
            </h3>
            <div className="space-y-2 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Peak Acceleration ≤ 7.5 g</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Max-Q Dynamic Pressure ≤ 60 kPa</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Periapsis Altitude ≥ 140 km (Atmospheric clearance)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Liftoff TWR ≥ 1.05</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={handleStartOptimization}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {loading ? 'Evaluating Flight Candidates...' : 'Run Differential Evolution'}
            </button>
          </div>
        </div>
      </div>

      {/* Optimization Results View */}
      {result && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`rounded-xl p-5 border flex flex-wrap items-center justify-between gap-4 ${
              result.best_feasible_candidate
                ? 'bg-emerald-950/20 border-emerald-800/80'
                : 'bg-amber-950/20 border-amber-800/80'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.best_feasible_candidate ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Optimization {result.status}: {result.message}
                </h3>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" /> Evaluations: {result.evaluation_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Runtime: {result.execution_duration_s.toFixed(2)} s
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Feasible Solutions: {result.feasible_count}
                  </span>
                </div>
              </div>
            </div>

            {result.best_feasible_candidate && (
              <button
                onClick={() => {
                  onApplyOptimized(
                    result.best_feasible_candidate!.vehicle,
                    result.best_feasible_candidate!.mission
                  );
                  alert('Optimized candidate parameters applied to active configuration!');
                }}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition-colors"
              >
                Apply Best Candidate
              </button>
            )}
          </div>

          {/* Comparison Table: Baseline vs Best Feasible */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">
                Baseline vs. Best Feasible Candidate Comparison
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-left">
                    <th className="py-3 px-4">Parameter</th>
                    <th className="py-3 px-4">Baseline Configuration</th>
                    <th className="py-3 px-4">Best Feasible Candidate</th>
                    <th className="py-3 px-4">Delta / Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2.5 px-4 text-slate-300">Propellant Mass</td>
                    <td className="py-2.5 px-4 text-slate-200">
                      {(result.baseline_candidate.vehicle.propellant_mass_kg / 1000).toFixed(1)} t
                    </td>
                    <td className="py-2.5 px-4 font-bold text-sky-400">
                      {result.best_feasible_candidate
                        ? `${(result.best_feasible_candidate.vehicle.propellant_mass_kg / 1000).toFixed(1)} t`
                        : 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 font-mono">
                      {result.best_feasible_candidate ? (
                        <span className={result.best_feasible_candidate.vehicle.propellant_mass_kg < result.baseline_candidate.vehicle.propellant_mass_kg ? 'text-emerald-400' : 'text-slate-400'}>
                          {((result.best_feasible_candidate.vehicle.propellant_mass_kg - result.baseline_candidate.vehicle.propellant_mass_kg) / 1000).toFixed(1)} t
                        </span>
                      ) : '-'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-300">Target Pitch Angle</td>
                    <td className="py-2.5 px-4 text-slate-200">
                      {result.baseline_candidate.mission.guidance_configuration.target_pitch_deg.toFixed(1)}°
                    </td>
                    <td className="py-2.5 px-4 font-bold text-sky-400">
                      {result.best_feasible_candidate?.mission.guidance_configuration.target_pitch_deg.toFixed(1) || 'N/A'}°
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">-</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-300">Pitch Exponent</td>
                    <td className="py-2.5 px-4 text-slate-200">
                      {result.baseline_candidate.mission.guidance_configuration.pitch_exponent.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-sky-400">
                      {result.best_feasible_candidate?.mission.guidance_configuration.pitch_exponent.toFixed(2) || 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">-</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-300">Peak Altitude</td>
                    <td className="py-2.5 px-4 text-slate-200">
                      {(result.baseline_candidate.peak_altitude_m / 1000).toFixed(1)} km
                    </td>
                    <td className="py-2.5 px-4 font-bold text-sky-400">
                      {result.best_feasible_candidate ? `${(result.best_feasible_candidate.peak_altitude_m / 1000).toFixed(1)} km` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">-</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-300">Orbit Insertion</td>
                    <td className="py-2.5 px-4">
                      <span className={result.baseline_candidate.target_orbit_satisfied ? 'text-emerald-400' : 'text-amber-400'}>
                        {result.baseline_candidate.orbit_classification} ({result.baseline_candidate.target_orbit_satisfied ? 'SATISFIED' : 'UNSATISFIED'})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      {result.best_feasible_candidate ? (
                        <span className={result.best_feasible_candidate.target_orbit_satisfied ? 'text-emerald-400' : 'text-amber-400'}>
                          {result.best_feasible_candidate.orbit_classification} ({result.best_feasible_candidate.target_orbit_satisfied ? 'SATISFIED' : 'UNSATISFIED'})
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">-</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-300">Feasibility Status</td>
                    <td className="py-2.5 px-4">
                      <span className={result.baseline_candidate.is_feasible ? 'text-emerald-400' : 'text-rose-400'}>
                        {result.baseline_candidate.is_feasible ? 'FEASIBLE' : 'VIOLATION'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      <span className={result.best_feasible_candidate?.is_feasible ? 'text-emerald-400' : 'text-rose-400'}>
                        {result.best_feasible_candidate ? (result.best_feasible_candidate.is_feasible ? 'FEASIBLE' : 'INFEASIBLE') : 'NO FEASIBLE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Evaluated Candidates Table */}
          {result.candidate_history.length > 0 && (
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-100 mb-3">
                Evaluated Population Sample ({result.candidate_history.length} candidates)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-left">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Propellant</th>
                      <th className="py-2.5 px-3">Pitch (deg)</th>
                      <th className="py-2.5 px-3">Exponent</th>
                      <th className="py-2.5 px-3">Peak Alt (km)</th>
                      <th className="py-2.5 px-3">Orbit</th>
                      <th className="py-2.5 px-3">Feasible</th>
                      <th className="py-2.5 px-3">Objective Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {result.candidate_history.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 text-slate-300">{(c.vehicle.propellant_mass_kg / 1000).toFixed(1)} t</td>
                        <td className="py-2 px-3 text-slate-300">{c.mission.guidance_configuration.target_pitch_deg.toFixed(1)}°</td>
                        <td className="py-2 px-3 text-slate-300">{c.mission.guidance_configuration.pitch_exponent.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">{(c.peak_altitude_m / 1000).toFixed(1)}</td>
                        <td className="py-2 px-3 uppercase text-[10px]">{c.orbit_classification}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${c.is_feasible ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                            {c.is_feasible ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-sky-400">{c.objective_value.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
