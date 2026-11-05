'use strict';
// Regression qualification: sampled clearance is not a complete swept-body test.
// The previous sampled candidate must reproduce the bug, while the new swept bounds must reject it.
const assert = require('node:assert/strict');
const { fixture, runtimeSha256 } = require('./neighbor-clearance-fixtures.test.cjs');
const f = fixture(); f.voxel(.125, .375, .125);
// Voxel x/z bounds [0,.25], expanded by the follower's .2 m half-width.
// Slab intersection is independent of the candidate's point-sampling loop.
function sweptIntersection(a, b) {
  let enter = 0, exit = 1;
  for (let axis = 0; axis < 2; axis++) {
    const d = b[axis] - a[axis];
    if (Math.abs(d) < 1e-12) { if (a[axis] < -.2 || a[axis] > .45) return null; continue; }
    let t0 = (-.2 - a[axis]) / d, t1 = (.45 - a[axis]) / d;
    if (t0 > t1) [t0, t1] = [t1, t0];
    enter = Math.max(enter, t0); exit = Math.min(exit, t1);
    if (enter > exit) return null;
  }
  return { enter, exit, overlapDistance: Math.hypot(b[0] - a[0], b[1] - a[1]) * (exit - enter) };
}
const paths = [
  [[0.002240985631942749, -0.8791190991178155], [1.2258128095418215, 1.011074491776526]],
  [[1.948655053973198, 1.9979866286739707], [-0.36263456754386425, -1.3592690592631698]],
  [[1.1634958274662495, 0.836485150270164], [-0.6109746638685465, -1.658103900961578]],
];
const cases = paths.map(([from, to]) => {
  assert(!f.blocked(...from) && !f.blocked(...to), 'Endpoints must each fit');
  const intersection = sweptIntersection(from, to); assert(intersection && intersection.overlapDistance > 0);
  const midpoint = (intersection.enter + intersection.exit) / 2;
  assert(f.blocked(from[0] + (to[0] - from[0]) * midpoint, from[1] + (to[1] - from[1]) * midpoint), 'Motor body predicate must confirm the collision');
  assert(f.clear(from, to, 'sampled'), 'Previous 0.125 m sampled candidate must reproduce the bug');
  return { from, to, intersection, previousSampledCandidateAccepts: true, candidateAcceptsShortcut: f.clear(from, to) };
});
const unresolved = cases.some(c => c.candidateAcceptsShortcut);
let seed = 1;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const sweep = { generated: 50000, clearEndpoints: 0, actualIntersections: 0, previousCandidateMisses: 0, sweptCandidateMisses: 0, conservativeRejections: 0 };
for (let i = 0; i < sweep.generated; i++) {
  const a = [random() * 4 - 2, random() * 4 - 2], b = [random() * 4 - 2, random() * 4 - 2];
  if (f.blocked(...a) || f.blocked(...b)) continue;
  sweep.clearEndpoints++;
  const hit = !!sweptIntersection(a, b), sampled = f.clear(a, b, 'sampled'), swept = f.clear(a, b);
  if (hit) { sweep.actualIntersections++; if (sampled) sweep.previousCandidateMisses++; if (swept) sweep.sweptCandidateMisses++; }
  else if (!swept) sweep.conservativeRejections++;
}
assert(sweep.previousCandidateMisses > 0, 'Randomized negative control must expose sampling gaps');
assert.equal(sweep.sweptCandidateMisses, 0, 'Swept boxes may be conservative but cannot miss a reference intersection');
console.log(JSON.stringify({ runtimeSha256, method: 'CPU reference against exact segment/expanded-voxel intersection, with production-predicate source guards, previous-candidate negative controls and body-overlap witnesses. Not WGSL or earned gameplay.', passed: !unresolved, issueReproduced: unresolved, disposition: 'CPU counterexamples resolved when passed. Keep release held for actual fallback routing, narrow-passage, rescue and GPU performance qualification.', cases, sweep }, null, 2));
process.exitCode = unresolved ? 1 : 0;
