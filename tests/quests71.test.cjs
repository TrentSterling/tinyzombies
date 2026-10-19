'use strict';
// Seven Maple Street missions advance on real game counters, each worth 1000 points with a banner and the next radio line;
// yellow paint rings mark trampolines, supply tables and resting cheese wheels.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutQuests71}=require('./quests71.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('missions advance in order on their counters',()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;glyphBuffer={name:"glyphBuffer"};window.__said=[];announce65=(l)=>{__said.push(l);return true};synth65=()=>true;counters.fill(0);time=1;questHUD65(1)');
 const step=js=>{h.run(js+';time+=1;questHUD65(1)');return h.json('quest65.i');};
 assert.equal(h.json('quest65.i'),0);assert.equal(step('playerValues[L7.journey7]=1'),1);assert.equal(step('counters[66]=1'),2);assert.equal(step('counters[48]=1'),3);assert.equal(step('counters[83]=1'),4);
 assert.equal(step('counters[66]=3'),4,'3/4 is not 4');assert.equal(h.json('QUESTS65[4].goal()'),'Rescue 4 neighbors (3/4)');assert.equal(step('counters[66]=4'),5);assert.equal(step('counters[70]=1'),5);assert.equal(step('counters[70]=2'),6);assert.equal(step('playerValues[L7.goal+3]=1'),7);
 assert.equal(h.json('quest65.bonus'),7000);const said=h.json('__said');assert.equal(said.length,8,'opening line, six next-mission lines and the sign-off');assert(said[7].includes('signing off'));});
check('score includes the quest bonus; resets with the world',()=>{assert(html.includes('+((counters[70]|0)===2?5000:0)+quest65.bonus;'));assert(html.includes('if(q.world!==world){Object.assign(q,{i:0,world,bonus:0,'));});
check('yellow paint on trampolines, unopened supply tables and resting cheese',()=>{assert(html.includes(' paint65(home.xz,1.45);'));assert(html.includes('paint65(p.xz,1.35);}'));assert(html.includes('if(length(pr.aux.xy)<.3){paint65(pr.p.xz,.85);}'));});
check('exact inverse restores the immutable pre-quest runtime',()=>{assert.equal(sha(withoutQuests71(html)),delta.parentSha256);});
const report={method:'CPU-host mission progression; the panel, banner, radio subtitle and yellow paint were rendered on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
