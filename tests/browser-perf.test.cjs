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
