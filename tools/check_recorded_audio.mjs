// CPU contract tests of the exact runtime loader/mixer with mocked browser nodes.
// Codec/PCM checks are separate; this does not claim browser or listening coverage.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json')));
const host=html.slice(html.indexOf('let audio=null,'),html.indexOf('function ordnanceHint('));
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(script);
const payloads=new Map(manifest.clips.map(c=>[c.id,fs.readFileSync(path.join(root,c.file))]));
const byHash=new Map(manifest.clips.map(c=>[c.sha256,c]));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function fixture(faults={}){
 let fetches=0,decodes=0,active=0,maxActive=0;const calls=new Map(),sources=[],timers=new Set();
 const param=()=>({value:1,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}});
 const node=()=>({gain:param(),frequency:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){},disconnect(){}});
 class Context{
  constructor(){this.state='running';this.currentTime=0;this.sampleRate=48000;this.destination=node();}
  resume(){this.state='running';return Promise.resolve();}
  createGain(){return node();} createBiquadFilter(){return node();} createDynamicsCompressor(){return node();} createWaveShaper(){return node();}
  createStereoPanner(){return {...node(),pan:param()};}
  createBufferSource(){const n={...node(),playbackRate:param(),start(t){this.at=t;},stop(t){this.stopAt=t;}};sources.push(n);return n;}
 }
 class Decoder{
  async decodeAudioData(data){decodes++;const c=byHash.get(sha(Buffer.from(data)));await new Promise(r=>setImmediate(r));active--;if(faults.decode===c.id)throw Error('decode failure');return {duration:(c.frames+(faults.duration===c.id?480:0))/48000,length:c.frames,numberOfChannels:1,sampleRate:48000};}
 }
 const context=vm.createContext({console,Float32Array,Uint8Array,Map,Set,Array,Math,Number,performance,Promise,AbortController,crypto:crypto.webcrypto,
  setTimeout(fn,ms){const t=setTimeout(fn,ms);timers.add(t);return t;},clearTimeout(t){clearTimeout(t);timers.delete(t);},
  window:{AudioContext:Context,OfflineAudioContext:Decoder},MAX_Z:8192,MAX_PROPS:2048,
  settings:{started:true,paused:false,muted:false},diagnostics:{audio:{pipeBeeps:0},notes:[]},playerValues:new Float32Array(600),counters:new Uint32Array(128),right:[1,0,0],runSeed:73129,time:0,
  async fetch(url,{signal}){fetches++;active++;maxActive=Math.max(active,maxActive);const id=url.match(/\/([^/]+)\.flac/)[1];calls.set(id,(calls.get(id)||0)+1);
   await new Promise(r=>setImmediate(r));
   if(faults.http===id){active--;return {ok:false,status:404};}
   if(faults.abort===id){active--;throw new DOMException('Aborted','AbortError');}
   const buf=Buffer.from(payloads.get(id));if(faults.hash===id)buf[buf.length-1]^=1;
   // Failed hashes never reach decode; keep the fixture concurrency accounting exact.
   if(faults.hash===id)active--;
   return {ok:true,arrayBuffer:async()=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length)};
  }
 });
 vm.runInContext(host+`;globalThis.api={load:loadAudioBank9,enable:enableAudio,play:playAudio9,clip:audioClip9,stop:stopAudio9,reset:resetAudio9,mission:missionTone,pipe:updateBombAudio,state:updateAudioState9,stats:audioBankStats9,voices:audioVoices9,clips:audioClips9,get audio(){return audio;}};`,context);
 return {context,api:context.api,sources,calls,faults,counts:()=>({fetches,decodes,maxActive,timers:timers.size}),finish(){for(const n of sources)n.onended?.();}};
}
const normal=fixture();
assert.equal(normal.api.play('rifle','weapon'),false);assert.equal(normal.counts().fetches,0);
const load=normal.api.load();assert.equal(normal.api.load(),load);
await load;assert.equal(normal.api.stats().ready,43);assert.equal(normal.counts().maxActive,2);assert.equal(normal.counts().timers,0);
normal.api.enable();await normal.api.load();normal.api.state();const initial=normal.counts();
for(let i=0;i<8;i++)assert.equal(normal.api.play('rifle','weapon'),true);
assert.equal(normal.api.play('rifle','weapon'),false);normal.finish();
const categories=[['rifle','weapon',8],['snap','cue',5],['explosion','explosion',4],['death','death',6],['hit','impact',5],['growl','zombie',5],['step','step',4],['debris','debris',4],['mass','mass',2]];
for(const [kind,category,cap] of categories){for(let i=0;i<cap;i++)assert(normal.api.play(kind,category));assert(!normal.api.play(kind,category));normal.finish();}
// Low-priority ceiling leaves ten slots; total cap stays 32.
for(const [kind,category,cap] of categories.slice(3))for(let i=0;i<cap;i++)normal.api.play(kind,category);
assert.equal(normal.api.voices.size,22);
for(let i=0;i<8;i++)normal.api.play('rifle','weapon');for(let i=0;i<5;i++)normal.api.play('snap','cue');
assert.equal(normal.api.voices.size,32);normal.finish();
const offset=normal.sources.length;normal.api.mission(4);assert.deepEqual(normal.sources.slice(offset).map(s=>s.at),[0,.1,.2]);normal.finish();
for(let i=0;i<5;i++)assert(normal.api.play('beepLow','cue'));
const five=normal.sources.slice(-5);assert.equal(new Set(five).size,5);assert.equal(new Set(five.map(s=>s.buffer)).size,1);
normal.context.settings.paused=true;normal.api.state();assert(!normal.api.play('rifle','weapon'));assert(five.every(s=>s.stopAt===.008));normal.finish();
normal.context.settings.paused=false;normal.context.settings.muted=true;assert(!normal.api.play('rifle','weapon'));
normal.context.settings.muted=false;normal.api.reset();normal.finish();assert.equal(normal.api.clips.size,43);
assert.equal(normal.counts().fetches,initial.fetches);assert.equal(normal.counts().decodes,initial.decodes);
const partial=fixture({http:'rifle-2',hash:'hit-1',decode:'growl-2',duration:'death-2',abort:'pipe-high'});
await partial.api.load();assert.equal(partial.api.stats().ready,38);assert.equal(partial.api.stats().state,'partial');assert.equal(partial.counts().timers,0);
// Missing variant uses an already decoded same-kind recording, with no new request.
assert.equal(partial.api.clip('rifle',1),partial.api.clip('rifle',0));assert.equal(partial.api.clip('beepHigh'),null);
await partial.api.load();assert.equal(partial.counts().fetches,43);
await partial.api.load(true);assert.equal(partial.counts().fetches,48);await partial.api.load(true);assert.equal(partial.counts().fetches,48);
const recovery=fixture({http:'rifle-2'});await recovery.api.load();delete recovery.faults.http;await recovery.api.load(true);assert.equal(recovery.api.stats().ready,43);assert.equal(recovery.api.stats().state,'ready');assert.equal(Object.keys(recovery.api.stats().failed).length,0);assert.equal(recovery.counts().fetches,44);
const late=fixture();late.api.enable();assert.equal(late.api.play('rifle','weapon'),false);assert.equal(late.sources.length,0);late.context.settings.paused=true;late.api.reset();await late.api.load();assert.equal(late.sources.length,0);assert.equal(late.api.stats().ready,43);
assert.equal(late.api.play('rifle','weapon'),false);late.context.settings.paused=false;assert(late.api.play('rifle','weapon'));late.finish();
const report={htmlSha256:sha(Buffer.from(html)),method:'Node VM executes exact audio host with stub AudioContext/OfflineAudioContext and filesystem-backed fetch. No browser, GPU, speaker output or subjective listening. Actual codec padding/PCM independently checked by Python and FFmpeg.',passed:true,checks:['whole-script syntax','deduplicated concurrent preload','two concurrent fetch/decode jobs','43 assets and hashes','no fetch/decode or source allocation before a buffer is ready','no fetch/decode at playback','per-category and total/low-priority limits','independent sources sharing decoded buffers','mission offsets','pause/mute/reset lifecycle','HTTP/hash/decode/duration/abort failure isolation','same-kind ready fallback','one explicit retry then bounded failure','late load while paused creates no playback'],normal:normal.counts(),partial:{...partial.counts(),ready:partial.api.stats().ready,failed:{...partial.api.stats().failed}}};
fs.writeFileSync(path.join(root,'validation/recorded-audio-cpu.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
