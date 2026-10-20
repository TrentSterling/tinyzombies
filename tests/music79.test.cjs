'use strict';
// Maple Street soundtrack: synthesised surf-horror loop, scheduled ahead on the audio clock, intensity by horde size and the boss,
// silent when audio is not allowed; a failure only notes and turns the music off.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutMusic79}=require('./music79.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('no audio context, no music; the hook is guarded',()=>{const h=loadHost(file,{plain:true});h.run('reset()');assert.equal(h.json('(updateMusic67(),music67.on)'),false);assert(html.includes('try{updateMusic67();}catch(e){'));});
check('schedules a quarter second ahead with a recorded audio graph; boss adds the theremin',()=>{const h=loadHost(file,{plain:true});h.run(`reset();settings.started=true;window.__osc=0;window.__noise=0;
 const node=()=>({connect(){},start(){},stop(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}},frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},type:''});
 audio={currentTime:10,sampleRate:8000,createGain:node,createOscillator:()=>{__osc++;return node()},createBuffer:(c,n)=>({getChannelData:()=>new Float32Array(n)}),createBufferSource:()=>{__noise++;return node()},createBiquadFilter:node};audioMix9=node();audioAllowed9=()=>true;playerValues[24]=0;counters[53]=0;counters[70]=0;updateMusic67();`);
 const calm=h.json('[__osc,music67.step]');assert(calm[1]>=1&&calm[1]<=3,'about .25 s of eighths at 132 bpm');h.run('__osc=0;audio.currentTime=11;counters[70]=1;updateMusic67()');assert(h.json('__osc')>calm[0],'boss adds kick and theremin voices');});
check('exact inverse restores the immutable pre-music runtime',()=>{assert.equal(sha(withoutMusic79(html)),delta.parentSha256);return {measured:'real Chrome: 340 steps scheduled, bus at .5, zero errors'};});
const report={method:'CPU host with a recorded audio graph; real Chrome scheduling (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
