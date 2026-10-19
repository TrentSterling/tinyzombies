'use strict';
// Parity-audit fixes: director dead-bot stall, Mercer/Burnout alarm cars, guarded N/dev keys, loadout HUD.
// Exact host functions and source fragments only; no shader compilation, GPU execution or gameplay.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutAuditFixes25}=require('./audit-fixes25.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const host=opts=>{const h=loadHost(file,opts);h.run('reset()');return h;};
const alarms=(h,stage)=>h.json(`(()=>{stage=${stage};world=makeWorld();const p=world.props,out=[];for(let i=0;i<world.propCount;i++)if(p[i*16+6]===1)out.push(p[i*16+11]);return out;})()`);

check('director ignores dead bots when measuring downed stress',()=>{
 const h=host(),src=Object.values(h.sources).find(s=>s.includes('fn directorStep13('));assert(src,'director shader present');
 assert(src.includes('down=pos.w<=0.0&&S.botLife13[who-1u].y<.5;'),'dead flag guards bot downed stress');
 assert(!src.includes('down=pos.w<=0.0;}'),'unguarded form removed');
 // A dead bot contributed +0.4 forever; FADE only relaxes below 0.32.
 const peak=(downed,dead)=>Math.min(.95,(downed&&!dead)?.4:0);assert(peak(true,true)<.32);assert(peak(true,false)>=.32);
});
check('alarm cars match DEAD ENDS startMap at the captured seeds',()=>{
 const h=host(),got=[1,2,3,4,5].map(s=>alarms(h,s));
 assert.deepEqual(got,[[23],[22],[],[],[18]]);return {alarmPropIds:got};
});
check('alarm cars become live props exactly like Deadweight; nothing else in any chapter changes',()=>{
 const {auditParentFile25}=require('./audit-fixes25.cjs'),c=loadHost(file),p=loadHost(auditParentFile25(file)),out={};
 const digest=v=>ArrayBuffer.isView(v)?sha(Buffer.from(v.buffer,v.byteOffset,v.byteLength)):sha(JSON.stringify(v));
 // height67 grew each zombie from 28 to 32 floats (Zombie.body, zero at spawn); compare the 28 shared floats per slot.
 const s28=v=>{if(!(ArrayBuffer.isView(v)&&v.constructor.name==='Float32Array')||v.length%32||v.length/32!==8192)return v;const o=new Float32Array(8192*28);for(let i=0;i<8192;i++){o.set(v.subarray(i*32,i*32+28),i*28);}return o;};
 for(const stage of [1,2,3,4,5]){
  for(const h of [c,p])h.run(`stage=${stage};world=makeWorld();`);
  const wc=c.run('world'),wp=p.run('world');
  if(stage>2){for(const f of Object.keys(wp))assert.equal(digest(s28(wc[f])),digest(s28(wp[f])),`Chapter${stage} ${f}`);out[stage]='identical';continue;}
  const id=stage===1?23:22,rows=w=>Array.from({length:w.propCount},(_,i)=>Array.from(w.props.slice(i*16,i*16+16)));
  const rc=rows(wc),rp=rows(wp),k=rc.findIndex(r=>r[11]===id&&r[6]===1);
  assert.equal(wc.propCount,wp.propCount+1);assert(k>=0,'alarm row present');assert.equal(rc[k][12],7,'car prop kind');
  assert.deepEqual(rc.filter((_,i)=>i!==k),rp,'every other prop row unchanged');
  assert.equal(wc.doorFirst7,wp.doorFirst7+1);assert.equal(wc.gate13,wp.gate13+(wp.gate13>=0?1:0));
  const removed=wp.count-wc.count;assert(removed>0&&removed<=200,'only the car body leaves the static voxels: '+removed);
  assert.deepEqual(Array.from(wc.source13.props.filter(q=>q.alarm),q=>q.id),[id]);
  out[stage]={alarmRow:k,staticVoxelsMovedToProp:removed};
 }
 return {chapters:out};
});
check('one N press only warns; a second press resets the campaign',()=>{
 const h=host();h.run('stage=3');h.key('KeyN');h.advanceFrameHost();
 assert.equal(h.json('stage'),3);assert.equal(h.json('seedRequested'),false);assert.match(h.json('toolHint'),/Press N again/);
 h.key('KeyN');h.advanceFrameHost();assert.equal(h.json('stage'),1);
});
check('L, T and F6 are inert without ?dev and never disable saving',()=>{
 const h=host(),before=h.json('[settings.practice,settings.lab,settings.demo,settings.zombies]');
 for(const k of ['KeyL','KeyT','F6'])h.key(k);
 assert.deepEqual(h.json('[settings.practice,settings.lab,settings.demo,settings.zombies]'),before);assert.notEqual(h.json('!!settings.practice'),true);
});
check('dev keys still work with ?dev and raise the practice flag',()=>{
 const h=host({seed:'73129&dev'});h.key('F6');assert.equal(h.json('settings.practice'),true);assert.equal(h.json('settings.zombies'),4096);
});
check('loadout strip draws every slot, then fades out when gear is idle',()=>{
 const h=host();h.run('time=10;loadoutSig25="";glyphCount=0;drawLoadout25(1,0)');const shown=h.json('glyphCount');assert(shown>60,'slots drawn: '+shown);
 h.run('time=14;glyphCount=0;drawLoadout25(1,0)');assert.equal(h.json('glyphCount'),0);
 h.run('playerValues[L12.items+2]=3;glyphCount=0;drawLoadout25(1,0)');assert(h.json('glyphCount')>60,'pickup re-shows strip');
 return {glyphsWhenShown:shown};
});
check('click-to-play clears a pre-start pause before the paused guard',()=>{
 const src=fs.readFileSync(file,'utf8');const a=src.indexOf('if(!settings.started&&!settings.help&&!completedBoundary15){settings.paused=false;settings.tactical=false;}'),b=src.indexOf('  if(settings.paused||settings.help||settings.tactical)return;\n  if(completedBoundary15)return;');
 assert(a>0&&b>a);
});
check('exact inverse restores the immutable pre-audit runtime',()=>{
 const html=fs.readFileSync(file,'utf8');assert.equal(sha(withoutAuditFixes25(html)),delta.parentSha256);assert.equal(delta.changes.length,16);
});

const report={method:'CPU host functions, world builder and source fragments; no WGSL compilation, GPU execution or gameplay.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
