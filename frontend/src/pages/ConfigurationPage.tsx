import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Play,
  Save,
  AlertCircle,
  Calculator,
  ChevronDown,
} from 'lucide-react';
import type { VehicleConfig, MissionConfig, MissionPreset } from '../types/simulation';
import { fetchMissionPresets, runSimulation, saveMission } from '../services/api';

interface ConfigurationPageProps {
  vehicle: VehicleConfig;
  setVehicle: (v: VehicleConfig) => void;
  mission: MissionConfig;
  setMission: (m: MissionConfig) => void;
  onSimulationSuccess: (res: any) => void;
}

export const ConfigurationPage: React.FC<ConfigurationPageProps> = ({
  vehicle,
  setVehicle,
  mission,
  setMission,
  onSimulationSuccess,
}) => {
  const navigate = useNavigate();
  const [presets, setPresets] = useState<MissionPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchMissionPresets()
      .then((data) => setPresets(data))
      .catch((err) => console.error(err));
  }, []);

  const handleApplyPreset = (presetId: string) => {
    const selected = presets.find((p) => p.id === presetId);
    if (selected) {
      setVehicle(selected.vehicle);
      setMission(selected.mission);
    }
  };

  // Real-time analytical preview calculations
  const totalLiftoffMassKg = vehicle.dry_mass_kg + vehicle.payload_mass_kg + vehicle.propellant_mass_kg;
  const burnoutMassKg = vehicle.dry_mass_kg + vehicle.payload_mass_kg;
  const liftoffTwr = vehicle.thrust_n / (totalLiftoffMassKg * 9.80665);
  const massRatio = totalLiftoffMassKg / burnoutMassKg;
  const ve = vehicle.specific_impulse_s * 9.80665;
  const idealDeltaV = ve * Math.log(massRatio);
  const mdot = vehicle.thrust_n / ve;
  const burnDurationS = vehicle.propellant_mass_kg / mdot;

  const handleSimulate = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const result = await runSimulation(vehicle, mission);
      onSimulationSuccess(result);
      navigate('/simulation');
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    try {
      await saveMission(saveName, saveDesc, vehicle, mission);
      setSaveModalOpen(false);
      alert('Mission configuration saved successfully!');
    } catch (err: any) {
      alert(`Failed to save mission: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Title & Presets header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-sky-400" />
            Mission & Vehicle Configuration
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Specify physical propulsion, structural mass, aerodynamics, and ascent guidance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {presets.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => handleApplyPreset(e.target.value)}
                defaultValue=""
                className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg px-4 py-2 pr-8 hover:border-sky-500 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  Load Educational Preset...
                </option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}

          <button
            onClick={() => setSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-sky-400" />
            Save Profile
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-rose-950/50 border border-rose-800 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vehicle & Propulsion parameters */}
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Launch Vehicle Parameters
            </h2>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Dry Structural Mass (kg)</label>
                <input
                  type="number"
                  value={vehicle.dry_mass_kg}
                  onChange={(e) => setVehicle({ ...vehicle, dry_mass_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  min="1"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Payload Mass (kg)</label>
                <input
                  type="number"
                  value={vehicle.payload_mass_kg}
                  onChange={(e) => setVehicle({ ...vehicle, payload_mass_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Propellant Mass (kg)</label>
                <input
                  type="number"
                  value={vehicle.propellant_mass_kg}
                  onChange={(e) => setVehicle({ ...vehicle, propellant_mass_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  min="100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Engine Thrust (N)</label>
                <input
                  type="number"
                  value={vehicle.thrust_n}
                  onChange={(e) => setVehicle({ ...vehicle, thrust_n: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  min="1000"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Specific Impulse Isp (s)</label>
                <input
                  type="number"
                  value={vehicle.specific_impulse_s}
                  onChange={(e) => setVehicle({ ...vehicle, specific_impulse_s: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  min="50"
                  max="600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Drag Coeff Cd</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vehicle.drag_coefficient}
                    onChange={(e) => setVehicle({ ...vehicle, drag_coefficient: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Ref Area (m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vehicle.reference_area_m2}
                    onChange={(e) => setVehicle({ ...vehicle, reference_area_m2: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Mission & Guidance parameters */}
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Mission & Guidance Settings
            </h2>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Target Orbital Altitude (m)</label>
                <input
                  type="number"
                  value={mission.target_altitude_m}
                  onChange={(e) => setMission({ ...mission, target_altitude_m: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  step="10000"
                />
                <span className="text-[10px] text-slate-500">{(mission.target_altitude_m / 1000).toFixed(0)} km target orbit</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Simulation Duration (s)</label>
                <input
                  type="number"
                  value={mission.simulation_duration_s}
                  onChange={(e) => setMission({ ...mission, simulation_duration_s: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Atmosphere Model</label>
                <select
                  value={mission.selected_atmosphere_model}
                  onChange={(e) => setMission({ ...mission, selected_atmosphere_model: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="exponential">Barometric Exponential</option>
                  <option value="us_standard_simple">US 1976 Standard (Simplified)</option>
                  <option value="vacuum">Idealized Vacuum (No Drag)</option>
                </select>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h3 className="text-xs font-semibold text-slate-300 mb-2">Ascent Pitch Program</h3>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Pitchover Alt (m)</label>
                    <input
                      type="number"
                      value={mission.guidance_configuration.pitchover_altitude_m}
                      onChange={(e) =>
                        setMission({
                          ...mission,
                          guidance_configuration: {
                            ...mission.guidance_configuration,
                            pitchover_altitude_m: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Pitch End Alt (m)</label>
                    <input
                      type="number"
                      value={mission.guidance_configuration.pitch_end_altitude_m}
                      onChange={(e) =>
                        setMission({
                          ...mission,
                          guidance_configuration: {
                            ...mission.guidance_configuration,
                            pitch_end_altitude_m: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Target Pitch (deg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={mission.guidance_configuration.target_pitch_deg}
                      onChange={(e) =>
                        setMission({
                          ...mission,
                          guidance_configuration: {
                            ...mission.guidance_configuration,
                            target_pitch_deg: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Pitch Exponent</label>
                    <input
                      type="number"
                      step="0.05"
                      value={mission.guidance_configuration.pitch_exponent}
                      onChange={(e) =>
                        setMission({
                          ...mission,
                          guidance_configuration: {
                            ...mission.guidance_configuration,
                            pitch_exponent: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analytical Preview & Launch Action */}
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              Ideal Analytical Calculations
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Classical Tsiolkovsky equations calculated prior to numerical integration (zero atmospheric & gravity losses assumed).
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <span className="text-slate-400">Total Liftoff Mass:</span>
                <span className="font-bold text-slate-100">{(totalLiftoffMassKg / 1000).toFixed(1)} t</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <span className="text-slate-400">Liftoff TWR:</span>
                <span className={`font-bold ${liftoffTwr >= 1.2 ? 'text-emerald-400' : liftoffTwr > 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {liftoffTwr.toFixed(2)} {liftoffTwr < 1.0 ? '(Cannot Liftoff)' : ''}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <span className="text-slate-400">Mass Ratio (m0 / mf):</span>
                <span className="font-bold text-sky-300">{massRatio.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <span className="text-slate-400">Ideal Delta-v (Tsiolkovsky):</span>
                <span className="font-bold text-emerald-400">
                  {idealDeltaV.toFixed(0)} m/s ({(idealDeltaV / 1000).toFixed(2)} km/s)
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <span className="text-slate-400">Engine Burn Duration:</span>
                <span className="font-bold text-amber-300">{burnDurationS.toFixed(1)} s</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {loading ? 'Solving Trajectory Equations...' : 'Run Flight Simulation'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2">Save Mission Profile</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Store this vehicle specification and guidance profile in the database.
            </p>
            <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1">Mission Profile Name</label>
                <input
                  type="text"
                  required
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. LEO Insertion Test #1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Description (Optional)</label>
                <textarea
                  value={saveDesc}
                  onChange={(e) => setSaveDesc(e.target.value)}
                  rows={3}
                  placeholder="Objectives, engine notes, or target payload..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Save Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
