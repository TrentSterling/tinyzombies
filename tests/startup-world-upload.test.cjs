const {test}=require('node:test'),assert=require('node:assert/strict'),{readFileSync}=require('node:fs'),{resolve}=require('node:path'),{createHash}=require('node:crypto'),vm=require('node:vm');

const input=process.argv[2]||resolve(__dirname,'../index.html');
const html=readFileSync(input,'utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
const end=js.lastIndexOf('if(NET_JOIN65)joinOnline65(');
assert.ok(end>0);
const marker="await startup93.run('buffers',";
const start=js.indexOf('()=>{',js.indexOf(marker))+5;
const allocation=js.slice(start,js.indexOf("\n });",start));
assert.ok(allocation.includes("fontBuffer=storage"));
const worldNames=['voxel occupancy','destructible blocks','interactive props','authored structural supports and damage flags','bounded wake-on-break wreckage'];
const worldUploadBytes=20_608_064;
const gpuProxy=new Proxy(()=>gpuProxy,{get:(_,k)=>k===Symbol.toPrimitive?()=>0:gpuProxy});

function exercise(search){
 const writes=[],stages=[],allocations=[],latest=new Map();
 let fractureBuilds=0;
 const deviceStub={
  createBuffer({label,size,usage}){const b={label,size,usage};allocations.push(b);return b;},
  createCommandEncoder({label}){return {clearBuffer(){},beginComputePass({label}){stages.push({label,world:worldNames.map(k=>latest.get(k))});return gpuProxy;},finish(){return label;}};},
  queue:{
   writeBuffer(b,offset,data){assert.ok(b&&offset+data.byteLength<=b.size);const digest=createHash('sha256').update(new Uint8Array(data.buffer,data.byteOffset,data.byteLength)).digest('hex');
    const row={label:b.label,offset,bytes:data.byteLength,digest};writes.push(row);if(offset===0)latest.set(b.label,row);},
   submit([label]){stages.push({submit:label});},
  },
 };
 const c=vm.createContext({console,URLSearchParams,location:{search},window:{addEventListener(){}},document:gpuProxy,performance,atob,btoa,navigator:{},addEventListener(){},
  GPUBufferUsage:{STORAGE:1,COPY_DST:2,COPY_SRC:4,UNIFORM:8,INDIRECT:16,VERTEX:32,MAP_READ:64,QUERY_RESOLVE:128},deviceStub,onFracture:()=>fractureBuilds++});
 const run=s=>vm.runInContext(s,c);
 run(js.slice(0,end)+`
  const originalFracture=fractureData8;fractureData8=w=>{onFracture();return originalFracture(w);};
  world=makeWorld();device=deviceStub;
  const features=[];${allocation}
 `);
 const before={writes:writes.splice(0),fractureBuilds};
 // Render/UI/DOM are not under test. Reset uses the real world pack, state population and command ordering.
 run('updateUniforms=()=>{};resetAudio9=()=>{};reset()');
 const first={writes:writes.splice(0),stages:stages.splice(0),fractureBuilds};
 run('reset()');
 const same={writes:writes.splice(0),stages:stages.splice(0),fractureBuilds};
 run('runSeed++;world=makeWorld();reset()');
 const reseed={writes:writes.splice(0),stages:stages.splice(0),fractureBuilds};
 return {before,first,same,reseed,allocations};
}

if (process.env.TINY_UPLOAD_SNAPSHOT==='1') {
 for(const search of ['?seed=73129','?deadends&seed=73129'])process.stdout.write(JSON.stringify(exercise(search))+'\n');
} else {
 for(const [name,search] of [['Maple','?seed=73129'],['DEAD ENDS','?deadends&seed=73129']])test(name+' uploads each world buffer once before compute; reset and reseed still upload',()=>{
 const {before,first,same,reseed}=exercise(search);
 const worldOnly=step=>step.writes.filter(w=>worldNames.includes(w.label)&&w.offset===0);
 assert.equal(before.writes.some(w=>w.label==='SDF glyph distance atlas'),true);
 assert.deepEqual(worldOnly(before),[]);assert.equal(before.fractureBuilds,0);
 for(const [i,step] of [first,same,reseed].entries()){
   const payload=worldOnly(step);assert.equal(step.fractureBuilds,i+1);
   assert.equal(payload.length,5);assert.equal(payload.reduce((sum,w)=>sum+w.bytes,0),worldUploadBytes);
   const byLabel=new Map(payload.map(w=>[w.label,w]));
   const compute=step.stages.filter(x=>x.world);
   assert.ok(compute.length);
   for(const s of compute)assert.deepEqual(s.world,worldNames.map(k=>byLabel.get(k)));
   assert.equal(step.stages.at(-1).submit,'reset seeded compound');
 }
 assert.deepEqual(first,{...same,fractureBuilds:1});
 if(name==='Maple')assert.notDeepEqual(worldOnly(first),worldOnly(reseed));
 });
}
