import { useMemo, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { getRocket } from '../../../assets/rocketRegistry';
import type { RocketId } from '../../../assets/rocketRegistry';

export function ModelLoading() { return null; }

function normalize(source: Group, height: number, flipVertical = false) {
  const model = source.clone(true);
  model.updateMatrixWorld(true);
  const initial = new Box3().setFromObject(model).getSize(new Vector3());
  // NASA models use several axis conventions. Normalize the longest vehicle axis upward.
  if (initial.z > initial.y && initial.z > initial.x) model.rotation.x += -Math.PI / 2;
  else if (initial.x > initial.y && initial.x > initial.z) model.rotation.z += Math.PI / 2;
  if (flipVertical) model.rotation.z += Math.PI;
  model.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(model), size = bounds.getSize(new Vector3()), center = bounds.getCenter(new Vector3());
  const container = new Group(), scale = height / Math.max(size.y, .001);
  container.scale.setScalar(scale);
  model.position.add(new Vector3(-center.x, -bounds.min.y, -center.z));
  model.traverse(object => { if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true; } });
  container.add(model);
  return container;
}
function GLBAsset({ url, height, onLoaded, flipVertical }: { url: string; height: number; onLoaded?: () => void; flipVertical?: boolean }) {
  const { scene } = useGLTF(url, '/decoders/draco/');
  const model = useMemo(() => normalize(scene, height, flipVertical), [scene, height, flipVertical]);
  useEffect(() => { onLoaded?.(); }, [onLoaded]);
  return <primitive object={model} dispose={null} />;
}
function STLAsset({ url, height, onLoaded, flipVertical }: { url: string; height: number; onLoaded?: () => void; flipVertical?: boolean }) {
  const geometry = useLoader(STLLoader, url);
  const model = useMemo(() => { const group = new Group(); group.add(new Mesh(geometry, new MeshStandardMaterial({ color: '#F1EDE5', roughness: .65 }))); return normalize(group, height, flipVertical); }, [geometry, height, flipVertical]);
  useEffect(() => { onLoaded?.(); }, [onLoaded]);
  useEffect(() => () => model.traverse(object => { if (object instanceof Mesh) (object.material as MeshStandardMaterial).dispose(); }), [model]);
  return <primitive object={model} dispose={null} />;
}
export function RocketAsset({ id, height = 60, onLoaded }: { id: RocketId; height?: number; onLoaded?: () => void }) {
  const asset = getRocket(id);
  return asset.format === 'stl' ? <STLAsset url={asset.url} height={height} onLoaded={onLoaded} flipVertical={asset.flipVertical} /> : <GLBAsset url={asset.url} height={height} onLoaded={onLoaded} flipVertical={asset.flipVertical} />;
}
