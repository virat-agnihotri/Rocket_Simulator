import "./LiveMissionPage.css";
import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, Cloud, Flame, Gauge, Pause, Play, RotateCcw, Rocket, ShieldAlert, SlidersHorizontal, Wind, Zap } from 'lucide-react';
import type { VehicleConfig } from '../types/simulation';

type FlightPoint = { t: number; altitude: number; velocity: number; x: number; mass: number; fuel: number; thrust: number; q: number; acceleration: number; engine: boolean };
type FlightEvent = { t: number; label: string; kind: 'info' | 'warning' | 'danger' | 'success' };
type FlightRun = { points: FlightPoint[]; events: FlightEvent[]; result: string; impactTime: number | null; apogee: number };
type Scenario = 'nominal' | 'wind' | 'engine';

const DT = 0.2;
function generateRun(vehicle: VehicleConfig, wind: number, failureTime: number, thrustLoss: number, scenario: Scenario): FlightRun {
  // Deliberately simplified illustrative vertical/ascent model; NOT the scientific FastAPI solver.
  const dryMass = Math.max(1000, vehicle.dry_mass_kg + vehicle.payload_mass_kg);
  const initialFuel = Math.max(0, vehicle.propellant_mass_kg);
  const maxThrust = Math.max(0, vehicle.thrust_n);
  const isp = Math.max(1, vehicle.specific_impulse_s);
  let altitude = 0, velocity = 0, x = 0, vx = 0, fuel = initialFuel;
  let maxAltitude = 0, impactTime: number | null = null;
  let hadLiftOff = false, maxQ = -1, maxQt = 0;
  const points: FlightPoint[] = [];
  for (let i = 0; i <= 2500; i++) {
    const t = +(i * DT).toFixed(2);
    const mass = dryMass + fuel;
    const factor = scenario === 'engine' && t >= failureTime ? Math.max(0, 1 - thrustLoss / 100) : 1;
    const engine = fuel > 0 && factor > 0;
    const thrust = engine ? maxThrust * factor : 0;
    const rho = 1.225 * Math.exp(-Math.max(0, altitude) / 8500);
    const relativeVertical = velocity;
    const drag = -0.5 * rho * vehicle.drag_coefficient * vehicle.reference_area_m2 * relativeVertical * Math.abs(relativeVertical);
    const gravity = 9.80665 * Math.pow(6371000 / (6371000 + Math.max(altitude, 0)), 2);
    const accel = (thrust + drag) / mass - gravity;
    const q = 0.5 * rho * (velocity * velocity + (vx - wind) ** 2);
    if (q > maxQ) { maxQ = q; maxQt = t; }
    points.push({ t, altitude: Math.max(0, altitude), velocity, x, mass, fuel, thrust, q, acceleration: accel, engine });
    maxAltitude = Math.max(maxAltitude, altitude);
    if (altitude > 1) hadLiftOff = true;
    if (hadLiftOff && altitude <= 0 && velocity < 0) { impactTime = t; break; }
    if (!hadLiftOff && t > 8 && thrust < mass * gravity) break;
    const windDrag = 0.5 * rho * vehicle.drag_coefficient * vehicle.reference_area_m2 * (wind - vx) * Math.abs(wind - vx);
    vx += windDrag / mass * DT;
    x += vx * DT;
    velocity += accel * DT;
    altitude = Math.max(0, altitude + velocity * DT);
    fuel = Math.max(0, fuel - (thrust / (isp * 9.80665)) * DT);
    if (altitude > 300000) break;
  }
  const events: FlightEvent[] = [{ t: 0, label: 'Ignition sequence and liftoff command', kind: 'success' }];
  if (!hadLiftOff) events.push({ t: 8, label: 'Launch unsuccessful: insufficient thrust-to-weight ratio', kind: 'danger' });
  if (scenario === 'wind') events.push({ t: 0, label: `Launch authorized despite ${wind.toFixed(0)} m/s wind advisory`, kind: 'warning' });
  if (scenario === 'engine' && points[points.length - 1].t >= failureTime) events.push({ t: failureTime, label: `Engine thrust reduced by ${thrustLoss}%`, kind: 'danger' });
  if (maxQt > 0) events.push({ t: maxQt, label: `Maximum dynamic pressure: ${(maxQ / 1000).toFixed(1)} kPa`, kind: 'info' });
  const burnout = points.find((p, i) => i > 0 && !p.engine && points[i - 1].engine);
  if (burnout) events.push({ t: burnout.t, label: 'Engine cutoff / propellant exhausted', kind: 'warning' });
  const apex = points.find(p => Math.abs(p.altitude - maxAltitude) < 0.02);
  if (apex) events.push({ t: apex.t, label: `Apogee reached: ${(maxAltitude / 1000).toFixed(1)} km`, kind: 'info' });
  if (impactTime !== null) events.push({ t: impactTime, label: 'Ground impact detected — mission failed', kind: 'danger' });
  events.sort((a, b) => a.t - b.t);
  return { points, events, result: !hadLiftOff ? 'NO LIFTOFF' : impactTime !== null ? 'GROUND IMPACT' : 'SIMULATION LIMIT', impactTime, apogee: maxAltitude };
}

