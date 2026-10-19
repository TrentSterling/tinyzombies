'use strict';
// The HOA President: at 3 min on Maple Street, zombie 1567 (a tank) becomes a 4.5x, 3500 HP boss 30 m away that walks straight at the
// player and bulldozes houses (world pass reads its packed position from C[68]); a boss bar, banners, and 5000 points when it falls.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutBoss66}=require('./boss66.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('zombie 1567 is a tank and is never held back by the ramp',()=>{assert.equal(1567%512,31,'i%512==31 makes it kind 6');assert(html.includes('if(f>.30&&i!=31u)'),'ramp keeps 31 only');
 assert(html.includes('if(u.run.x>5.0&&u.run.y<.5&&i==1567u&&S.aux.x>=180.0&&S.pos.w>0.0&&atomicLoad(&C[70])==0u){atomicStore(&C[70],1u);'),'spawns once at 3 min regardless of its state');
 assert(html.includes('z.p=vec4f(p.x,0,p.y,3500.0);z.v=vec4f(0,0,0,99.0);z.extraData=vec4f(z.extraData.x,0,6.0,0);z.history=vec4f(p,0,0);z.special13=vec4f(777.0,0,0,-1);'));});
check('marker 777 is never written by other special13 paths',()=>{const writes=[...html.matchAll(/special13=vec4f\(([^;]*)\);/g)].map(m=>m[1]);for(const w of writes)if(!w.startsWith('777.0'))assert(!/^777/.test(w));
 assert.equal(html.split('special13.x==777.0').length-1,6,'uses: target, dir, hurt, per-frame state, render scale, hit box');});
check('walks straight, hits for 45, bulldozes within 1.6 m',()=>{assert(html.includes('if(z.special13.x==777.0){dir=direct;}'));assert(html.includes('45u,z.special13.x==777.0)'));
 assert(html.includes('if(length(dd)<1.6&&b.p.y<3.4){damage+=40.0;'));assert(html.includes(' atomicStore(&C[68],0u);\n atomicStore(&C[52],0u);'),'cleared in the props pass, which runs before zombies; the world pass runs after');
 const o=html.indexOf("pass(enc,'props'"),z=html.indexOf("pass(enc,'zombies'"),w=html.indexOf("pass(enc,'world'");assert(o<z&&z<w);
 const pack=(x,z)=>((Math.floor((x+96)*16))|(Math.floor((z+96)*16)<<12))+1,un=a=>{const v=a-1;return [(v&4095)/16-96,(v>>>12)/16-96]};assert.deepEqual(un(pack(-69,57.5)),[-69,57.5]);assert.deepEqual(un(pack(95.9375,-96)),[95.9375,-96]);});
check('boss HUD: bar, arrival and defeat banners, 5000 points',()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;time=10;counters[70]=1;counters[69]=1750;glyphBuffer={name:"glyphBuffer"};bossHUD65(1)');
 assert.equal(h.json('boss65.banner'),'BOSS: THE HOA PRESIDENT');h.run('time=11;counters[70]=2;bossHUD65(1)');assert.equal(h.json('boss65.banner'),'HOA PRESIDENT DEFEATED!  +5000');
 assert(html.includes('+((counters[70]|0)===2?5000:0)'));});
check('exact inverse restores the immutable pre-boss runtime',()=>{assert.equal(sha(withoutBoss66(html)),delta.parentSha256);});
const report={method:'Source fragments, pack round trip, CPU-host HUD; spawn, chase and bulldozing measured in the real game on SwiftShader with the spawn time compressed (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
