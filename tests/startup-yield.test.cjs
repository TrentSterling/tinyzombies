const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const loader=html.slice(html.indexOf('function createStartup93('),html.indexOf('async function main(){'));
const failure=html.slice(html.indexOf('function fail(e){'),html.indexOf('// Browser extensions'));
function harness(){
 let now=0,frames=0;const raf=[],timers=[],elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}});return elements.get(id);};
 const boot={hidden:false,innerHTML:'',querySelector:element};
 const c=vm.createContext({diagnostics:{errors:[]},boot,document:{hidden:false,getElementById:element},window:{__TINY_READY__:false},location:{reload(){}},console:{error(){}},performance:{now:()=>now},requestAnimationFrame:f=>{frames++;raf.push(f);},setTimeout:f=>timers.push(f)});
 vm.runInContext('let stopped=false,startup93=null;'+failure+loader,c);
 const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
 const flush=async()=>{await tick();if(!c.document.hidden&&raf.length){now+=16;raf.shift()();}while(timers.length)timers.shift()();await tick();};
 return {c,boot,element,raf,timers,tick,flush,advance:n=>now+=n,frames:()=>frames,make:n=>vm.runInContext(`startup93=createStartup93(${JSON.stringify(Array.from({length:n},(_,i)=>'s'+i))})`,c),async settle(p){let done=false,result,error;p.then(v=>{done=true;result=v},e=>{done=true;error=e});for(let i=0;!done&&i<100;i++)await flush();assert.ok(done,'promise settles');if(error)throw error;return result;}};
}
test('cached 61-step schedule keeps truthful history with only first and final waits',async()=>{
 const h=harness(),s=h.make(61);let works=0;
 const first=s.run('s0','World',()=>{works++;});await h.tick();assert.equal(works,0);assert.equal(h.element('boot-status93').textContent,'World');await h.settle(first);
 for(let i=1;i<61;i++)await h.settle(s.run('s'+i,'Step '+i,()=>++works));
 assert.equal(h.frames(),1);assert.equal(works,61);assert.equal(s.state.history.length,61);
 s.state.history.forEach((e,i)=>{assert.equal(e.completed,i+1);assert.equal(e.percent,Math.floor((i+1)*100/61));});
 const final=s.finish();await h.tick();assert.equal(h.boot.hidden,false);assert.equal(s.state.status,'loading');assert.equal(h.element('boot-percent93').textContent,'100%');await h.settle(final);assert.equal(h.frames(),2);assert.equal(s.state.status,'ready');assert.equal(h.boot.hidden,true);
});
test('50 ms bound is checked between work steps, not used to invent progress',async()=>{
 const h=harness(),s=h.make(3);await h.settle(s.run('s0','a',()=>{}));h.advance(49);await h.settle(s.run('s1','b',()=>{}));assert.equal(h.frames(),1);h.advance(1);const p=s.run('s2','c',()=>{});await h.tick();assert.equal(h.frames(),2);assert.equal(s.state.completed,2);await h.settle(p);await h.settle(s.finish());assert.equal(h.frames(),3);
});
test('slow 61-step mocked workload periodically yields without changing counts',async()=>{
 const h=harness(),s=h.make(61);for(let i=0;i<61;i++)await h.settle(s.run('s'+i,'step',()=>h.advance(i===0?54:3)));await h.settle(s.finish());assert.equal(s.state.completed,61);assert.equal(h.frames(),6);
});
test('actual outer error path shows failed fast step without its own rAF',async()=>{
 const h=harness(),s=h.make(61);for(let i=0;i<14;i++)await h.settle(s.run('s'+i,'ok',()=>{}));
 await assert.rejects(s.run('s14','Compiling broken shader',()=>{throw Error('shader fixture failure');}),/shader fixture failure/);vm.runInContext("fail(new Error('shader fixture failure'))",h.c);
 assert.equal(h.frames(),1);assert.equal(s.state.completed,14);assert.equal(s.state.status,'failed');assert.equal(h.boot.hidden,false);assert.equal(h.c.window.__TINY_READY__,false);assert.match(h.element('#boot-failure93').textContent,/22% \(14 \/ 61 steps\): Compiling broken shader/);assert.match(h.element('textarea').value,/shader fixture failure/);
});
for(const afterQueue of [false,true])test('hidden tab retains forced first/final wait: after queue '+afterQueue,async()=>{
 const h=harness(),s=h.make(1);let work=0;if(!afterQueue)h.c.document.hidden=true;const p=s.run('s0','world',()=>work++);if(afterQueue)h.c.document.hidden=true;await h.flush();assert.equal(work,0);assert.equal(s.state.completed,0);h.c.document.hidden=false;await h.settle(p);h.c.document.hidden=true;const f=s.finish();await h.flush();assert.equal(s.state.status,'loading');assert.equal(h.boot.hidden,false);h.c.document.hidden=false;await h.settle(f);assert.equal(s.state.status,'ready');
});
test('stopping during mandatory waits prevents work and ready',async()=>{
 const h=harness(),s=h.make(1);let work=0;const p=s.run('s0','world',()=>work++);vm.runInContext('stopped=true',h.c);await assert.rejects(h.settle(p),/Startup stopped/);assert.equal(work,0);
 const j=harness(),t=j.make(1);await j.settle(t.run('s0','world',()=>{}));const f=t.finish();t.fail();await assert.rejects(j.settle(f),/Startup stopped/);assert.equal(t.state.status,'failed');assert.equal(j.boot.hidden,false);
});
test('duplicate keys, repeated work and unfinished finish retain validation',async()=>{
 const h=harness();assert.throws(()=>vm.runInContext("createStartup93(['a','a'])",h.c),/Duplicate/);const s=h.make(2);await h.settle(s.run('s0','ok',()=>{}));await assert.rejects(s.run('s0','again',()=>{}),/Unexpected/);await assert.rejects(s.finish(),/unfinished/);
});
