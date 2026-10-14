import { RocketSelector } from './RocketSelector';
import { FlightInstrument } from './FlightInstrument';
import { getRocket } from '../../../assets/rocketRegistry';
import type { RocketId } from '../../../assets/rocketRegistry';
import type { MissionRun } from '../telemetry/mission';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adaptBackendTelemetry, sampleMission } from '../telemetry/mission';
import { usePlayback } from '../telemetry/usePlayback';
import { MissionScene, SceneBoundary } from '../scene/MissionScene';
import type { CameraMode } from '../scene/MissionScene';
import { Introduction } from '../scene/Introduction';
import { useReducedMotion } from '../telemetry/useReducedMotion';
import { Experiment } from './Experiment';
import type { ExperimentProps } from './Experiment';
import { TelemetryCharts } from '../../../components/TelemetryCharts';
import './mission.css';

export function MissionView(props: ExperimentProps) {
  const { simulationResult } = props;
  const [selected, setSelected] = useState<RocketId>('saturn-v');
  const [earthCamera, setEarthCamera] = useState('free'), [satellites, setSatellites] = useState(true), [trajectory, setTrajectory] = useState(true), [cameraReset,setCameraReset] = useState(0);
  const idleRun: MissionRun = useMemo(() => ({source:'backend',staged:false,events:[],samples:[{time:0,position:[0,0,0],velocity:[0,0,0],pitch:0,throttle:0,altitude:0,fuel:0}]}),[]);
  const [mode, setMode] = useState<CameraMode>('chase');
  const [rocketCameraReset, setRocketCameraReset] = useState(0);
  const reduced = useReducedMotion();
  const run = useMemo(() => simulationResult?.telemetry.length ? adaptBackendTelemetry(simulationResult.telemetry) : null, [simulationResult]);
  const duration = run?.samples.at(-1)?.time ?? 0;
  const playback = usePlayback(duration);
  const { seek } = playback;
  useEffect(() => { seek(0); }, [run, seek]); // A new result always starts paused at ignition.
  const sample = run ? sampleMission(run.samples, playback.displayTime) : null;
  const fallback = <div className="mv-fallback">3D rendering is unavailable. Scientific telemetry, charts and playback controls remain available. <Link to="/simulation">Open the planar results view</Link>.</div>;
  return <div className="mv-page"><Introduction /><section id="analysis" className="mv-analysis"><div className="mv-heading"><div><p className="mv-kicker">02 / MISSION ANALYSIS</p><h2>Mission Control</h2><p>Simulation playback · FastAPI solver · 2D planar physics displayed in 3D</p></div><span className="mv-badge">{run ? 'SCIENTIFIC SIMULATION PLAYBACK' : 'AWAITING SCIENTIFIC RESULT'}</span></div>
    <div className="mv-toolbar"><label>Launch camera<select value={mode} onChange={e => setMode(e.target.value as CameraMode)}><option value="chase">Chase camera</option><option value="pad">Launchpad camera</option><option value="orbit">Free camera · drag / zoom</option></select></label><Link to="/optimization">Optimize mission ↗</Link><Link to="/saved">Saved missions ↗</Link></div>
    <div className="mv-metrics">{[['MISSION TIME', sample ? `T+ ${playback.displayTime.toFixed(1)} s` : '—'], ['ALTITUDE', sample ? `${(sample.altitude / 1000).toFixed(2)} km` : '—'], ['SPEED', sample ? `${Math.hypot(...sample.velocity).toFixed(0)} m/s` : '—'], ['PROPELLANT', sample ? `${sample.fuel.toFixed(0)} kg` : '—'], ['DYNAMIC PRESSURE', sample ? `${((sample.pressure ?? 0) / 1000).toFixed(2)} kPa` : '--'], ['ACCELERATION', sample ? `${(sample.acceleration ?? 0).toFixed(2)} m/s2` : '--']].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <RocketSelector selected={selected} onSelect={setSelected}/><div className="tracking-toolbar"><label>Earth camera<select value={earthCamera} onChange={e=>setEarthCamera(e.target.value)}><option value="free">Free orbit · drag / zoom</option><option value="follow">Follow rocket</option><option value="launch">Launch reference</option><option value="target">Target orbit</option></select></label><button onClick={()=>{setEarthCamera('free');setCameraReset(n=>n+1);}}>Reset Earth view</button><label><input type="checkbox" checked={satellites} onChange={e=>setSatellites(e.target.checked)}/> Satellites</label><label><input type="checkbox" checked={trajectory} onChange={e=>setTrajectory(e.target.checked)}/> Trajectories</label></div><div className="mv-scenes">{[false, true].map(earth => <section className="mv-panel" key={String(earth)}><header>{earth ? 'EARTH / TRAJECTORY' : 'LAUNCH / ASCENT'}<span>{earth ? 'Drag to orbit · scroll to zoom' : mode === 'orbit' ? 'Drag to orbit · scroll to zoom' : 'Automatic tracking'}</span></header>{!earth && <div className="rocket-view-controls"><button aria-pressed={mode === 'orbit'} onClick={() => setMode('orbit')}>Free rocket view</button><button aria-pressed={mode === 'chase'} onClick={() => setMode('chase')}>Track rocket</button><button onClick={() => { setMode('orbit'); setRocketCameraReset(value => value + 1); }}>Reset rocket view</button>{mode === 'orbit' && <span>Drag to rotate · Scroll to zoom · Right-drag to pan</span>}</div>}<div className="mv-canvas">{<SceneBoundary key={`${simulationResult?.simulation_id}-${earth ? "earth" : selected}`} fallback={fallback}><MissionScene run={run ?? idleRun} clock={playback.time} mode={mode} model={selected} earth={earth} reducedMotion={reduced} targetAltitude={props.mission.target_altitude_m} earthCamera={earthCamera} showSatellites={satellites} showTrajectory={trajectory} cameraReset={cameraReset} rocketCameraReset={rocketCameraReset} /></SceneBoundary>}</div><footer>{earth ? 'Teal: flown path · dashed gold: full computed trajectory · orange: rocket · gold: launch reference' : 'Selected asset · engine effects follow solver state · visual dimensions normalized'}</footer></section>)}</div>
    <section className="mv-playback"><button disabled={!run} onClick={() => { if (playback.displayTime >= duration) playback.seek(0); playback.setPlaying(!playback.playing); }}>{playback.playing ? 'Pause' : playback.displayTime === 0 ? 'Launch / Play' : 'Resume'}</button><button disabled={!run} onClick={() => playback.seek(0)}>Reset</button><input disabled={!run} aria-label="Simulation playback timeline" type="range" min={0} max={duration} step={.1} value={playback.displayTime} onChange={e => playback.seek(Number(e.target.value))} /><label>Playback speed<select value={playback.speed} onChange={e => playback.setSpeed(Number(e.target.value))}>{[.25, 1, 5, 15, 30].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label></section>
    <FlightInstrument run={run} clock={playback.time} selected={selected}/><p className="mv-note selected-model-note">{getRocket(selected).name} · {getRocket(selected).physics}</p>
    {simulationResult && <><p className="mv-note">{simulationResult.status}: {simulationResult.termination_reason} · Orbit: {simulationResult.orbital_metrics.orbit_classification} · Target {simulationResult.target_orbit_satisfied ? 'satisfied' : 'not satisfied'} · Max-Q {(simulationResult.maximum_dynamic_pressure_pa / 1000).toFixed(2)} kPa · Peak acceleration {simulationResult.peak_acceleration_mps2.toFixed(2)} m/s²</p><TelemetryCharts telemetry={simulationResult.telemetry} burnDurationS={simulationResult.burn_duration_s} />{simulationResult.warnings.map((warning, i) => <p className="mv-note" key={i}>{warning}</p>)}<details className="mv-note"><summary>Solver assumptions</summary>{simulationResult.model_assumptions.map((assumption, i) => <p key={i}>{assumption}</p>)}</details></>}
    <p className="mv-note">The solver models one inertial plane. Target orbit is an altitude reference, not a calculated inclined orbit. Satellite motion is decorative. Earth texture and launch marker are visual references, without a modeled geographic launch or orbital inclination. The introduction and the separate <Link to="/live">illustrative launch demo</Link> do not supply scientific results.</p></section><Experiment {...props} /></div>;
}

