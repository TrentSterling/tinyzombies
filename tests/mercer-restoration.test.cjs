'use strict';
// Exact host/world bytes plus mechanically adapted production scalar/vector fragments.
// Controlled ray hits/projection/occupancy are fixtures, not gameplay or GPU execution.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{fragment,makeModel,plan}=require('./navigation-model.cjs');
const baseline=require('./mercer-restoration-baseline.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html'),h=loadHost(file),html=h.html,checks=[];
function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const digest=v=>sha(JSON.stringify(v));
check('Mercer authored spine, supplies, mission doors and initial actors stay unchanged',()=>{
 const w=loadHost(require('./audit-fixes25.cjs').auditParentFile25(file)).run('world');for(const field of ['source13','sourceSeed13','sourceDoors13','sourceProps15','sourcePickups13','start','buddy','generators','exit','gate13','final13','startDoor13'])assert.equal(digest(w[field]),baseline.worlds[1].fields[field],field);
 assert.deepEqual(h.json('MERCER13.grid'),baseline.mercer.grid);return{authoredInfected:w.source13.infected.length};
});
for(const seed of [73129,1,4294967295])for(const budget of [0,256,2048,8192])check(`seed ${seed} honors ${budget} initial slots and bounded world/fracture budgets`,()=>{
 h.run(`runSeed=${seed};settings.zombies=${budget};stage=1;world=makeWorld();`);const w=h.run('world'),limits=h.json('({MAX_Z,MAX_WORLD,MAX_PAGES,MAX_GROUPS})');
 let alive=0;for(let i=0;i<limits.MAX_Z;i++)if(w.initialZ13[i*28+3]>0)alive++;
 assert.equal(alive,budget);assert.equal(w.mercer24.population,budget);assert(w.count<limits.MAX_WORLD);assert(w.occupiedPages<=limits.MAX_PAGES);assert(w.groupCount<limits.MAX_GROUPS);
 const groups=new Map();for(let i=0;i<w.count;i++){const g=w.blocks[i*8+7];if(g>0)groups.set(g,(groups.get(g)||0)+1);}
 assert(groups.size>400);assert(Math.max(...groups.values())<=128);assert(w.mercer24.buildings.length===9);
 const connected=Array.from(w.navSeed).filter(x=>x<1073741800).length;assert(connected>18000);assert(connected>baseline.worlds[1].counts.reachable*10||connected>18000);
 for(const [x,z,width,depth]of w.mercer24.buildings){const cell=Math.floor(x+width/2+96)+192*Math.floor(z+depth/2+96);assert(w.navSeed[cell]<1073741800,'building interior disconnected');}
 for(let i=w.source13.infected.length;i<budget;i++){const o=i*28,x=w.initialZ13[o],z=w.initialZ13[o+2],cell=Math.floor(x+96)+192*Math.floor(z+96);assert(w.navSeed[cell]<1073741800);assert.equal(w.walk[cell],0);assert(Math.hypot(x-w.start[0],z-w.start[1])>=15);assert(Math.abs(x)>=43||Math.abs(z)>=28);}
 return{alive,connectedNavCells:connected,voxels:w.count,pages:w.occupiedPages,fractureGroups:groups.size,maxGroupVoxels:Math.max(...groups.values())};
});
check('all supplemental maximum-budget actors have physically clear spawn footprints',()=>{
 const m=makeModel(file);m.host.run('settings.zombies=8192;world=makeWorld();');const z=m.host.run('world.initialZ13');let checked=0;
 for(let i=m.world.source13.infected.length;i<8192;i++){assert(!m.blocked(z[i*28],z[i*28+2],.30),`blocked actor ${i}`);checked++;}return{checked};
});
check('five alternate exterior passages are open in collision and connected on both sides',()=>{
 const m=makeModel(file);for(const [x0,z0,x1,z1]of m.world.mercer24.passages){const center=[(x0+x1)/2,(z0+z1)/2];assert(!m.blocked(...center,.24));const axis=x1-x0<z1-z0?0:1;const a=[...center],b=[...center];a[axis]-=1;b[axis]+=1;assert(m.clear(a,b));for(const p of [a,b])assert(m.world.navSeed[Math.floor(p[0]+96)+192*Math.floor(p[1]+96)]<1073741800);}return{passages:5};
});
check('new building wall blocks movement until a local body-clear breach removes occupancy',()=>{
 const m=makeModel(file),w=m.world;let selected;
 for(const [x,z,width,depth]of w.mercer24.buildings){for(const offset of [3,5,7]){const a=[x+offset,z-.7],b=[x+offset,z+.8];if(!m.blocked(...a)&&!m.blocked(...b)&&!m.clear(a,b)){selected={a,b,x:x+offset,z};break;}}if(selected)break;}
 assert(selected);let removed=0;for(let i=0;i<w.count;i++){const o=i*8,b=w.blocks;if(b[o+7]>0&&Math.abs(b[o]-selected.x)<.85&&Math.abs(b[o+2]-(selected.z+.125))<.43&&b[o+1]<1.72){m.occ[b[o+5]]=0;removed++;}}
 assert(removed>0&&removed<=128);assert(m.clear(selected.a,selected.b));assert(plan(m,selected.a,selected.b).path.length>0);return{removed,from:selected.a,to:selected.b};
});
function V(...xs){xs=xs.flatMap(x=>Array.isArray(x)?x.slice(0,x.dim||x.length):[x]);if(xs.length===1)xs=Array(4).fill(xs[0]);while(xs.length<4)xs.push(0);const a=xs.slice(0,4);for(let i=0;i<4;i++)Object.defineProperty(a,'xyzw'[i],{get:()=>a[i],set:v=>a[i]=v});for(const sw of ['xy','xz','yz','zw','xyz'])Object.defineProperty(a,sw,{get:()=>{const q=V(...[...sw].map(k=>a['xyzw'.indexOf(k)]));q.dim=sw.length;return q;}});Object.defineProperty(a,Symbol.toPrimitive,{value(){throw Error('Unadapted vector coercion')}});return a;}
const vn=(n,...xs)=>{const a=V(...xs);a.dim=n;return a;},add=(a,b)=>vn(a.dim||3,...a.map((x,i)=>x+(Array.isArray(b)?b[i]:b))),sub=(a,b)=>vn(a.dim||3,...a.map((x,i)=>x-b[i])),mul=(a,b)=>vn(a.dim||3,...a.map(x=>x*b)),len=a=>Math.hypot(...a.slice(0,a.dim||3)),dist=(a,b)=>len(sub(a,b)),norm=a=>mul(a,1/Math.max(len(a),.0001));
const scalar=s=>s.replace(/\b(\d+)u\b/g,'$1').replace(/\bvar\b/g,'let').replace(/^fn (\w+)\(([^)]*)\)(?:->\w+)?/,(_,n,p)=>'function '+n+'('+p.replace(/:\w+/g,'')+')');
function context(){const c={V,vec4f:V,vec2f:(...a)=>vn(2,...a),vec3f:(...a)=>vn(3,...a),u32:Math.trunc,f32:Number,min:Math.min,max:(a,b)=>Array.isArray(a)?vn(a.dim||3,...a.map((x,i)=>Math.max(x,b[i]))):Math.max(a,b),abs:a=>Array.isArray(a)?vn(a.dim||3,...a.map(Math.abs)):Math.abs(a),select:(a,b,c)=>c?b:a,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),dot:(a,b)=>a.slice(0,a.dim||3).reduce((sum,x,i)=>sum+x*b[i],0),distance:dist,length:len,safe2:norm,normalize:norm,add,sub,mul,route:h.json('CHAPTER_GEOMETRY16[0].route').map(p=>vn(2,...p)),chapterRoute16(){return this.route},chapterRouteCount16(){return this.route.length},u:{run:V(1,0),config:V(2048),clock:V(1/60),worldInfo:V(0,0)},S:{pos:V(60,0,20,100),look:V(1,0),progress8:V(0),player7:V(0),flags12:V(0),director:V(1,0,.1),botLife13:[V(0),V(0),V(0)],team7:[{p:V(60,0,20,100)},{p:V(61,0,20,100)},{p:V(60,0,21,100)}]},safe:false,safeHouse13(){return this.safe},waves:[],queueWave13(...a){this.waves.push(a)},Z13:[],O:new Uint32Array(36864),NAV_OFFSET:0,navcell:p=>Math.floor(p.x+96)+192*Math.floor(p.y+96),project:()=>V(3,3,0,1)};c.chapterRoute16=()=>c.route;c.chapterRouteCount16=()=>c.route.length;c.safeHouse13=()=>c.safe;c.queueWave13=(...a)=>c.waves.push(a);vm.createContext(c);return c;}
let routeCode=scalar(fragment(html,'fn routePoint24(')).replace('route[n]-a','sub(route[n],a)').replace('dot(p-a,d)','dot(sub(p,a),d)').replace('let q=a+d*t','let q=add(a,mul(d,t))');
let pressureCode=scalar(fragment(html,'fn mercerPressure24(')).replace('home-S.pos.xz','sub(home,S.pos.xz)').replace('z.p.xz-S.pos.xz','sub(z.p.xz,S.pos.xz)').replace('u.vp*vec4f(delta.x,0,delta.y,1)','project(vec4f(delta.x,0,delta.y,1))');
const budgetCode=scalar(fragment(html,'fn directorBudget24('));
function pressure(){const c=context();vm.runInContext(routeCode+'\n'+budgetCode+'\n'+pressureCode,c);return c;}
for(const chapter of [1,2,3,4,5])check('director budget is chapter-scoped: '+chapter,()=>{const c=pressure();c.u.run.x=chapter;for(const budget of [0,256,2048,8192]){c.u.config.x=budget;assert.equal(c.directorBudget24(),chapter===1?budget:Math.min(245,budget));}});
check('off-route warning precedes bounded pressure; cooldown, recovery and retreat work',()=>{
 const c=pressure();c.u.config.x=0;c.mercerPressure24(1.99,0,true,false);assert.equal(c.S.progress8.z,0);c.mercerPressure24(.02,0,true,false);assert.equal(c.S.progress8.z,1);assert.equal(c.waves.length,0);
 for(let n=0;n<6;n++)c.mercerPressure24(1,0,true,false);assert.deepEqual(c.waves,[[12,false,true]]);assert.equal(c.S.progress8.y,24);
 for(let n=0;n<23;n++)c.mercerPressure24(1,0,true,false);assert.equal(c.waves.length,1);c.mercerPressure24(1,0,true,false);assert.equal(c.waves.length,2);
 c.S.pos=V(-19.5,0,2.5,100);c.mercerPressure24(.1,0,true,false);assert.equal(c.S.progress8.x,0);assert.equal(c.S.progress8.z,0);
 for(const [full,forced,near,intensity]of [[false,false,0,.1],[true,true,0,.1],[true,false,45,.1],[true,false,0,.55]]){const q=pressure();q.u.config.x=0;q.S.progress8.x=10;q.S.director.z=intensity;q.mercerPressure24(.1,near,full,forced);assert.equal(q.waves.length,0);}
});
check('maximum 12 sleeping off-screen actors recruited without filling retreat sector or spawning extras',()=>{
 const c=pressure();c.S.progress8.x=8;const home=c.routePoint24(c.S.pos.xz),retreat=norm(sub(home,c.S.pos.xz)),away=mul(retreat,-1);c.u.config.x=40;
 for(let i=0;i<40;i++){const offset=mul(i<20?away:retreat,15+i%6);const p=add(c.S.pos.xz,offset);c.Z13.push({p:V(p.x,0,p.y,80),v:V(0),extraData:V(0),sense13:V(0)});}
 c.mercerPressure24(.1,0,true,false);assert.equal(c.Z13.filter(z=>z.v.w>0).length,12);assert(c.Z13.slice(20).every(z=>z.v.w===0));assert.equal(c.waves.length,0);
 const q=pressure();q.S.progress8.x=8;q.u.config.x=1;q.Z13=[{p:V(70,0,30,80),v:V(0),extraData:V(0),sense13:V(0)}];q.project=()=>V(0,0,0,1);q.mercerPressure24(.1,0,true,false);assert.equal(q.Z13[0].v.w,0);assert.deepEqual(q.waves,[[12,false,true]]);
});
check('safehouse, down, pin and other chapters suppress Mercer pressure',()=>{for(const state of ['safe','down','pin','other']){const c=pressure();c.u.config.x=0;c.S.progress8.x=10;if(state==='safe')c.safe=true;if(state==='down')c.S.player7.x=20;if(state==='pin')c.S.flags12.w=1;if(state==='other')c.u.run.x=2;c.mercerPressure24(1,0,true,false);assert.equal(c.waves.length,0);if(state!=='other')assert.equal(c.S.progress8.z,0);}});
check('off-route formation follows player while other chapters retain exact route formation',()=>{
 const raw=fragment(html,'fn sourceAdvance14(');let code=scalar(raw).replace('array<f32,3>(120.0,65.0,-95.0)','[120.0,65.0,-95.0]').replace('ahead-S.pos.xz','sub(ahead,S.pos.xz)').replaceAll('S.pos.xz-dir*back+vec2f(-dir.y,dir.x)*side','add(sub(S.pos.xz,mul(dir,back)),mul(vec2f(-dir.y,dir.x),side))').replace('desired+vec2f(-dir.y,dir.x)*side','add(desired,mul(vec2f(-dir.y,dir.x),side))');
 const c=context();c.routeAhead14=()=>vn(2,0,0);c.walkGoal14=p=>p;vm.runInContext(code,c);
 for(let id=0;id<3;id++){assert(dist(c.sourceAdvance14(id),c.S.pos.xz)<3);c.u.run.x=2;assert(dist(c.sourceAdvance14(id),vn(2,0,0))<2);c.u.run.x=1;}
 if(raw.includes('u.run.x>5.0')){c.u.run.x=6;c.S.motion=c.S.motion||vn(0,0,0,0);for(let id=0;id<3;id++)assert(dist(c.sourceAdvance14(id),c.S.pos.xz)<2.5,'Maple Street slot stays with the player (bots48)');c.u.run.x=1;}
});
check('axe contact is ray-bounded, one pulse per swing, Mercer-only and structural-safe',()=>{
 const raw=fragment(html,'if(u.run.x==1.0&&u.run.y<.5&&hit.kind==2u');let code=scalar(raw).replace('o+dir*(hit.t+.1)','add(o,mul(dir,hit.t+.1))');
 const c=context();Object.assign(c,{hit:{kind:2,id:0,t:1},W8:[{extraData:V(0,0,0,1)}],o:V(0,.5,0),dir:vn(3,1,0,0)});c.S.axe14=V(.5,0,1,0);c.S.melee8=V(0);c.S.meleeDir8=V(0);vm.runInContext('function contact(){for(let j=0;j<1;j++){'+code+'}}',c);c.contact();assert.equal(c.S.melee8.w,1);assert.equal(c.S.melee8.x,1.1);c.S.melee8.w=0;c.contact();assert.equal(c.S.melee8.w,0);c.S.axe14=V(.5,0,1,0);vm.runInContext('if(u.run.x==1.0){S.progress8.w=-1.0;}',c);assert(html.includes('if(u.run.x==1.0){S.progress8.w=-1.0;}S.axeHits14='));c.contact();assert.equal(c.S.melee8.w,1);c.S.melee8.w=0;
 c.S.axe14.z++;c.W8[0].extraData.w=0;c.contact();assert.equal(c.S.melee8.w,0);c.W8[0].extraData.w=1;c.u.run.x=2;c.contact();assert.equal(c.S.melee8.w,0);
 assert(fragment(html,'fn axeStep14(').includes('world3(o,dir,80.0/64.0,false)'));assert(html.includes('S.melee8.w=0.0;'));assert(html.includes('if(u.run.x==1.0&&u.run.y<.5&&g==0u){damage=0.0;}'));
});
check('source barrel/pump blasts use exact current-frame stamp and bounded radius',()=>{
 const raw=fragment(html,'if(u.run.x==1.0&&u.run.y<.5&&atomicLoad(&C[52])>0u)');let code=scalar(raw).replace('atomicLoad(&C[52])','C[52]').replace('b.p.xyz-vec3f(pr.p.x,.4,pr.p.z)','sub(b.p.xyz,vec3f(pr.p.x,.4,pr.p.z))').replace('normalize(delta+vec3f(.001,.4,0))*9.0','mul(normalize(add(delta,vec3f(.001,.4,0))),9.0)');
 const c=context();Object.assign(c,{C:[],Props:[],b:{p:V(2,.4,0,4)}});c.C[52]=1;c.u.worldInfo.y=1;c.S.aux=V(10);const pr={p:V(0,.4,0,10),data:V(0),more:V(1,0,0,10)};c.Props=[pr];vm.runInContext('function blast(){let damage=0,impulse=V(0);'+code+'return damage}',c);
 assert.equal(c.blast(),60);pr.more.w=9.99;assert.equal(c.blast(),0);pr.more.w=10;c.b.p.x=3.2;assert.equal(c.blast(),0);pr.more.x=2;assert.equal(c.blast(),60);c.u.run.x=2;assert.equal(c.blast(),0);c.u.run.x=1;pr.more.x=5;assert.equal(c.blast(),0);
});
check('bullet/pipe damage and occupancy/fracture/nav handoffs remain connected',()=>{
 const code=h.run('worldShader');for(const needle of ['shot.tag.x==2.0&&u32(shot.tag.y)==i','damage+=60.0','let melee=meleeInside8','damage+=3.2','O[u32(b.extraData.y)]=0u;dirtyAt(b.p.xyz)','atomicStore(&Groups[4096u+g],1u)'])assert(code.includes(needle),needle);
 assert(h.run('fracture8Shader').includes('meleeInside8(p,vec3f(.125),S.melee8,S.meleeDir8)'));assert(h.run('navInitShader').includes('fn bodyFits30(q:vec2f)->bool {return !blocked(vec3f(q.x,.36,q.y),vec3f(.17,.29,.17));}'));assert(html.includes('pass(enc,\'world\''));assert(html.includes('pass(enc,\'fracture8\''));
});
check('pause/retry clears pressure and axe transient state in the exact host',()=>{h.run('settings.zombies=2048;stage=1;reset();playerValues[L8.progress]=18;playerValues[L8.progress+1]=24;playerValues[L8.progress+2]=1;playerValues[L8.progress+3]=4;reset();');assert.deepEqual(h.json('Array.from(playerValues.slice(L8.progress,L8.progress+4))'),[0,0,0,0]);assert(html.includes('if(dt<=0.0||S.goal.w>0.0||u.config.z<.5){return;}'));});
const report={method:'Exact CPU production host, source/asset fingerprints, physical occupancy/navigation reference and mechanically adapted production route/pressure/formation/axe/blast fragments with controlled state. No WGSL compilation, GPU execution, earned gameplay, rendering or performance qualification.',candidateSha256:h.sha256,passed:checks.every(c=>c.passed),checks};console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
