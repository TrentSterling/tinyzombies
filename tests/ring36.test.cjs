'use strict';
// Behaviour pass 4: a ring of six remembered noises replaces the single noise slot for hearing, awareness and the heard lane.
// Source fragments, the State layout, and a JS mirror of hearRing34/ringHeard34; GPU runs are in the PR notes (SwiftShader).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutRing36}=require('./ring36.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),h=loadHost(file),src=h.sources;
function stateLayout(){
 const structs={};for(const m of html.matchAll(/struct (\w+) \{([^}]*)\}/g))if(!structs[m[1]])structs[m[1]]=m[2];
 const fields=b=>{const f=[];let d=0,cur='';for(const c of b){if(c==='<')d++;if(c==='>')d--;if(c===','&&d===0){f.push(cur.trim());cur='';}else cur+=c;}f.push(cur.trim());return f.filter(Boolean).map(x=>{const i=x.indexOf(':');return [x.slice(0,i).trim(),x.slice(i+1).trim()];});};
 const sz=t=>{const a=t.match(/^array<(.+),\s*(\d+)u?>$/);if(a){const e=sz(a[1]);return [Math.ceil(e[0]/e[1])*e[1]*+a[2],e[1]];}if(/^vec4/.test(t))return [16,16];if(/^mat4/.test(t))return [64,16];if(/^vec3/.test(t))return [12,16];if(/^vec2/.test(t))return [8,8];if(/^(f32|u32|i32)$/.test(t))return [4,4];if(structs[t]){const l=layout(t);return [l.size,l.al];}throw new Error(t);};
 const layout=n=>{let off=0,al=4;const offs={};for(const [k,t] of fields(structs[n])){const [b,a]=sz(t);off=Math.ceil(off/a)*a;offs[k]=off/4;off+=b;al=Math.max(al,a);}return {size:Math.ceil(off/al)*al,al,offs};};
 return layout('State');
}
// JS mirror of the WGSL, statement for statement.
function hearRing(R,seen,noise,dt){const n=noise.slice();
 if(n[2]>0&&n.some((v,i)=>v!==seen[i])){let slot=6,weakest=0;for(let k=0;k<6;k++){const r=R[k];if(slot===6&&r[2]>0&&Math.hypot(r[0]-n[0],r[1]-n[1])<4)slot=k;if(r[2]<R[weakest][2])weakest=k;}
  if(slot<6){const r=R[slot];R[slot]=[n[0],n[1],Math.max(r[2],n[2]),Math.max(r[3],n[3])];}else R[weakest]=n;}
 for(const r of R)r[2]=Math.fround(Math.max(0,r[2]-dt));return [n[0],n[1],Math.fround(Math.max(0,n[2]-dt)),n[3]];}
const heardBy=(R,p)=>{let best=6,bd=1e9;R.forEach((r,k)=>{const d=Math.hypot(p[0]-r[0],p[1]-r[1]);if(r[2]>0&&d<r[3]&&d<bd){bd=d;best=k;}});return best;};

check('ring lives after the neighbor mirror, inside the 16 KiB state buffer, and the civ mirror offset is unchanged',()=>{
 const L=stateLayout();assert.equal(L.offs.noise,h.json('L7.noise'));assert.equal(L.offs.civ34,h.json('CIV_STATE30'));assert.equal(L.offs.noiseRing34,3952);assert.equal(L.offs.noiseSeen34,3976);assert(L.size<=16384,'fits: '+L.size);
 return {noiseRing34:L.offs.noiseRing34,stateBytes:L.size};
});
check('every hearing site reads the ring: awareness, the heard goal and the heard-lane seeds',()=>{
 const z=src.zombies,n=src.navInit,m=src.mission5;
 assert(!/S\.noise(?!Ring34)/.test(z),'zombie pass no longer reads the single slot');assert(z.includes('let ring34=ringHeard34(z.p.xz);'));assert(z.includes('if(ring34<6u&&distance>14.0){goalPoint=S.noiseRing34[ring34].xy;heard=true;}'));
 assert(!/S\.noise(?!Ring34)/.test(n),'nav seeds no longer read the single slot');assert(n.includes('for(var k=0u;k<6u;k++){let r=S.noiseRing34[k];if(r.z>0.0&&navcell(r.xy)==i){heard=0u;}}'));
 assert(m.includes('hearRing34(dt);let broke30=atomicExchange(&C[45],0u);'),'archived once per frame before break noise');
 assert(m.includes('S.noise.z=max(0.0,S.noise.z-dt);'),'the slot still decays exactly as hearRing34 expects');
});
check('a new noise takes a slot, a repeat within 4 m merges, and an older noise elsewhere survives a newer one',()=>{
 const R=Array.from({length:6},()=>[0,0,0,0]);let seen=[0,0,0,0],noise=[10,10,3,20];const dt=Math.fround(1/60);
 seen=hearRing(R,seen,noise,dt);noise[2]=seen[2];assert.equal(R.filter(r=>r[2]>0).length,1);
 for(let f=0;f<20;f++){seen=hearRing(R,seen,noise,dt);noise[2]=seen[2];}assert.equal(R.filter(r=>r[2]>0).length,1,'unchanged slot is not re-added');
 noise=[12,11,3,30];seen=hearRing(R,seen,noise,dt);noise[2]=seen[2];assert.equal(R.filter(r=>r[2]>0).length,1,'merged');assert.equal(R.find(r=>r[2]>0)[3],30);
 noise=[60,-20,3,9];seen=hearRing(R,seen,noise,dt);noise[2]=seen[2];assert.equal(R.filter(r=>r[2]>0).length,2);
 assert.equal(heardBy(R,[15,15]),R.findIndex(r=>r[0]===12),'zombie near the first noise still hears it after the second');
 for(let f=0;f<200;f++){seen=hearRing(R,seen,noise,dt);noise[2]=seen[2];}assert.equal(heardBy(R,[15,15]),6,'expires with its timer');
});
check('a seventh noise replaces the one with the least time left',()=>{
 const R=Array.from({length:6},()=>[0,0,0,0]);let seen=[0,0,0,0];const dt=1/60;
 for(let k=0;k<6;k++)seen=hearRing(R,seen,[k*10,0,1+k*.2,10],dt);const weakest=R.reduce((b,r,i)=>r[2]<R[b][2]?i:b,0);
 seen=hearRing(R,seen,[0,90,3,10],dt);assert.deepEqual(R[weakest].slice(0,2),[0,90]);
});
check('breaking things elsewhere can replace an older slot noise; louder-or-same-place rule unchanged nearby',()=>{
 assert(src.mission5.includes('if(S.noise.z<=0.0||loud>=S.noise.w*.8||distance(at,S.noise.xy)>8.0){S.noise=vec4f(at,3.0,loud);}'));
});
check('exact inverse restores the immutable pre-noise-ring runtime',()=>{assert.equal(sha(withoutRing36(html)),delta.parentSha256);});
const report={method:'Source fragments, State layout arithmetic and a JS mirror of the ring; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
