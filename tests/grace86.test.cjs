'use strict';
// Barricaded: waiting Maple neighbors take no bites for the first 30 s of game time; followers and later waiting neighbors do.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutGrace86}=require('./grace86.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('bite damage gated on waiting state and game time (State.aux.x is SR[6].x)',()=>{assert(html.includes('c.data.x-=f32(min(bites,6u))*7.0*dt*select(1.0,0.0,c.data.y<1.5&&SR[6u].x<30.0);'));
 assert(/struct State \{ pos:vec4f, motion:vec4f, look:vec4f, timers:vec4f, bomb:vec4f, blast:vec4f, aux:vec4f,/.test(html),'aux is the 7th vec4');
 const dmg=(state,t,bites)=>Math.min(bites,6)*7*(1/60)*(state<1.5&&t<30?0:1);assert.equal(dmg(1,11,3),0);assert(dmg(2,11,3)>0);assert(dmg(1,31,3)>0);});
check('exact inverse restores the immutable pre-grace runtime',()=>{assert.equal(sha(withoutGrace86(html)),delta.parentSha256);});
const report={method:'Source checks and a JS mirror of the damage line; robot playtest runs motivated it (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
