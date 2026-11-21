# Regular-door closure occupancy
Base: 23ee4e77f1700a3ea1d8682e3d22312ccdcdfb60. No gameplay or hardware QA yet.

The existing bounded shared scan remains unchanged: 7×7 buckets, at most 16 linked actors per bucket and 96 overall. Its count still feeds regular battering. Its affirmative occupancy result remains sufficient. Only a new player close press on a presently open regular door can invoke the exact fallback, and only if neither the existing player/ally check nor the existing zombie scan already blocked it. Opening, held presses, allied AI, and the separate authored final shelter gate follow the original paths.

The fallback reads the existing same-snapshot zombie grid, not a new pass or a CPU readback. It checks only buckets touched by the widest possible zombie footprint around the slab (12 buckets for Maple seed 73129 door 86). The tiny conservative padding applies only to cell selection. Each actual actor uses the pre-existing strict footprint predicate and positive HP; awake status is not an occupancy requirement. Each link is visited at most once in valid data. Across these disjoint chains, the work is bounded by the active actor capacity (up to 8,192) on that one press; a bad link/range fails closed rather than permitting a close. No horde reduction.

## Verified
- Exact JS host parsing and composed WGSL Naga 30.0.1 parsing/semantic validation: 44/44 baseline and 44/44 candidate with passing positive, parse-negative and semantic-negative controls. Only doors7Shader changed. This is static validation, not Dawn pipeline creation, GPU execution, or a performance benchmark.
- Float32-oriented CPU lookup model demonstrates both row-ordered 96-candidate and 16-in-one-bucket misses, plus 4,096 direct-scan oracle comparisons. All 8,192 actors in an intersecting bucket but outside the actual slab still permit closure in the model. Covers sleepers, dead actors, and strict equality at the footprint boundary. Run node tools/door-occupancy-model.mjs. This is a model, not an executing simulation.

## Before release
- Real WebGPU pipeline creation and deterministic replays at full horde: seed 73129 Maple starter door and a rotated regular door. Occupied behind the global budget and behind the per-bucket budget must give the blocked message/counter without moving or damaging the door from the press. A packed actually empty slab must close; repeat with player/ally occupancy and after a refused close with release/repress once clear. Opening and held key must stay unchanged.
- Check the final authored shelter gate and ordinary attack damage/pressure with matched actor state, not the historical stationary-zombie report. Main and horde unchanged until verified.
- Compare close-frame timing for healthy, packed-empty and packed-occupied cases, alongside ordinary frame timing. A maximum packed scan is potentially the heavy case; do not extrapolate from the CPU fixtures or call this a speedup.
