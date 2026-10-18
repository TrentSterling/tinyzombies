'use strict';
// On Maple Street the player's pistol is ZAMN's squirt gun: a blue water stream, a water splash on hits, and the label.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutSquirt63}=require('./squirt63.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('only the human pistol on Maple marks its trail and splashes',()=>{const g='if(human&&weapon==2u&&u.run.x>5.0&&u.run.y<.5){';assert.equal(html.split(g).length,3);assert(html.includes(g+'S.trails6[trail].hit.w=1.0;}'));assert(html.includes(g+'event(shot.hit.xyz+h.n*.05,dir*2.5+h.n*1.2+vec3f(0,2.2,0),vec3f(.38,.70,1.0),11u,10u,'));});
check('renderer draws marked trails as a thick blue stream',()=>{assert(html.includes('let water=sh.hit.w>.5;'));assert(html.includes('vec3f(.40,.75,1.0),water)'));assert(html.includes('select(select(.028,.065,crit),.075,water)'));});
check('labels',()=>{const h=loadHost(file,{plain:true});h.run('reset()');assert.equal(h.json('gearLabel14(2)'),'SQUIRT GUN');assert.equal(h.json('gearLabel14(3)'),'SODA CAN');
 const d=loadHost(file,{seed:'73129'});d.run('reset()');assert.equal(d.json('gearLabel14(2)'),'9MM PISTOL');});
check('exact inverse restores the immutable pre-squirt runtime',()=>{assert.equal(sha(withoutSquirt63(html)),delta.parentSha256);});
const report={method:'Source fragments and CPU-host labels; the stream was rendered in a real Maple Street frame on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