const fmt = (v: number, decimals = 0) => Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) : '—';
function FlightChart({ points, current, field, color, title, unit }: { points: FlightPoint[]; current: number; field: 'altitude' | 'velocity'; color: string; title: string; unit: string }) {
  const maxT = Math.max(1, points[points.length - 1]?.t ?? 1);
  const values = points.map(p => p[field]);
  const min = Math.min(0, ...values), max = Math.max(1, ...values), spread = Math.max(1, max - min);
  const path = points.filter((_, i) => i % 3 === 0 || i === points.length - 1).map((p, i) => `${i === 0 ? 'M' : 'L'}${(p.t / maxT * 600).toFixed(2)},${(106 - (p[field] - min) / spread * 92).toFixed(2)}`).join(' ');
  return <div className="lm-chart"><div className="lm-chart-title"><span>{title}</span><span>{unit}</span></div><svg viewBox="0 0 600 120" preserveAspectRatio="none" aria-label={`${title} over time`}><path d="M0 106H600 M0 58H600 M0 14H600" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 7" fill="none"/><path d={path} stroke={color} strokeWidth="2.6" fill="none" vectorEffect="non-scaling-stroke"/><path d={`M${current / maxT * 600} 0 V114`} stroke="var(--text-primary)" strokeOpacity=".8" strokeDasharray="3 4"/></svg><div className="lm-chart-times"><span>T+0</span><span>T+{fmt(maxT)}s</span></div></div>;
}
function FlightVisual({ p, launched, impact, wind }: { p: FlightPoint; launched: boolean; impact: boolean; wind: number }) {
  const height = Math.min(210, Math.max(0, Math.log1p(p.altitude / 150) * 36));
  const sideways = Math.max(-85, Math.min(85, p.x / 90));
  const trail = launched && p.engine && !impact;
  return <div className="lm-visual"><div className="lm-stars"/><div className="lm-visual-top"><span>CAM 01 · LAUNCH TRACKER</span><span className="lm-camera-dot">● LIVE RENDER</span></div><div className="lm-alt-label">ALT {fmt(p.altitude / 1000, 2)} KM</div><div className="lm-wind-vector"><Wind size={15}/> WIND {fmt(wind)} m/s {wind >= 0 ? '→' : '←'}</div><svg className="lm-scene" viewBox="0 0 640 390" aria-label="Animated 2D rocket launch scene"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#071323"/><stop offset="1" stopColor="#173651"/></linearGradient><linearGradient id="flame" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff5e8"/><stop offset=".4" stopColor="var(--ember)"/><stop offset="1" stopColor="var(--ember)" stopOpacity="0"/></linearGradient></defs><rect width="640" height="390" fill="url(#sky)"/>{Array.from({ length: 28 }, (_, i) => <circle key={i} cx={(i * 157 + 43) % 640} cy={(i * 73 + 17) % 285} r={i % 4 ? 1 : 1.6} fill="#d2e9f9" opacity={0.25 + (i % 3) / 7}/>)}<path d="M0 340 Q170 325 315 343 T640 339 L640 390 L0 390Z" fill="#172a37"/><path d="M260 345V207H290V345M247 344V240H302V344 M260 230L290 258 M290 230L260 258 M260 275L290 303 M290 275L260 303" fill="none" stroke="#687e8c" strokeWidth="3"/><path d="M0 353H640" stroke="#436170" strokeWidth="3"/>{launched && <path d={`M318 314 Q${318 + sideways / 2} ${310 - height / 2} ${318 + sideways} ${307 - height}`} fill="none" stroke="var(--telemetry)" strokeWidth="2" strokeDasharray="5 7" opacity=".65"/>}<g transform={`translate(${318 + sideways} ${impact ? 332 : 306 - height}) rotate(${impact ? 74 : Math.max(-13, Math.min(13, p.x / 1200))})`}>{trail && <path d="M-12 34Q-13 75 0 101Q15 73 12 34Z" fill="url(#flame)"/>}<path d="M0 -53 Q-18 -30 -16 22 L-16 35H16V22Q18 -30 0 -53Z" fill={impact ? '#ad8590' : '#e7eef6'}/><path d="M0 -53Q-18 -30 -16 -15H16Q18 -30 0 -53" fill="var(--ember)"/><rect x="-16" y="-2" width="32" height="6" fill="var(--surface-elevated)"/><circle cy="15" r="7" fill="var(--telemetry)"/><path d="M-16 23L-29 37L-16 35 M16 23L29 37L16 35" fill="#8aa9bc"/></g>{impact && <g><circle cx={318 + sideways} cy="336" r="37" fill="#ee6c3f" opacity=".2"/><circle cx={318 + sideways} cy="337" r="19" fill="#ffb05c" opacity=".5"/></g>}</svg><div className="lm-view-bottom"><span>TRACKING · {p.engine ? 'ENGINE ACTIVE' : 'ENGINE OFF'}</span><span>2D ILLUSTRATIVE VIEW</span></div></div>;
}

