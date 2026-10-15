# Live preparation and doorway pressure

Tiny Zombies froze every zombie before movement and damage processing until the player crossed the departure radius. Opening the shelter door or shooting from inside therefore left enemies stationary and invulnerable. Closed doors also disconnected the shared flow field when its source cell was inside the shelter.

This change keeps nearby actors live during preparation. Unaware zombies take short slow walks with pauses; sight, gunfire, alarms and injury activate pursuit. Closed doors block sight and bodies, but the shared route field can lead an alerted zombie to the door. Alerted zombies batter it and enter when opened. Player damage and recruited squad defense work before departure. The automatic director and dead-enemy respawn gate still wait for departure; unrecruited Violet does not start a remote rescue during preparation.

The dynamic occupancy word retains its physical height bits and adds separate non-door height bits in unused upper bits. Routing reads the latter, preserving overlapping crates and walls. Physical collision still reads the original bits. Reset initializes this occupancy before the first sight/movement tick, preventing an unintended first-frame squad volley. Perception reuses the existing 48-step sight loop; the navigation, neighbor, crowd and door candidate caps stay unchanged. There are no new GPU buffers or per-enemy path searches. Defaults remain 2,048 zombies and 32,768 particles.

The audio host is byte-equivalent to the approved recorded-SFX release, and all 43 audio assets passed their existing hash/loader/mixer contract checks. Controls, rendering, authored identity and world population settings are unchanged.

## DEAD ENDS was inspected directly

Reference: https://tront.xyz/deadends/, source SHA-256 `209a9d39f79649304c278ed229a0fcba52c7a610ce6c7113cbd048c46f82837e`, main `a547496c931a047c832a21d35165026df091025b`.

The current game was run through its real simulation and existing Canvas2D renderer in a CPU-only diagnostic copy. Only the final `installAtlas27()` call was omitted; animation frames were manually stepped and browser GPU/WebGL/WebGPU were disabled. Screenshots of actual preparation, closed-door pursuit and open-door attack were inspected. This was a behavior reference, not a GPU benchmark.

- Quiet preparation: 155 of 181 authored zombies moved more than five world pixels in eight simulated seconds without stimuli or enemy repositioning.
- Controlled pursuit: after gunfire, a common zombie approached the closed entrance. Emptying the squad's ammunition isolated navigation from combat kills.
- Opening that entrance allowed the zombie inside and reduced the player's health from 100 to 23 while the game remained in preparation.
- Source inspection confirms separate ambient wandering, sight/noise awareness, remembered targets, exterior closed-door goals, bounded shared fields and staging-only director suppression. Tiny uses the first principles relevant to this bug; it does not claim to port the full last-seen/search state machine.

## Windows evidence

Release HTML SHA-256: `6a8b47bcce3eb65b236240ffc1be9d9052b5ab6ab026089405566fb63bea4572`. The full behavior suite used `e4754e8743e3d5284d44f5b786c22ef6d77bcefe972f2032543cf862d9f9fa4f`; the only final packaging change restores LF line endings. A byte-for-byte normalization proof and a fresh exact-release boot/single-frame gate are included. Baseline is released main `ccc932b7f541086c8ff17e5bf0df12c4eee2a950`, HTML `f7cc36522bf433ad879f5be1aaeb8077dee11f11578ad61dfbf0a286a2914405`.

Chrome 155.0.8059.41, NVIDIA RTX 5070 Ti, driver 32.0.15.9186 / 591.86, 1280×720. The exact served Document hashes were checked. The original uploaded V9 was never launched and remains unchanged at 368,656 bytes, SHA-256 `787cdb9b13b91e27313e550826580e4030ce314fb571299ec171ddf051f99349`.

- Quiet candidate preparation: 367 zombies moved, zero shots, zero alert count, full player health, full 28-point door health. The baseline moved only 10 overlapping bodies through its separate crowd pass; its AI remained frozen.
- Matched closed-door fixture: three common zombies approached after a normal gunshot, stopped outside the physical door and reduced its health. Player health stayed 100. Baseline zombies remained in their initial positions.
- Opening through normal E input let the candidate zombies cross and damage the player while departure/director remained zero. Baseline zombies still did not move.
- Shooting before departure killed all three tracked candidate zombies. All three baseline zombies retained their full health despite normal shots and recorded impacts.
- Actual GPU occupancy probe: closed doors block the ground; a non-door prop overlapping the door remains a physical and navigation obstacle when the door opens; removing that prop restores ground clearance. The open door's overhead occupancy remains intentional.
- Normal-input regression: movement out of the shelter, firing 91 rounds, one pipe detonation, one grenade, help/map, pause, and restart passed. Restart returned the player to `[-64, 0, 52, 100]` and cleared bomb state.
- All three owned browser sessions closed with zero Windows GPU faults and no remaining owned browser, server or monitor processes. GPU lease released at **2026-10-15 18:00:35 UTC**.

See [machine-readable results](doorway-summary.json), [browser probes and captures](doorway-browser/), and [audio regression](doorway-browser/audio-regression.json). The capture video is silent screen evidence; the approved sound assets were not re-recorded or changed.

The same seed and scenario inputs were used, with explicit three-zombie positioning and squad ammunition suppression for the pursuit fixture. All 2,048 enemies and 32,768 particles remain present; nearby unrelated enemies are moved away only in that fixture. Timing, aim tracking and GPU atomic order are not identical between runs. These are brief bounded tests on one adapter, not a full campaign or extended soak.

An initial occupancy assertion incorrectly expected an opened overhead door to clear every height bit. It was corrected to assert ground clearance and repeated in a fresh profile, with no runtime change. That failed probe and the first candidate's startup-volley discovery are preserved in the local/Library evidence history rather than substituted for the final qualification.

## Repeating the targeted checks

The `doorway-browser` harness serves only baseline/candidate HTML and the audio manifest files. Copy exact tested HTML files and `assets/` beside it, use a fresh profile, and hold the shared GPU lease before running `launch.ps1`. `check.mjs boot candidate` verifies the Document hash at frame zero. `gate candidate` runs one frame. `door candidate natural`, `closed`, `open`, `combat`, and `mask` run the targeted probes; open continues the closed scene. `ordinary candidate` checks normal controls. `close candidate` and `cleanup.ps1` must finish before releasing the GPU lease. Stop on any device loss or Windows GPU fault.

`manifest.json` identifies the scenario-tested CRLF snapshot. To test the final LF release, copy `final-manifest.json` over the harness's `manifest.json`; the runtime is otherwise identical, as recorded in `final-line-ending-proof.json`.

## Release review and rollback

Runtime commit `e290fcf3056b90e1085bb66123ff17e731af52e9` was reviewed against `ccc932b7f541086c8ff17e5bf0df12c4eee2a950`. This is an implementation-owner review, not an independent second reviewer. No unresolved blocker was found in the changed preparation gates, sight loop, ambient steering, recruited-squad behavior, door attacker predicate, occupancy packing, navigation mask or reset ordering. The source change is 25 added and 17 removed lines; the remaining files are validation evidence and documentation. Audio assets/host, GPU buffer allocation and existing iteration/candidate limits were checked against the prior release.

The exact release file has a successful fresh-profile boot and single-frame check, and the scenario-qualified snapshot differs only in newline encoding. The PR must merge only its reviewed head, preserving the prior main commit as the rollback point. If rollback is needed, revert the PR's merge commit with mainline parent 1 and deploy that new revert commit; do not reset or force-push main. Public HTML and all 43 same-origin audio files must match the qualified hashes after deployment. The prior playable release remains available in Git history at `ccc932b7f541086c8ff17e5bf0df12c4eee2a950`.
