import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import draco from 'draco3d';
const root = path.resolve(import.meta.dirname,'..');
const registryText=fs.readFileSync(path.join(root,'src/assets/rocketRegistry.ts'),'utf8');
const assets=JSON.parse(registryText.split(' = ')[1].split(' as const;')[0]);
const decoderModule=await draco.createDecoderModule({});
test('all registry assets exist; GLB dependencies are embedded and Draco geometry decodes',()=>{
 assert.equal(new Set(assets.map(a=>a.id)).size,assets.length);
 for(const asset of assets){
  const bytes=fs.readFileSync(path.join(root,'public',asset.url));
  if(asset.format==='stl'){assert.equal(bytes.length,84+bytes.readUInt32LE(80)*50);continue;}
  assert.equal(bytes.readUInt32LE(0),0x46546c67,asset.name);assert.equal(bytes.readUInt32LE(8),bytes.length);
  const jsonLength=bytes.readUInt32LE(12),document=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
  assert.ok(document.meshes.length>0,asset.name);
  for(const resource of [...(document.buffers??[]),...(document.images??[])])assert.ok(!resource.uri || resource.uri.startsWith('data:'),`${asset.name}: external dependency ${resource.uri}`);
  const binaryOffset=20+jsonLength+8;
  for(const mesh of document.meshes)for(const primitive of mesh.primitives){
   const extension=primitive.extensions?.KHR_draco_mesh_compression;if(!extension)continue;
   const view=document.bufferViews[extension.bufferView],data=bytes.subarray(binaryOffset+(view.byteOffset??0),binaryOffset+(view.byteOffset??0)+view.byteLength);
   const buffer=new decoderModule.DecoderBuffer(),decoder=new decoderModule.Decoder(),geometry=new decoderModule.Mesh();
   buffer.Init(new Int8Array(data),data.length);const result=decoder.DecodeBufferToMesh(buffer,geometry);
   assert.ok(result.ok(),`${asset.name}: Draco decode failed`);assert.ok(geometry.num_points()>0);
   decoderModule.destroy(geometry);decoderModule.destroy(decoder);decoderModule.destroy(buffer);
  }
 }
});
test('original SLS print asset remains available alongside its flight presentation copy',()=>{
 const original=fs.readFileSync(path.join(root,'public/models/sls-block-1/sls-block-1.stl'));
 const flight=fs.readFileSync(path.join(root,'public/models/sls-block-1/sls-block-1-flight.stl'));
 assert.ok(flight.length<original.length);assert.ok(flight.readUInt32LE(80)>200000);
});
