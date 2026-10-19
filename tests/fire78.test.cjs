'use strict';
// Maple Street fire: infected that touch flames or a burning neighbour burn for 4 s (body.z), run 35% faster and spread it; flames
// are layered with smoke and embers; hedges and picket fences burn down; fire kills stack into TOASTED xN.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutFire78}=require('./fire78.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('burn timer, spread through the neighbour scan, faster stagger; Maple only, not tanks',()=>{assert(html.includes('if(other.body.z>.5&&other.p.w>0.0&&dist<rr+.18){catchFire=true;}'));
 assert(html.includes('if(u.run.x>5.0&&u.run.y<.5&&kind!=6.0){if(burning||catchFire){z.body.z=max(z.body.z,4.0);}z.body.z=max(0.0,z.body.z-dt);if(z.body.z>0.0){burning=true;}}'));assert(html.includes('var movement=velocity*dt*select(1.0,1.35,z.body.z>0.0);'));
 return {measured:'SwiftShader real game: a 1 m fire at the edge of a packed crowd of 20 toasted all 20 within ~2 s'};});
check('richer flames on Maple, the old look elsewhere; burning infected wear flames',()=>{assert(html.includes('let f=S.heat6[fi];if(f.w>S.aux.x&&u.run.x>5.0&&u.run.y<.5){'));assert(html.includes('}else if(f.w>S.aux.x){for(var k=0u;k<8u;k++)'));assert(html.includes('if(z.body.z>0.0){charred=.48;'));});
check('hedges and fences burn; TOASTED callout',()=>{assert(html.includes('(b.extraData.x==6.0||b.extraData.x==7.0)'));const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;glyphBuffer={name:"glyphBuffer"};announce65=()=>true;time=5;counters[61]=0;toastHUD67(1);time=5.5;counters[61]=3;toastHUD67(1);time=6;counters[61]=5;toastHUD67(1)');assert.equal(h.json('toast67.burst'),5);});
check('exact inverse restores the immutable pre-fire runtime',()=>{assert.equal(sha(withoutFire78(html)),delta.parentSha256);});
const report={method:'Source fragments, CPU-host callout; the chain fire was rendered on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
