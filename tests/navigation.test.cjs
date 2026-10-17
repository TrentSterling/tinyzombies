'use strict';
// CPU geometry/path/movement regressions, not WGSL compilation or playtesting.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const{makeModel,localEdge,localPath,plan,fragment}=require('./navigation-model.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html'),m=makeModel(file),checks=[];
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function check(name,fn){try{const details=fn();checks.push({name,passed:true,...details});}catch(e){checks.push({name,passed:false,error:e.message});}}
const starts=[[29.753629684448242,-18.020959854125977],[29.603023529052734,-18.96685028076172],[29.03496551513672,-18.39631462097168]];
const goals=[[35.17354965209961,-16.90965461730957],[33.8125,-17.40625],[35.453125,-17.40625]];
check('reviewed WGSL local-edge reference remains synchronized',()=>{assert.equal(sha(fragment(m.host.html,'fn localEdge15(')),'fd1db12dabc01f33eb39cb433b69610d8488b5001e9ac25a74e502c2d0343f00');});
check('reviewed WGSL local-search reference remains synchronized',()=>{assert.equal(sha(fragment(m.host.html,'fn localPath15(').replace(',requireGoal24:bool','').replace(' if(requireGoal24&&any(nodes[bestID].cell!=finish)){atomicAdd(&C[86],expanded);return 0u;}\n','')),'d4b16db79d567d97e905ad9d0c6bd0715c3ddfb873d79970a75e555bcbfe5903');});
check('fallback is bounded and retains exact physical body/scratch sizes',()=>{
 assert(m.host.html.includes('if(count==0u&&d<12.0){count=localPath15(id,a.p.xz,destination7,false);}'));
 assert(m.host.html.includes('nodes:array<Node7,256>'));assert(m.host.html.includes('reverse:array<vec2i,128>'));
 assert(m.host.html.includes('distance(a.p.xz,a.route[id].xz)<select(28.0/64.0,a.route[id].w,a.route[id].w>0.0)'));
 assert(fragment(m.host.html,'fn localPath15(').includes('vec4f(p.x,0,p.y,.125)'));assert(fragment(m.host.html,'fn localPath15(').includes('if(at>0){atomicAdd(&C[86],expanded);return 0u;}'));
});
for(let i=0;i<3;i++){
 check('captured safehouse coarse route remains incomplete and bounded: bot '+i,()=>{
  assert(!m.blocked(...starts[i]));assert(!m.blocked(...goals[i]));assert(!m.clear(starts[i],goals[i]));
  const r=m.coarse(starts[i],goals[i]);if(m.world.mercer24)assert(!r.reached);else assert.equal(r.path.length,0);assert.equal(r.expanded,192);return{expanded:r.expanded};
 });
 check('fallback connects captured bot '+i+' without crossing collision',()=>{
  const r=plan(m,starts[i],goals[i]);assert(r.fallback);assert(r.reached);assert(r.path.length>0&&r.path.length<=16);assert(r.nodes<=256&&r.expanded<=192);
  let previous=starts[i];for(const p of r.path){assert(localEdge(m,previous,p),'blocked route edge');previous=p;}
  return{expanded:r.expanded,nodes:r.nodes,waypoints:r.path.length};
 });
}
check('fine diagonal cannot cut the safehouse wall corner',()=>{assert(!localEdge(m,[29.75,-18.25],[30.25,-17.75]));assert(localEdge(m,[29.75,-17.75],[30.25,-17.75]));});
check('fine edge rejects structural wall crossing',()=>{assert(!localEdge(m,[29.75,-19.25],[30.75,-19.25]));});
check('closed final door remains physically impassable',()=>{
 const d=m.world.final13,o=d*16;m.props[o+1]=1;m.props[o+5]=1;m.dynamic();
 try{assert(!localEdge(m,[29.75,-17.25],[30.75,-17.25]));const r=localPath(m,starts[0],goals[0]);assert(!r.reached);assert(r.path.every(p=>p[0]<30));assert(r.nodes<=256&&r.expanded<=192);return{expanded:r.expanded,nodes:r.nodes};}
 finally{m.openDoor(d);m.dynamic();}
});
check('closed service gate remains physically impassable',()=>{
 const d=m.world.gate13,o=d*16;m.props[o+1]=1;m.props[o+5]=1;m.dynamic();
 try{assert(!localEdge(m,[1,-4.5],[1,-3.5]));assert(!m.passCell(97,92));}
 finally{m.openDoor(d);m.dynamic();}
});
check('closed ordinary freight door keeps existing coarse planning behavior',()=>{
 const a=[4.4,-2],b=[6.5,-2],r=plan(m,a,b);assert(r.path.length>0);assert(!r.fallback);assert(!localEdge(m,[5,-2],[6,-2]));
});
for(const [name,a,b]of [['street',[-19,15.5],[-19,10]],['service approach',[-4,2.5],[.5,2.5]],['open freight yard',[7,-2],[9,-2]]])check('successful '+name+' coarse route is unchanged',()=>{
 const before=m.coarse(a,b),after=plan(m,a,b);assert(before.path.length>0);assert.deepEqual(after.path,before.path);assert(!after.fallback);
});
check('goals at 12 metres never trigger the local retry',()=>{const r=plan(m,[29.75,-18.02],[45,-17]);assert(!r.fallback);});
check('worst-case local search respects node/expansion/edge/route caps',()=>{
 const blocked={blocked:(x,z)=>Math.hypot(x-10,z-10)<1};const r=localPath(blocked,[0,0],[10,10]);assert(!r.reached);assert(r.nodes<=256);assert(r.expanded<=192);assert(r.edgeChecks<=192*8);assert(r.path.length<=16);return{expanded:r.expanded,nodes:r.nodes,edgeChecks:r.edgeChecks};
});
check('hazards retain a positive path penalty',()=>{const clear={blocked:()=>false};const a=localPath(clear,[0,0],[4,0]),b=localPath(clear,[0,0],[4,0],[{x:2,z:0,radius:.6,cost:18}]);assert(a.reached&&b.reached);assert(b.path.some(p=>Math.abs(p[1])>.75));});

