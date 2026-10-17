# Tiny Zombies: No One Left

A standalone WebGPU voxel zombie game. This is the 2026 V9 prototype, distinct from the 2015 Unity experiment.

Play at [tront.xyz/tinyzombies](https://tront.xyz/tinyzombies/). The former `/tiny-zombies/` address redirects here.

## Mercer restoration playtest build

This checkout restores a larger connected Chapter 1 district, destructible wall breaches, the configured infected population, bounded off-route pressure and objective-safe extraction. Chapters 2–5 world buffers, art, controls, recorded audio and persistent blood are preserved. This build is released for the owner's playtest through [PR 18](https://github.com/TrentSterling/tinyzombies/pull/18). CPU/source checks are separate from shader compilation, GPU performance and earned gameplay, which remain unverified. See [scope, preservation and test limits](tests/MERCER-RESTORATION.md) and [fresh CPU results](validation/mercer-support-fix/suite-summary.json).

## DEAD ENDS Chapters 1–5

The published campaign contains five authored chapters from [DEAD ENDS v29.2](https://github.com/TrentSterling/deadends/blob/a547496c931a047c832a21d35165026df091025b/index.html): Mercer, Burnout, Last Train, Code Red and Deadweight. Code Red adds the hospital shutter and alarm; Deadweight adds the bridge winch and campaign ending. The player mohawk, all 43 recorded SFX assets and default 2,048 infected / 32,768 particle allocations are preserved.

Chapters 1–3 have bounded hardware qualification on the earlier three-chapter build described below. Chapters 4–5 are published with GPU playtesting deferred: their CPU checks, source construction and navigation models do not establish shader compilation, gameplay or hardware performance. The current five-chapter runtime has not earned matched hardware acceptance. See the [hardware qualification plan and remaining cases](tests/hardware/README.md).

Full source parity remains incomplete. Shared combat, extraction, AI, co-op, device controls and broader source behavior still have unfinished or unqualified cases; publishing all five authored chapters does not qualify every behavior.

## Earlier Chapters 1–3 hardware qualification

The earlier three-chapter release added Last Train's authored subway, north-facing departure, solid trains, Maintenance heavy rifle, two-second power-panel hold and autonomous 15-second gate opening. Squad extraction, entry carry and retry/reload continued through Chapter 3.

That hardware-qualified build's HTML SHA-256 is `4f35b2ab8ab0820d99762226e95d55fe3d0b94d632b7cf63a0f0c3c8366140ed`; it is not the current five-chapter runtime. Its preceding shipped rollback is `f895f7c09aaf564593896374e8f701960f669a4d`.

Ordinary keyboard/pointer testing resumed a byte-matched, naturally earned Burnout checkpoint, then passed Last Train entry retry/reload, the north door, interrupted and fresh power holds, paused and autonomous countdown, Maintenance rifle, all-four extraction, completed-save reload and original-entry retry. Separate scenarios passed explicit bot X-order operation and canceling a partial seal by moving away. A separate fresh-profile run earned Chapters 1–2, including their fuel and extraction contracts; a focused persistence run verified that actual earned checkpoint. These are adaptive recorded routes across separate runs, not a single uninterrupted playthrough or frame-identical benchmark. No gameplay-state injection, teleporting or population reduction supplied the wins.

On Windows Chrome 155 / RTX 5070 Ti, all 37 compute pipelines compiled and all 43 audio clips decoded. The Last Train run recorded 1,071 telemetry samples at approximately 60 FPS with median reported GPU time 1.84 ms. Accepted runs had no browser/device errors or new GPU faults. Those bounded observations do not establish a general performance guarantee or long-session stability.

That release's portable checks passed 62 Last Train cases, 8 delayed-readback/checkpoint cases, 24 navigation cases and 18 fuel/weapon cases. The current checkout retains `node tests/last-train.test.cjs`, `node tests/checkpoint-readback.test.cjs`, `node tests/navigation.test.cjs` and `node tests/burnout-fuel.test.cjs`, with additional Chapter 4–5 coverage in `node tests/code-red.test.cjs`, `node tests/code-red-navigation.test.cjs`, `node tests/deadweight.test.cjs` and `node tests/deadweight-navigation.test.cjs`. The shader-name scan and hardware-route geometry checks are `node tests/wgsl-source.test.cjs` and `node tests/hardware-route.test.cjs`. CPU checks do not compile or execute WGSL.

That earlier slice stopped at an explicit Chapter 4 boundary. Chapter 3 revive-first, down/pin interruption and door-occupancy/reopening were not independently observed on hardware. A bounded natural-combat attempt did not produce them and is not counted as a pass; Chapter 1–2 rescues do not qualify those Chapter 3 cases. Recordings are silent, with no audio-listening claim.

The sections below and [earlier slice-3 review](validation/deadends-slice3-review.json) record historical releases. Their controls, scope and performance observations apply to those earlier artifacts, not the current runtime.

## Live preparation and doorway pursuit

Nearby zombies wander during preparation, react to sight and noise, gather at closed doors and batter them, then enter when opened. Shooting and squad defense work before departure; automatic horde waves and respawns still wait for departure. This follows direct inspection of DEAD ENDS gameplay. The approved recorded SFX and default populations are preserved.

The doorway, combat, collision and normal-controls checks passed on Windows Chrome 155 / RTX 5070 Ti with no GPU faults. The public [methods and limitations](validation/doorway-review.md) describe those historical checks. Broader encounter pacing is a separate pass.

## Combat audio

Combat uses 43 compact CC0 recordings and recording-derived layers: rifle/shotgun attacks, wet hits/deaths, creature vocals, material breaks, firework blasts and mechanical cues. The 719 KiB bank predecodes asynchronously, plays immediately from cache, and retains the bounded 32-source spatial mix and pipe countdown timing. Missing or late assets never block gameplay or replay old events.

The exact runtime passed Windows Chrome 155 / RTX 5070 Ti loading, failure/delay, decode, combat, timing, controls and saturation checks. Six matched scenes per build plus stress ran at approximately 60 FPS with no clipped samples or GPU faults. The horde scenario recorded 35 kills and death/impact/debris layers. Read the public [release review](validation/recorded-audio-review.md) for methods and limitations, or inspect [source credits](assets/audio/CREDITS.md). The user approved the selected-sample preview; no agent listening or long-session audio stability claim is made.

Earlier procedural-mix and fixed-cue-cache measurements remain in the historical [audio report](validation/audio-release-review.md) and [cache report](validation/audio-cache-review.md).

## Authored routes and supply loops

Reserved approaches, three optional supply loops and six destructible freight buildings give the existing mission a sequence of bends and clear objective pockets. Ground markings follow those routes. Mission coordinates, enemy director, supply/trap behavior and simulation shaders are preserved. See [the route intent and validation](validation/flow-review.md).

The exact build completed chapter 1 on Windows Chrome 155 / RTX 5070 Ti using ordinary movement, combat, healing and objective inputs at the default 2,048 zombies and 32,768 particles. All three squadmates reached the secured safehouse alive. The game clock reached 96.79 seconds across bounded segments with inspection pauses. Separate positioned, zero-zombie fixtures passed all supply loops, wall-breach collision/navigation updates, and a falling-slab detour. No device errors or new Windows GPU faults were observed.

Compare the actual same-seed, frame-one [before](assets/route-before.png) and [after](assets/route-after.png) captures. [Watch the gameplay highlights](assets/route-gameplay-proof.mp4) or inspect the [victory capture](assets/route-victory.png). The clip contains cuts between recorded mission segments and no audio.

CPU collision/navigation models also pass three seeds across all three chapters, including lane widths, objective/supply access, support groups, door states and bounded squad-search progress. Chapters 2/3 have CPU coverage only. A matched ten-second prep-area comparison completed about 60 FPS in both builds; this short sample does not establish a performance gain or long-session stability. Full methods and limits are in [the Windows report](validation/flow-windows-summary.json). Published authored-route HTML SHA-256: `ca3675b42b5ec46776153a26ea847e7af77c7ce30f57e426b4eb3dc1e1fcff1c`.

## Compact minimap and environment contrast

The compact minimap is restored at the upper right during active play. Hold Tab for the larger field map. Help, pause and hidden-HUD mode hide the compact map. Both sizes use the same existing GPU renderer and live collision/entity data.

Static architecture and ground now use darker, less saturated materials, following DEAD ENDS' category separation. Character and particle colors, lighting, post-processing, mission behavior and world geometry remain unchanged. The reference came from the verified DEAD ENDS source and gallery/repository image.

The exact build passed Windows shader compilation and ordinary browser-input gameplay on Chrome 155 / RTX 5070 Ti. Movement, 86 rifle rounds, pipe and grenade detonations, controls, Tab map, pause and restart passed without runtime/device errors or new Windows GPU faults. Same-seed frame-one captures verify the visible contrast change and compact minimap; source checks prove identical world/prop/occupancy buffers for seed 73129. See `validation/map-source-check.json` and `validation/map-windows-summary.json`.

Compare [before](assets/contrast-before.png) and [after](assets/contrast-after.png), or see the [combat capture](assets/contrast-combat.png). These are actual Windows captures of the preceding minimap release.

Published minimap build HTML SHA-256: `b16d90b1e63f82b4b07def0888345ad854c811803a33b82e6b2257a99a655540`.

## V9.1 pipe bombs and smaller floor marks

This branch adds a pipe bomb on B, separate from the existing grenade on Space. It arcs toward the cursor, beeps after landing, attracts nearby zombies with line of sight, and detonates after six seconds using the existing blast, damage and destruction pipeline. It costs one ordnance and has a twelve-second cooldown. Long Distraction extends its fuse. The fuse and beep scheduler pause with the game.

Floor stamps shrink again: isolated droplets cover 9 paint cells instead of 21, and gore covers 1 instead of 9. Blood remains persistent; its existing shading, drying appearance and minimap rendering are preserved. Wall marks and particle emission, motion, colors, sizes and lifetimes are preserved.

The start/pause screens show both bomb controls. Press ? to open a complete controls overlay. Throwing with no ordnance or during a cooldown gives a brief contextual message.

The exact build passed shader compilation and bounded Windows gameplay on Chrome 155.0.8059.41 / NVIDIA RTX 5070 Ti, driver 591.86, with the default 2,048 zombies and 32,768 particles. Ordinary browser input moved the player out of the prep room, fired 91 rounds, detonated a pipe bomb and a grenade, opened controls and the field map, and passed pause/restart checks. No device errors or new Windows GPU faults were observed.

In an explicit four-zombie fixture, real B input attracted all four from an average 2.99 m to 0.49 m from the bomb; the delayed explosion killed them. Pause held the fuse and beep count. WebAudio scheduled 17 beeps, but the isolated browser output was muted, so audible quality is not verified. [Watch the actual fixture capture](assets/pipe-bomb-proof.mp4).

Paired GPU particle buffers and impact counts matched across isolated impacts and a seeded death event. At frame 120, floor coverage fell from 709 cells to 292 while the 96 active particles and 107 impacts matched exactly. This fixture omits pair solving to avoid atomic-order differences; ordinary gameplay exercises the complete pipeline. See `validation/v91-source-check.json` and `validation/v91-windows-summary.json` for methods and limits. These short checks do not replace a long stability run.

## Play locally

Serve this directory over localhost, for example `python -m http.server 8000`, and open `http://localhost:8000/` in a WebGPU-capable desktop browser with hardware acceleration. Public hosting requires HTTPS. Keep `assets/audio/` beside the HTML for recorded sound; the files load from the same host. No package installation, build step, third-party runtime or WebGL fallback is required.

Click to start. Move with WASD or arrow keys and aim with the mouse. LMB fires or uses selected gear; RMB or Space shoves. Select guns with 1/2/3, reload with R, and return to the last gun with Q. 4/G/C cycles throwables; 5/F/H selects a medkit. Hold LMB to heal yourself or RMB to heal a nearby ally. Hold Shift to sprint, E to interact, V to toggle dragging, and X to issue or clear the existing squad order. Tab toggles the field map. Wheel cycles available gear; Ctrl-wheel zooms. Escape pauses, ? shows controls, Backspace restarts, N starts a new campaign, M mutes, F3 shows statistics, and F2 exports diagnostics.

## V9 compatibility repair

The preceding V9 compatibility repair preserved the uploaded gameplay and quiet centered HUD. A narrow shader change moves bounded fracture, squad-navigation and buddy-planning scratch arrays into workgroup storage. Those kernels use one invocation per workgroup. Two helper functions now receive scalar upgrade values instead of copying the full state struct. Entity limits and gameplay budgets are unchanged.

The original reproduced a GPU device hang on an NVIDIA RTX 5070 Ti with Chrome 155 and driver 591.86. The repair passed the same previously failing active simulation/render frame. The repaired build also passed a bounded 60-second hardware gameplay test. This is evidence on the tested configuration, not a guarantee for every browser or GPU.

## Previous smaller floor blood release

The previous release reduced the ground-stamp radius to 2 paint cells for droplets and 1 for gore, previously 3 and 2. Isolated painted areas shrink from 37 to 21 cells and 21 to 9 cells. Particle counts, flight, colors, wall marks, impact intensity and persistence remain unchanged. Long sessions can still accumulate blood.

The exact two-byte change passed Windows paired GPU tests: identical particle buffers and impact counts, with the smaller painted areas above. Controlled seeded death-event frames 6 and 120 also matched particle buffers; that diagnostic omitted pair solving and is not a full-game physics equivalence test. A separate ordinary-gameplay smoke test completed 598 frames with pause/resume/restart and no GPU errors or new Windows faults. See `validation/blood-windows-summary.json`.

## Validation of the preceding compatibility build

The following longer and cloud tests apply to SHA `1be63cbfÃ¢â‚¬Â¦`, before the two-byte blood-radius adjustment. They are retained as historical evidence, not relabelled as tests of the latest HTML.


- Windows hardware: Chrome 155.0.8059.41, NVIDIA RTX 5070 Ti, driver 591.86, 1280Ãƒâ€”720, default 2,048 zombies / 32,768 particles. A bounded 60-second test completed 3,600 active frames (10-second gate plus 50 seconds, with an inspection pause), approximately 60 FPS and median reported GPU time 3.87 ms. Movement, 983 rounds, two grenades, wall destruction/fracture, particles and pathfinding ran without game/device errors or new Windows GPU faults. Pause/resume/restart passed and restart restored health, ammunition and world. Simulation continued after the player was downed. Hosted URL testing is a separate deployment check.

- Chromium 140 / Playwright 1.55, SwiftShader WebGPU: 155 frames, default 2,048 zombies and 32,768 particles; movement, firing, voxel destruction, grenade/melee input, pause, restart and demo; no JavaScript or GPU errors. Software-renderer coverage does not establish hardware performance.
- Cloud run: https://github.com/TrentSterling/trentsterling.github.io/actions/runs/38620762717
- `validation/cloud-browser.json` contains the browser report; `assets/tiny-zombies-v9.png` is an actual game capture from that run.
- All 37 compute and 6 render pipelines compiled on the tested Windows NVIDIA configuration without errors or warnings.

## Provenance and reproduction

Source: user-uploaded `tiny_zombies_v9.html` on October 14, 2026.

Original SHA-256: `787cdb9b13b91e27313e550826580e4030ce314fb571299ec171ddf051f99349`

Compatibility repair SHA-256: `1be63cbf1a3887251b0b26067133e71068f7c820c96f5f1c28a9b8718c72f6df`

Previous release SHA-256: `c487bdb1aabeddb7c0ee6edcb2d059aabb2c32ea1be5cfa7a0c34717da3a4fc4`

V9.1 pipe-bomb build `index.html` SHA-256: `4248fc595511b5e5eed88422d2c46ea623bb792b4b7a3ed007ca445521af4355`

With Python and Node.js available, reproduce from your preserved original using:

`python tools/make_v9_scratch_candidate.py /path/to/tiny_zombies_v9.html /tmp/reproduced.html`

Then apply `python tools/reduce_floor_stamps.py /tmp/reproduced.html /tmp/current.html` to reproduce the previous smaller-stamp release. These scripts predate the V9.1 gameplay changes.

The scripts verify source and output hashes and check JavaScript syntax. To run the V9.1 CPU-only regression checks, use `node tools/check_v91.js /path/to/previous-smaller-stamp-release.html`. The crashing original is not the published entry point. No third-party runtime dependencies were found; no new license grant is asserted by this repository.
