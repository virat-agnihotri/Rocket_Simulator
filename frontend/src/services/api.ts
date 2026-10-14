import type {
  VehicleConfig,
  MissionConfig,
  SimulationResult,
  OptimizationResult,
  OptimizationObjective,
  MissionPreset,
  SavedMissionSummary,
} from '../types/simulation';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchMissionPresets(): Promise<MissionPreset[]> {
  const res = await fetch(`${API_BASE}/api/missions/presets`);
  if (!res.ok) throw new Error('Failed to load mission presets');
  return res.json();
}

export async function runSimulation(
  vehicle: VehicleConfig,
  mission: MissionConfig,
  missionId?: string,
  persistResult: boolean = true
): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/api/simulations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicle,
      mission,
      mission_id: missionId || null,
      persist_result: persistResult,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const detail = errorBody.detail;
    const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((item: { loc?: string[]; msg?: string }) => `${item.loc?.join('.')}: ${item.msg}`).join('; ') : `Simulation failed: HTTP ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function runOptimization(
  baselineVehicle: VehicleConfig,
  baselineMission: MissionConfig,
  objective: OptimizationObjective = 'minimize_propellant',
  maxEvaluations: number = 35,
  seed: number = 42,
  propellantMinKg?: number,
  propellantMaxKg?: number
): Promise<OptimizationResult> {
  const res = await fetch(`${API_BASE}/api/optimizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseline_vehicle: baselineVehicle,
      baseline_mission: baselineMission,
      objective,
      max_evaluations: maxEvaluations,
      seed,
      propellant_min_kg: propellantMinKg,
      propellant_max_kg: propellantMaxKg,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Optimization failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSavedMissions(): Promise<SavedMissionSummary[]> {
  const res = await fetch(`${API_BASE}/api/missions`);
  if (!res.ok) throw new Error('Failed to fetch saved missions');
  return res.json();
}

export async function fetchMissionById(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/missions/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch mission ${id}`);
  return res.json();
}

export async function saveMission(
  name: string,
  description: string,
  vehicle: VehicleConfig,
  mission: MissionConfig
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, vehicle, mission }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save mission');
  }
  return res.json();
}

export async function deleteMission(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/missions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete mission');
}

export function getExportCsvUrl(simulationId: string): string {
  return `${API_BASE}/api/simulations/${simulationId}/export/csv`;
}
