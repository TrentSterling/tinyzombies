'use strict';
// Counter slots: Maple neighbor tallies and boss state move out of the squad-contact slots (C[64..66], C[68..70]) that live bots
// atomicExchange to zero every frame and that infected bites atomicMax into. Robot playtests caught a squad bite reading as 7 saves.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutSlots85}=require('./slots85.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('squad contacts own 64..66 and 68..70 alone',()=>{assert(html.includes('let touches=atomicExchange(&C[64u+id],0u);let slam=atomicExchange(&C[68u+id],0u);'));assert(html.includes('atomicMax(&C[63u+victim],hurt);'));
 for(const n of [64,65,66,68,69,70])assert(!new RegExp('C\\['+n+'\\](?!\\.)').test(html.replace(/\/\/[^\n]*/g,'')),'literal C['+n+'] left in code');
 for(const n of [64,65,66,68,69,70])assert(!html.includes('counters['+n+']'),'counters['+n+'] left in JS');});
check('neighbors and boss use 96..101; buffer, readback and audio offset grew to fit',()=>{for(const s of ['atomicAdd(&C[96],1u)','atomicAdd(&C[97],1u)','atomicAdd(&C[98],1u)','atomicLoad(&C[101])==0u){atomicStore(&C[101],1u);','atomicStore(&C[99],0u);','atomicLoad(&C[99])',"C=storage('counters',512)",'let counters=new Uint32Array(128)','enc.copyBufferToBuffer(C,0,sampleBuffer,0,512);enc.copyBufferToBuffer(S,0,sampleBuffer,512,16384);','getMappedRange(0,512)));playerValues.set(new Float32Array(sampleBuffer.getMappedRange(512,16384)))','AUDIO_OFFSET9=16896'])assert(html.includes(s),s);
 assert.equal(16896,512+16384);});
check('exact inverse restores the immutable pre-move runtime',()=>{assert.equal(sha(withoutSlots85(html)),delta.parentSha256);});
const report={method:'Source checks of every counter user; Tint validates the shaders (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
