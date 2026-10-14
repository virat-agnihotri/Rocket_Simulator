import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Trash2, ArrowRight, Play, AlertCircle, RefreshCw } from 'lucide-react';
import type { SavedMissionSummary, VehicleConfig, MissionConfig } from '../types/simulation';
import { fetchSavedMissions, fetchMissionById, deleteMission, runSimulation } from '../services/api';

interface SavedMissionsPageProps {
  onLoadMission: (vehicle: VehicleConfig, mission: MissionConfig) => void;
  onSimulationSuccess: (res: any) => void;
}

export const SavedMissionsPage: React.FC<SavedMissionsPageProps> = ({
  onLoadMission,
  onSimulationSuccess,
}) => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<SavedMissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadList = () => {
    setLoading(true);
    fetchSavedMissions()
      .then((data) => setMissions(data))
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleSelect = async (id: string) => {
    try {
      const details = await fetchMissionById(id);
      onLoadMission(details.vehicle, details.mission);
      navigate('/configure');
    } catch (err: any) {
      alert(`Failed to load mission: ${err.message}`);
    }
  };

  const handleQuickRun = async (id: string) => {
    try {
      const details = await fetchMissionById(id);
      onLoadMission(details.vehicle, details.mission);
      const res = await runSimulation(details.vehicle, details.mission, id);
      onSimulationSuccess(res);
      navigate('/simulation');
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteMission(id);
      setMissions((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-6 h-6 text-sky-400" />
            Persisted Mission Scenarios
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Browse and load saved rocket vehicles and ascent configurations from SQLite
          </p>
        </div>

        <button
          onClick={loadList}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="h-48 flex items-center justify-center font-mono text-xs text-slate-500">
          Loading saved mission database...
        </div>
      ) : missions.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800">
          <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200 mb-1">No Saved Missions Found</h3>
          <p className="text-xs text-slate-400 font-mono mb-4">
            Create and save customized vehicle configurations in the Mission Configuration panel.
          </p>
          <button
            onClick={() => navigate('/configure')}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono"
          >
            Create New Mission
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((m) => (
            <div
              key={m.id}
              className="rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-5 shadow-xl flex flex-col justify-between font-mono text-xs transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-100 text-sm line-clamp-1">{m.name}</h3>
                  <button
                    onClick={() => handleDelete(m.id, m.name)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete scenario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {m.description && (
                  <p className="text-[11px] text-slate-400 mb-4 line-clamp-2">{m.description}</p>
                )}

                <div className="space-y-1.5 py-3 border-y border-slate-800/80 my-3 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Altitude:</span>
                    <span className="font-bold text-sky-400">{(m.target_altitude_m / 1000).toFixed(0)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payload:</span>
                    <span className="text-slate-200">{m.payload_mass_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Propellant:</span>
                    <span className="text-slate-200">{(m.propellant_mass_kg / 1000).toFixed(1)} t</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thrust / Isp:</span>
                    <span className="text-slate-200">{(m.thrust_n / 1000).toFixed(0)} kN / {m.specific_impulse_s}s</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleSelect(m.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                >
                  Load Profile <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleQuickRun(m.id)}
                  className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
                  title="Run simulation immediately"
                >
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
