import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { AdditiveBlending, BackSide, Group, Mesh, SRGBColorSpace } from 'three';
const vertex = `varying vec2 vUv; varying vec3 vNormal; void main(){vUv=uv; vNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment = `uniform sampler2D dayMap; uniform sampler2D nightMap; varying vec2 vUv; varying vec3 vNormal; void main(){float sunlight=dot(normalize(vNormal),normalize(vec3(10.,5.,8.))); float day=smoothstep(-.12,.2,sunlight); vec3 albedo=texture2D(dayMap,vUv).rgb; vec3 night=texture2D(nightMap,vUv).rgb; vec3 color=albedo*(.025+max(sunlight,0.)*1.15)+night*(1.-day)*.8; gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>\n #include <colorspace_fragment> }`;
export function RealisticEarth({ rotate = false, reduced = false }: { rotate?: boolean; reduced?: boolean }) {
 const earth = useRef<Group>(null), clouds = useRef<Mesh>(null);
 const [day, night, cloud, bump] = useTexture(['/textures/earth/earth-daymap-4k.jpg','/textures/earth/earth-nightmap-4k.jpg','/textures/earth/earth-clouds-4k.jpg','/textures/earth/earth-bump-4k.jpg'], textures => { const maps=Array.isArray(textures)?textures:[textures]; maps.slice(0,2).forEach(texture=>{texture.colorSpace=SRGBColorSpace;}); });
 const uniforms = useMemo(() => ({ dayMap: { value:day }, nightMap: { value:night } }), [day,night]);
 useFrame((_,delta) => { if (rotate && !reduced && earth.current) earth.current.rotation.y += delta*.025; if (!reduced && clouds.current) clouds.current.rotation.y += delta*.009; });
 return <group ref={earth} rotation={[0,-.45,0]}><mesh><sphereGeometry args={[6.371,96,64]}/><shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms}/></mesh><mesh ref={clouds}><sphereGeometry args={[6.395,72,48]}/><meshStandardMaterial alphaMap={cloud} bumpMap={bump} bumpScale={.008} color="white" transparent opacity={.48} depthWrite={false}/></mesh><mesh><sphereGeometry args={[6.47,64,48]}/><shaderMaterial side={BackSide} transparent depthWrite={false} blending={AdditiveBlending} vertexShader={`varying vec3 n;varying vec3 p;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);p=mv.xyz;gl_Position=projectionMatrix*mv;}`} fragmentShader={`varying vec3 n;varying vec3 p;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(-p))),3.);gl_FragColor=vec4(.45,.62,.72,rim*.18);}`}/></mesh></group>;
}
export function Satellites({ reduced = false }: { reduced?: boolean }) {
 const groups = useRef<(Group | null)[]>([]);
 useFrame(({clock}) => groups.current.forEach((group,i) => { if(group) { const t = (reduced ? 0 : clock.elapsedTime*.06/(1+i*.2))+i*1.6; const r=8+i*.28; group.position.set(Math.cos(t)*r,Math.sin(t)*r*.45,Math.sin(t)*r);group.rotation.y=-t; } }));
 return <>{[0,1,2,3].map(i => <group key={i} scale={1.8} ref={g => {groups.current[i]=g;}}><mesh><boxGeometry args={[.14,.18,.14]}/><meshStandardMaterial color="#ded6c6" metalness={.8} roughness={.4}/></mesh>{[-1,1].map(side => <mesh key={side} position={[side*.24,0,0]}><boxGeometry args={[.32,.14,.018]}/><meshStandardMaterial color="#23394b" metalness={.3} roughness={.6}/></mesh>)}<mesh position={[0,.17,0]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.09,.09,12]}/><meshStandardMaterial color="#c4beb0"/></mesh></group>)}</>;
}
