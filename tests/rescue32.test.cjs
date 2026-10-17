'use strict';
// Milestone 2c: the shelter will not seal while neighbors wait at home; objective, prompt and minimap say so.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutRescue32}=require('./rescue32.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const h=loadHost(file),src=h.sources;
check('extraction readiness requires zero waiting neighbors; following, saved and lost ones do not block',()=>{
 const m=src.mission5;assert(m.includes('&&S.player7.x==0.0&&neighborsWaiting30()==0u;'));
 assert(m.includes('if(c.p.w==30.0&&c.data.y>.5&&c.data.y<1.5){n++;}'),'only state 1 (waiting) counts');
 // Chapters have no kind-30 props in the reserved slots, so the gate is always open there.
 const c=loadHost(file);for(let st=1;st<=5;st++){c.run(`stage=${st};world=makeWorld()`);assert.notEqual(c.json(`world.props[${c.json('CIV_BASE30')}*16+3]`),30);}
});
check('objective line and shelter prompt explain the wait',()=>{
 const g=loadHost(file,{seed:'7&sandbox'});g.run('reset()');
 g.run('for(let c=0;c<CIV_MAX30;c++)playerValues[CIV_STATE30+c*4+2]=c<3?1:(c<5?3:0);playerValues[448]=4');
 assert.equal(g.json('waitingNeighbors30()'),3);assert.equal(g.json('shortObjective9()'),'Round up the neighbors: 3 still home');
 g.run('playerValues[448]=1');assert.notEqual(g.json('shortObjective9()'),'Round up the neighbors: 3 still home','earlier steps keep their own objective');
 g.run('for(let c=0;c<CIV_MAX30;c++)playerValues[CIV_STATE30+c*4+2]=c<3?2:3;playerValues[448]=4');assert.equal(g.json('waitingNeighbors30()'),0);assert.equal(g.json('shortObjective9()'),'Fallout shelter (HOA approved)');
 assert(g.script.includes("if(SANDBOX25&&interaction===7&&waitingNeighbors30()>0)label='Neighbors still at home: '+waitingNeighbors30();"));
});
check('minimap marks waiting (gold) and following (mint) neighbors from the State mirror',()=>{
 const ui=h.html.slice(h.html.indexOf('const uiShader='),h.html.indexOf('const uiShader=')+20000);assert(ui.includes('let nb=S[976u+ni];if(nb.z<.5||nb.z>2.5){continue;}'));assert.equal(h.json('CIV_STATE30')/4,976);
});
check('exact inverse restores the immutable pre-rescue runtime',()=>{assert.equal(sha(withoutRescue32(fs.readFileSync(file,'utf8'))),delta.parentSha256);});
const report={method:'Source fragments and exact host functions; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
