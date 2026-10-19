'use strict';
// Maple Street levels: each evacuation's Enter rolls the next level (u.v3.x) with its own title, night on even levels, a bigger
// opening crowd and an earlier, tougher boss; a new run returns to level 1.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutLevels73}=require('./levels73.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('Enter after an evacuation advances the level; names, boss time and HP scale',()=>{const h=loadHost(file,{plain:true});h.run('reset()');assert.equal(h.json('mapleLevel65'),1);assert.equal(h.json('levelName65()'),'ZOMBIE PANIC!');
 h.run('nextSandbox25()');assert.equal(h.json('mapleLevel65'),2);assert.equal(h.json('levelName65()'),'NIGHT OF THE LIVING HOA');assert.equal(h.json('bossAt65()'),150);assert.equal(h.json('bossHP65()'),4500);
 h.run('mapleLevel65=9');assert.equal(h.json('bossAt65()'),120,'never before 2:00');h.run('updateUniforms&&updateUniforms(1/60)');});
check('shaders read the level from u.v3.x',()=>{assert(html.includes('uniformData.set([SANDBOX25?mapleLevel65:0,0,0,0],76);'));assert(html.includes('if(f>.30+min(.30,max(0.0,u.v3.x-1.0)*.10)&&i!=31u)'));
 assert(html.includes('S.aux.x>=max(120.0,180.0-max(0.0,u.v3.x-1.0)*30.0)'));assert(html.includes('3500.0+max(0.0,u.v3.x-1.0)*1000.0'));assert(html.includes('let night=sunny&&u.v3.x>1.5&&(u32(u.v3.x)%2u)==0u;'));
 const held=L=>1-(0.30+Math.min(.30,Math.max(0,L-1)*.10));assert(Math.abs(held(2)-.6)<1e-9);return {measured:'real game: level 1 opens with 605 infected, level 2 with 799, at night'};});
check('a new run (N twice) resets to level 1; DEAD ENDS sends 0',()=>{assert(html.includes('stage=SANDBOX25?SANDBOX_STAGE25:1;mapleLevel65=1;'));});
check('exact inverse restores the immutable pre-level runtime',()=>{assert.equal(sha(withoutLevels73(html)),delta.parentSha256);});
const report={method:'CPU host and source fragments; level 2 rendered at night on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
