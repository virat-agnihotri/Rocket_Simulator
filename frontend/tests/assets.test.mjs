import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
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
test('hangar preserves original identifiers, local thumbnails and visual-only physics metadata',()=>{
 const original=['saturn-v','ares-a','ares-b','atlas-6','atlas-7','atlas-9','redstone','jupiter-c','sls-block-1','shuttle-a','shuttle-b','shuttle-c','shuttle-d','solid-booster'];
 for(const id of original) assert.ok(assets.some(a=>a.id===id),`Missing original vehicle ${id}`);
 for(const asset of assets){
  assert.equal(asset.simulationConfig,null,`${asset.name}: no verified preset exists`);
  assert.ok(asset.presentationHeight>0 && asset.scaleCorrection>0);
  assert.ok(Number.isFinite(asset.verticalOffset));
  assert.ok(asset.license && asset.attribution && asset.licenseUrl);
  assert.ok(asset.thumbnail && fs.existsSync(path.join(root,'public',asset.thumbnail)),`${asset.name}: missing thumbnail`);
 }
});
test('Starship retains its embedded creator license, distributed credit, and licensed source bytes',()=>{
 const asset=assets.find(a=>a.id==='starship-s24-b7');
 assert.ok(asset);
 assert.equal(asset.permissionClassification,'Requires attribution or additional conditions');
 assert.equal(asset.creator,'clarence365');
 assert.equal(asset.licenseUrl,'https://creativecommons.org/licenses/by/4.0/');
 const bytes=fs.readFileSync(path.join(root,'public',asset.url));
 const document=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 assert.equal(document.asset.extras.source,asset.sourceUrl);
 assert.match(document.asset.extras.license,/CC-BY-4\.0/);
 assert.match(document.asset.extras.author,/clarence365/i);
 const audit=JSON.parse(fs.readFileSync(path.join(root,'../docs/model-permissions-audit.json'),'utf8'));
 const record=audit.models.find(a=>a.source===asset.source);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sourceSha256);
 assert.equal(record.servedSha256,record.sourceSha256);
 const notice=fs.readFileSync(path.join(root,'../THIRD_PARTY_NOTICES.md'),'utf8');
 assert.equal(fs.readFileSync(path.join(root,'public/THIRD_PARTY_NOTICES.md'),'utf8'),notice);
 assert.ok(notice.includes(asset.attribution.split(' by ')[0]));
 assert.ok(notice.includes(asset.sourceUrl));
 assert.ok(notice.includes(asset.licenseUrl));
 assert.match(fs.readFileSync(path.join(root,'public/models/rockets/starship-s24-b7/ATTRIBUTION.md'),'utf8'),/clarence365/);
 for(const original of assets.filter(a=>a.id!==asset.id)) assert.equal(original.licenseUrl,'https://www.nasa.gov/nasa-brand-center/images-and-media/');
 const publicFiles=fs.readdirSync(path.join(root,'public/models'),{recursive:true}).map(String);
 for(const excluded of ['mechazilla.glb','booster2.glb','ship2.glb','launchtower.glb']) assert.ok(!publicFiles.some(p=>path.basename(p)===excluded),`${excluded} remains excluded`);
});
