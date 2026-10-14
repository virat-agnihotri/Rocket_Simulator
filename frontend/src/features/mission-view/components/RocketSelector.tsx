import { Suspense, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Html, OrbitControls, useProgress } from '@react-three/drei';
import { rocketRegistry, getRocket } from '../../../assets/rocketRegistry';
import type { RocketId } from '../../../assets/rocketRegistry';
import { RocketAsset } from '../scene/RocketAsset';
import { SceneBoundary } from '../scene/MissionScene';
function Loading() {
  const { progress } = useProgress();
  return <Html center><span className="scene-loading" role="status">Loading model · {Math.round(progress)}%</span></Html>;
}
function NoWebGL({ onUnavailable }: { onUnavailable: () => void }) {
  return <div className="model-error">WebGL is unavailable. You can still select a vehicle and configure its flight. <button onClick={onUnavailable}>Use vehicle metadata</button></div>;
}
export function RocketSelector({ selected, onSelect }: { selected: RocketId; onSelect: (id: RocketId) => void }) {
  const [filter, setFilter] = useState(''), [category, setCategory] = useState('all');
  const [candidate, setCandidate] = useState(selected), [reset, setReset] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed' | 'unavailable'>('loading');
  const asset = getRocket(candidate);
  const ready = useCallback(() => setStatus('ready'), []);
  const failed = useCallback(() => setStatus('failed'), []);
  const unavailable = useCallback(() => setStatus('unavailable'), []);
  const matches = rocketRegistry.filter(a => (category === 'all' || a.category === category) && `${a.name} ${a.category} ${a.manufacturer}`.toLowerCase().includes(filter.toLowerCase()));
  function preview(id: RocketId) { if (id !== candidate) { setCandidate(id); setStatus('loading'); } }
  return <section className="rocket-library" aria-label="Rocket Hangar">
    <div className="section-label"><div><p className="mv-kicker">VEHICLE LIBRARY / {rocketRegistry.length} ASSETS</p><h3>Rocket Hangar</h3></div><div className="hangar-filters"><input aria-label="Search rocket models" placeholder="Search vehicles…" value={filter} onChange={e => setFilter(e.target.value)}/><select aria-label="Filter vehicle category" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{[...new Set(rocketRegistry.map(a => a.category))].map(value => <option key={value}>{value}</option>)}</select></div></div>
    <div className="hangar-layout"><div className="hangar-gallery">{matches.map(a => <button key={a.id} className={`hangar-card ${a.id === candidate ? 'previewed' : ''} ${a.id === selected ? 'confirmed' : ''}`} aria-pressed={a.id === candidate} aria-label={`Preview ${a.name}`} onClick={() => preview(a.id)}>
      {a.thumbnail ? <img src={a.thumbnail} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }}/> : <span className="hangar-placeholder" aria-hidden="true">↑</span>}<span className="rocket-name">{a.name}</span><span className="rocket-category">{a.category}</span><span className="rocket-state">{a.id === selected ? '● SELECTED' : 'VISUAL MODEL ONLY'}</span>
    </button>)}{!matches.length && <p role="status">No vehicles match these filters.</p>}</div>
    <div className="hangar-detail"><div className="hangar-canvas" key={`${candidate}-${reset}`}><SceneBoundary onError={failed} fallback={<div className="model-error" role="alert">Unable to load {asset.name}. Retry the preview or choose another vehicle.</div>}><Canvas shadows frameloop="demand" fallback={<NoWebGL onUnavailable={unavailable}/>} camera={{ position: [100, 45, 120], fov: asset.cameraFov }} dpr={[1, 1.5]}><color attach="background" args={['#101d2a']}/><hemisphereLight intensity={1.6}/><directionalLight position={[40, 90, 60]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]}/><Suspense fallback={<Loading/>}><Bounds fit clip observe margin={1.35}><RocketAsset id={candidate} height={asset.presentationHeight} onLoaded={ready}/></Bounds></Suspense><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[45, 64]}/><meshStandardMaterial color="#263640" roughness={.9}/></mesh><OrbitControls makeDefault target={[0, asset.presentationHeight / 2, 0]} enablePan={false} minDistance={35} maxDistance={240} enableDamping/></Canvas></SceneBoundary></div>
      <div className="hangar-info"><h4>{asset.name}</h4><p>{asset.manufacturer} · Visual Model Only</p><p role="status">{status === 'ready' ? 'Model ready · Drag to rotate · Scroll to zoom' : status === 'failed' ? 'Model load failed' : status === 'unavailable' ? '3D preview unavailable · metadata selection available' : 'Loading selected model…'}</p><div className="hangar-actions"><button onClick={() => { setStatus('loading'); setReset(n => n + 1); }}>Reset camera / retry</button><button disabled={status !== 'ready' && status !== 'unavailable'} onClick={() => onSelect(candidate)}>{candidate === selected ? 'Selection confirmed' : 'Confirm vehicle selection'}</button><a href="#vehicle-configuration">Configure flight physics ↗</a></div><p className="library-note">{asset.physics}. No verified vehicle preset or structural separation mapping is available.</p><p className="library-note">{asset.license} · <a href={asset.sourceUrl} target="_blank" rel="noreferrer">{asset.attribution}</a> · <a href={asset.licenseUrl} target="_blank" rel="noreferrer">Usage terms</a></p><p className="library-note">{asset.modificationNotice} <a href="/THIRD_PARTY_NOTICES.md" target="_blank" rel="noreferrer">Full asset credits</a></p></div>
    </div></div><p className="library-note">Confirmed selection drives launch and telemetry playback. Rendering size is independent of physical dimensions. Configure mass, thrust, propellant and aerodynamics below before running a mission.</p>
  </section>;
}
