'use strict';
// Actual host callback scheduled manually; no GPU execution or fabricated gameplay claim.
const assert=require('node:assert/strict'),path=require('node:path');
const{loadHost}=require('./deadends-cpu-host.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html'),key='tiny-zombies-deadends-checkpoint-v1';
const carry=Array.from({length:4},()=>({hp:80,dead:false,meds:1,bombs:1,molotovs:1,weapon:0,upgrades:0}));
const entry={schema:1,map:1,difficulty:1,leg:1,kills:20,time:100,seed:81048,carry};
const checks=[];let hash;
const test=(name,fn)=>{try{fn();checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.stack});}};
function fixture(savedEntry=entry){
 const h=loadHost(file,{storage:new Map([[key,JSON.stringify(savedEntry)]])});hash=h.sha256;h.run('reset()');h.key('Enter');h.advanceFrameHost();
 h.run(`playerValues[67]=1;playerValues[24]=50;counters[0]=15;saveBoundary13();globalThis.__oldC=counters.slice().buffer;globalThis.__oldS=playerValues.slice().buffer;globalThis.__unmaps=0;globalThis.GPUMapMode={READ:1};sampleBuffer={mapAsync(){return{then(fn){globalThis.__lateSample=fn;return{catch(fn){globalThis.__sampleReject=fn}}}}},getMappedRange(offset){return offset===0?__oldC:__oldS},unmap(){__unmaps++}};readBusy=true;`);
 const line=h.script.split('\n').find(l=>l.trim().startsWith('if(sample){const sampleEpoch16='));assert(line);
 h.run('(()=>{const sample=true,audioSample=false,readEpoch9=audioEpoch9;'+line+'})()');return h;
}
function finish(h){h.run('__lateSample()');assert.equal(h.json('__unmaps'),1);assert.equal(h.json('readBusy'),false);}
function unchanged(h,fn){const before=h.json('({stage,goal:playerValues[67],hp:playerValues[3],kills:counters[0],save:savedCheckpoint,checkpointWritten13})');fn();finish(h);assert.deepEqual(h.json('({stage,goal:playerValues[67],hp:playerValues[3],kills:counters[0],save:savedCheckpoint,checkpointWritten13})'),before);}
test('old Burnout victory cannot save unplayed Last Train after chapter reset',()=>{const h=fixture();h.key('Enter');h.advanceFrameHost();assert.equal(h.json('stage'),3);unchanged(h,()=>{});assert.equal(h.json('savedCheckpoint.map'),2);assert.equal(h.json('playerValues[67]'),0);});
test('pending seed transition discards old victory before reset executes',()=>{const h=fixture();h.key('Enter');assert(h.json('seedRequested'));unchanged(h,()=>{});});
test('pending retry discards old sample before reset executes',()=>{const h=fixture();h.key('Backspace');assert(h.json('resetRequested'));unchanged(h,()=>{});});
test('same-stage retry epoch discards old victory after reset',()=>{const h=fixture();h.key('Backspace');h.advanceFrameHost();unchanged(h,()=>{});assert.equal(h.json('stage'),2);assert.equal(h.json('playerValues[67]'),0);});
test('new campaign epoch discards old completion',()=>{const h=fixture();h.key('KeyN');h.key('KeyN');h.advanceFrameHost();unchanged(h,()=>{});assert.equal(h.json('savedCheckpoint'),null);assert.equal(h.json('stage'),1);});
test('current-generation readback is still consumed and released',()=>{const h=fixture();h.run('playerValues[3]=1;counters[0]=0;');finish(h);assert.equal(h.json('playerValues[3]'),80);assert.equal(h.json('counters[0]'),15);assert.equal(h.json('savedCheckpoint.map'),2);});
test('audio epoch and pause do not invalidate current gameplay readback',()=>{const h=fixture();h.run('playerValues[3]=1;settings.paused=true;audioEpoch9++;');finish(h);assert.equal(h.json('playerValues[3]'),80);});
test('callback error still unmaps and releases the readback slot',()=>{const h=fixture();h.run("sampleBuffer.getMappedRange=()=>{throw Error('readback fixture')}");assert.throws(()=>h.run('__lateSample()'),/readback fixture/);assert.equal(h.json('__unmaps'),1);assert.equal(h.json('readBusy'),false);});
const lastTrainEntry={...entry,map:2,leg:2,seed:88967,entry};
test('old Last Train victory cannot save unplayed Code Red after chapter reset',()=>{const h=fixture(lastTrainEntry);h.key('Enter');h.advanceFrameHost();assert.equal(h.json('stage'),4);unchanged(h,()=>{});assert.equal(h.json('savedCheckpoint.map'),3);assert.equal(h.json('playerValues[67]'),0);});
test('pending Last Train to Code Red transition discards the old sample',()=>{const h=fixture(lastTrainEntry);h.key('Enter');assert(h.json('seedRequested'));unchanged(h,()=>{});});
test('Code Red retry epoch discards its old terminal completion sample',()=>{const codeRedEntry={...lastTrainEntry,map:3,leg:3,seed:96886,entry:lastTrainEntry};const h=fixture(codeRedEntry);h.key('Backspace');h.advanceFrameHost();assert.equal(h.json('stage'),4);unchanged(h,()=>{});assert.equal(h.json('playerValues[67]'),0);});
const codeRedEntry={...lastTrainEntry,map:3,leg:3,seed:96886,entry:lastTrainEntry};
const deadweightEntry={...codeRedEntry,map:4,leg:4,seed:104805,entry:codeRedEntry};
test('old Code Red victory cannot complete unplayed Deadweight',()=>{const h=fixture(codeRedEntry);h.key('Enter');h.advanceFrameHost();assert.equal(h.json('stage'),5);unchanged(h,()=>{});assert.equal(h.json('savedCheckpoint.map'),4);assert.equal(h.json('finalResult19'),null);});
test('pending Code Red to Deadweight transition discards the old sample',()=>{const h=fixture(codeRedEntry);h.key('Enter');assert(h.json('seedRequested'));unchanged(h,()=>{});assert.equal(h.json('finalResult19'),null);});
test('old final victory cannot repopulate completion after final entry retry',()=>{const h=fixture(deadweightEntry);assert(h.json('finalResult19'));const progress=h.values.get('tiny-zombies-deadends-progress-v1');h.key('Backspace');h.advanceFrameHost();unchanged(h,()=>{});assert.equal(h.json('stage'),5);assert.equal(h.json('finalResult19'),null);assert.equal(h.json('playerValues[67]'),0);assert(!h.values.has(key));assert.equal(h.values.get('tiny-zombies-deadends-progress-v1'),progress);});
test('pending final retry discards old sample and releases its slot',()=>{const h=fixture(deadweightEntry);h.key('Backspace');assert(h.json('seedRequested'));unchanged(h,()=>{});});
const result={method:'CPU-only execution of exact sampled-state callback with controlled asynchronous ordering; no WebGPU execution.',candidateSha256:hash,passed:checks.every(x=>x.passed),checks};console.log(JSON.stringify(result,null,2));process.exitCode=result.passed?0:1;
