import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TelemetryPoint } from '../types/simulation';

interface TelemetryChartsProps {
  telemetry: TelemetryPoint[];
  burnDurationS?: number;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  telemetry,
}) => {
  const [activeTab, setActiveTab] = useState<'altitude' | 'speed' | 'acceleration' | 'mass' | 'q'>('altitude');

  if (!telemetry || telemetry.length === 0) return null;

  // Format dataset with convenient units
  const chartData = telemetry.map((pt) => ({
    time: Math.round(pt.time_s),
    altitudeKm: parseFloat((pt.altitude_m / 1000).toFixed(2)),
    downrangeKm: parseFloat((pt.downrange_distance_m / 1000).toFixed(2)),
    speedMps: Math.round(pt.speed_mps),
    vRadialMps: Math.round(pt.vertical_speed_mps),
    vHorizontalMps: Math.round(pt.horizontal_speed_mps),
    accelerationG: parseFloat((pt.acceleration_mps2 / 9.80665).toFixed(2)),
    massTonnes: parseFloat((pt.mass_kg / 1000).toFixed(2)),
    propellantTonnes: parseFloat((pt.propellant_remaining_kg / 1000).toFixed(2)),
    dynamicPressureKPa: parseFloat((pt.dynamic_pressure_pa / 1000).toFixed(2)),
    densityKgM3: parseFloat(pt.atmospheric_density_kg_m3.toFixed(4)),
    pitchDeg: parseFloat(pt.pitch_angle_deg.toFixed(1)),
  }));

  const tabs = [
    { id: 'altitude', label: 'Altitude & Downrange' },
    { id: 'speed', label: 'Velocity Vectors' },
    { id: 'acceleration', label: 'Acceleration (g)' },
    { id: 'mass', label: 'Mass & Propellant' },
    { id: 'q', label: 'Dynamic Pressure (Max-Q)' },
  ];

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
      {/* Header and Chart Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100">Telemetry Analysis</h3>
          <p className="text-xs text-slate-400 font-mono">
            {chartData.length} discrete integration states sampled
          </p>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'altitude' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" s" />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" km" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--background-secondary)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="altitudeKm" name="Altitude (km)" stroke="var(--telemetry)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="downrangeKm" name="Downrange (km)" stroke="var(--gold)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          ) : activeTab === 'speed' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" s" />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" m/s" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--background-secondary)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="speedMps" name="Inertial Speed (m/s)" stroke="var(--success)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="vHorizontalMps" name="Tangential Speed (m/s)" stroke="var(--telemetry)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="vRadialMps" name="Radial/Vertical Speed (m/s)" stroke="var(--gold)" strokeWidth={1.8} dot={false} />
            </LineChart>
          ) : activeTab === 'acceleration' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" s" />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" g" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--background-secondary)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="accelerationG" name="Acceleration (g-load)" stroke="var(--ember)" strokeWidth={2.5} dot={false} />
            </LineChart>
          ) : activeTab === 'mass' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" s" />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" t" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--background-secondary)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="massTonnes" name="Total Rocket Mass (tonnes)" stroke="var(--telemetry)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="propellantTonnes" name="Propellant Mass (tonnes)" stroke="var(--gold)" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" s" />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} unit=" kPa" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--background-secondary)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="dynamicPressureKPa" name="Dynamic Pressure q (kPa)" stroke="var(--warning)" strokeWidth={2.5} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
