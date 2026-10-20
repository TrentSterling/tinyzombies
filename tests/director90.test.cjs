'use strict';
// AI Director stage 2: after a 20 s opening, BUILD-UP pushes held Maple infected in faster and awake while intensity is low; PEAK/FADE
// trickle; RELAX holds every release; 150+ awake never pushes. The rate reaches the zombie pass as u.v5.x = rate - 1 (0 = old timers).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutDirector90}=require('./director90.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const sim=(script,awake=40)=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;playerValues[3]=100;');return h.json('(()=>{const out=[];for(let f=0;f<=900;f++){playerValues[24]=f*.1;counters[53]='+awake+';'+script+';out.push(directorTick70());}return out;})()');};
check('opening keeps timers, then push / trickle / hold follow the pacing states',()=>{const o=sim('if(f===300)playerValues[3]=55;if(f===305)playerValues[3]=30');const at=t=>o.find(d=>d.t>=t);
 assert.equal(at(10).rate,1);assert.equal(at(25).rate,2.5);assert.equal(at(25).action,'PUSH WAVES x2.5');assert.equal(at(31).state,'PEAK');assert.equal(at(31).rate,.3);assert.equal(at(45).state,'RELAX');assert.equal(at(45).rate,0);assert.equal(at(65).rate,2.5);
 const ev=o[o.length-1].events.map(e=>e[1]);assert.deepEqual(ev,['PEAK','FADE','RELAX','BUILD-UP']);assert.equal(o[o.length-1].peaks,1);const s=o[o.length-1].share;assert(Math.abs(Object.values(s).reduce((a,b)=>a+b,0)-1)<.02);});
check('a crowded street (150+ awake) is never pushed; mid intensity pushes x1.5',()=>{const o=sim('',200);assert(o.filter(d=>d.t>20).every(d=>d.rate===1&&d.action==='LET IT BUILD (crowded)'));
 const m=sim('if(f===250)playerValues[3]=82');const d=m.find(x=>x.t>=25.2);assert(d.intensity>=.3&&d.intensity<.6,'intensity '+d.intensity);assert.equal(d.rate,1.5);});
check('GPU wiring: u.v5.x scales held Maple timers and wakes pushed arrivals; non-Maple keeps 0',()=>{
 assert(html.includes('z.v.w-=dt*select(1.0,max(0.0,1.0+u.v5.x),u.run.x>5.0&&u.run.y<.5&&z.special13.w==-2.0);'));assert(html.includes('(z.special13.w==-2.0&&(S.aux.x>90.0||S.aux.x<20.0||u.v5.x>.25))'));
 assert(html.includes("uniformData.set([SANDBOX25?director70.rate-1:0,keys.has('KeyX')?1:0,pendingChoice,keys.has('KeyK')?1:0],80)"));assert.equal(/u\.v5\.x/.test(withoutDirector90(html)),false,'v5.x was unused before');});
check('panel draws decisions before the first tick and after events',()=>{const h=loadHost(file,{plain:true});h.run('reset();glyphBuffer={name:"glyphBuffer"};hud2d30={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillRect(){},measureText:s=>({width:s.length*8}),fillText(){},strokeText(){}};hudScale30=1;width=1280;height=720;director70.on=true;directorHUD70(1);settings.started=true;for(let f=0;f<400;f++){playerValues[24]=f*.1;if(f===250)playerValues[3]=20;directorHUD70(1);}');assert(h.json('director70.events.length')>0);});
check('exact inverse restores the immutable pre-stage-2 runtime',()=>{assert.equal(sha(withoutDirector90(html)),delta.parentSha256);});
const report={method:'CPU host driving HP, awake count and the clock; WGSL wiring by source; Tint validates the zombie pass (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
