import { RocketAsset, ModelLoading } from './RocketAsset';
import { RealisticEarth, Satellites } from './RealisticEarth';
import { EngineEffects } from './EngineEffects';
import type { RocketId } from '../../../assets/rocketRegistry';
import { designColor } from '../../../designTokens';
import { Component, Suspense, useMemo, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, OrbitControls, Stars, Sky, useGLTF } from '@react-three/drei';
import { Box3, Group, Vector3 } from 'three';
import type { MissionRun, Vec3 } from '../telemetry/mission';
import { BOOSTER_SEPARATION, CORE_SEPARATION, sampleMission, separationAt } from '../telemetry/mission';
import { earthPosition } from '../telemetry/mission';
import { missionAssets } from '../../../assets/manifest';

export type CameraMode = 'pad' | 'chase' | 'orbit';
export type ModelMode = RocketId | 'schematic' | 'saturn';
type Props = { run: MissionRun; clock: RefObject<number>; mode: CameraMode; model: ModelMode; reducedMotion?: boolean; targetAltitude?: number; earthCamera?: string; showSatellites?: boolean; showTrajectory?: boolean; cameraReset?: number; rocketCameraReset?: number };

export class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onError?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function ImportedModel({ url, height }: { url: string; height: number }) {
  const { scene } = useGLTF(url, '/decoders/draco/');
  const clone = useMemo(() => {
    const copy = scene.clone(true);
    const bounds = new Box3().setFromObject(copy);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = height / Math.max(size.y, .001);
    copy.scale.multiplyScalar(scale);
    copy.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    return copy;
  }, [scene, height]);
  return <primitive object={clone} />;
}

function Body({ radius, height, color }: { radius: number; height: number; color: string }) {
  return <mesh position={[0, height / 2, 0]} castShadow><cylinderGeometry args={[radius, radius, height, 24]} /><meshStandardMaterial color={color} roughness={.6} /></mesh>;
}

