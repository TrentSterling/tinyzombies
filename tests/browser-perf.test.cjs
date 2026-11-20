const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const {instrument,makeRecorder} = require('../tools/browser-perf.cjs');

test('a 250 ms submitted-frame hitch stays 250 ms and skipped callbacks are separate', () => {
  const r = makeRecorder();
  r.start();
  const submit = (now,f) => r.submit(now,f,f%16,1280,720,4,8192,true,false,73129,6);
  submit(100,1);
  r.skip(); r.skip();
  submit(350,2);
  submit(366,3);
  const out = r.stop();
  assert.equal(out.skippedCallbacks,2);
  assert.deepEqual(out.intervalMs,{n:2,p50:16,p95:250,p99:250,worst:250});
  assert.deepEqual(out.configuration,[[1280,720,4,8192,true,false,73129,6]]);
  assert.equal(out.frames[0][1],null);
});

test('GPU capture requests all sixteen phases despite initial frame/phase offset', () => {
  const r = makeRecorder();
  r.start('gpu');
  for(let f=7;f<600;f++){
    let phase=(f+3)%16;
    if(!r.shouldStamp(f,phase)) continue;
    r.stamped(f,phase,f%2===0);
    assert.throws(()=>r.stop(),/pending/);
    r.timestamps(BigUint64Array.from({length:12},(_,i)=>BigInt(i)*1000000n));
  }
  const out=r.stop();
  assert.ok(out.phaseCounts.every(n=>n>=1));
  assert.equal(out.gpu[0].throughToneMapMs,1);
  assert.equal(out.gpu[0].drip,out.gpu[0].frame%8===0);
  assert.equal(out.missedGpuSamples,0);
});

test('an unavailable timestamp does not produce a zero-valued GPU sample', () => {
  const r=makeRecorder();r.start('gpu');r.stamped(1,0,false);r.failedTimestamp();
  const out=r.stop();
  assert.equal(out.missedGpuSamples,1);
  assert.equal(out.gpu.length,0);
});

test('the candidate instrumented inline script parses and bad or duplicate hooks fail closed', () => {
  const html=readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  const patched=instrument(html);
  for(const m of patched.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
  assert.throws(()=>instrument(patched),/Already instrumented/);
  const marker='const params=new URLSearchParams(location.search);';
  assert.throws(()=>instrument(html.replace(marker,'')),/nonunique marker/);
  assert.throws(()=>instrument(html+marker),/nonunique marker/);
});


function clockRecorder() {
  let now=0;
  return {r:vm.runInNewContext('('+makeRecorder.toString()+')()', {performance:{now:()=>now}}), at:t=>now=t};
}
test('Play latency excludes time spent waiting on the ready screen; absent click remains null',()=>{
  for(const delay of [200,20]){
    const {r,at}=clockRecorder();r.readyMs=100;r.start();at(1000-delay);r.acceptPlay();at(1000);r.submit(999,1,0,1280,720,4,8192,true,false,73129,6);at(1200);r.acceptPlay();
    const out=r.stop();assert.equal(out.readyMs,100);assert.equal(out.firstStartedSubmitMs,1000);assert.equal(out.acceptedPlayToFirstSubmitMs,delay);
  }
  const {r}=clockRecorder();r.start();r.submit(999,1,0,1,1,1,8192,true,false,1,6);assert.equal(r.stop().acceptedPlayToFirstSubmitMs,null);
});
test('ordinary captures and idle recorder retain stock timestamp cadence',()=>{
  const r=makeRecorder();for(const active of [false,true]){if(active)r.start();for(let frame=0;frame<65;frame++)assert.equal(r.shouldStamp(frame,frame%16),frame%30===0);if(active){r.stamped(30,14,true);assert.equal(r.stop().gpu.length,0);}}
});
test('labeled work excludes scheduler wait and records failed work without swallowing it',async()=>{
  const {r,at}=clockRecorder();at(50);assert.equal(await r.work('world','Build world',async()=>{at(57);return 42;}),42);
  at(107);const err=Error('shader fixture');await assert.rejects(r.work('shader','Compile shader',async()=>{at(110);throw err;}),e=>e===err);
  r.start();const out=r.stop();assert.deepEqual(JSON.parse(JSON.stringify(out.startupWork)),[{key:'world',label:'Build world',startMs:50,endMs:57,durationMs:7,status:'completed'},{key:'shader',label:'Compile shader',startMs:107,endMs:110,durationMs:3,status:'failed'}]);
});
test('instrumented loader records work after actual paint yield and retains failed step state',async()=>{
  const html=instrument(readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8'));
  const loader=html.slice(html.indexOf('function createStartup93('),html.indexOf('async function main(){'));
  let now=0;const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{style:{},setAttribute(){}});return elements.get(id)};
  const ctx=vm.createContext({performance:{now:()=>now},diagnostics:{},stopped:false,boot:{hidden:false},document:{getElementById:el},requestAnimationFrame:f=>{now+=50;f()},setTimeout:f=>f()});
  vm.runInContext('const perfAB=('+makeRecorder.toString()+')();'+loader+';var s=createStartup93(["world","shader"]);',ctx);
  await ctx.s.run('world','World',async()=>{now+=7});await assert.rejects(ctx.s.run('shader','Shader',async()=>{now+=3;throw Error('fixture')}),/fixture/);ctx.s.fail();
  const rows=vm.runInContext('perfAB.startupWork',ctx);assert.equal(rows[0].durationMs,7);assert.equal(rows[1].durationMs,3);assert.equal(rows[1].status,'failed');assert.equal(ctx.s.state.completed,1);assert.equal(ctx.s.state.percent,50);assert.equal(ctx.s.state.status,'failed');assert.equal(ctx.boot.hidden,false);
});
test('accepted click hook is past readiness/help/choice guards and fires once',()=>{
  const html=instrument(readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8'));
  const begin="canvas.addEventListener('pointerdown',e=>{";
  const body=html.slice(html.indexOf(begin)+begin.length,html.indexOf(" window.addEventListener('pointerup',pointerButtons12);"));
  let accepted=0;const ctx=vm.createContext({stopped:false,startup93:{state:{status:'loading'}},setMouse(){},seedRequested:false,playerValues:new Float32Array(500),mouse:{x:.5},settings:{started:false,help:false,paused:false,tactical:false},completedBoundary15:false,perfAB:{acceptPlay(){accepted++}},enableAudio(){},canvas:{focus(){},setPointerCapture(){}},cancelInput12(){},pointerButtons12(){}});
  vm.runInContext('var click=e=>{'+body.replace(/\}\);\s*$/,'')+'};',ctx);const e={preventDefault(){}};
  ctx.click(e);assert.equal(accepted,0);ctx.startup93.state.status='ready';ctx.settings.help=true;ctx.click(e);assert.equal(accepted,0);ctx.settings.help=false;ctx.playerValues[464]=1;ctx.click(e);assert.equal(accepted,0);ctx.playerValues[464]=0;ctx.click(e);ctx.click(e);assert.equal(accepted,1);
});
