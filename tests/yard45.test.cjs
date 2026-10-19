'use strict';
// Style pass 3: ZAMN yards on Maple Street. Hedges (mat 6) and picket fences (mat 7) are breakable voxels, houses get pastel siding
// (mats 8-10), and backyard pools are drawn on the ground through the floors42 list (+16 size flag).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutYard45}=require('./yard45.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),parent=path.join(__dirname,'.yard45-parent.html');fs.writeFileSync(parent,withoutYard45(html));
const h=loadHost(file);
const W=(f,seed)=>loadHost(f,{seed}).json('(()=>{const w=makeWorld();const m={};for(let i=4;i<w.count*8;i+=8)m[w.blocks[i]]=(m[w.blocks[i]]||0)+1;let g=0;for(let i=7;i<w.blocks.length;i+=8)if(w.blocks[i]>g)g=w.blocks[i];return {b:w.buildings,civ:(w.civilians30||[]).map(c=>[c.slot,c.outfit]),start:w.start,caches:w.caches,pools:w.pools45||[],m,g,count:w.count}})()');
check('street layout is unchanged: same houses, neighbors, start and caches as before the yards',()=>{
 for(const s of ['4242&sandbox','73129&sandbox','99&sandbox']){const a=W(file,s),b=W(parent,s);assert.deepEqual(a.b,b.b,s+' houses');assert.deepEqual(a.civ.slice(0,8),b.civ,s+' neighbors');assert.deepEqual(a.caches,b.caches,s+' caches');}
});
check('yards appear on every street within the voxel and support-group budgets',()=>{
 const out={};for(const s of ['4242&sandbox','73129&sandbox','99&sandbox']){const a=W(file,s);assert(a.m[6]>2000&&a.m[7]>1000,s+' hedges and pickets');assert(a.pools.length>=8,s+' pools');assert((a.m[8]||0)+(a.m[9]||0)+(a.m[10]||0)>5000,s+' siding');
  assert(a.g<h.json('MAX_GROUPS')*.8,'groups '+a.g);assert(a.count<h.json('MAX_WORLD')*.8,'voxels '+a.count);out[s]={pools:a.pools.length,hedge:a.m[6],picket:a.m[7],groups:a.g};}return out;
});
check('the chapters build exactly the same world as before',()=>{const a=W(file,73129),b=W(parent,73129);assert.equal(a.count,b.count);assert.deepEqual(a.m,b.m);assert.deepEqual(a.pools,[]);});
check('pools pack with the +16 flag, decode exactly, and never share a size with a house',()=>{
 const st=loadHost(file,{seed:'4242&sandbox'}).json('(()=>{const st=new Float32Array(4096);const w=makeWorld();const n=packFloors42(st,w.buildings,w.pools45);return {n,f:Array.from(st.subarray(3980)),b:w.buildings,p:w.pools45}})()');
 const dec=[];for(let k=0;k<29;k++){const f=st.f.slice(k*4,k*4+4);if(f[0]===0)break;for(const j of [0,1]){const a=f[j*2],b=f[j*2+1];if(a===0)continue;const x0=Math.floor(a/32)-96,z0=Math.floor(b/32)-96;let w=a-(x0+96)*32,d=b-(z0+96)*32;const pool=w>=16;if(pool){w-=16;d-=16;}dec.push([pool,x0,z0,w,d]);}}
 const want=[...st.b.filter(b=>b.w<16&&b.d<16).map(b=>[false,b.x,b.z,b.w,b.d]),...st.p.map(p=>[true,p.x,p.z,p.w,p.d])].slice(0,58);assert.deepEqual(dec,want);return {packed:st.n};
});
check('new materials have HP, face colours and debris colours',()=>{
 assert(html.includes('const materialHP=[4,1,4,3,7,8,2,1,1,1,1];\n for(const [key,[x,y,z,mat,g]]of cells){let addr=occAddress(x,y,z,occ),hp=materialHP[mat];'));
 for(const m of [6,7,8,9,10]){assert(html.includes(`if(mat==${m}u){`),'face '+m);assert(html.includes(`if(m==${m}.0){return`),'debris '+m);}
});
check('no yard seals a house: across 16 streets every house reachable before the yards is still reachable',()=>{
 const reach=(f,seed)=>{const x=loadHost(f,{seed});x.run('reset()');return x.json('(()=>{const nav=world.occ.subarray(NAV_OFFSET,NAV_OFFSET+NAV_SIZE);return world.buildings.map(b=>nav[Math.floor(b.x+b.w/2+96)+NG*Math.floor(b.z+b.d/2+96)]<0x3fffffff)})()');};
 let houses=0;for(let s=1;s<=16;s++){const seed=(s*7919)+'&sandbox',a=reach(file,seed),b=reach(parent,seed);b.forEach((ok,i)=>{if(ok){houses++;assert(a[i],'seed '+seed+' house '+i);}});}return {housesChecked:houses};
});
check('exact inverse restores the immutable pre-yards runtime',()=>{assert.equal(sha(withoutYard45(html)),delta.parentSha256);});
fs.unlinkSync(parent);
const report={method:'World builder in the CPU host, compared with the exact pre-yards runtime; frames rendered on SwiftShader for the PR.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