function Rocket({ run, clock, model, reducedMotion }: Pick<Props, 'run' | 'clock' | 'model' | 'reducedMotion'>) {
  const root = useRef<Group>(null), boosters = useRef<Group>(null), core = useRef<Group>(null), flame = useRef<Group>(null);
  useFrame(() => {
    const p = sampleMission(run.samples, clock.current);
    const state = separationAt(run, clock.current);
    const pos = localPosition(p);
    const pitch = p.localPitch ?? p.pitch;
    if (root.current) { root.current.position.set(...pos); root.current.rotation.z = -pitch; }
    if (boosters.current) {
      const elapsed = state.boosters ? clock.current - BOOSTER_SEPARATION : 0;
      boosters.current.position.y = -Math.min(80, elapsed * 3);
      boosters.current.children.forEach((child, index) => { child.position.x = (index === 0 ? -1 : 1) * (6 + Math.min(50, elapsed * 2)); });
    }
    if (core.current) core.current.position.y = state.core ? -Math.min(100, (clock.current - CORE_SEPARATION) * 3) : 0;
    if (flame.current) { flame.current.visible = clock.current > 0 && p.throttle > 0; flame.current.position.y = state.core && model === 'schematic' ? 40 : 0; flame.current.scale.set(state.core ? .5 : 1, reducedMotion ? 1 : .8 + .2 * Math.sin(clock.current * 35), state.core ? .5 : 1); }
  });
  return <group ref={root}>
    {model !== 'schematic' && model !== 'saturn' ? <Suspense fallback={<ModelLoading />}><RocketAsset id={model} /></Suspense> : run.source === 'backend' ? <><Body radius={4} height={52} color="#e4ecf2" /><mesh position={[0, 56, 0]}><coneGeometry args={[4, 8, 24]} /><meshStandardMaterial color="#edf2f7" /></mesh></> : model === 'saturn' ? <Suspense fallback={<Body radius={4} height={60} color="#d9e4ed" />}><ImportedModel url={missionAssets.saturn.url} height={missionAssets.saturn.heightNormalizedM} /></Suspense> : <>
      <group ref={core}><Body radius={4} height={40} color="#ce773d" />{[-1, 1].flatMap(x => [-1, 1].map(z => <mesh key={`${x}-${z}`} position={[x * 1.8, -1, z * 1.8]}><coneGeometry args={[1.2, 3, 16]} /><meshStandardMaterial color="#52606d" metalness={.8} roughness={.35} /></mesh>))}</group>
      <group position={[0, 40, 0]}><Body radius={3.5} height={15} color="#e4ecf2" /><mesh position={[0, 18, 0]}><coneGeometry args={[3.5, 6, 24]} /><meshStandardMaterial color="#edf2f7" /></mesh></group>
      <group ref={boosters}>{[-1, 1].map(side => <group key={side} position={[side * 6, 0, 0]}><Body radius={2} height={32} color="#f2f4f5" /><mesh position={[0, 34, 0]}><coneGeometry args={[2, 4, 20]} /><meshStandardMaterial color="#f2f4f5" /></mesh></group>)}</group>
    </>}
    <EngineEffects run={run} clock={clock} />{model === 'schematic' || model === 'saturn' ? <group ref={flame}><mesh position={[0, -9, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[3.2, 17, 24]} /><meshBasicMaterial color={designColor('ember')} transparent opacity={.85} /></mesh><pointLight color={designColor('ember')} intensity={80} distance={50} /></group> : null}
  </group>;
}

function localPosition(sample: { launchPosition?: Vec3; position: Vec3; downrange?: number; altitude?: number }): Vec3 {
  // Topocentric launch-frame meters: [downrange, altitude, 0]
  if (sample.launchPosition) return sample.launchPosition;
  if (typeof sample.downrange === 'number' && typeof sample.altitude === 'number') {
    return [sample.downrange, sample.altitude, 0];
  }
  return sample.position;
}

function LaunchView({ run, clock, mode, model, reducedMotion, rocketCameraReset = 0 }: Props) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const lastTime = useRef(-1);
  const lastRocketReset = useRef(rocketCameraReset);
  const target = useMemo(() => new Vector3(), []);
  const cameraTarget = useMemo(() => new Vector3(), []);
  const cameraPosition = useMemo(() => new Vector3(), []);
  const planned = useMemo(() => run.samples.map(p => localPosition(p)), [run]);
  useFrame(({ camera }, delta) => {
    const t = clock.current;
    const p = sampleMission(run.samples, t);
    const pos = localPosition(p);
    target.set(...pos).add(new Vector3(0, 25, 0));
    if (mode === 'chase') { cameraTarget.copy(target); cameraPosition.copy(target).add(new Vector3(65, 20, 85)); }
    else if (mode === 'pad') { cameraTarget.copy(target); cameraPosition.copy(target).add(new Vector3(100, -Math.min(20, p.altitude*.1)+40, 140)); }
    else {
      if (lastRocketReset.current !== rocketCameraReset) {
        camera.position.copy(target).add(new Vector3(65, 20, 85));
        controls.current?.target.copy(target);
        controls.current?.update();
        lastRocketReset.current = rocketCameraReset;
      }
      return; // Free exploration must never be overwritten by automatic tracking.
    }
    const snap = t < lastTime.current || Math.abs(t - lastTime.current) > 1;
    camera.position.lerp(cameraPosition, snap || reducedMotion ? 1 : 1 - Math.exp(-delta * 5));
    if (controls.current) { controls.current.target.lerp(cameraTarget, snap || reducedMotion ? 1 : 1 - Math.exp(-delta * 5)); controls.current.update(); }
    lastTime.current = t;
  });
  return <>
    <color attach="background" args={['#182630']} /><hemisphereLight args={['#d9e4e8','#5e5549',1.4]} /><directionalLight position={[100, 200, 80]} intensity={3} castShadow shadow-mapSize={[1024,1024]} />
    <Sky sunPosition={[100,40,100]} turbidity={3} rayleigh={.6} distance={450000}/><Stars radius={200000} depth={50000} count={1800} factor={4} speed={reducedMotion ? 0 : 1} fade />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}><planeGeometry args={[4000, 4000]} /><meshStandardMaterial color="#182e32" /></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.2,0]} receiveShadow><circleGeometry args={[45,64]}/><meshStandardMaterial color="#5b6060" roughness={.95}/></mesh><mesh position={[0,-1,0]} receiveShadow><boxGeometry args={[26,2,26]}/><meshStandardMaterial color="#8d8b80"/></mesh>
    <SceneBoundary fallback={<group position={[-30, 0, 0]}><Body radius={10} height={55} color="#49616c" /></group>}><Suspense fallback={null}><group position={[-35, 0, 0]}><ImportedModel url={missionAssets.launcher.url} height={missionAssets.launcher.heightNormalizedM} /></group></Suspense></SceneBoundary>
    <Line points={planned} color={designColor('gold')} lineWidth={1} dashed dashSize={1000} gapSize={600} />
    <FlownPath run={run} clock={clock} />
    <Rocket run={run} clock={clock} model={model} reducedMotion={reducedMotion} />
    <OrbitControls ref={controls} enablePan={mode === 'orbit'} enableRotate={mode === 'orbit'} enableZoom={mode === 'orbit'} minDistance={8} maxDistance={500000} enableDamping dampingFactor={.08} />
  </>;
}

