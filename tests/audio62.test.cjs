'use strict';
// Maple Street moments play cues from the existing clip bank, once per counter increase.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutAudio62}=require('./audio62.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('every cue uses a clip the bank has',()=>{const bank=JSON.parse(html.match(/audioBankKinds9=(\{[^;]*\});/)[1]);const f=html.slice(html.indexOf('function updateMapleAudio62()'),html.indexOf('function updateBombAudio()'));
 const kinds=[...f.matchAll(/playAudio9\('([a-zA-Z]+)'/g)].map(m=>m[1]);assert(kinds.length>=9);for(const k of kinds)assert(bank[k],k);return {kinds:[...new Set(kinds)]};});
check('cues fire once per increase and never on a drop',()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;settings.paused=false;window.__cues=[];playAudio9=(k)=>{__cues.push(k);return true;};');
 h.run('counters.fill(0);updateMapleAudio62();__cues.length=0;counters[48]=1;counters[51]=1;counters[57]=1;counters[96]=1;counters[98]=1;updateMapleAudio62();');
 assert.deepEqual(h.json('__cues'),['crit','snap','death','debris','death','growl','beepMid','latch','beepHigh','beepHigh']);
 h.run('__cues.length=0;updateMapleAudio62();counters.fill(0);updateMapleAudio62();');assert.deepEqual(h.json('__cues'),[],'no repeat, no cue on reset');});
check('called every frame next to the bomb audio',()=>{assert(html.includes(' updateBombAudio();updateMapleAudio62();'));});
check('exact inverse restores the immutable pre-audio runtime',()=>{assert.equal(sha(withoutAudio62(html)),delta.parentSha256);});
const report={method:'CPU host with playAudio9 recorded; bank lookup against audioBankKinds9.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
