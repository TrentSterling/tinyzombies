'use strict';
// AI Director stage 1: intensity (damage and close kills up, drains when clear), BUILD-UP -> PEAK -> FADE -> RELAX -> BUILD-UP,
// rolling dmg/kills per minute, neighbor and horde counts, a Backquote / ?director panel and window.__director() for robots.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutDirector88}=require('./director88.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const sim=script=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;playerValues[3]=100;for(let c=0;c<CIV_MAX30;c++)playerValues[CIV_STATE30+c*4+2]=0;');return h.json('(()=>{const out=[];for(let f=0;f<=400;f++){playerValues[24]=f*.1;'+script+';const d=directorTick70();out.push(d);}return out;})()');};
check('a big hit peaks, holds 4 s, fades, relaxes 20 s, then builds up again',()=>{const o=sim('if(f===50)playerValues[3]=60;if(f===60)playerValues[3]=40');const at=t=>o.find(d=>d.t>=t);
 assert.equal(at(4.9).state,'BUILD-UP');assert.equal(at(6.1).state,'PEAK');assert.equal(at(10.5).state,'FADE');const relax=o.find(d=>d.state==='RELAX');assert(relax&&relax.t>14&&relax.t<20,'relax at '+relax?.t);
 const back=o.find(d=>d.t>relax.t&&d.state==='BUILD-UP');assert(back&&Math.abs(back.t-relax.t-20)<.3);return {peak:6,relax:relax.t,buildUp:back.t};});
check('quiet play stays in BUILD-UP at zero; dmg/min counts the hit',()=>{const o=sim('');assert(o.every(d=>d.state==='BUILD-UP'&&d.intensity===0));const p=sim('if(f===50)playerValues[3]=80');assert(p[100].dpm>0&&p[100].intensity>0);});
check('neighbor states and saved/lost come from the mirror and the new counter slots',()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;for(let c=0;c<CIV_MAX30;c++)playerValues[CIV_STATE30+c*4+2]=0;playerValues[CIV_STATE30+2]=1;playerValues[CIV_STATE30+6]=2;counters[98]=3;counters[97]=1;playerValues[24]=1;directorTick70();playerValues[24]=1.1');
 const d=h.json('directorTick70()');assert.equal(d.waiting,1);assert.equal(d.following,1);assert.equal(d.saved,3);assert.equal(d.lost,1);assert.equal(h.json('typeof __director()'),'object');assert.equal(h.json('director70.read'),true);});
check('panel wiring: Backquote toggles, ?director opens, readback runs with the panel',()=>{assert(html.includes("case 'Backquote':director70.on=!director70.on;break;"));assert(html.includes("on:params.has('director')"));assert(html.includes('if((audioAllowed9()||director70.on||director70.read)&&now>=audioReadAt9)'));assert(html.includes('  if(SANDBOX25)directorHUD70(k);\n'));});
check('panel draws before the first tick (full default snapshot)',()=>{const h=loadHost(file,{plain:true});h.run('reset();glyphBuffer={name:"glyphBuffer"};hud2d30={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillRect(){},measureText:s=>({width:s.length*8}),fillText(){},strokeText(){}};hudScale30=1;width=1280;height=720;director70.on=true;directorHUD70(1)');for(const k of ['dpm','kpm','hp','stateAge','awake'])assert.equal(typeof h.json('director70.last.'+k),'number',k);});
check('exact inverse restores the immutable pre-director runtime',()=>{assert.equal(sha(withoutDirector88(html)),delta.parentSha256);});
const report={method:'CPU host driving HP, kills and the clock through directorTick70; panel rendered in a real frame (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
