# Slow downed crawl: CPU qualification

The player can use the existing movement controls while incapacitated at **0.60 metres per second**, one eighth of the normal unupgraded 4.8 m/s walk. The same normalized input, axis collision checks, static occupancy, dynamic door masks and world clamp apply. The crawl speed is fixed regardless of movement upgrades, diagonal input, carried cell, dragging state or demo input.

Incapacitation cancels any remaining dash and suppresses new dash and grenade actions. Space is the existing grenade control; this game has no separate jump mechanic. The downed pistol path is unchanged. Fresh knockout, pause, upgrade selection, not-started state, completed extraction and defeat cannot move through the new branch. Revival restores ordinary movement without changing health, bleedout, rescue distance, line-of-sight or threat rules. Squad members retain their existing rescue AI; no autonomous squad crawl feature was added.

Only the player movement block in the `begin` shader changes relative to proportion-fix commit `e06b43b`. The previously tested presentation shader is byte-identical. All other simulation, host input/reset logic, audio, art, budgets and counts remain unchanged.

The supplied screenshot shows the downed player beside a wall with `Down - 29s`. It is context for the requested ability, not evidence about motion over time; the private desktop screenshot is not included in this repository.

## Evidence

[CPU results](downed-crawl-cpu.json) and [runner](../tools/check_downed_crawl.cjs):

- 432 crawl-cap cases across 1/120, 1/60 and 1/30-second steps, input directions/magnitudes, upgrades, new and residual dash, and demo mode. All stay at or below 0.60 m/s.
- Five-second diagonal traces travel 3 metres at all three timesteps.
- 432 normal-movement cases, each 60 ticks, match the previous movement block exactly.
- Seven movement guards plus explicit paused bleedout and queued-Shift checks. The existing host may queue Shift during pause, but uniform updates consume it and the downed shader cancels it when movement resumes.
- Wall, corner, wall-sliding and world-clamp fixtures; 25 authored seed-73129 doors in both orientations pass when open and block when closed in the existing CPU occupancy model.
- Revive checks cover moving out of range, occlusion, threat interruption, successful revival to the existing 60 HP and return to normal speed.
- The existing 45-second bleedout and all-squad-down defeat rule execute unchanged. Float64 test steps cross their limits at 45.0167 and 2.0167 seconds; these are scalar model results, not GPU timing claims.
- Actual host keyboard/uniform functions and reset execute against captured buffer writes. Restart clears incapacitation and pending inputs.

The movement and revive blocks execute with limited vector-operator substitutions. Collision geometry uses the previously reviewed CPU grid model. This is not WGSL compilation, float32 accuracy, full squad simulation or gameplay evidence.

```text
node tools/check_downed_crawl.cjs PATH_TO_PROPORTION_ONLY_HTML index.html validation/downed-crawl-cpu.json
```

Proportion-only input SHA-256: `52cc1f3f2ddba7a8277685b0d1ded88982b47a88a7fafdc0b3ebe146144539f8`.

Combined candidate: 398,314 bytes, SHA-256 `4a670f4ac344b810f20864923760828a7aa23f2e752741fb5d5e7f45631ede62`.

The [proportion tests](character-proportions-review.md) qualify their separate source checkpoint. The crawl tests prove that checkpoint's presentation shader remains exact in the combined candidate.

## Pending hardware and release

A single slot capped at 15 wall minutes has been requested after Jet's GPU handoff. No slot has been acquired and no browser/GPU workload has run for these two changes. Preserve the original V9 and the current public release until the combined candidate passes the approved review/release route.

Within the slot, use exact served-byte identity, shader-boot and one-frame gates with the existing isolated profile and Windows GPU fault monitor. First check bounded downed input/collision/revive fixtures, clearly labelled as fixtures. Then record normal before/after gameplay with the same seed, counts, route and intended inputs, including walking, firing and naturally occurring damage/healing/downed/crawler transitions. If a desired state does not occur within the cap, report it as incomplete; do not claim a forced state as ordinary gameplay. Inspect rigid low poses for ground contact, weapon alignment and overlap against the unchanged collision volumes. Stop on any device loss/reset or unresponsive frame progress; close only owned processes and release the lease before packaging.

## Completed combined qualification

This document records an intermediate CPU checkpoint. Windows validation is complete for the final combined runtime, including the crawler ray-alignment adjustment. See [final runtime review](character-runtime-review.md) for exact identity, GPU evidence, limitations and release review.
