'use strict';
// Maple Street sandbox (milestone 1): ?sandbox boots the open V9 town mission, rerollable, campy.
// Exact host functions, world builder and source fragments only; no WGSL compilation, GPU execution or gameplay.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutSandbox26}=require('./sandbox26.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const sandbox=seed=>loadHost(file,{seed:seed+'&sandbox'});
const unreachable=h=>h.json('(()=>{const nav=world.occ.subarray(NAV_OFFSET,NAV_OFFSET+NAV_SIZE);const at=(x,z)=>{let best=0x3fffffff;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)best=Math.min(best,nav[Math.floor(x+96)+dx+NG*(Math.floor(z+96)+dz)]);return best;};const pts=[["buddy",...world.buddy],["genA",world.generators[0],world.generators[1]],["genB",world.generators[2],world.generators[3]],...world.caches.map(c=>["cache"+c.id,c.x,c.z]),...world.switches.map((w,i)=>["switch"+i,w.x,w.z])];return pts.filter(p=>at(p[1],p[2])>=0x3fffffff).map(p=>p[0]);})()');

check('?sandbox starts on the V9 town mission with the full horde; plain URL keeps the campaign',()=>{
 const h=sandbox(73129);assert.equal(h.json('stage'),6);assert.equal(h.json('SANDBOX25'),true);
 h.run('world=makeWorld()');assert.equal(h.json('world.chapter8.name'),'MAPLE STREET');assert.equal(h.json('!!world.source13'),false);
 assert(h.script.includes('settings.lab||stage===1||SANDBOX25?campaignPopulation24():'),'full population in sandbox');
 const c=loadHost(file);assert.equal(c.json('stage'),1);assert.equal(c.json('SANDBOX25'),false);
});
check('every seed rerolls the street and keeps every objective reachable',()=>{
 const sigs=new Set();let worst=[];
 for(let s=1;s<=16;s++){const h=sandbox(s*7919);h.run('world=makeWorld()');const r=h.json('[world.count,world.buildings.length,world.groupCount]');sigs.add(r.join());
  assert(h.json('world.count')<=h.json('MAX_WORLD')&&h.json('world.propCount')<=h.json('MAX_PROPS'));const u=unreachable(h);if(u.length)worst.push([s,u]);}
 assert.deepEqual(worst,[]);assert(sigs.size>=8,'seeds produce different streets: '+sigs.size);return {distinctStreets:sigs.size};
});
check('houses are small, doored and inside the support-group budget',()=>{
 const h=sandbox(99);h.run('world=makeWorld()');const b=h.json('world.buildings');assert(b.length>=12);
 for(const x of b){assert(x.w>=8&&x.w<=10&&x.d>=7&&x.d<=8,'house size '+JSON.stringify(x));}
 assert(h.json('world.groupCount')<h.json('MAX_GROUPS'));assert.equal(h.json('world.doors7.length'),b.length+1,'one garage door per house plus the start door');
});
check('campy announcer lines exist for every legacy announcement code',()=>{
 const h=sandbox(1);for(const code of [2,4,6,7,9,10,11,14,15])assert(h.json(`sandboxBanner25(${code},0)`).length>8,'line '+code);
 assert.notEqual(h.json('sandboxBanner25(3,0)'),h.json('sandboxBanner25(3,1)'));assert.equal(h.json('sandboxBanner25(99,0)'),'');
 assert(!/—/.test(JSON.stringify(h.json('SANDBOX_LINES25'))),'no em dashes in player-facing strings');
 assert.deepEqual(h.json('SQUAD25()'),['Gary','Doris','Chad']);assert.deepEqual(loadHost(file).json('SQUAD25()'),['Mara','Rook','Kit']);
});
check('HUD draws the banner and the evacuation card without throwing',()=>{
 const h=sandbox(1);h.run('reset();glyphBuffer={name:"glyphBuffer"};settings.started=true;playerValues[3]=100;playerValues[460]=3;playerValues[461]=2;glyphCount=0;hud()');const g=h.json('glyphCount');
 h.run('playerValues[461]=0;glyphCount=0;hud()');assert(g>h.json('glyphCount'),'banner adds glyphs');
 h.run('playerValues[67]=1;glyphCount=0;hud()');assert(h.json('glyphCount')>30);return {glyphsWithBanner:g};
});
check('Enter after evacuation rerolls a new street; N twice stays in the sandbox',()=>{
 const h=sandbox(1);h.run('reset()');const s0=h.json('runSeed');h.run('playerValues[67]=1');h.key('Enter');assert.equal(h.json('seedRequested'),true);assert.notEqual(h.json('runSeed'),s0);
 h.advanceFrameHost();assert.equal(h.json('stage'),6);h.run('playerValues[67]=0');h.key('KeyN');h.key('KeyN');h.advanceFrameHost();assert.equal(h.json('stage'),6);
});
check('exact inverse restores the immutable pre-sandbox runtime',()=>{
 assert.equal(sha(withoutSandbox26(fs.readFileSync(file,'utf8'))),delta.parentSha256);
});
const report={method:'CPU host functions, world builder and nav seed; no WGSL compilation, GPU execution or gameplay.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
