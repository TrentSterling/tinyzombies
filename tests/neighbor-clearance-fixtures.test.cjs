'use strict';
// A CPU reference of the existing clearance predicate, not WGSL execution or an earned escort.
const assert = require('node:assert/strict');
const { loadHost, sha } = require('./deadends-cpu-host.cjs');
const file = process.argv[2] || 'index.html';
const host = loadHost(file, { plain: true });
const solidSource = host.run('SOLID');
const civSource = host.sources.civilians30;
const stepSource = civSource.slice(civSource.indexOf('fn civStep30('), civSource.indexOf('@compute @workgroup_size(16)', civSource.indexOf('fn civStep30(')));
// Reject changed production predicates until the reference is reviewed against them again.
assert.equal(sha(solidSource), 'f40e6ea0c0c4ff9b9249e86cf4ba4e1c8f1eb7f78b36d5b112d873908c8f3fa4');
assert.equal(sha(stepSource), '371c0bfb00fb6052c5731f487ca06ea1674c762d18b72229ed0a30bf479703fe');
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function fixture() {
  const voxels = new Set(), dynamic = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  const voxel = (x, y, z) => voxels.add(key(Math.floor((x + 96) * 4), Math.floor(y * 4), Math.floor((z + 96) * 4)));
  const debris = (x, z, mask) => dynamic.set(Math.floor((x + 96) * 2) + 384 * Math.floor((z + 96) * 2), mask);
  const solid = (x, y, z) => voxels.has(key(Math.floor((x + 96) * 4), Math.floor(y * 4), Math.floor((z + 96) * 4)));
  // Literal dimensional translation of SOLID.blocked for the escort motor's (.2, .29, .2) half-size at y=.36.
  function blocked(x, z, hx = .2, hz = .2) {
    const y = .36, h = [hx, .29, hz];
    if (Math.abs(x) + h[0] > 95.8 || Math.abs(z) + h[2] > 95.8) return true;
    const low = clamp(Math.floor((y - h[1]) * 4), 0, 11), high = clamp(Math.floor((y + h[1]) * 4), 0, 11);
    const mask = ((1 << (high + 1)) - 1) ^ ((1 << low) - 1);
    const dx0 = clamp(Math.floor((x - h[0] + 96) * 2), 0, 383), dx1 = clamp(Math.floor((x + h[0] + 96) * 2), 0, 383);
    const dz0 = clamp(Math.floor((z - h[2] + 96) * 2), 0, 383), dz1 = clamp(Math.floor((z + h[2] + 96) * 2), 0, 383);
    for (let zz = dz0; zz <= dz1; zz++) for (let xx = dx0; xx <= dx1; xx++) if ((dynamic.get(xx + 384 * zz) || 0) & mask) return true;
    for (let yy = low; yy <= high; yy++) for (let zz = Math.max(0, Math.floor((z - h[2] + 96) * 4)); zz <= Math.min(767, Math.floor((z + h[2] + 96) * 4)); zz++)
      for (let xx = Math.max(0, Math.floor((x - h[0] + 96) * 4)); xx <= Math.min(767, Math.floor((x + h[0] + 96) * 4)); xx++) if (voxels.has(key(xx, yy, zz))) return true;
    return false;
  }
  function clear(from, to, method = 'swept') {
    const delta = [to[0] - from[0], to[1] - from[1]], dist = Math.hypot(...delta);
    if (dist >= 20) return false;
    const old = method === true || method === 'point', sampled = method === 'sampled';
    const steps = old ? Math.ceil(dist * 2) : Math.max(1, Math.ceil(dist * 8));
    for (let i = 1; old ? i < steps : i <= steps; i++) {
      const t = old ? i * .5 / dist : (sampled ? i : i - .5) / steps;
      const x = from[0] + delta[0] * t, z = from[1] + delta[1] * t;
      if (old ? solid(x, .36, z) : blocked(x, z, .2 + (sampled ? 0 : Math.abs(delta[0]) * .5 / steps), .2 + (sampled ? 0 : Math.abs(delta[1]) * .5 / steps))) return false;
    }
    return true;
  }
  return { voxel, debris, blocked, clear, voxels, dynamic };
}
module.exports = { fixture, runtimeSha256: host.sha256 };
if (require.main === module) {
const checks = [];
function check(name, fn) { try { checks.push({ name, passed: true, ...fn() }); } catch (e) { checks.push({ name, passed: false, error: e.stack }); } }
function rejectsOldShortcut(f, from, to) { assert.equal(f.clear(from, to, true), true); assert.equal(f.clear(from, to), false); }
check('doorway lip: a clear center line is rejected when the body overlaps the jamb', () => {
  const f = fixture(); f.voxel(.125, .375, .375);
  assert(!f.blocked(-1, .1) && !f.blocked(1, .1)); rejectsOldShortcut(f, [-1, .1], [1, .1]);
});
check('short final segment: a blocked endpoint is checked even below the old 0.5 m interval', () => {
  const f = fixture(); f.voxel(.625, .375, .125); rejectsOldShortcut(f, [0, .125], [.35, .125]);
});
check('upper body: a voxel above the center-ray height still blocks the follower', () => {
  const f = fixture(); f.voxel(.125, .625, .125); rejectsOldShortcut(f, [-1, .125], [1, .125]);
});
check('dynamic wreckage: ground-level occupancy blocks a shortcut through otherwise empty voxels', () => {
  const f = fixture(); f.debris(.25, .25, 1 << 1); rejectsOldShortcut(f, [-1, .125], [1, .125]);
});
check('overhead wreckage: occupancy outside the body height does not close the route', () => {
  const f = fixture(); f.debris(.25, .25, 1 << 6); assert(f.clear([-1, .125], [1, .125]));
});
check('removed wall and cleared wreckage: the same route reopens without stale blockage', () => {
  const f = fixture(); f.voxel(.125, .375, .125); f.debris(.25, .25, 1 << 1); assert(!f.clear([-1, .125], [1, .125]));
  f.voxels.clear(); assert(!f.clear([-1, .125], [1, .125])); f.dynamic.clear(); assert(f.clear([-1, .125], [1, .125]));
});
check('open doorway remains open while a center-clear narrow slit is rejected', () => {
  const f = fixture(); f.voxel(.125, .375, -.375); f.voxel(.125, .375, .625); assert(f.clear([-1, .125], [1, .125]));
  f.voxel(.125, .375, .375); rejectsOldShortcut(f, [-1, .125], [1, .125]);
});
check('world border rejects a body extending outside even when its center remains inside', () => {
  const f = fixture(); rejectsOldShortcut(f, [95.3, 0], [95.7, 0]);
});
check('zero-distance open goal is safe and the 20 m shortcut cutoff stays intact', () => {
  const f = fixture(); assert(f.clear([0, 0], [0, 0])); assert(f.clear([0, 0], [19.99, 0])); assert(!f.clear([0, 0], [20, 0]));
});
const report = { runtimeSha256: host.sha256, method: 'Frozen-source-guarded JavaScript reference of static/dynamic body clearance and swept-bounds/candidate/old shortcut sampling. No WGSL execution, pathfinding fallback, earned rescues, browser, GPU timing or performance claim.', passed: checks.every(c => c.passed), checks };
console.log(JSON.stringify(report, null, 2)); process.exitCode = report.passed ? 0 : 1;
}
