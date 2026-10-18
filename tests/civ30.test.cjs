'use strict';
// Maple Street neighbors (milestone 2a): placement, reserved prop slots, the civilian pass contract, targeting, HUD and end card.
// Exact host functions, world builder and source fragments; GPU execution evidence is described in the PR, not run here.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutCiv30}=require('./civ30.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const sandbox=seed=>{const h=loadHost(file,{seed:seed+'&sandbox'});h.run('world=makeWorld()');return h;};

check('every seed places up to 8 neighbors inside houses, in reserved slots, all reachable',()=>{
 let counts=[];
 for(let s=1;s<=16;s++){const h=sandbox(s*7919);const r=h.json(`(()=>{const nav=world.occ.subarray(NAV_OFFSET,NAV_OFFSET+NAV_SIZE);return {n:world.civilians30.length,props:world.propCount,civ:world.civilians30.map(c=>({slot:c.slot,kind:world.props[c.slot*16+3],hp:world.props[c.slot*16+4],state:world.props[c.slot*16+5],type:c.type||0,inHouse:world.buildings.some(b=>c.x>b.x&&c.x<b.x+b.w&&c.z>b.z&&c.z<b.z+b.d),reach:nav[Math.floor(c.x+96)+NG*Math.floor(c.z+96)]<0x3fffffff}))};})()`);
  assert(r.n>=4&&r.n<=8,'count '+r.n);assert(r.props<=h.json('CIV_BASE30'),'level props never reach the reserved slots');counts.push(r.n);
  r.civ.forEach((c,i)=>{assert.equal(c.slot,h.json('CIV_BASE30')+i);assert.equal(c.kind,30);assert.equal(c.hp,60);assert.equal(c.state,1);assert(c.inHouse||[1,2,4].includes(c.type),'inside a house (yard and pool types since victims47)');assert(c.reach,'reachable seed '+s);});}
 return {neighborsPerSeed:counts};
});
check('chapters and plain URLs get no neighbors and no civilian dispatch',()=>{
 const h=loadHost(file);for(let st=1;st<=5;st++){h.run(`stage=${st};world=makeWorld()`);assert.equal(h.json('world.civilians30?.length||0'),0);assert.equal(h.json(`world.props[${h.json('CIV_BASE30')}*16+3]`),0);}
 assert(h.script.includes("if(world.civilians30?.length)pass(enc,'civilians30',bindings.civilians30[zParity],1);"));
});
check('civilian pass: join at 2.2 m, follow on the squad field, bites from awake infected, saved in the shelter, HUD mirror',()=>{
 const s=loadHost(file).sources.civilians30;
 for(const k of ['if(c.data.y<1.5&&d<2.2&&player.w>0.0){c.data.y=2.0;atomicAdd(&C[24],1u);',...(s.includes('Followers take their own place')?['stride2=civStep30(me,goal)','if(ed<footprint(e.extraData.z)+.42){bites++;}']:['stride2=civStep30(me,player.xz)','e.p.w>0.0&&e.v.w>0.0&&distance(e.p.xz,me)<footprint(e.extraData.z)+.42']),'c.data.y=4.0;atomicAdd(&C[25],1u);','c.data.y=3.0;atomicAdd(&C[29],1u);',(s.includes('let panic=c.data.y<1.5')?'SR[976u+k]=vec4f(c.p.x,c.p.z,c.data.y+select(0.0,.25,panic),c.data.x);':'SR[976u+k]=vec4f(c.p.x,c.p.z,c.data.y,c.data.x);'),'stepOpen30(wc,wn,d,','portal30('])assert(s.includes(k),k);
 assert.equal(h0().json('CIV_STATE30')/4,976,'mirror sits in the unused State tail');assert(h0().json('L13.stateFloats')<=3904);
 function h0(){return loadHost(file);}
});
check('infected target neighbors in the sandbox only, sit on them, and skip the squad damage path',()=>{
 const z=loadHost(file).sources.zombies;assert(z.includes('if(u.run.x>5.0&&u.run.y<.5){for(var ck=0u;ck<12u;ck++){let cv=Props[CIV_BASE30+ck];'));assert(z.includes('victim=5u;'));
 assert(z.includes('if(distance>4.0&&victim!=5u){let angle=rnd(i*29u)'));assert(z.includes('if(victim<4u&&awake&&sight'),'squad melee path still excludes victim 5');
});
check('HUD tally, campy notes and HELP markers draw; end card counts the saved',()=>{
 const h=loadHost(file,{seed:'99&sandbox'});h.run('reset();glyphBuffer={name:"glyphBuffer"};settings.started=true;playerValues[3]=100;');
 h.run('glyphCount=0;hud()');const base=h.json('glyphCount');
 h.run(`counters[24]=1;for(let c=0;c<world.civilians30.length;c++){playerValues[CIV_STATE30+c*4]=playerValues[0]+1;playerValues[CIV_STATE30+c*4+1]=playerValues[2];playerValues[CIV_STATE30+c*4+2]=1;}glyphCount=0;hud();playerValues[CIV_STATE30+2]=2;glyphCount=0;hud()`);
 assert(h.json('glyphCount')>base,'note and HELP markers add glyphs');assert(/joined|following|manager|opinions|with you|team|squad|tube|grill/.test(h.json('civNote30')),h.json('civNote30'));
 h.run('counters[29]=2;counters[25]=1;playerValues[67]=1;glyphCount=0;hud()');assert(h.json('glyphCount')>30);
 for(const lines of Object.values(h.json('CIV_LINES30')))for(const l of lines)assert(!/—/.test(l),'no em dashes');
});
check('exact inverse restores the immutable pre-neighbors runtime',()=>{assert.equal(sha(withoutCiv30(fs.readFileSync(file,'utf8'))),delta.parentSha256);});
const report={method:'Exact host functions, world builder and source fragments; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
