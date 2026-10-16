'use strict';

// Scalar regression checks only. These do not compile WGSL or qualify gameplay.
// Run: node tests/burnout-fuel.test.cjs [path/to/index.html] [report.json]
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const file = process.argv[2] || path.join(__dirname, '../index.html');
const html = fs.readFileSync(file, 'utf8');

function block(text, marker, start = 0) {
  const pos = text.indexOf(marker, start);
  assert(pos >= 0, 'Missing fragment: ' + marker);
  const begin = text.indexOf('{', pos);
  let depth = 0;
  for (let i = begin; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && !--depth) return text.slice(begin + 1, i);
  }
  throw Error('Unclosed fragment: ' + marker);
}
const human = html.indexOf('else if(kind==6u){S.upgrades14.x');
const pickup = block(html, 'else if(kind==7u)', human);
const reset = html.split('\n').find(line => line.includes('if(oldKind!=S.mission5.y||oldIndex!=S.mission5.z'));
const pour = block(html, 'if(S.mission5.y==3.0&&u.run.x==2.0&&S.cell.w==1.0');
const guard = html.split('\n').find(line => line.includes('if(u.controls.x>.5&&S.pos.w>0.0&&S.player7.x<=0.0'));
const shotWeapon = html.match(/var weapon=u32\((S\.[^)]+)\);var serial=u32\(S\.ballistic\.x\)/)[1];
const impactWeapon = html.match(/damage\+=shot\.origin\.w;let actor=j\/18u;var weapon=u32\((S\.[^)]+)\)/)[1];
const knockBody = block(html, 'fn gunKnock14(');
const translate = text => text.replace(/\b(\d+)u\b/g, '$1').replace(/\bvar\b/g, 'let');
const vec = (x = 0, y = 0, z = 0, w = 0) => ({x, y, z, w});

function context(weapon) {
  return vm.createContext({
    S: {
      cell: vec(), edges12: vec(0, weapon), gear12: vec(weapon, weapon, 1, weapon),
      reload12: vec(1.2, 0, weapon, .02), heal12: vec(.8), axe14: vec(.48),
      mission5: vec(3, 3, 12, 0), relay: vec(), alarm: vec(), flags12: vec(),
      pos: vec(0, 0, 0, 100), player7: vec()
    },
    P: [{data: vec()}], used: true, k: 0, vec4f: vec, max: Math.max,
    u32: Math.trunc, waves: 0,
    u: {controls: {x: 1}, run: {x: 2}}, oldKind: 3, oldIndex: 12, dt: 1 / 60
  });
}
function takeFuel(c) { vm.runInContext(translate(pickup), c); }
function pourFrame(c) {
  vm.runInContext('function queueWave13(){waves++;}', c);
  vm.runInContext(translate(reset), c);
  vm.runInContext(translate(guard + '\nif(S.mission5.y==3.0&&u.run.x==2.0&&S.cell.w==1.0&&S.relay.x<.5){' + pour + '}}'), c);
}
const checks = [];
function check(name, fn) {
  try { fn(); checks.push({name, passed: true}); }
  catch (e) { checks.push({name, passed: false, error: e.message}); }
}

for (const weapon of [0, 1, 2]) check('fuel pickup switch effects: gun ' + weapon, () => {
  const c = context(weapon); takeFuel(c);
  assert.equal(c.S.reload12.x, weapon === 2 ? 1.2 : 0);
  assert.equal(c.S.heal12.x, weapon === 2 ? .8 : 0);
  assert.equal(c.S.reload12.w, weapon === 2 ? .02 : .15);
  assert.equal(c.S.gear12.w, 2);
  assert.equal(c.S.cell.w, 1);
  assert.equal(c.P[0].data.y, 15);
});
check('fuel pickup cancels pending axe swing', () => {
  const c = context(2); takeFuel(c); assert.equal(c.S.axe14.x, 0);
});
for (const weapon of [0, 1, 2]) check('same-frame shot preserves emitted weapon: ' + weapon, () => {
  const c = context(weapon); takeFuel(c); assert.equal(vm.runInContext(shotWeapon, c), weapon);
});
for (const [weapon, bits, knock] of [[0, 0, 76], [0, 1, 145], [1, 0, 180], [1, 2, 150], [2, 4, 55]]) {
  check('same-frame impact preserves knockback/pin release: ' + weapon + '/' + bits, () => {
    const c = context(weapon); takeFuel(c);
    const body = translate(knockBody).replace(/array<f32,3>\(([^)]+)\)/, '[$1]');
    vm.runInContext('function gunKnock14(w,bits){' + body + '}', c);
    c.weapon = vm.runInContext(impactWeapon, c); c.bits = bits;
    const actual = vm.runInContext('gunKnock14(weapon,bits)', c);
    assert.equal(actual, knock); assert.equal(actual >= 80, knock >= 80);
  });
}
check('fuel pickup preserves longer shot cooldown', () => {
  const c = context(0); c.S.reload12.w = .6; takeFuel(c); assert.equal(c.S.reload12.w, .6);
});
check('carrying fuel prevents consuming a second can', () => {
  const c = context(0); c.S.cell.w = 1; takeFuel(c);
  assert.equal(c.used, false); assert.equal(c.P[0].data.y, 0);
});
for (const type of ['pin', 'release', 'target-change']) check('pour interruption: ' + type, () => {
  const c = context(2); c.S.cell.w = 1; c.S.mission5.w = 1.9;
  if (type === 'pin') c.S.flags12.w = 1;
  if (type === 'release') c.u.controls.x = 0;
  if (type === 'target-change') c.oldIndex = 11;
  pourFrame(c);
  assert.equal(c.S.mission5.w, type === 'target-change' ? 1 / 60 : 0);
  assert.equal(c.S.relay.w, 0);
});
check('two uninterrupted 2.1-second pours start exactly one event', () => {
  const c = context(2); c.S.cell.w = 1;
  for (let i = 0; i < 125; i++) pourFrame(c);
  assert.equal(c.S.relay.w, 0);
  for (let i = 0; i < 2; i++) pourFrame(c);
  assert.equal(c.S.relay.w, 1); assert.equal(c.S.cell.w, 0); assert.equal(c.S.relay.x, 0);
  c.S.cell.w = 1;
  for (let i = 0; i < 127; i++) pourFrame(c);
  assert.equal(c.S.relay.w, 2); assert.equal(c.S.cell.w, 0); assert.equal(c.S.relay.x, 1);
  assert.equal(c.waves, 1);
});

const report = {
  method: 'Exact candidate scalar WGSL fragments mechanically translated for CPU branch checks. No WGSL compilation, GPU execution, timing-precision or earned-gameplay claim.',
  candidateSha256: crypto.createHash('sha256').update(html).digest('hex'),
  passed: checks.every(c => c.passed), checks
};
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.passed ? 0 : 1;
