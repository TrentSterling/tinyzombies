'use strict';
// Actual host clock/uniform functions plus a literal scalar translation of the
// extracted WGSL bit test. No shader compilation, GPU execution or gameplay.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const {loadHost}=require('./deadends-cpu-host.cjs');
const h=loadHost(process.argv[2]||path.join(__dirname,'../index.html')),checks=[];
const helper=h.run('COMMON').match(/fn firePhase17\(mask:f32,phase:u32\)->bool \{([^}]+)\}/);
assert(helper,'actual shared shader helper');
const phase=new Function('mask','phase',helper[1].replace(/u32\(([^)]+)\)/g,'($1>>>0)').replace(/(\d+)u\b/g,'$1'));
const check=(name,fn)=>{try{const detail=fn();checks.push({name,passed:true,...detail});}catch(e){checks.push({name,passed:false,error:e.stack});}};
function timeline(dts){return h.json(`(()=>{firePhase17=fireRemainder17=0;return ${JSON.stringify(dts)}.map(dt=>fireMask17(dt));})()`);}
function oracle(dts){let elapsed=0,previous=0;return dts.map(dt=>{elapsed+=Math.max(0,Math.min(dt,1/30));const end=Math.floor(elapsed*60+1e-7);let mask=0;for(let t=previous+1;t<=end;t++)mask|=1<<(t%12);previous=end;return mask;});}
function verify(dts){const masks=timeline(dts);assert.deepEqual(masks,oracle(dts));for(const m of masks){assert(m>=0&&m<4096);assert.equal(Math.fround(m),m);assert(m.toString(2).replace(/0/g,'').length<=2);}return masks;}
for(const hz of [30,60,120])check(`${hz} Hz: all 12 infected offsets and four survivor phases`,()=>{
 const masks=verify(Array(hz*10).fill(1/hz)),infected=[],survivors=[];
 for(let id=0;id<12;id++){let damage=0;for(const m of masks)if(phase(m,12-id%12))damage+=19;assert.equal(damage,950);infected.push(damage);}
 for(let id=0;id<4;id++){let raw=0,guarded=0,cool=0;for(const m of masks){cool=Math.max(0,Math.fround(cool-Math.fround(1/hz)));if(phase(m,id*3)){raw+=9;if(cool<=0){guarded+=9;cool=Math.fround(.37);}}}assert.equal(raw,450);assert.equal(guarded,225);survivors.push({raw,guarded});}
 return {simSeconds:10,infectedDamage:infected,survivorDamage:survivors};
});
check('30 Hz preserves both crossed odd/even phases',()=>{assert.deepEqual(verify([1/30,1/30,1/30]),[6,24,96]);});
check('120 Hz does not repeat a phase on its empty half-tick',()=>{assert.deepEqual(verify([1/120,1/120,1/120,1/120]),[0,2,0,4]);});
check('60 Hz phase origin matches source tick increment before update',()=>{const m=verify(Array(12).fill(1/60));assert.deepEqual(m,[2,4,8,16,32,64,128,256,512,1024,2048,1]);});
check('jittered bounded intervals match an independent elapsed-time oracle',()=>{const choices=[1/30,1/47,1/60,1/90,1/120,1/144,1/240,0];let seed=173;const dt=Array.from({length:12000},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return choices[seed%choices.length];});verify(dt);});
check('fractional tick carries through pause without damage or phase loss',()=>{assert.deepEqual(verify([1/120,0,0,0,1/120,0,1/60]),[0,0,0,0,2,0,4]);});
check('jitter preserves every phase but does not claim fixed-step cooldown eligibility',()=>{
 const dts=[...Array(18).fill(.033),.006,...Array(12).fill(1/60)],m=verify(dts);let elapsed=0,cool=0;const hits=[];
 for(let n=0;n<dts.length;n++){elapsed+=dts[n];cool=Math.max(0,Math.fround(cool-Math.fround(dts[n])));if(phase(m[n],0)&&cool<=0){hits.push(+elapsed.toFixed(3));cool=Math.fround(.37);}}
 assert.deepEqual(hits,[.231,.8]);return {knownLimit:'Variable-step survivor cooldown eligibility remains quantized to frame endpoints; source fixed-step hits would be .2 and .6.',observedScalarHitTimes:hits};
});
check('sub-tick boundary and fractional carry are stable',()=>{const m=verify([1/180,1/180,1/180,1/240,1/240,1/240,1/240]);assert.deepEqual(m,[0,0,2,0,0,0,4]);});
check('long bounded clock remains phase-stable without unbounded counters',()=>{const dt=Array(120*600).fill(1/120),m=verify(dt);assert.equal(m.filter(x=>phase(x,0)).length,3000);const s=h.json('({firePhase17,fireRemainder17})');assert.equal(s.firePhase17,0);assert(s.fireRemainder17<1e-8);});
check('reset clears phase and fraction before the zero-dt uniform upload',()=>{h.run('firePhase17=7;fireRemainder17=.75;reset()');assert.deepEqual(h.json('({firePhase17,fireRemainder17})'),{firePhase17:0,fireRemainder17:0});const b=h.writes.get('U'),u=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));assert.equal(u[99],0);assert.equal(h.run('fireMask17(1/60)'),2);});
check('actual updateUniforms uploads mask only in existing meta12.w',()=>{
 h.run('reset();frame=731;time=4;updateUniforms(1/30)');const b=h.writes.get('U'),u=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));assert.equal(u[34],731);assert.equal(u[99],6);assert.deepEqual([...u.slice(96,99)],h.json('[input12.previous,input12.lastGun,input12.throwable]'));
 h.run('updateUniforms(0)');const z=h.writes.get('U'),v=new Float32Array(z.buffer.slice(z.byteOffset,z.byteOffset+z.byteLength));assert.equal(v[99],0);assert.equal(h.run('firePhase17'),2);
});
check('three fire sites retain actor phases and original damage/eligibility',()=>{
 const s=h.script;assert.equal((s.match(/firePhase17\(u\.meta12\.w,/g)||[]).length,3);
 assert(s.includes('S.feedback.z<=0.0&&firePhase17(u.meta12.w,0u)'));
 assert(s.includes('if(burning&&firePhase17(u.meta12.w,12u-i%12u)){damage+=19.0;}'));
 assert(s.includes('firePhase17(u.meta12.w,(id+1u)*3u)&&d<fireRadius13'));
 assert(s.includes('S.pos.w=max(0.0,S.pos.w-9.0);')&&s.includes('S.feedback.z=.37;'));
 assert(s.includes('a.p.w=max(0.0,a.p.w-9.0);')&&s.includes('a.vital.y=.37;'));
 assert(!s.includes('(u32(u.clock.z)+i)%12u')&&!s.includes('u32(u.clock.z)%12u'));
});
check('zero masks cannot cause fire damage for any actor phase',()=>{for(let p=0;p<24;p++)assert.equal(phase(0,p),false);});
check('mask helper agrees for all exactly representable 12-bit masks',()=>{for(let m=0;m<4096;m++)for(let p=0;p<24;p++)assert.equal(phase(Math.fround(m),p),!!(m&(1<<(p%12))));});
check('existing population and state allocation contracts remain unchanged',()=>{assert.deepEqual(h.json('[settings.zombies,settings.pool,MAX_Z,MAX_P,L13.stateFloats,L13.zombieBytes]'),[2048,32768,8192,65536,3896,112]);});
check('isolated GPU fixture parses and extracts the exact production clock',()=>{
 const fixture=fs.readFileSync(path.join(__dirname,'hardware/fire-cadence.html'),'utf8'),script=fixture.match(/<script type="module">([\s\S]*?)<\/script>/)[1];new vm.Script('(async()=>{'+script+'})()');
 const clock=h.html.match(/function fireMask17\(dt\)\{([\s\S]*?)\n\}/)[0],advance=new Function('let firePhase17=0,fireRemainder17=0;'+clock+';return fireMask17;')();assert.deepEqual([1/120,1/120,1/30,0].map(advance),[0,2,12,0]);
 for(const forbidden of ['localStorage.setItem','localStorage.removeItem','settings.zombies=','settings.pool=','__tiny.teleport'])assert(!script.includes(forbidden));assert(script.includes('device?.destroy()'));assert(script.includes('b.destroy()'));assert(script.includes('sha===manifest.runtimeSha256'));
});
const report={method:'CPU-only exact host clock/uniform execution plus translated extracted WGSL mask expression; no shader compilation or gameplay.',candidateSha256:h.sha256,passed:checks.every(x=>x.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
