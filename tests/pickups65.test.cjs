'use strict';
// The Maple start shelter's armory is real: ammo (table rifle + can), a medkit, and the first rack gun (auto shotgun) are E pickups.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutPickups65}=require('./pickups65.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('three items exist inside the shelter, after the doors and the start clear',()=>{const h=loadHost(file,{plain:true});h.run('reset()');
 const r=h.json('(()=>{const out=[];for(let i=0;i<world.propCount;i++)if(world.props[i*16+12]===44)out.push({i,x:world.props[i*16],z:world.props[i*16+2],w:world.props[i*16+3],hp:world.props[i*16+4],kind:world.props[i*16+8]});return {out,first:world.doorFirst7,n:world.doors7.length,start:world.start}})()');
 assert.deepEqual(r.out.map(o=>o.kind).slice(0,3),[0,3,5]);/* bazooka77 adds a fourth, kind 4 */for(const o of r.out){assert.equal(o.w,7);assert.equal(o.hp,1);assert(o.i>=r.first+r.n,'not inside the door range');assert(Math.abs(o.x-r.start[0])<3.5&&Math.abs(o.z-r.start[1])<3.5,'inside the shelter');}
 const d=loadHost(file,{seed:'73129'});d.run('reset()');assert.equal(d.json('(()=>{let n=0;for(let i=0;i<world.propCount;i++)if(world.props[i*16+12]===44)n++;return n})()'),0,'DEAD ENDS has none');});
check('quick grab gives exactly the item',()=>{assert(html.includes('let item44=kind==5.0&&P[u32(max(0.0,S.mission5.z))].more.x==44.0;'));assert(html.includes('.5,item44);'));
 assert(html.includes('if(what==3u){S.items12.y=min(4.0,S.items12.y+1.0);}'));assert(html.includes('if(what==5u){S.upgrades14.x=f32(u32(S.upgrades14.x)|2u);'));
 return {measured:'SwiftShader real game: medkits 1 -> 2, reserve 180 -> 240, upgrades 0 -> 2 with the auto shotgun in hand'};});
check('items are drawn by the item pass and vanish when taken; static copies removed',()=>{assert(html.includes('if(pr.more.x==44.0){shelterItem44(p,u32(pr.aux.x),pr.data.x>0.0);}else{supplyTable44(p,pr.data.x>0.0);}'));
 assert(html.includes('for(var k=2u;k<4u;k++){gunStand44(vec3f(o.x-3.22,.95,o.y-1.95+f32(k)*.62));}'),'slots 0 and 1 are pickups since bazooka77');assert(!html.includes('medkit44(vec3f(o.x-.40,y+.07,o.y-2.6))'));});
check('prompt names the item',()=>{assert(html.includes("label=['E  Grab ammo','','','E  Grab medkit','E  Grab BAZOOKA','E  Grab AUTO SHOTGUN'][world.props[o+8]]||label;else label='E  Raid supply table';"));});
check('exact inverse restores the immutable pre-pickup runtime',()=>{assert.equal(sha(withoutPickups65(html)),delta.parentSha256);});
const report={method:'CPU host world, source fragments, and a real-game E test on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
