'use strict';
// CPU-only source and input/audio-scheduler checks. This does not compile or run WGSL.
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const path = require('node:path');
const baseline = fs.readFileSync(process.argv[2]);
const candidate = fs.readFileSync(process.argv[3] || path.join(__dirname, '../index.html'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(digest(baseline), 'c487bdb1aabeddb7c0ee6edcb2d059aabb2c32ea1be5cfa7a0c34717da3a4fc4');
function load(bytes) {
  const html = bytes.toString('utf8'), script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  new vm.Script(script);
  const handlers = {}, canvas = {addEventListener(){}, focus(){}};
  const context = {console, URLSearchParams, location:{search:''}, document:{getElementById(){return canvas;}, addEventListener(){}},
    addEventListener(name, fn){handlers[name] = fn;}, atob:s => Buffer.from(s, 'base64').toString('binary')};
  context.window = context;
  vm.createContext(context);
  assert.equal(script.split('main().catch(fail);').length, 2);
  vm.runInContext(script.replace('main().catch(fail);', ''), context);
  return {context, handlers, run:code => vm.runInContext(code, context), sources:context.__TINY_SOURCES__};
}
const old = load(baseline), current = load(candidate);
const changed = Object.keys(old.sources).filter(name => old.sources[name] !== current.sources[name]);
assert.deepEqual(changed, ['lights', 'begin', 'zombies', 'integrate', 'boxes', 'render', 'ui']);
assert.equal(current.sources.integrate, old.sources.integrate.replace('let radius=select(1,2,q.c.w<.5);', 'let radius=select(0,1,q.c.w<.5);'));
for (const name of ['spawn','solve','gridP','drip','fracture8','squadNav7','buddy']) assert.equal(current.sources[name], old.sources[name], name + ' preserved exactly');
assert.equal(current.run('COMMON'), old.run('COMMON'), 'State layout, budgets and scalar helpers remain exact');
assert.equal(current.run('JSON.stringify(L7)'), old.run('JSON.stringify(L7)'));
assert.equal(current.run('JSON.stringify(L8)'), old.run('JSON.stringify(L8)'));
assert.ok(!candidate.toString('utf8').includes('\u00e2\u20ac'), 'no accidental UTF-8/Windows encoding corruption');

current.run('bindInput()');
const key = (code, repeat = false) => current.handlers.keydown({code, repeat, preventDefault(){}});
key('KeyB');
assert.equal(current.run('pendingPipeBomb'), 1);
assert.equal(current.run('settings.started'), true);
current.run('pendingPipeBomb=0');
key('KeyB', true);
assert.equal(current.run('pendingPipeBomb'), 0, 'held B never queues another throw');
key('Escape');
key('KeyB'); key('Space');
assert.equal(current.run('pendingPipeBomb+pendingGrenade'), 0, 'bomb inputs while paused are ignored');
key('Slash');
assert.equal(current.run('settings.help&&settings.paused'), true);
key('Escape');
assert.equal(current.run('!settings.help&&settings.paused'), true, 'closing help retains an existing pause');
key('Escape'); key('Slash');
assert.equal(current.run('settings.help&&settings.paused'), true);
key('Slash');
assert.equal(current.run('!settings.help&&!settings.paused'), true, 'closing help restores active play');
key('Space');
assert.equal(current.run('pendingGrenade'), 1, 'the existing grenade has a separate input');

current.run(`
  globalThis.testBeeps=[]; globalThis.testSounds=[];
  pipeBeep=(remaining)=>testBeeps.push(remaining); sound=(kind)=>testSounds.push(kind);
  settings.started=true; settings.paused=false;
  playerValues[24]=10; playerValues[110]=5.8; playerValues[499]=6;
  updateBombAudio();
`);
assert.equal(current.run('testBeeps.length'), 0, 'beeps start after the throwing arc');
current.run('playerValues[24]=10.5;playerValues[110]=5.5;updateBombAudio();updateBombAudio()');
assert.equal(current.run('testBeeps.length'), 1, 'a stale GPU sample cannot duplicate a beep');
current.run('settings.paused=true;playerValues[24]=11.5;playerValues[110]=4.5;updateBombAudio()');
assert.equal(current.run('testBeeps.length'), 1, 'paused audio scheduler does not beep');
current.run('settings.paused=false;updateBombAudio()');
assert.equal(current.run('testBeeps.length'), 2);
current.run('playerValues[110]=0;counters[64]=1;updateBombAudio();updateBombAudio()');
assert.equal(current.run('testSounds.length'), 1, 'one pipe explosion sample produces one sound');
current.run('counters[66]=1;updateBombAudio();updateBombAudio()');
assert.equal(current.run('testSounds.length'), 2, 'grenade audio follows its own GPU event counter');
const footprint = radius => {
  let n = 0;
  for(let y=-radius;y<=radius;y++) for(let x=-radius;x<=radius;x++) if((x*x+y*y)/(radius*radius+1)<1.25) n++;
  return n;
};
console.log(JSON.stringify({
  kind:'CPU-only source and host behavior validation', baseline_sha256:digest(baseline), candidate_sha256:digest(candidate),
  candidate_bytes:candidate.length, javascript_syntax:'passed', changed_shader_modules:changed,
  exact_preservation:['particle emission','particle integration except floor radius','pair solver','particle grid','wall drips','NVIDIA scratch fix','state layout and entity budgets'],
  isolated_floor_cells:{droplet:{before:footprint(2),after:footprint(1)},gore:{before:footprint(1),after:footprint(0)}},
  controls:'passed: separate B/Space, no repeat throws, pause and help restoration',
  audio_scheduler:'passed with stubs: landing delay, sample deduplication, pause, distinct pipe/grenade events',
  gpu_compilation:'pending', gpu_execution:'pending', audible_output:'pending', visual_validation:'pending'
}, null, 2));
