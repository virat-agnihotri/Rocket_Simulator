export interface VehicleConfig {
  dry_mass_kg: number;
  payload_mass_kg: number;
  propellant_mass_kg: number;
  thrust_n: number;
  specific_impulse_s: number;
  drag_coefficient: number;
  reference_area_m2: number;
}

export interface GuidanceConfig {
  pitchover_altitude_m: number;
  pitch_end_altitude_m: number;
  target_pitch_deg: number;
  pitch_exponent: number;
}

export interface NumericalSolverSettings {
  method: string;
  rtol: number;
  atol: number;
  max_step_s: number;
}

export interface MissionConfig {
  target_altitude_m: number;
  launch_altitude_m: number;
  launch_latitude_deg?: number;
  simulation_duration_s: number;
  output_interval_s: number;
  selected_atmosphere_model: 'exponential' | 'vacuum' | 'us_standard_simple';
  wind_velocity_x_mps: number;
  guidance_configuration: GuidanceConfig;
  numerical_solver_settings?: NumericalSolverSettings;
}

export interface TelemetryPoint {
  time_s: number;
  x_m: number;
  y_m: number;
  vx_mps: number;
  vy_mps: number;
  altitude_m: number;
  downrange_distance_m: number;
  speed_mps: number;
  vertical_speed_mps: number;
  horizontal_speed_mps: number;
  mass_kg: number;
  propellant_remaining_kg: number;
  thrust_n: number;
  drag_n: number;
  acceleration_mps2: number;
  dynamic_pressure_pa: number;
  atmospheric_density_kg_m3: number;
  pitch_angle_deg: number;
  is_engine_active: boolean;
}

export type OrbitClassification =
  | 'suborbital'
  | 'circular'
  | 'elliptical'
  | 'escape_hyperbolic'
  | 'ground_impact'
  | 'invalid';

export interface OrbitalMetrics {
  semi_major_axis_m?: number | null;
  eccentricity?: number | null;
  apoapsis_altitude_m?: number | null;
  periapsis_altitude_m?: number | null;
  orbital_period_s?: number | null;
  specific_energy_j_kg: number;
  specific_angular_momentum_m2_s: number;
  target_circular_velocity_mps: number;
  target_altitude_error_m: number;
  target_velocity_error_mps: number;
  orbit_classification: OrbitClassification;
}

export interface SimulationResult {
  simulation_id?: string | null;
  status: string;
  termination_reason: string;
  telemetry: TelemetryPoint[];
  telemetry_count: number;
  burnout_state?: TelemetryPoint | null;
  final_state: TelemetryPoint;
  peak_altitude_m: number;
  peak_speed_mps: number;
  peak_acceleration_mps2: number;
  maximum_dynamic_pressure_pa: number;
  total_flight_time_s: number;
  burn_duration_s: number;
  ideal_delta_v_mps: number;
  orbital_metrics: OrbitalMetrics;
  target_orbit_satisfied: boolean;
  warnings: string[];
  model_assumptions: string[];
}

export type OptimizationObjective =
  | 'minimize_propellant'
  | 'minimize_orbit_error'
  | 'maximize_payload';

export interface OptimizationCandidate {
  vehicle: VehicleConfig;
  mission: MissionConfig;
  objective_value: number;
  is_feasible: boolean;
  constraint_violations: Record<string, number>;
  peak_altitude_m: number;
  target_altitude_error_m: number;
  peak_acceleration_mps2: number;
  max_q_pa: number;
  orbit_classification: OrbitClassification;
  target_orbit_satisfied: boolean;
}

export interface OptimizationResult {
  optimization_id?: string | null;
  status: string;
  objective: OptimizationObjective;
  baseline_candidate: OptimizationCandidate;
  best_feasible_candidate?: OptimizationCandidate | null;
  evaluation_count: number;
  feasible_count: number;
  algorithm_settings: Record<string, any>;
  candidate_history: OptimizationCandidate[];
  execution_duration_s: number;
  message: string;
}

export interface MissionPreset {
  id: string;
  name: string;
  description: string;
  vehicle: VehicleConfig;
  mission: MissionConfig;
}

export interface SavedMissionSummary {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  dry_mass_kg: number;
  payload_mass_kg: number;
  propellant_mass_kg: number;
  thrust_n: number;
  specific_impulse_s: number;
  target_altitude_m: number;
  simulation_runs_count: number;
}
