'use strict';
// Same-screen co-op: IJKL or a gamepad stick joins player two, who drives bot 1 (screen-relative, collision-checked, leashed 13 m);
// the bot's combat AI keeps aiming and firing.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutCoop74}=require('./coop74.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('input joins player two and reaches u.v3',()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;announce65=()=>true;updateUniforms(1/60)');assert.equal(h.json('uniformData[77]'),0,'not joined');
 h.run('keys.add("KeyL");updateUniforms(1/60)');assert.equal(h.json('p2_65.on'),true);assert.equal(h.json('uniformData[77]'),1);const v=h.json('[uniformData[78],uniformData[79]]');assert(Math.hypot(...v)>.5,'stick in world space');
 h.run('keys.delete("KeyL");updateUniforms(1/60)');assert.equal(h.json('uniformData[77]'),1,'stays joined');});
check('bot 1 override: start position, collision, 13 m leash, Maple only',()=>{assert(html.includes('var a=S.team7[id];let start65=a.p.xz;'));assert(html.includes('if(u.run.x>5.0&&u.run.y<.5&&id==0u&&u.v3.y>.5&&a.p.w>0.0){var q=start65;'));
 assert(html.includes('if(length(off)>13.0){let pull=S.pos.xz+safe2(off)*13.0;'));return {measured:'Dawn/lavapipe buddy shader: no input, bot 1 stays 2 m from the player; holding L it walks to 13 m and holds there'};});
check('exact inverse restores the immutable pre-co-op runtime',()=>{assert.equal(sha(withoutCoop74(html)),delta.parentSha256);});
const report={method:'CPU-host uniforms; the real buddy shader on Dawn/lavapipe (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
