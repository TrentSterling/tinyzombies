'use strict';
// The B-movie announcer (speechSynthesis) and synthesised layers fire on the big Maple Street moments, once each, and stay silent
// when audio is not allowed.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutVoice70}=require('./voice70.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const mock=`(()=>{window.__said=[];window.__synth=[];voice65.ok=true;globalThis.speechSynthesis={speaking:false,getVoices:()=>[],speak:u=>{__said.push(u.text)},cancel(){}};globalThis.SpeechSynthesisUtterance=function(t){this.text=t};
 audioAllowed9=()=>true;const real=synth65;synth65=k=>{__synth.push(k);return true;};playAudio9=()=>true;settings.started=true;})()`;
check('counter events: thud, splat, sting, jingle; cheese and splat lines',()=>{const h=loadHost(file,{plain:true});h.run('reset()');h.run(mock);
 h.run('counters.fill(0);updateMapleAudio62();time=10;counters[48]=1;counters[51]=3;counters[57]=1;counters[66]=1;updateMapleAudio62();');
 assert.deepEqual(h.json('__synth'),['thud','splat','sting','jingle']);assert.deepEqual(h.json('__said'),['Say cheese!','Splat-tastic!']);});
check('neighbor and boss lines, boing',()=>{const h=loadHost(file,{plain:true});h.run('reset()');h.run(mock);h.run('glyphBuffer={name:"glyphBuffer"};time=20;counters[70]=1;counters[69]=3500;bossHUD65(1);time=30;counters[70]=2;bossHUD65(1);time=40;counters[83]=1;boingHUD65(1);');
 const said=h.json('__said');assert(said.includes('Warning! The H. O. A. President has arrived!'));assert(said.includes('The H. O. A. President has been... foreclosed!'));assert(said.includes('Boing!'));assert(h.json('__synth').includes('boing'));
 assert(html.includes("if(st===4)announce65((n.name||'A neighbor')+' got eaten!',true);"));});
check('silent when audio is not allowed or speech is missing; repeats debounced',()=>{const h=loadHost(file,{plain:true});h.run('reset()');assert.equal(h.json('announce65("x")'),false,'no speech in the host');
 h.run(mock);h.run('time=5');assert.equal(h.json('announce65("Again")'),true);assert.equal(h.json('announce65("Again")'),false,'same line within 4 s');h.run('audioAllowed9=()=>false');assert.equal(h.json('announce65("Muted")'),false);});
check('exact inverse restores the immutable pre-voice runtime',()=>{assert.equal(sha(withoutVoice70(html)),delta.parentSha256);});
const report={method:'CPU host with speechSynthesis and synth65 recorded.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
