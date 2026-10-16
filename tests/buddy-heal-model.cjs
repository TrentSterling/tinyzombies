'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const file=process.argv[2]||path.join(__dirname,'../index.html'),html=fs.readFileSync(file,'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function fragment(s,n){const i=s.indexOf(n);assert(i>=0,n);let start=s.indexOf('{',i),d=0;for(let k=start;k<s.length;k++){if(s[k]==='{')d++;else if(s[k]==='}'&&!--d)return s.slice(i,k+1);}throw Error(n);}
const shader=html.slice(html.indexOf('const buddyShader='),html.indexOf('const squadNav7Shader=')),full=fragment(shader,'@compute @workgroup_size(1) fn update()');
let code=full.slice(full.indexOf('{')+1,-1).replace(/\b(\d+)u\b/g,'$1').replace(/\bvar\b/g,'let').replace('let claims:array<i32,4>','let claims=new Array(4)').replace(/atomicExchange\(&C\[([^\]]+)\],([^\)]+)\)/g,'exchange($1,$2)').replace(/atomicAdd\(&C\[([^\]]+)\],([^\)]+)\)/g,'increment($1,$2)');
// Mechanical vector operators on paths exercised here. Untranslated vector coercion throws.
code=code.replaceAll('a.p.xyz+vec3f(0,.4,0)','add(a.p.xyz,vec3f(0,.4,0))').replaceAll('t.xyz+vec3f(0,.4,0)','add(t.xyz,vec3f(0,.4,0))');
code=code.replace('floor(a.p.xz+HALF)','floor(add(a.p.xz,HALF))').replace('grid+vec2i(xx,zz)','add(grid,vec2i(xx,zz))').replace('any(c<vec2i(0))','any(less(c,vec2i(0)))').replace('any(c>=vec2i(NG))','any(greaterEqual(c,vec2i(NG)))');
// WGSL struct/vector assignment is by value; preserve this at mutable local boundaries.
code=code.replace('let a=S.team7[id];','let a=clone(S.team7[id]);').replace('let mag=S.botMag13[id];let reserve=S.botReserve13[id];let life=S.botLife13[id];','let mag=clone(S.botMag13[id]);let reserve=clone(S.botReserve13[id]);let life=clone(S.botLife13[id]);').replace('S.team7[0].p=S.buddy;','S.team7[0].p=clone(S.buddy);');
// Observers only. Complete updater body is retained, including claim assignment and final state writes.
code=code.replace('let manual=-1;','observedClaims=claims.slice();let manual=-1;').replace('if(a.ai.w<=0.0||a.plan.y==0){','if(a.ai.w<=0.0||a.plan.y==0){replanVisits++;');
const helperRaw=fragment(shader,'fn validHealPatient21(');
function scalar(s){return s.replace(/\b(\d+)u\b/g,'$1').replace(/\bvar\b/g,'let').replace(/atomicAdd\(&C\[([^\]]+)\],([^\)]+)\)/g,'increment($1,$2)');}
const helperCode=scalar(helperRaw).replace(/^fn (\w+)\(([^)]*)\)->bool/,(_,n,p)=>'function '+n+'('+p.replace(/:\w+/g,'')+')');
let goapCode=scalar(fragment(shader,'fn goap7(')).replace(/^fn (\w+)\(([^)]*)\)->Buddy7/,(_,n,p)=>'function '+n+'('+p.replace(/:\w+/g,'')+')').replace('let a=a0;','let a=clone(a0);').replace('switch action {','switch(action){').replace(/^(\s*(?:case \d+|default):\{.*)\}$/gm,'$1break;}');
code=code.replace('let commitment=S.botCommit14[id];','let commitment=clone(S.botCommit14[id]);').replace('destination7=a.p;','destination7=clone(a.p);');
code=code.replace('q.xz+vec2f(cos(f32(id)*2.1),sin(f32(id)*2.1))*1.8','add(q.xz,mul(vec2f(cos(f32(id)*2.1),sin(f32(id)*2.1)),1.8))');
const shaderLine=html.slice(0,html.indexOf(full)).split('\n').length;
function v(...xs){xs=xs.flatMap(x=>Array.isArray(x)?Array.from(x).slice(0,x.dim||x.length):[x]);if(xs.length===1)xs=Array(4).fill(xs[0]);while(xs.length<4)xs.push(0);let a=xs.slice(0,4);for(let i=0;i<4;i++)Object.defineProperty(a,'xyzw'[i],{get:()=>a[i],set:x=>a[i]=x});for(const s of ['xy','xz','yz','zw','xyz'])Object.defineProperty(a,s,{get:()=>{const b=v(...[...s].map(k=>a['xyzw'.indexOf(k)]));b.dim=s.length;return b;}});Object.defineProperty(a,Symbol.toPrimitive,{value:()=>{throw Error('Untranslated vector operator');}});return a;}
function vn(n,...xs){const a=v(...xs);a.dim=n;return a;}
function clone(x){if(Array.isArray(x))return v(...x);return Object.fromEntries(Object.entries(x).map(([k,val])=>[k,Array.isArray(val)?v(...val):val]));}
function actor(x,hp){let a={};for(const k of ['p','look','ai','destination7','pack','memory','nav','movement','plan','stats','vital','intent','aim','pathInfo','misc','flags'])a[k]=v(0);a.p=v(x,.35,0,hp);a.memory=v(-1,0,0,hp);a.vital=v(0,0,1,0);a.pack=v(30,30,0,1);return a;}
function make({think=.2,patient='human',dt=1/60}={}){
 const S={};for(const k of ['weapons','supplies','escape','buddyShot','goal','chooser','radio7','player7','rescue','journey7','squad7','controlEdges12','edges12','flags12','botFuel15','botStamina13','botControl13','aux','blast','runStats','upgrades14','orders','order13','botPour15','mission5','buddyLook','allyAim','feedback'])S[k]=v(0);
 S.pos=v(0,.35,0,patient==='human'?0:100);S.player7=v(patient==='human'?40:0,0,0,0);S.journey7.x=1;S.squad7.y=-1;S.aux.x=10;S.rescue.z=1;S.team7=[actor(.5,100),actor(1,patient==='bot'?0:100),actor(2,100)];
 const medic=S.team7[0];medic.ai=v(3,5,patient==='human'?-1:1,think);medic.plan=v(5,1,0,0);medic.vital.x=2.29;medic.destination7=v(0,.35,0,patient==='human'?-1:1);S.buddy=clone(medic.p);
 for(let i=1;i<3;i++){S.team7[i].ai=v(0,0,-1,10);S.team7[i].plan=v(0,1,0,0);}
 S.botLife13=[v(0),v(patient==='bot'?40:0,0,patient==='bot'?1:0,0),v(0)];if(patient==='bot')S.team7[1].memory.w=0;
 for(const k of ['botMag13','botReserve13','botItems13','botCommit14'])S[k]=Array.from({length:3},()=>v(0));for(let i=0;i<3;i++){S.botMag13[i]=v(30,8,15,0);S.botReserve13[i]=v(180,48,9999);S.botItems13[i]=v(0,0,1,0);}
 for(const k of ['heat6','acid13','pipes12'])S[k]=Array.from({length:16},()=>v(0));S.heatLife15=Array(16).fill(0);for(const k of ['extraBullets7','extraCrit7'])S[k]=Array.from({length:2},()=>({origin:v(0),tag:v(0)}));
 const c={S,u:{clock:v(dt,0,1),run:v(1,0),config:v(0),worldInfo:v(0),controls:v(0),controlEdges12:v(0),goals:v(0)},Z:[],P:[],H:new Uint32Array(192*192),C:new Uint32Array(96),NG:192,HALF:96,ZHEADS:192*192,costs:new Float64Array(128),codes:new Uint32Array(128),lens:new Uint32Array(128),closed:new Uint32Array(128),observedClaims:[],replanVisits:0,clearCalls:0,threatCalls:0,vec4f:v,vec4u:v,vec2f:(...x)=>vn(2,...x),vec3f:(...x)=>vn(3,...x),vec2i:(...x)=>vn(2,...x),clone,u32:Math.trunc,i32:Math.trunc,f32:Number,max:Math.max,min:Math.min,select:(a,b,c)=>c?b:a,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),length:a=>Math.hypot(a.x,a.y),floor:a=>v(...a.map(Math.floor)),add:(a,b)=>v(...a.map((n,i)=>n+(Array.isArray(b)?b[i]:b))),less:(a,b)=>a.slice(0,2).map((n,i)=>n<b[i]),greaterEqual:(a,b)=>a.slice(0,2).map((n,i)=>n>=b[i]),any:a=>a.some(Boolean),gunStats14:()=>v(30,.1,1.8,180)};
 for(const m of shader.matchAll(/const (\w+7):u32=(\d+)u/g))c[m[1]]=Number(m[2]);c.mul=(a,b)=>v(...a.map(x=>x*b));c.danger7=()=>v(0);c.sourceAdvance14=()=>v(3,0);c.chapterInside16=()=>false;c.moveBuddy7=a=>a;c.safe2=()=>v(1,0);c.cos=Math.cos;c.sin=Math.sin;
 c.clearSegment7=()=>{c.clearCalls++;return true};c.threatNear7=()=>{c.threatCalls++;return 0};c.exchange=(i,x)=>{const prior=c.C[i];c.C[i]=x;return prior;};c.increment=(i,x)=>{c.C[i]+=x;};c.teamTarget7=i=>clone(i<0||i>2?c.S.pos:c.S.team7[i].p);c.clearFirst7=a=>a.plan.z>=a.plan.y?0:(a.plan.x>>(a.plan.z*4))&15;
 vm.createContext(c);vm.runInContext(helperCode+'\n'+goapCode+'\nfunction update(){'+code+'}',c);return c;
}

module.exports={file,make,v,vn,clone,html,sha,fragment,shader,full,code,helperRaw,helperCode,goapCode};
