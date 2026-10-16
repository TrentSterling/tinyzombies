'use strict';
// Focused host-state checks; WebGPU is forbidden by the shared VM host.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadHost,sha}=require('./cpu_game_host.cjs');
const baseline=process.argv[2],candidate=process.argv[3]||path.join(__dirname,'../index.html'),output=process.argv[4];
if(!baseline)throw Error('Usage: node tools/check_checkpoint_lifecycle.cjs baseline.html [candidate.html] [report.json]');
const key='tiny-zombies-v5-checkpoint',checkpoint={version:5,stage:3,seed:88967,mods:[2,3,1,1,1,0,1,1],upgrades:[1,1,0]},raw=JSON.stringify(checkpoint);
const storage=()=>new Map([[key,raw],['unrelated-save','keep']]);
const same=(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
const cases=[];
function check(name,fn){const detail=fn()||{};cases.push({name,passed:true,...detail});}
function clear(h){const m=h.meta();assert.equal(m.stage,1);assert.equal(m.savedCheckpoint,null);same(m.carryMods,new Array(8).fill(0));same(m.upgrades,[0,0,0]);assert(!h.values.has(key));assert.equal(h.values.get('unrelated-save'),'keep');assert.equal(m.advanceRequested,0);}
function resume(file,values=storage()){const h=loadHost(file,{storage:values});h.key('Enter');h.advanceFrameHost();return h;}
function pointer(h){h.run("canvas.addEventListener=(name,fn)=>{if(name==='pointerdown')globalThis.__testPointer=fn};bindInput();__testPointer({preventDefault(){},clientX:640,clientY:360,button:0});");}
const old=loadHost(baseline),now=loadHost(candidate);assert.equal(old.sha256,'42d7d28e07ed2a80d64d274b374f7effbbce06c36da390af42cf88bd0e19f20f');
same(old.sources,now.sources);
const touched=line=>line.startsWith('function clearCheckpoint()')||line.includes("canvas.addEventListener('pointerdown'")||line.includes("case 'KeyN':")||line.includes("case 'Digit1':case 'Digit2':case 'Digit3':")||line.includes('if(seedRequested||advanceRequested){');
assert.equal(old.html.split('\n').filter(l=>!touched(l)).join('\n'),now.html.split('\n').filter(l=>!touched(l)).join('\n'),'Only checkpoint lifecycle and stale-input guard lines may change');
const repro=resume(baseline);repro.run('playerValues[67]=1');repro.key('KeyN');repro.advanceFrameHost();assert.equal(repro.meta().stage,1);assert.equal(repro.meta().savedCheckpoint.stage,3);const oldReload=resume(baseline,new Map(repro.values));assert.equal(oldReload.meta().stage,3);
const oldRace=resume(baseline);oldRace.run('playerValues[67]=1');oldRace.key('Digit1');oldRace.key('KeyN');oldRace.advanceFrameHost();assert.equal(oldRace.meta().stage,2);
const reproduced={staleCheckpointAfterN:true,reloadContinuesOldLeg:oldReload.meta().stage,queuedChoiceAfterNStartsWrongLeg:oldRace.meta().stage};
for(const [name,state] of Object.entries({title:'settings.started=false;',active:'',paused:'settings.paused=true;',help:'settings.help=true;settings.paused=true;',downed:'playerValues[3]=0;playerValues[L7.player7]=30;',dead:'playerValues[3]=0;playerValues[67]=2;',chooser:'playerValues[464]=1;',legWin:'playerValues[67]=1;stage=2;',finalWin:'playerValues[67]=1;'})){
 check('new-campaign-'+name,()=>{const h=resume(candidate);h.run(state);const seed=h.meta().runSeed;h.key('KeyN');clear(h);assert.equal(h.meta().runSeed,(seed+104729)>>>0);h.advanceFrameHost();clear(h);assert.equal(h.state()[3],100);const reloaded=loadHost(candidate,{storage:new Map(h.values)});assert.equal(reloaded.meta().savedCheckpoint,null);reloaded.key('Enter');assert.equal(reloaded.meta().stage,1);assert.equal(reloaded.meta().seedRequested,false);});
}
check('interrupted-before-reset-frame',()=>{const h=resume(candidate);h.key('KeyN');clear(h);const reload=loadHost(candidate,{storage:new Map(h.values)});assert.equal(reload.meta().savedCheckpoint,null);reload.key('Enter');assert.equal(reload.meta().stage,1);});
for(const order of ['choice-then-N','N-then-choice','N-then-pointer','Enter-N-Enter','N-Backspace','N-repeat'])check('input-order-'+order,()=>{
 const h=resume(candidate);h.run('playerValues[67]=1;');
 if(order==='choice-then-N')h.key('Digit2');
 h.key('KeyN');
 if(order==='N-then-choice')h.key('Digit2');
 if(order==='N-then-pointer')pointer(h);
 if(order==='Enter-N-Enter')h.key('Enter');
 if(order==='N-Backspace')h.key('Backspace');
 if(order==='N-repeat'){h.key('KeyN');h.key('KeyN');}
 clear(h);h.advanceFrameHost();clear(h);assert.equal(h.state()[3],100);
});
for(const seed of [0,73129,4294967295])check('repeated-N-seed-'+seed,()=>{const h=loadHost(candidate,{seed,storage:storage()});for(let i=1;i<=5;i++){h.key('KeyN');clear(h);assert.equal(h.meta().runSeed,(seed+i*104729)>>>0);}h.advanceFrameHost();clear(h);});
for(const stage of [2,3])check('continue-retry-preserved-leg-'+stage,()=>{
 const cp={...checkpoint,stage},values=new Map([[key,JSON.stringify(cp)]]),before=values.get(key),h=resume(candidate,values);assert.equal(h.meta().stage,stage);same(h.meta().carryMods,cp.mods);same(h.meta().upgrades,cp.upgrades);const initial=Buffer.from(h.state().buffer);assert.equal(values.get(key),before);
 h.run('playerValues[3]=0;playerValues[67]=2;pendingDash=1;pendingGrenade=1;');h.key('Backspace');h.advanceFrameHost();assert(Buffer.from(h.state().buffer).equals(initial));assert.equal(values.get(key),before);assert.equal(h.meta().savedCheckpoint.stage,stage);
 const reload=resume(candidate,new Map(values));assert.equal(reload.meta().stage,stage);assert.equal(reload.meta().runSeed,cp.seed);same(reload.meta().carryMods,cp.mods);
});
check('leg-transitions-and-final-completion',()=>{
 const h=loadHost(candidate,{storage:new Map([['unrelated-save','keep']])});h.run('world=makeWorld();reset();');let seed=73129;
 for(const stage of [2,3]){h.run('playerValues[67]=1;playerValues.set([1,2,0,1,0,0,1,0],432);');h.key('Digit2');h.advanceFrameHost();seed=(seed+7919)>>>0;assert.equal(h.meta().stage,stage);const cp=JSON.parse(h.values.get(key));assert.equal(cp.stage,stage);assert.equal(cp.seed,seed);assert.equal(cp.upgrades[1],stage-1);const reload=resume(candidate,new Map(h.values));assert.equal(reload.meta().stage,stage);}
 h.run('playerValues[67]=1');const wonSave=h.values.get(key);assert(wonSave);h.key('Backspace');h.advanceFrameHost();assert.equal(h.values.get(key),wonSave);assert.equal(h.meta().stage,3);
 h.run('playerValues[67]=1');h.key('Digit1');h.advanceFrameHost();clear(h);assert.equal(h.meta().runSeed,(seed+7919)>>>0);
});
check('interrupted-pending-leg-advance-keeps-last-checkpoint',()=>{const cp=JSON.stringify({...checkpoint,stage:2}),h=resume(candidate,new Map([[key,cp]]));h.run('playerValues[67]=1;');h.key('Digit1');assert.equal(h.values.get(key),cp);const reload=resume(candidate,new Map(h.values));assert.equal(reload.meta().stage,2);});
check('storage-remove-failure-clears-memory-and-reports',()=>{const h=resume(candidate);h.run("localStorage.removeItem=()=>{throw Error('test storage denied')}");h.key('KeyN');assert.equal(h.meta().savedCheckpoint,null);assert.equal(h.meta().stage,1);assert.equal(h.values.get(key),raw);assert(h.meta().notes.some(n=>n.includes('Checkpoint reset storage unavailable')));h.key('Enter');assert.equal(h.meta().stage,1);return{durableDeletion:'Unavailable when storage rejects deletion; existing stored value remains, warning recorded'};});
check('final-advance-storage-failure-clears-memory',()=>{const h=resume(candidate);h.run("localStorage.removeItem=()=>{throw Error('test storage denied')};playerValues[67]=1;");h.key('Digit1');h.advanceFrameHost();assert.equal(h.meta().stage,1);assert.equal(h.meta().savedCheckpoint,null);assert(h.meta().notes.length>0);});
for(const mode of ['practice','lab'])check(mode+'-preserves-existing-save-until-explicit-N',()=>{const h=resume(candidate);h.run('settings.'+mode+'=true;stage=1;playerValues[67]=1');h.key('Digit1');h.advanceFrameHost();assert.equal(h.values.get(key),raw);h.key('KeyN');clear(h);});
check('malformed-save-parser-unchanged',()=>{for(const value of ['{','null',JSON.stringify({...checkpoint,version:4}),JSON.stringify({...checkpoint,stage:1})]){const h=loadHost(candidate,{storage:new Map([[key,value]])});assert.equal(h.meta().savedCheckpoint,null);h.key('Enter');assert.equal(h.meta().seedRequested,false);assert.equal(h.values.get(key),value);}});
const assets=JSON.parse(now.html.match(/const audioBankAssets9=(.*);\n/)[1]);assert.equal(Object.keys(assets).length,43);for(const [id,a]of Object.entries(assets)){const b=fs.readFileSync(path.join(__dirname,'../assets/audio',id+'.flac'));assert.equal(sha(b),a.hash);assert.equal(b.length,a.bytes);}
const report={method:'Exact host parser, keyboard/pointer handlers and frame transition/reset blocks in a Node VM. GPU is forbidden; win/death states are explicit readback fixtures. Browser results are separate.',baselineSha256:old.sha256,candidateSha256:now.sha256,reproduced,allShaderModulesExact:true,hostOutsideAllowedLinesExact:true,audioClipsUnchanged:43,cases,passed:true,completedUtc:new Date().toISOString()};if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:cases.length,reproduced,candidateSha256:now.sha256},null,2));
