'use strict';
// Polish after the screenshot tour: front doorways (no garage shutters) on Maple Street houses, real picket slats, pools you wade
// through, a ZAMN-style player, and the two GPU maps no longer hidden under their overlay panels.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutPolish46}=require('./polish46.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),parent=path.join(__dirname,'.polish46-parent.html');fs.writeFileSync(parent,withoutPolish46(html));
const W=(f,seed)=>loadHost(f,{seed}).json('(()=>{const w=makeWorld();const doors=w.doors7.map(d=>[d.x,d.z,d.sx]);return {doors,b:w.buildings,civ:w.civilians30,caches:w.caches}})()');
check('Maple Street houses lose their roll-up shutters; the start shelter keeps its door; chapters unchanged',()=>{
 const a=W(file,'4242&sandbox'),b=W(parent,'4242&sandbox');assert.deepEqual(a.b,b.b);assert.deepEqual(a.civ,b.civ);assert.deepEqual(a.caches,b.caches);
 assert(b.doors.length>a.doors.length,'house shutters removed');assert.equal(a.doors.length,1,'only the start shelter door');assert.deepEqual(a.doors[0],b.doors[0]);
 const c=W(file,73129),d=W(parent,73129);assert.deepEqual(c.doors,d.doors);return {before:b.doors.length,after:a.doors.length};
});
check('pickets: one voxel thick, a bottom rail, every other slat standing, 3 m gate',()=>{
 const h=loadHost(file,{seed:'4242&sandbox'});const r=h.json('(()=>{const w=makeWorld();const cols={};for(let i=0;i<w.count;i++){const o=i*8;if(w.blocks[o+4]!==7)continue;const k=Math.round(w.blocks[o]*4)+","+Math.round(w.blocks[o+2]*4);cols[k]=Math.max(cols[k]||0,Math.round(w.blocks[o+1]*4+.5));}const v=Object.values(cols);return {n:v.length,tall:v.filter(x=>x===3).length,rail:v.filter(x=>x===1).length}})()');
 assert(r.n>500);assert(Math.abs(r.tall-r.rail)<r.n*.12,'about half the columns are slats: '+JSON.stringify(r));
});
check('every house still reachable through its narrower doorway (16 streets, against the parent)',()=>{
 const reach=(f,seed)=>{const x=loadHost(f,{seed});x.run('reset()');return x.json('(()=>{const nav=world.occ.subarray(NAV_OFFSET,NAV_OFFSET+NAV_SIZE);return world.buildings.map(b=>nav[Math.floor(b.x+b.w/2+96)+NG*Math.floor(b.z+b.d/2+96)]<0x3fffffff)})()');};
 let n=0;for(let s=1;s<=16;s++){const seed=(s*7919)+'&sandbox',a=reach(file,seed),b=reach(parent,seed);b.forEach((ok,i)=>{if(ok){n++;assert(a[i],seed+' house '+i);}});}return {houses:n};
});
check('pools slow infected and the player only on Maple Street',()=>{
 const src=loadHost(file).sources;assert(src.zombies.includes('if(u.run.x>5.0&&u.run.y<.5&&inPool45(z.p.xz)){speed*=.45;}'));
 assert(Object.values(src).some(s=>s.includes('let speed=select(1.0,.55,u.run.x>5.0&&u.run.y<.5&&inPool45(S.pos.xz))*')),'player wades');
});
check('the maps punch a hole through the overlay panel (recording 2D context)',()=>{
 const h=loadHost(file,{plain:true});h.run('reset()');h.run(`width=1280;height=720;hud2d30={canvas:{width:1280,height:720,clientWidth:1280,clientHeight:720},log:[],clearRect(x,y,w,hh){this.log.push(['clear',x,y,w,hh]);},fillRect(){this.log.push(['rect']);},strokeText(){},fillText(){},measureText(s){return {width:String(s).length*8};}};sizeHud2d30();hud2d30.log.length=0;hudHole30(10,20,100,50);`);
 assert.deepEqual(h.json('hud2d30.log'),[['clear',10,20,100,50]]);assert.equal((html.match(/uiQuad9\(x,y,sz,sz,\[1,1,1,1\],130\);hudHole30\(x,y,sz,sz\);/g)||[]).length,2);
});
check('the Maple Street player is dressed for the lawn',()=>{assert(html.includes('let zeke=player&&typ> -1.5&&u.run.x>5.0&&u.run.y<.5;'));assert(html.includes('vec3f(.98,.82,.22)'));});
check('exact inverse restores the immutable pre-polish runtime',()=>{assert.equal(sha(withoutPolish46(html)),delta.parentSha256);});
fs.unlinkSync(parent);
const report={method:'World builder and HUD in the CPU host against the exact parent; frames rendered on SwiftShader for the PR.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
