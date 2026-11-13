'use strict';
// Executes narrowly translated production WGSL fragments on CPU. Not GPU compilation or playtest evidence.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=process.argv[2]||path.join(__dirname,'../index.html'),html=fs.readFileSync(file,'utf8');
function block(marker,source=html){const at=source.indexOf(marker);assert(at>=0,`Missing production fragment: ${marker}`);const start=source.indexOf('{',at);let depth=0;for(let i=start;i<source.length;i++){if(source[i]==='{')depth++;if(source[i]==='}'&&!--depth)return source.slice(at,i+1);}throw Error('Unclosed '+marker);}
const scalar=s=>s.replace(/\b(\d+)u\b/g,'$1').replace(/\bvar\b/g,'let');
function vec(...xs){xs=xs.flatMap(x=>Array.isArray(x)?x:[x]);if(xs.length===1)xs=Array(4).fill(xs[0]);const v=xs.slice();for(const[i,k]of [...'xyzw'].entries())Object.defineProperty(v,k,{get:()=>v[i]||0,set:n=>v[i]=n});Object.defineProperty(v,'xy',{get:()=>vec(v[0],v[1])});return v;}
const spitRaw=block('fn advanceSpit13('),spitBody=scalar(spitRaw.slice(spitRaw.indexOf('{')+1,-1));
function spitFixture(active=1){const ctx={S:{aux:vec(100),acid13:Array.from({length:16},()=>vec(0,0,0,0))},Z13:Array.from({length:active},()=>({p:vec(0,0,0,100),extraData:vec(0,0,3,0),special13:vec(0,0,.85,1),sense13:vec(9,11,0,0)})),u:{config:vec(active)},vec4f:vec,max:Math.max,u32:Math.trunc};vm.createContext(ctx);vm.runInContext('function advance(dt){'+spitBody+'}',ctx);return ctx;}
let c=spitFixture();c.advance(.4);assert.equal(c.S.acid13.filter(x=>x.w>100).length,0);assert(Math.abs(c.Z13[0].special13.z-.45)<1e-6);c.advance(.46);assert.equal(c.S.acid13.filter(x=>x.w>100).length,1);assert.deepEqual(Array.from(c.S.acid13[0]),[9,11,71/64,105.8]);assert.equal(c.Z13[0].special13.w,-1);c.advance(1);assert.equal(c.S.acid13.filter(x=>x.w>100).length,1,'expired projectile must not allocate twice');
c=spitFixture();c.S.acid13=Array.from({length:16},()=>vec(1,2,3,200));c.advance(1);assert.equal(c.Z13[0].special13.w,-1,'full pool consumes projectile');assert(c.S.acid13.every(x=>x.w===200));c.S.acid13[7].w=99;c.advance(1);assert.equal(c.S.acid13[7].w,99,'dropped projectile cannot land later');
c=spitFixture(2);c.advance(1);assert.equal(c.S.acid13.filter(x=>x.w>100).length,2,'sequential owner allocates separate slots');
c=spitFixture();c.Z13[0].extraData.z=2;c.advance(1);assert.equal(c.Z13[0].special13.z,.85,'nonspitter untouched');
c=spitFixture();c.Z13[0].special13.w=-1;c.advance(1);assert.equal(c.Z13[0].special13.z,.85,'inactive spitter untouched');
// Execute the actual mode gate/call/chapter-return fragment with counters, not a hand-written mode model.
const gateAt=html.indexOf('if(u.run.y>.5){S.supplies=vec4f(8,3,0,0);return;}');assert(gateAt>=0);
const chapter=block('if(u.run.x<=5.0){chapterMission13(dt);return;}',html.slice(gateAt));
const gate=html.slice(gateAt,html.indexOf(chapter,gateAt)+chapter.length);
assert.equal((gate.match(/advanceSpit13\(dt\)/g)||[]).length,1,'shared mode gate owns one advancement');
const chapterBody=block('fn chapterMission13(');assert(!chapterBody.includes('advanceSpit13(')&&!chapterBody.includes('S.acid13[slot]'),'chapter must not double advance');
for(const [stage,lab,expected,chapters]of [[1,0,1,1],[5,0,1,1],[6,0,1,0],[6,1,0,0]]){const ctx={u:{run:vec(stage,lab)},S:{},dt:.1,vec4f:vec,n:0,ch:0};ctx.advanceSpit13=()=>ctx.n++;ctx.chapterMission13=()=>ctx.ch++;vm.createContext(ctx);vm.runInContext('(function(){'+scalar(gate)+'})()',ctx);assert.equal(ctx.n,expected,`stage ${stage} lab ${lab}`);assert.equal(ctx.ch,chapters);}
// Run the production cardinal gate choice with operator translation only.
const civ=block('fn civStep30(');assert(/var result=vec2f\(0(?:\.0)?\)/.test(civ),'blocked direct path must default to safe zero');
const portalRaw=block('if(a<4u)',civ);
const portalJS=scalar(portalRaw).replace(/vec2f\(c\)\+\.5-HALF/g,'center').replace(/gate-me/g,'sub(gate,me)');
for(const [a,gate,me,expected]of [[0,[0,.3],[0,.3],[-.5,.5]],[0,[0,-.3],[.1,-.3],[-.5,.5]],[0,[0,.3],[.4,.3],[0,.3]],[4,[0,.3],[0,.3],[-.5,.5]]]){const ctx={a,wc:0,wn:0,d:vec(-1,0),c:vec(0),center:vec(.5,.5),aim:vec(-.5,.5),me:vec(...me),portal30:()=>vec(...gate),length:v=>Math.hypot(...v),sub:(x,y)=>vec(x[0]-y[0],x[1]-y[1])};vm.createContext(ctx);vm.runInContext(portalJS,ctx);assert.deepEqual(Array.from(ctx.aim),expected,'near portal crosses toward neighbor center');}
console.log('roadmap96-specials: production-fragment spit lifecycle, mode placement, and portal crossing passed (CPU only)');

