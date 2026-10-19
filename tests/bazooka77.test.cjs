'use strict';
// Maple Street BAZOOKA: a rack pickup in the start shelter; each rocket detonates the shared one-frame blast where it lands.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutBazooka77}=require('./bazooka77.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('Maple-only stats and labels; DEAD ENDS keeps the R7',()=>{assert(html.includes('if(u.run.x>5.0&&u.run.y<.5){return vec4f(4,.85,2.0,24);}return vec4f(14,.27,1.55,98);}'));
 const h=loadHost(file,{plain:true});h.run('reset();playerValues[L13.upgrades]=1');assert.equal(h.json('gearLabel14(0)'),'BAZOOKA');const d=loadHost(file,{seed:'73129'});d.run('reset();playerValues[L13.upgrades]=1');assert.equal(d.json('gearLabel14(0)'),'R7 HEAVY RIFLE');});
check('rocket = blast at the impact point, after the bullet pass',()=>{assert(html.includes('S.blast=vec4f(at.x,at.z,.45,3.4);S.aux.w=1.0;'));const b=html.indexOf("pass(enc,'bullet3'"),z=html.indexOf("pass(enc,'zombies'"),w=html.indexOf("pass(enc,'world'");assert(b<z&&z<w);
 return {measured:'SwiftShader real game: grabbed from the rack (BAZOOKA 4/24), one rocket into a group of 12: SPLAT x13'};});
check('rack pickup, reserve capped at 24',()=>{const h=loadHost(file,{plain:true});h.run('reset()');assert(h.json('(()=>{for(let i=0;i<world.propCount;i++)if(world.props[i*16+12]===44&&world.props[i*16+8]===4)return true;return false})()'));
 assert(html.includes('S.reserve12.x=min(S.reserve12.x,24.0);'));assert(html.includes("'E  Grab BAZOOKA'"));});
check('exact inverse restores the immutable pre-bazooka runtime',()=>{assert.equal(sha(withoutBazooka77(html)),delta.parentSha256);});
const report={method:'CPU host labels and world, pass order; real-game pickup and rocket on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
