import { useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Points, ShaderMaterial } from 'three';
import { sampleMission } from '../telemetry/mission';
import type { MissionRun } from '../telemetry/mission';
export function EngineEffects({ run, clock, illustrative = false }: { run?: MissionRun; clock?: RefObject<number>; illustrative?: boolean }) {
 const plume = useRef<ShaderMaterial>(null);
 const plumeUniforms=useMemo(()=>({time:{value:0}}),[]);
 const smoke = useRef<Points>(null), fire = useRef<Points>(null);
 const seeds = useMemo(() => Array.from({length:180},(_,i) => [(i*.618)%1,(i*.381)%1,(i*.713)%1]),[]);
 const positions = useMemo(() => new Float32Array(seeds.length*3),[seeds]);
 const flamePositions = useMemo(() => new Float32Array(70*3),[]);
 useFrame(({clock: renderClock}) => {
  const t=clock?.current ?? renderClock.elapsedTime; if (plume.current) plume.current.uniforms.time.value=t; const active = illustrative || !!(run && sampleMission(run.samples,t).throttle>0 && t>0);
  if(smoke.current){smoke.current.visible=active;const attribute=smoke.current.geometry.getAttribute('position');seeds.forEach(([a,b,c],i) => {const age=(t*.28+a)%1;const spread=4+age*22;attribute.setXYZ(i,Math.cos(b*6.28)*spread,-8-age*48,Math.sin(b*6.28)*spread+c*3);});attribute.needsUpdate=true;}
  if(fire.current){fire.current.visible=active;const attribute=fire.current.geometry.getAttribute('position');for(let i=0;i<70;i++){const age=(t*3+i*.017)%1;const spread=(1-age)*2.4;attribute.setXYZ(i,Math.sin(i*2.4)*spread,-age*27,Math.cos(i*2.4)*spread);}attribute.needsUpdate=true;}
 });
 return <><points ref={fire} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[flamePositions,3]}/></bufferGeometry><shaderMaterial transparent depthWrite={false} blending={AdditiveBlending} vertexShader={`varying float heat;void main(){heat=clamp(-position.y/27.,0.,1.);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(90.,700.*length(modelMatrix[0].xyz)/max(1.,-mv.z));gl_Position=projectionMatrix*mv;}`} fragmentShader={`varying float heat;void main(){float r=length(gl_PointCoord-.5)*2.;float a=pow(max(0.,1.-r),2.)*(1.-heat*.65);gl_FragColor=vec4(mix(vec3(1.,.96,.85),vec3(.95,.37,.12),heat),a);}`}/><mesh position={[0,-13.5,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[3.2,27,24,8,true]}/><shaderMaterial ref={plume} uniforms={plumeUniforms} transparent depthWrite={false} blending={AdditiveBlending} vertexShader={`varying vec2 uvFlame;void main(){uvFlame=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`uniform float time;varying vec2 uvFlame;void main(){float heat=uvFlame.y;float turbulence=.8+.2*sin(uvFlame.x*31.+heat*22.-time*38.);vec3 c=mix(vec3(1.,.96,.86),vec3(.95,.38,.12),smoothstep(.05,.8,heat));gl_FragColor=vec4(c,pow(1.-heat,.65)*turbulence*.75);}`}/></mesh></points><points ref={smoke} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><shaderMaterial transparent depthWrite={false} vertexShader={`varying float fade;void main(){fade=clamp(1.+position.y/65.,0.,1.);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(160.,2200.*length(modelMatrix[0].xyz)/max(1.,-mv.z));gl_Position=projectionMatrix*mv;}`} fragmentShader={`varying float fade;void main(){float d=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,.15,d)*fade*.2;gl_FragColor=vec4(vec3(.72,.71,.68),a);}`}/></points></>;
}

