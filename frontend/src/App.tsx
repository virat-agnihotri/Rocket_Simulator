import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import { SimulationPage } from './pages/SimulationPage';
import { OptimizationPage } from './pages/OptimizationPage';
import { SavedMissionsPage } from './pages/SavedMissionsPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { LiveMissionPage } from './pages/LiveMissionPage';
const MissionView = lazy(() => import('./features/mission-view/components/MissionView').then(module => ({ default: module.MissionView })));
import type { VehicleConfig, MissionConfig, SimulationResult } from './types/simulation';
import { fetchMissionPresets } from './services/api';

const DEFAULT_VEHICLE: VehicleConfig = {
  dry_mass_kg: 25000.0,
  payload_mass_kg: 4000.0,
  propellant_mass_kg: 380000.0,
  thrust_n: 5800000.0,
  specific_impulse_s: 360.0,
  drag_coefficient: 0.28,
  reference_area_m2: 10.5,
};

const DEFAULT_MISSION: MissionConfig = {
  target_altitude_m: 400000.0,
  launch_altitude_m: 0.0,
  launch_latitude_deg: 28.5,
  simulation_duration_s: 900.0,
  output_interval_s: 1.0,
  selected_atmosphere_model: 'exponential',
  wind_velocity_x_mps: 0.0,
  guidance_configuration: {
    pitchover_altitude_m: 600.0,
    pitch_end_altitude_m: 85000.0,
    target_pitch_deg: 87.2,
    pitch_exponent: 0.52,
  },
  numerical_solver_settings: {
    method: 'RK45',
    rtol: 1e-6,
    atol: 1e-8,
    max_step_s: 1.0,
  },
};

export const App: React.FC = () => {
  const [vehicle, setVehicle] = useState<VehicleConfig>(DEFAULT_VEHICLE);
  const [mission, setMission] = useState<MissionConfig>(DEFAULT_MISSION);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    fetchMissionPresets()
      .then((presets) => {
        if (presets && presets.length > 0) {
          setVehicle(presets[0].vehicle);
          setMission(presets[0].mission);
        }
      })
      .catch((err) => console.log('Presets fetch note:', err));
  }, []);

  const handleApplyOptimized = (v: VehicleConfig, m: MissionConfig) => {
    setVehicle(v);
    setMission(m);
  };

  const handleLoadSavedMission = (v: VehicleConfig, m: MissionConfig) => {
    setVehicle(v);
    setMission(m);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--background)] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/mission-3d" element={<Suspense fallback={<div className="p-12 text-sky-300">Loading mission view…</div>}><MissionView vehicle={vehicle} mission={mission} setVehicle={setVehicle} setMission={setMission} simulationResult={simulationResult} onResult={setSimulationResult} /></Suspense>} />
            <Route path="/" element={<Suspense fallback={<div className="p-12">Loading analysis…</div>}><MissionView vehicle={vehicle} mission={mission} setVehicle={setVehicle} setMission={setMission} simulationResult={simulationResult} onResult={setSimulationResult} /></Suspense>} />
            <Route path="/live" element={<LiveMissionPage vehicle={vehicle} />} />
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  vehicle={vehicle}
                  mission={mission}
                  simulationResult={simulationResult}
                />
              }
            />
            <Route
              path="/configure"
              element={
                <ConfigurationPage
                  vehicle={vehicle}
                  setVehicle={setVehicle}
                  mission={mission}
                  setMission={setMission}
                  onSimulationSuccess={setSimulationResult}
                />
              }
            />
            <Route
              path="/simulation"
              element={
                <SimulationPage
                  simulationResult={simulationResult}
                  vehicle={vehicle}
                  mission={mission}
                />
              }
            />
            <Route
              path="/optimization"
              element={
                <OptimizationPage
                  vehicle={vehicle}
                  mission={mission}
                  onApplyOptimized={handleApplyOptimized}
                />
              }
            />
            <Route
              path="/compare"
              element={<ComparisonPage />}
            />
            <Route
              path="/saved"
              element={
                <SavedMissionsPage
                  onLoadMission={handleLoadSavedMission}
                  onSimulationSuccess={setSimulationResult}
                />
              }
            />
            <Route
              path="/docs"
              element={<DocumentationPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 lg:px-8 text-center text-xs font-mono text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div>Rocket Mission Optimization Platform • Flight Analysis Workspace</div>
            <div className="text-[11px] text-slate-600">All Physical Quantities in SI Units • Non-Flight-Certified Simulation</div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;

