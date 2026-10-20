'use strict';
// Twelve neighbors on Maple Street (every reserved slot): the first eight keep their homes, types and names; four more follow.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutSurvivors72}=require('./survivors72.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('up to twelve, first eight unchanged (before the first-rescue swap)',()=>{const parent=withoutSurvivors72(html),tmp=path.join(require('node:os').tmpdir(),'tz-survivors72-parent.html');fs.writeFileSync(tmp,parent);const cur=path.join(require('node:os').tmpdir(),'tz-survivors72-cur.html');fs.writeFileSync(cur,require('./first83.cjs').withoutFirst83(html));const out={};
 for(const s of ['4242&sandbox','73129&sandbox','99&sandbox']){const a=loadHost(cur,{seed:s}),b=loadHost(tmp,{seed:s});a.run('reset()');b.run('reset()');const ca=a.json('world.civilians30'),cb=b.json('world.civilians30');
  assert(ca.length>cb.length&&ca.length<=12);assert.deepEqual(ca.slice(0,cb.length),cb);out[s]=ca.length;}return out;});
check('unique names for the four new indoor neighbors',()=>{assert(html.includes("'Kimberly','Gary','Dolores','Chad','Aunt Pat'][outfit]"));assert(html.includes('type=[0,2,1,3,4,5,2,4,0,1,3,0][outfit];'));});
check('exact inverse restores the immutable pre-survivor runtime',()=>{assert.equal(sha(withoutSurvivors72(html)),delta.parentSha256);});
const report={method:'CPU-host worlds against the exact parent; the real game shows 12 neighbors waiting (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
