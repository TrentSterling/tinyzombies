'use strict';
// First rescue next door: the home closest to the start always holds neighbor 0; the other homes keep their shuffled order.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutFirst83}=require('./first83.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('neighbor 0 lives in the nearest home: within 5 m of the nearest neighbor and under 50 m',()=>{const parent=withoutFirst83(html),tmp=path.join(require('node:os').tmpdir(),'tz-first83-parent.html');fs.writeFileSync(tmp,parent);const out={};
 for(const s of ['4242&sandbox','73129&sandbox','99&sandbox']){const a=loadHost(file,{seed:s}),b=loadHost(tmp,{seed:s});a.run('reset()');b.run('reset()');
  const d=h=>{const st=h.json('world.start');return h.json('world.civilians30').map(c=>Math.hypot(c.x-st[0],c.z-st[1]));};const da=d(a),db=d(b);
  assert.equal(da.length,db.length);assert(da[0]<=Math.min(...da)+5);assert(da[0]<=Math.min(...db)+5&&da[0]<50,s+': '+da[0]+' vs '+Math.min(...db));out[s]=[+da[0].toFixed(1),+Math.min(...db).toFixed(1)];}return out;});
check('exact inverse restores the immutable pre-first-rescue runtime',()=>{assert.equal(sha(withoutFirst83(html)),delta.parentSha256);});
const report={method:'CPU-host worlds against the exact parent; robot playtest heatmaps motivated the change (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
