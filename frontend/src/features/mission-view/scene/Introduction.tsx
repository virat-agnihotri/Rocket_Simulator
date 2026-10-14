import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { Group } from 'three';
import { SceneBoundary } from './MissionScene';
import { RealisticEarth, Satellites } from './RealisticEarth';
import { RocketAsset, ModelLoading } from './RocketAsset';
import { EngineEffects } from './EngineEffects';
import { useReducedMotion } from '../telemetry/useReducedMotion';
function IntroLaunch({ reduced }: { reduced: boolean }) {
 const rocket = useRef<Group>(null);
 useFrame(({clock}) => {
   if(rocket.current){
     const phase=reduced?.25:(clock.elapsedTime%24)/24;
     const horizontalOffset = phase < 0.15 ? 0 : Math.sin((phase - 0.15) / 0.85 * (Math.PI / 2)) * 0.8;
     const pitchAngle = phase < 0.15 ? 0 : -0.08 * Math.min(1, (phase - 0.15) / 0.2);
     rocket.current.position.set(10 + horizontalOffset, -3 + phase * 6, 3);
     rocket.current.rotation.z = pitchAngle;
   }
 });
 return <group ref={rocket}><Suspense fallback={<ModelLoading/>}><RocketAsset id="saturn-v" height={3}/></Suspense><group scale={.045}><EngineEffects illustrative/></group></group>;
}
function World({ reduced }: { reduced: boolean }) {
 const { camera, size } = useThree();
 useEffect(()=>{ camera.position.set(...(size.width < 600 ? [3,2,40] : [0,2,21]) as [number,number,number]); },[camera,size.width]);
 return <><ambientLight intensity={.25}/><directionalLight position={[10,5,8]} intensity={2.5}/><Stars radius={80} count={2400} speed={reduced?0:.2} fade/><group position={[3,-1,0]}><Suspense fallback={<ModelLoading/>}><RealisticEarth rotate reduced={reduced}/></Suspense><Satellites reduced={reduced}/></group><IntroLaunch reduced={reduced}/><OrbitControls target={[3,-1,0]} enablePan={false} enableZoom={false} minPolarAngle={.5} maxPolarAngle={2.5} rotateSpeed={.25}/></>;
}
export function Introduction() {
 const reduced=useReducedMotion();
 return <section className="space-intro"><div className="space-intro-scene" aria-label="Interactive rotating Earth, orbiting satellites and Saturn V launch"><SceneBoundary fallback={<p className="mv-fallback">3D introduction unavailable. Continue to Mission Control.</p>}><Canvas camera={{position:[0,2,21],fov:48}} dpr={[1,1.5]}><World reduced={reduced}/></Canvas></SceneBoundary></div><div className="space-intro-copy"><p className="mv-kicker">EXPLORE / SIMULATE / OPTIMIZE</p><h1>Rocket Mission<br/><span>Optimization Platform</span></h1><p>Simulate. Analyze. Optimize. Launch.</p><p className="space-description">Engineer the ascent. Explore recovered launch vehicles, configure your mission, and follow one calculated flight across three synchronized perspectives.</p><button onClick={()=>document.getElementById('analysis')?.scrollIntoView({behavior:reduced?'instant':'smooth'})}>Begin Analysis →</button><small>Interactive 3D scene · Drag to explore<br/>Introduction launch is illustrative</small></div><div className="intro-features"><span>01 / REAL VEHICLE ASSETS</span><span>02 / SYNCHRONIZED FLIGHT PLAYBACK</span><span>03 / EARTH & TRAJECTORY</span></div></section>;
}
