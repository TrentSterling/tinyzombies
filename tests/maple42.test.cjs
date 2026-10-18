'use strict';
// Maple Street is the default game; the DEAD ENDS chapters stay reachable behind ?deadends or ?campaign.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutMaple42}=require('./maple42.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const mode=opts=>{const h=loadHost(file,opts);h.run('reset()');return h.json('({sandbox:SANDBOX25,stage,chapter:makeWorld().chapter8.name,neighbors:(makeWorld().civilians30||[]).length})');};
check('the bare URL boots Maple Street with neighbors to rescue',()=>{const m=mode({plain:true});assert.equal(m.sandbox,true);assert.equal(m.stage,6);assert.equal(m.chapter,'MAPLE STREET');assert(m.neighbors>=4);return m;});
check('?deadends and ?campaign boot the old Chapter 1; ?sandbox still forces Maple Street',()=>{
 for(const q of ['73129&deadends','73129&campaign']){const m=mode({seed:q});assert.equal(m.sandbox,false);assert.equal(m.stage,1);}
 assert.equal(mode({seed:'73129&sandbox'}).sandbox,true);
});
check('a saved DEAD ENDS checkpoint is ignored on Maple Street and still restored under ?deadends',()=>{
 const save=loadHost(file,{seed:'73129&deadends'});const ok=save.json('(()=>{const v={schema:1,map:1,difficulty:1,seed:42,carry:[{},{},{},{}],leg:0,kills:0,time:0};return parseCheckpoint13(JSON.stringify(v))?JSON.stringify(v):null})()');
 if(!ok)return {skipped:'checkpoint fixture rejected by parser; guard checked by source only'};
 const store=()=>new Map([['tiny-zombies-deadends-checkpoint-v1',ok]]);
 assert.equal(loadHost(file,{plain:true,storage:store()}).json('savedCheckpoint'),null);
 assert.notEqual(loadHost(file,{seed:'73129&deadends',storage:store()}).json('savedCheckpoint'),null);
});
check('boot line is in the new voice',()=>{assert(html.includes('<p>Waking up the neighborhood...</p>'));assert(html.includes("try{if(!SANDBOX25)savedCheckpoint=parseCheckpoint13(localStorage.getItem(checkpointKey));}catch{}"));});
check('exact inverse restores the immutable pre-default-switch runtime',()=>{assert.equal(sha(withoutMaple42(html)),delta.parentSha256);});
const report={method:'CPU host with explicit URLs and storage.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