function FlownPath({ run, clock, earth = false }: Pick<Props, 'run' | 'clock'> & { earth?: boolean }) {
  const group = useRef<Group>(null);
  const positions = useMemo(() => new Float32Array(run.samples.flatMap(p => earth ? earthPosition(run, p.position) : localPosition(p))), [run, earth]);
  useFrame(() => {
    const line = group.current?.children[0] as unknown as { geometry: { setDrawRange: (start: number, count: number) => void } };
    line?.geometry.setDrawRange(0, run.samples.filter(p => p.time <= clock.current).length);
  });
  return <group ref={group}><line><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><lineBasicMaterial color={designColor('telemetry')} /></line></group>;
}

export function EarthSurface() { return <RealisticEarth />; }

function EarthView({ run, clock, reducedMotion, targetAltitude = 400000, earthCamera = 'free', showSatellites = true, showTrajectory = true, cameraReset = 0 }: Props) {
 const marker = useRef<Group>(null), controls = useRef<React.ComponentRef<typeof OrbitControls>>(null), previousReset = useRef(-1);
 const targetOrbit = useMemo(() => Array.from({length:161},(_,i) => {const a=i/160*Math.PI*2,r=6.371+targetAltitude/1e6; return [Math.sin(a)*r,Math.cos(a)*r,0] as Vec3;}),[targetAltitude]);
 useFrame(({camera},delta) => {
  const position=earthPosition(run,sampleMission(run.samples,clock.current).position);
  marker.current?.position.set(...position);
  if(previousReset.current!==cameraReset){camera.position.set(0,5,20);controls.current?.target.set(0,0,0);previousReset.current=cameraReset;}
  if(earthCamera==='follow'){const point=new Vector3(...position);camera.position.lerp(point.clone().multiplyScalar(1.75).add(new Vector3(0,0,3)),reducedMotion?1:1-Math.exp(-delta*3));controls.current?.target.lerp(point,.15);}
  else if(earthCamera==='launch'){camera.position.lerp(new Vector3(0,11,8),.08);controls.current?.target.set(0,6.371,0);}
  else if(earthCamera==='target'){camera.position.lerp(new Vector3(0,0,19),.08);controls.current?.target.set(0,0,0);}
  controls.current?.update();
 });
 return <><color attach="background" args={[designColor('background')]} /><ambientLight intensity={.15}/><directionalLight position={[10,5,8]} intensity={2.5}/><Stars radius={100} count={900} factor={1} speed={reducedMotion?0:.2}/><Suspense fallback={<ModelLoading/>}><RealisticEarth reduced={reducedMotion}/></Suspense>{showSatellites && <Satellites reduced={reducedMotion}/>}{showTrajectory && <><Line points={targetOrbit} color={designColor('text-secondary')} dashed dashSize={.1} gapSize={.1} lineWidth={1}/>{run.samples.length>1 && <><Line points={run.samples.map(p=>earthPosition(run,p.position))} color={designColor('gold')} dashed dashSize={.1} gapSize={.07} lineWidth={1}/><FlownPath run={run} clock={clock} earth/></>}</>}<mesh position={earthPosition(run,run.samples[0].position)}><sphereGeometry args={[.055,16,12]}/><meshBasicMaterial color={designColor('gold')}/></mesh><group ref={marker}><mesh><sphereGeometry args={[.07,16,12]}/><meshBasicMaterial color={designColor('ember')}/></mesh></group><OrbitControls ref={controls} enablePan={false} enableRotate={earthCamera==='free'} enableZoom={earthCamera==='free'} minDistance={7} maxDistance={40}/></>;
}

export function MissionScene(props: Props & { earth?: boolean }) {
  return <Canvas shadows fallback={<div className="mv-fallback">WebGL is unavailable. Telemetry and charts remain available below.</div>} camera={{ fov:42, position: props.earth ? [0, 5, 20] : [180, 110, 260], near: props.earth ? .01 : 1, far: props.earth ? 300 : 1000000 }} dpr={[1, 1.5]}>
    {props.earth ? <EarthView {...props} /> : <LaunchView {...props} />}
  </Canvas>;
}