const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),unit=v=>{const d=Math.max(Math.hypot(...v),.0001);return v.map(x=>x/d);};
function simulateSquad(speed,lookahead=false){
 const bots=starts.map(p=>({p:[...p],route:[],waypoint:0,arrival:0,nextPlan:0})),dt=1/60;let fallbacks=0,maxStuck=0;const stuck=[0,0,0];
 for(let frame=0;frame<900;frame++){
  for(let i=0;i<3;i++){
   const a=bots[i],goal=goals[i],d=distance(a.p,goal);if(d<.85)continue;
   if(frame>=a.nextPlan){const r=plan(m,a.p,goal);a.route=r.path;a.waypoint=0;a.arrival=r.arrival;a.nextPlan=frame+54;if(r.fallback)fallbacks++;}
   let dir=unit([goal[0]-a.p[0],goal[1]-a.p[1]]);
   if(!m.clear(a.p,goal)){
    while(a.waypoint<a.route.length&&distance(a.p,a.route[a.waypoint])<a.arrival)a.waypoint++;
    if(lookahead&&a.waypoint<a.route.length){for(let n=a.waypoint+1;n<Math.min(a.route.length,a.waypoint+5);n++){
     const target=a.route[n],d=distance(a.p,target),steps=Math.min(112,Math.ceil(d/.35));let clear=true;
     for(let k=1;k<steps;k++){const t=k/steps;if(m.blocked(a.p[0]+(target[0]-a.p[0])*t,a.p[1]+(target[1]-a.p[1])*t,.25,.42,.06)){clear=false;break;}}
     if(clear)a.waypoint=n;else break;
    }}
    if(a.waypoint<a.route.length)dir=unit([a.route[a.waypoint][0]-a.p[0],a.route[a.waypoint][1]-a.p[1]]);else dir=[0,0];
   }
   const avoid=[0,0];for(const other of bots){const dv=[a.p[0]-other.p[0],a.p[1]-other.p[1]],dd=Math.hypot(...dv);if(dd>.005&&dd<.78){const u=unit(dv);avoid[0]+=u[0]*(.78-dd)*2.2;avoid[1]+=u[1]*(.78-dd)*2.2;}}
   const pd=[a.p[0]-goals[0][0],a.p[1]-goals[0][1]],plen=Math.hypot(...pd);if(plen>.02&&plen<.8){const u=unit(pd);avoid[0]+=u[0]*(.8-plen)*2;avoid[1]+=u[1]*(.8-plen)*2;}
   dir=unit(dir.map((v,k)=>v+Math.max(-.55,Math.min(.55,avoid[k]))));const step=Math.min(d,Math.max(0,d-.828125),dt*speed),before=[...a.p];
   if(!m.blocked(a.p[0]+dir[0]*step,a.p[1]))a.p[0]+=dir[0]*step;
   if(!m.blocked(a.p[0],a.p[1]+dir[1]*step))a.p[1]+=dir[1]*step;
   assert(!m.blocked(...a.p));stuck[i]=distance(before,a.p)<dt*.25?stuck[i]+dt:Math.max(0,stuck[i]-dt);maxStuck=Math.max(maxStuck,stuck[i]);
  }
  if(bots.every((b,i)=>distance(b.p,goals[i])<.85))return{seconds:(frame+1)*dt,fallbacks,maxStuck,positions:bots.map(b=>b.p)};
 }
 throw Error('CPU movement model stalled: '+JSON.stringify(bots.map((b,i)=>({p:b.p,d:distance(b.p,goals[i])}))));
}
for(const lookahead of [false,true])for(const [name,speed]of [['walk',204/64],['sprint',204/64*1.42]])check('all captured bots traverse with '+name+' movement, avoidance and lookahead '+lookahead,()=>simulateSquad(speed,lookahead));
const report={method:'CPU reference model against exact world geometry and captured in-game coordinates; source fingerprints lock the new WGSL/reference correspondence. Not WGSL execution, browser playtesting or a performance measurement.',candidateSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
