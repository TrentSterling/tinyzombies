const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const {performance} = require('node:perf_hooks');

function load(path) {
 const html = fs.readFileSync(path,'utf8');
 const start=html.indexOf('<script>')+8, end=html.lastIndexOf('if(NET_JOIN65)joinOnline65(');
 assert(start>=8&&end>start);
 return vm.compileFunction(html.slice(start,end)+
    '\nreturn (level, seed)=>{stage=level;runSeed=seed;return makeWorld();};',
    ['location','window','document','navigator','addEventListener']);
}
const dom=new Proxy(()=>dom,{get:(_,k)=>k===Symbol.toPrimitive?()=>0:dom});
const make=(program, search)=>program({search},{addEventListener(){}},dom,{},()=>{});
const specs=[
 ['Maple 73129','?sandbox&seed=73129',6,73129],
 ['Maple reseed','?sandbox',6,73130],
 ['Maple next street','?sandbox',6,81048],
 ['Maple rifles','?sandbox&freshRifles',6,73129],
 ...Array.from({length:5},(_,i)=>['DEAD ENDS '+(i+1),'?deadends',i+1,73129]),
 ['Lab','?sandbox&lab',6,73129],
];

function digest(o) {
 const h=createHash('sha256');
 for (const [k,v] of Object.entries(o)) {
  h.update(k+'\0');
  if(ArrayBuffer.isView(v)) h.update(new Uint8Array(v.buffer,v.byteOffset,v.byteLength));
  else h.update(JSON.stringify(v)??typeof v);
  h.update('\0');
 }
 return h.digest('hex');
}
const a=load(process.argv[2]), b=load(process.argv[3]);
for(const [name,search,stage,seed] of specs) {
 const old=make(a,search), next=make(b,search);
 assert.equal(digest(next(stage,seed)),digest(old(stage,seed)),name);
 console.log('parity:',name);
}
const mid=v=>[...v].sort((a,b)=>a-b)[v.length>>1];
for(const [name,search,stage,seed] of [specs[0],specs[4]]) {
 const old=make(a,search), next=make(b,search), before=[],after=[];
 for(let i=0;i<34;i++){
  const jobs=[[old,before],[next,after]];
  if(i%2)jobs.reverse();
  for(const [run,times] of jobs){
   if(global.gc)global.gc();
   const t=performance.now();
   const world=run(stage,seed);
   const elapsed=performance.now()-t;
   assert(world.count>0);
   if(i>=4)times.push(elapsed);
  }
 }
 console.log(name,'CPU constructor median ms, 30 samples per side:',mid(before).toFixed(2),'->',mid(after).toFixed(2));
}
