import { Suspense, useCallback, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { rocketRegistry } from '../../../assets/rocketRegistry';
import type { RocketId } from '../../../assets/rocketRegistry';
import { RocketAsset, ModelLoading } from '../scene/RocketAsset';
import { SceneBoundary } from '../scene/MissionScene';
function ModelCard({ id, selected, onSelect }: { id: RocketId; selected: boolean; onSelect: () => void }) {
  const container = useRef<HTMLElement>(null), [visible,setVisible] = useState(false);
  useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.05});if(container.current)observer.observe(container.current);return()=>observer.disconnect();},[]);
  const asset = rocketRegistry.find(a => a.id === id)!;
  const [loaded, setLoaded] = useState(false), [failed, setFailed] = useState(false);
  const ready = useCallback(() => setLoaded(true), []);
  return <article ref={container} className={`rocket-card ${selected ? 'selected' : ''}`}>
    <div className="rocket-preview">{visible ? <SceneBoundary onError={() => setFailed(true)} fallback={<span className="model-error">Model unavailable · telemetry remains available</span>}><Canvas frameloop="demand" camera={{ position: [105, 40, 130], fov: 30 }} dpr={[1, 1.25]}><ambientLight intensity={1.8}/><directionalLight position={[40, 80, 60]} intensity={3}/><Suspense fallback={<ModelLoading/>}><RocketAsset id={id} height={60} onLoaded={ready}/></Suspense><OrbitControls target={[0, 30, 0]} enableZoom={false} enablePan={false}/></Canvas></SceneBoundary> : <span className="scene-loading">3D preview on scroll</span>}</div>
    <button aria-pressed={selected} aria-label={`Select ${asset.name}`} onClick={onSelect}><span className="rocket-name">{asset.name}</span><span className="rocket-category">{asset.category}</span><span className="rocket-state">{failed ? 'ASSET ERROR' : !loaded && visible ? 'LOADING MODEL' : selected ? '● SELECTED' : loaded ? 'MODEL READY' : 'PREVIEW ON SCROLL'}</span></button>
  </article>;
}
export function RocketSelector({ selected, onSelect }: { selected: RocketId; onSelect: (id: RocketId) => void }) {
 const [filter, setFilter] = useState('');
 return <section className="rocket-library"><div className="section-label"><div><p className="mv-kicker">VEHICLE LIBRARY / {rocketRegistry.length} RECOVERED ASSETS</p><h3>Select your vehicle</h3></div><input aria-label="Search rocket models" placeholder="Search vehicle library…" value={filter} onChange={e => setFilter(e.target.value)}/></div><div className="rocket-cards">{rocketRegistry.filter(a => `${a.name} ${a.category}`.toLowerCase().includes(filter.toLowerCase())).map(asset => <ModelCard key={asset.id} id={asset.id} selected={asset.id === selected} onSelect={() => onSelect(asset.id)}/>)}</div><p className="library-note">Model selection changes the visual vehicle. Physics uses your Configuration Lab inputs; verified vehicle-specific presets and separable stage mappings are unavailable.</p></section>;
}