export const LiveMissionPage: React.FC<{ vehicle: VehicleConfig }> = ({ vehicle }) => {
  const [scenario, setScenario] = useState<Scenario>('engine');
  const [wind, setWind] = useState(18);
  const [failureTime, setFailureTime] = useState(45);
  const [thrustLoss, setThrustLoss] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [clock, setClock] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [launched, setLaunched] = useState(false);
  const [runConfig, setRunConfig] = useState({ scenario: 'engine' as Scenario, wind: 18, failureTime: 45, thrustLoss: 100 });
  const run = useMemo(() => generateRun(vehicle, runConfig.wind, runConfig.failureTime, runConfig.thrustLoss, runConfig.scenario), [vehicle, runConfig]);
  const duration = run.points[run.points.length - 1].t;
  const current = run.points[Math.min(run.points.length - 1, Math.round(clock / DT))];
  const finished = launched && clock >= duration;
  const failureTriggered = launched && runConfig.scenario === 'engine' && clock >= runConfig.failureTime;
  const isImpact = finished && run.impactTime !== null;
  useEffect(() => { if (!playing) return; const timer = window.setInterval(() => setClock(c => Math.min(duration, c + .1 * speed)), 100); return () => window.clearInterval(timer); }, [playing, duration, speed]);
  useEffect(() => { if (clock >= duration) setPlaying(false); }, [clock, duration]);
  const launch = () => { setRunConfig({ scenario, wind: scenario === 'nominal' ? 0 : wind, failureTime, thrustLoss }); setClock(0); setLaunched(true); setPlaying(true); };
  const reset = () => { setPlaying(false); setClock(0); setLaunched(false); };
  const activeEvents = launched ? run.events.filter(e => e.t <= clock + .05).slice(-5).reverse() : [];
  const windWarning = scenario !== 'nominal' && Math.abs(wind) >= 15;
  const displayedStatus = !launched ? 'READY FOR LAUNCH' : isImpact ? 'GROUND IMPACT' : finished ? run.result : failureTriggered ? 'ENGINE ANOMALY' : 'FLIGHT IN PROGRESS';
  return <div className="lm-page"><div className="lm-head"><div><div className="lm-eyebrow">ILLUSTRATIVE LAUNCH DEMO / SIMULATION PLAYBACK <span className="lm-mode">● DEMO PHYSICS</span></div><h1>Launch Control <span>Center</span></h1><p>Illustrative model only — not the FastAPI scientific solver and not a live broadcast. Explore wind and engine scenarios.</p></div><div className={`lm-status ${isImpact || failureTriggered ? 'bad' : 'good'}`}><span className="lm-pulse"/> {displayedStatus}</div></div><div className="lm-topmetrics">{[{ label:'MISSION ELAPSED TIME', value:`T+ ${fmt(clock,1)}s`, icon:Clock3 },{label:'ALTITUDE',value:`${fmt(current.altitude / 1000,2)} km`,icon:Rocket},{label:'VERTICAL VELOCITY',value:`${fmt(current.velocity)} m/s`,icon:Gauge},{label:'PROPELLANT LEFT',value:`${fmt(current.fuel / Math.max(1,vehicle.propellant_mass_kg) * 100,1)}%`,icon:Flame},{label:'DYNAMIC PRESSURE',value:`${fmt(current.q / 1000,1)} kPa`,icon:Activity}].map(({label,value,icon:Icon})=><div className="lm-metric" key={label}><div><span>{label}</span><Icon size={15}/></div><strong>{value}</strong></div>)}</div><div className="lm-main"><div className="lm-central"><FlightVisual p={current} launched={launched} impact={isImpact} wind={runConfig.wind}/><div className="lm-controls"><button className="lm-primary" onClick={launch}><Rocket size={17}/>{launched ? 'NEW LAUNCH' : 'INITIATE LAUNCH'}</button><button disabled={!launched || finished} onClick={()=>setPlaying(v=>!v)}><span>{playing ? <Pause size={16}/> : <Play size={16}/>}</span>{playing ? 'Pause' : 'Resume'}</button><button onClick={reset}><RotateCcw size={16}/>Reset</button><label>REPLAY SPEED <select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={1}>1×</option><option value={5}>5×</option><option value={15}>15×</option><option value={30}>30×</option></select></label></div><div className="lm-scrub"><input aria-label="Scrub simulation timeline" type="range" min={0} max={duration} step={DT} value={clock} disabled={!launched} onChange={e=>{setPlaying(false);setClock(Number(e.target.value));}}/><div><span>T+0s</span><span>MISSION TIMELINE / SCRUB TO REPLAY</span><span>T+{fmt(duration)}s</span></div></div><div className="lm-charts"><FlightChart points={run.points} current={clock} field="altitude" color="var(--telemetry)" title="ALTITUDE PROFILE" unit="m"/><FlightChart points={run.points} current={clock} field="velocity" color="var(--gold)" title="VERTICAL VELOCITY" unit="m/s"/></div></div><aside className="lm-sidebar"><section className="lm-panel"><div className="lm-panel-title"><SlidersHorizontal size={16}/> SCENARIO CONFIGURATION</div><div className="lm-segment">{(['nominal','wind','engine'] as const).map(s=><button key={s} disabled={launched} className={scenario===s?'active':''} onClick={()=>setScenario(s)}>{s==='nominal'?'Nominal':s==='wind'?'High wind':'Engine fault'}</button>)}</div><div className="lm-field"><div><label><Wind size={14}/> HORIZONTAL WIND</label><strong>{scenario==='nominal'?0:wind} m/s</strong></div><input disabled={launched || scenario==='nominal'} type="range" min={-45} max={45} step={1} value={wind} onChange={e=>setWind(Number(e.target.value))}/><small>Negative = leftward, positive = rightward.</small></div>{scenario==='engine'&&<><div className="lm-field"><div><label><Zap size={14}/> FAILURE AT</label><strong>T+{failureTime}s</strong></div><input disabled={launched} type="range" min={5} max={120} step={5} value={failureTime} onChange={e=>setFailureTime(Number(e.target.value))}/></div><div className="lm-field"><div><label><ShieldAlert size={14}/> THRUST LOSS</label><strong>{thrustLoss}%</strong></div><input disabled={launched} type="range" min={10} max={100} step={5} value={thrustLoss} onChange={e=>setThrustLoss(Number(e.target.value))}/></div></>}{windWarning && <div className="lm-advisory"><AlertTriangle size={16}/> Wind advisory: launch not recommended. Demo override is enabled.</div>}<div className="lm-note"><Cloud size={15}/> Changes to scenario settings take effect on the next launch.</div></section><section className="lm-panel lm-events"><div className="lm-panel-title"><Activity size={16}/> MISSION EVENT LOG</div>{activeEvents.length ? activeEvents.map((e,i)=><div className={`lm-event ${e.kind}`} key={`${e.t}-${i}`}><span>T+{fmt(e.t,1)}s</span><p>{e.label}</p></div>):<div className="lm-empty">Awaiting launch authorization. Mission events appear here during flight.</div>}</section><section className="lm-panel"><div className="lm-panel-title"><CheckCircle2 size={16}/> MISSION OUTCOME</div><div className="lm-outcome"><span>Predicted run result</span><strong>{launched ? run.result : 'NOT STARTED'}</strong><div><span>Apogee</span><b>{launched?`${fmt(run.apogee/1000,2)} km`:'—'}</b></div><div><span>Impact at</span><b>{launched && run.impactTime!==null?`T+${fmt(run.impactTime,1)}s`:'Not predicted'}</b></div><div><span>Downrange displacement</span><b>{launched?`${fmt(run.points[run.points.length-1].x/1000,2)} km`:'—'}</b></div></div></section></aside></div><div className="lm-disclaimer"><AlertTriangle size={17}/><span><b>Demonstration model, not a real orbital flight prediction.</b> This launch preview uses a simplified vertical point-mass integration and approximate horizontal wind drift, not your existing FastAPI RK45 orbital simulator. Camera, event labels and model outcomes are illustrative; arbitrary 3D wind, structural failures and stability are not modeled. The existing science and optimization pages remain unchanged.</span><ArrowRight size={18}/></div></div>;
};

