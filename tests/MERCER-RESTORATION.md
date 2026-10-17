# Mercer restoration candidate

This is an unmerged, undeployed Chapter 1 candidate based on the separately backed-up six-fix and WGSL grouping stack at `e4fe5def1f60b030b6d90761ab3ab5a9fab5dda2` (equivalent local parent `b335dfb`). Main's separate startup-only merge `efe2ed29b215310e6cc93f12ada60e4d45abf065` is unchanged.

Runtime SHA-256: `1082ae0d4f1ece7dfcf7fd9bc59f480ad745dfcab84a4c1e34702fa93a14d0b4`

## Bounded restoration

- Chapter 1 now has a connected 160 × 128 metre district, five open exterior connections and nine breachable shell buildings around its unchanged objective/supply spine. The exterior perimeter and start/final mission shells remain structural. At seed 73129, boot navigation reaches 19,040 metre cells; the world uses 73,471 voxels, 366 occupied pages and 493 nonzero support groups. Individual support groups contain at most 128 voxels, below the existing 512-voxel scratch cap.
- The configured Mercer population is populated at world creation and used by the existing simulation/director, up to the existing 8,192-slot allocation. Default Mercer now begins with 2,048 infected rather than the source's 185 initialized actors behind a 245-slot campaign ceiling. Supplemental actors are placed in connected, physically clear exterior cells away from the prep shelter. The source's original 185 actors, pickups and objective coordinates are unchanged.
- Existing bullet and pipe-blast damage now has destructible Mercer wall voxels to affect. Axe wall contact uses a real short ray and one body-clear local damage pulse per swing, including after re-equipping. Source barrel/pump explosions apply wall damage only on their actual explosion frame. Removal continues through the existing occupancy, dirty-mesh, support, fracture and navigation paths. Structural Mercer groups cannot be damaged.
- After two seconds more than 12 metres from the objective route, the existing HUD shows a warning. After eight seconds, ordinary director build/peak states may recruit at most 12 unseen sleeping common/runner infected; unmet count uses the ordinary finite wave queue. A 24-second cooldown, nearby-count and intensity caps, and recovery/forced-wave exclusions keep this bounded. The route-facing sector is excluded from new recruits/spawns while exposed. Returning within nine metres clears exposure/warning; existing enemies are not removed. This preserves a direction to retreat, not a guaranteed safe corridor.
- Exterior X-order targets and default squad formation follow the expanded district. A complete-only, bounded fine-route retry fixes the new partial-coarse-path detour near the safehouse. Direct-clear routes are unchanged. At most two searches run for a blocked short route, each retaining the existing 192-expansion/256-node cap.
- Physically reaching or closing the red door cannot complete Mercer until the service gate's objective completion is earned. Other chapters do not inherit this prerequisite.

## Preservation

The immutable pre-edit fingerprints in `mercer-restoration-baseline.cjs` are unchanged. Tests compare all Chapter 2–5 world, prop, initial-population, occupancy and navigation buffers at multiple population settings, plus embedded/external art, mohawk, controls, all 43 FLAC recordings, audio code, blood, particles, font and HTML/CSS shell. Shared new runtime decisions are explicitly Mercer-scoped. Earlier medical, revive, downed crawl, pin, extraction and checkpoint-chain regressions run against the current candidate.

`mercer-restoration-scope.cjs` only reverses the 19 exact reviewed Mercer hunks in `mercer-restoration-delta.json`, then requires the immutable parent runtime SHA. Older whole-file inverse tests use that helper to retain their historical identity assertions. The new restoration suite exercises the actual candidate; it does not substitute the reverted parent. The WGSL grouping and reserved-token scans inspect all 40 current evaluated shader strings.

## Reproduce CPU checks

Run each `tests/*.test.cjs` with Node.js. No package installation is needed. Fresh reports are under `validation/mercer-support-fix/`; prior validation directories remain historical and retain their original runtime hashes.

All 24 scripted suites pass, with 1,064 named cases plus the static harness/shader scans. The grouping suite includes 17,280 expression truth-table combinations. The supplemental sweep can be reproduced with `node tests/mercer-population-sweep.cjs` (several minutes; not included in the default suite count). The first independent review reran 165 focused cases and eight geometry seeds. Follow-up review found the support notification defect described below, then independently checked its narrow correction and 14-case regression.

Focused suites:

- `node tests/mercer-restoration.test.cjs`
- `node tests/mercer-support-lifecycle.test.cjs`
- `node tests/mercer-source-blast.test.cjs`
- `node tests/mercer-restoration-regression.test.cjs`
- `node tests/navigation.test.cjs`
- `node tests/extraction-hold.test.cjs`
- `node tests/wgsl-logical-grouping.test.cjs`
- `node tests/wgsl-source.test.cjs`

## Follow-up support notification correction

The follow-up CPU lifecycle audit found that support/collapse ran before voxel damage, while fracture consumed the damage-frame dirty flag. A group crossing the existing failed-footing threshold on the next frame could then remain uninspected until another hit. The correction requeues that group once when its failure flag first changes, only in Mercer campaign mode. It preserves dispatch order, the four-group inspection cap, other chapters and lab behavior.

The regression uses actual generated 128-voxel wall geometry and exact production support, collapse, voxel-death, fracture scheduler and ground-flood/release-decision fragments. Removing 24 of 32 footing voxels leaves 104 connected survivors. The previous code misses the next-frame release decision; the corrected code schedules it. The adapter stops before wreck allocation/physics, so it does not establish physical collapse or rebuilt navigation on GPU.

A separate 32-seed × 12-budget sweep passed 416 generated worlds and 256,224 supplemental actor footprint checks, including exact counts/clamps, original actor prefixes, zero unused slots, unique clear positions, occupancy backlinks, building/passage connectivity and group capacity. It ran on the immediately preceding runtime; an exact one-fragment inverse establishes that the swept host/world/population code is unchanged by the support correction. See `validation/mercer-support-fix/population-sweep-pre-fix.json` and `population-scope-equivalence.json`.

The additional source-blast lifecycle suite has 11 checks for actual producer stamping, active-frame resets, barrel/pump chains, the bounded 192-entry pending queue, stale stamps, radius/scope guards and pause/terminal behavior. It computes the source wall-damage pulse; it does not execute a full blast-to-fracture-to-navigation pipeline.

## Qualification limits

These are CPU host/buffer checks, controlled production-fragment adapters, collision/navigation reference models and lexical shader guards. They do not compile or execute WGSL, create GPU pipelines, render the district, establish combat pacing, or earn a campaign completion. Files named hardware/fixture tests here are static or mocked harness checks, not hardware runs.

Cloud browser launch remains blocked by the environment's socket policy. No bypass or desktop testing was attempted. Shader compilation, natural gameplay, a matched full-budget hardware performance run and earned Mercer-to-Burnout continuation remain deferred. The restored population increases actor scans substantially; retained allocation limits do not establish acceptable GPU performance. The source-level independent review is not hardware acceptance.
