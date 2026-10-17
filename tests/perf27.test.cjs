'use strict';
// Performance pass 1: exact crowd/sight/pressure reductions, live-population dispatch, door-frame steering, adaptive render quality.
// Source fragments, a scalar steering model and exact host functions; no GPU timing, WGSL execution or gameplay.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutPerf27}=require('./perf27.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const h=loadHost(file),src=h.sources;

check('crowd 3x3 ring is exact: largest contact distance is under one 1 m cell',()=>{
 const fp=h.html.match(/fn footprint\(kind:f32\)->f32 \{return array<f32,7>\(([^)]*)\)\[u32\(kind\)\]\/64\.0;\}/);assert(fp,'footprint table');
 const maxContact=2*Math.max(...fp[1].split(',').map(v=>parseFloat(v)/64));assert(maxContact<1,'contact '+maxContact);
 assert(src.crowd.includes('for(var k=0u;k<9u;k++){let d=neighbor6(k,rotate);'));assert(!src.crowd.includes('k<25u'));
 assert(src.zombies.includes('for(var k=0u;k<25u;k++){let rot=hash('),'zombie pass keeps 5x5 for look-ahead and stomp range');
 return {maxContactMetres:maxContact};
});
check('sight ray stops probing once sight is already false',()=>{
 assert(src.zombies.includes('var sight=targetDistance<24.0;')&&src.zombies.includes('for(var k=1u;sight&&k<steps;k++){'));
});
check('pressure grid was never written; its reads and per-frame clear are gone',()=>{
 const before=withoutPerf27(h.html);assert(!/O\[PRESS_OFFSET[^\]]*\]\s*=/.test(before)&&!/atomic\w*\(&O\[PRESS_OFFSET/.test(before),'parent never wrote pressure');
 assert(!h.html.includes('O[PRESS_OFFSET+')&&!h.html.includes('enc.clearBuffer(O,PRESS_OFFSET'));assert(src.world.includes('let pressure=0u;'));
});
check('infected passes dispatch for the live population and every one guards on u.config.x',()=>{
 for(const n of [0,64,245,2048,8192]){h.run(`uniformData[44]=${n}`);assert.equal(h.json('liveGroups25()'),Math.max(1,Math.ceil(n/64)));}
 assert(src.gridZ.includes('let n=u32(u.config.x);if(gid.x>=n'));assert(src.zombies.includes('if(i>=u32(u.config.x)){return;}'));assert(src.crowd.includes('if(i>=u32(u.config.x)){return;}'));
 const sim=h.script.slice(h.script.indexOf('function runSimulation('),h.script.indexOf('function drawFrame('));assert(!sim.includes("Math.ceil(settings.zombies/64)"));
});
check('door frames: a blocked cell now steers to its cheapest open neighbour; sealed pockets still return zero',()=>{
 const f=src.zombies.slice(src.zombies.indexOf('fn flowDirection('),src.zombies.indexOf('@compute'));assert(!f.includes('if(cost>=1073741800u){return vec2f(0);}'));
 // Scalar model of the loop: candidates must be strictly cheaper than here; INF here admits any finite neighbour.
 const INF=0x3fffffff,step=(grid,c)=>{const here=grid[c[1]][c[0]];let best=1e9,res=null;for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){const v=grid[c[1]+dz]?.[c[0]+dx];if(v===undefined||v>=here)continue;const s=v+10;if(s<best){best=s;res=[dx,dz];}}return res;};
 const doorFrame=[[INF,INF,INF],[40,INF,20],[INF,INF,INF]];assert.deepEqual(step(doorFrame,[1,1]),[1,0]);
 const sealed=[[INF,INF,INF],[INF,INF,INF],[INF,INF,INF]];assert.equal(step(sealed,[1,1]),null);
});
check('quality governor steps down only after 3 s of sustained low frame rate, never while pinned',()=>{
 const g=loadHost(file);g.run('settings.started=true;settings.paused=false;time=10;fps=30;qualityTier25=0;qualitySlow25=0;applyQualityTier25(0)');
 for(let i=0;i<120;i++)g.run('qualityGovernor25(1/60)');assert.equal(g.json('qualityTier25'),0,'2 s is not enough');
 for(let i=0;i<120;i++)g.run('qualityGovernor25(1/60)');assert.equal(g.json('qualityTier25'),1);
 for(let i=0;i<2000;i++)g.run('qualityGovernor25(1/60)');assert.equal(g.json('qualityTier25'),3,'never beyond the lowest tier');assert.equal(g.json('settings.quality'),.67);
 const q=loadHost(file);q.run('settings.started=true;time=10;fps=60');for(let i=0;i<600;i++)q.run('qualityGovernor25(1/60)');assert.equal(q.json('qualityTier25'),0,'a healthy 60 fps never steps down');
 const pinned=loadHost(file,{seed:'1&tier=2'});assert.equal(pinned.json('qualityTier25'),2);assert.equal(pinned.json('qualityLocked25'),true);
 pinned.run('settings.started=true;time=10;fps=10');for(let i=0;i<600;i++)pinned.run('qualityGovernor25(1/60)');assert.equal(pinned.json('qualityTier25'),2);
 const early=loadHost(file);early.run('settings.started=true;time=1;fps=10');for(let i=0;i<600;i++)early.run('qualityGovernor25(1/60)');assert.equal(early.json('qualityTier25'),0,'first 4 s of a run are ignored');
});
check('tier 0 is the original look: full scale, 4x MSAA pipelines and textures',()=>{
 const g=loadHost(file);g.run('applyQualityTier25(0)');assert.equal(g.json('settings.quality'),1);assert.equal(g.json('renderSamples25'),4);
 assert(g.html.includes("multisample:{count:4}"));assert.deepEqual(g.json('QUALITY_TIERS25.map(t=>t.q)'),[1,1,.8,.67]);
});
check('exact inverse restores the immutable pre-perf runtime',()=>{assert.equal(sha(withoutPerf27(fs.readFileSync(file,'utf8'))),delta.parentSha256);});
const report={method:'Source fragments, a scalar steering model and exact host functions; no GPU timing, WGSL execution or gameplay.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
