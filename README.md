# Tiny Zombies: No One Left

A standalone WebGPU voxel zombie game. This is the 2026 V9 prototype, distinct from the 2015 Unity experiment.

Play at [tront.xyz/tinyzombies](https://tront.xyz/tinyzombies/). The former `/tiny-zombies/` address redirects here.

**Maple Street is the game now.** The plain URL boots the open, breakable suburb with neighbors to rescue, in the spirit of Zombies Ate My Neighbors. The old DEAD ENDS chapters are still there behind [`?deadends`](https://tront.xyz/tinyzombies/?deadends) (or `?campaign`), and a saved chapter checkpoint only loads there.

## Mercer restoration playtest build

This checkout restores a larger connected Chapter 1 district, destructible wall breaches, the configured infected population, bounded off-route pressure and objective-safe extraction. Chapters 2–5 world buffers, art, controls, recorded audio and persistent blood are preserved. This build is released for the owner's playtest through [PR 18](https://github.com/TrentSterling/tinyzombies/pull/18). CPU/source checks are separate from shader compilation, GPU performance and earned gameplay, which remain unverified. See [scope, preservation and test limits](tests/MERCER-RESTORATION.md) and [fresh CPU results](validation/mercer-support-fix/suite-summary.json).

## Maple Street (default)

Play it at [tront.xyz/tinyzombies/?sandbox](https://tront.xyz/tinyzombies/?sandbox). This is the first step of the destruction-first redesign: an open, breakable suburb instead of DEAD ENDS corridors.

- It runs the original V9 open-town mission at the full configured horde (2,048 by default): find Gary (HOA President), start the karaoke generator, steal the car battery, hot-wire the ice cream truck, then get everyone into the fallout shelter (HOA approved).
- Every block gets up to two small houses with garage doors and side doors, knee-high picket fences and yard junk. All of it breaks. The seed rerolls the street; `?sandbox&seed=1234` picks one.
- A very calm announcer comments on the chaos. After the evacuation, Enter rolls a new street.
- No checkpoints or records are saved in the sandbox. The campaign URL is unchanged.

`node tests/sandbox26.test.cjs` checks start-up, rerolls, objective reachability on 16 seeds, the announcer and the evacuation flow. Gameplay and GPU behaviour need an owner playtest.

## Drop the building on them

Collapsing walls and buildings now crush infected. Any heavy wreck piece that is falling or flung marks the ground under it, and infected standing there die the same way they do under a dropped slab. In the sandbox a burst of crushes shows CRUSHED x12 in the middle of the screen, chained barrel and pump explosions show CHAIN x3, and the evacuation card counts the crushed. Breaking things is also loud now: a frame that breaks ten or more voxels makes a noise at the break, from 10 m for a chunk to 38 m for a collapse, and the horde comes to see.

## Neighbors to rescue (sandbox)

Every Maple Street now hides 4 to 8 neighbors inside its houses: Brenda, Marv, Linda, Coach Dale, Mrs. Henderson, Todd, Pastor Ray and Kimberly, in bathrobes, HOA polos and hi-vis vests, each with a bobbing "!" and a HELP! tag. Walk up to one and they follow you, finding their own way around walls and through breaches. Awake infected go for them and bite on contact, so noise near a house can cost you a neighbor. Bring them into the fallout shelter to save them. Like Zombies Ate My Neighbors, nobody leaves while someone is still waiting at home: the shelter will not seal until every neighbor has been found (saved or lost), the objective line says how many are still home, and the minimap shows them as gold diamonds (mint once they follow you). The HUD keeps the tally (saved / lost / out there), the announcer reacts, and the evacuation card counts who made it.

On a software GPU running the real shaders, a neighbor followed the player 73 m across town into the shelter; another, cornered by three awake infected, was lost in about 3 seconds.

A group of neighbors follows as a loose two-wide column behind you instead of piling onto one spot. When you stop, they gather on their own side of you. They hurry (3.6 m/s) when more than 4 m behind, and they sidestep awake infected within 2.2 m without backing away from you. In the same software-GPU test, four neighbors escorted 30 m past six awake infected lost 26 HP between them (previously 91). They stayed about 2.9 m behind you on average (previously 4.5 m, all four stacked within 0.2 m of each other).

Neighbors still waiting at home no longer stand still to be eaten. When awake infected come within 4 m, they back away at a run while staying within 3 m of where they were found, usually into a corner, and their tag turns into a shaking red HELP!!. In the software-GPU test, a neighbor with three infected 3.5 m away was still alive after 10 s (dead at 4.75 s before). With two infected they lasted 8 s instead of 6.25 s. With one, they had 36 HP left at 10 s instead of 2.

## Hordes that hear things

Infected now follow two flow fields that share one buffer: one toward the squad (you, plus living bots at a small penalty) and one toward whatever they heard (gunfire and blasts far from the squad, alarms, a landed pipe bomb). A lured infected walks around the house to the pipe instead of grinding against the wall toward you. Following is smoother (the 8-way step blends with the field's slope), queues match the speed of the infected ahead instead of braking and surging, and crowd contacts push along the true separation instead of flipping between axes.

Measured with the real shaders on a software WebGPU device (no hardware timing): both fields match an exact shortest-path reference on every reachable cell; a lured infected behind a back wall reached the pipe in about 15 s where the previous build stalled 14.6 m away; 48 infected chasing the player through a garage door were all inside in 10 s, against 37 of 48 after 12 s before.

Breaches count now. The nav grid used to write off any metre cell holding a single wall voxel, so a hole had to clear a whole grid-aligned metre to exist. Now a cell is walkable if a body fits anywhere in it, each edge records which of three lanes (centre or 0.3 m either side) a body can sweep through, and infected aim through that lane instead of at the next cell's centre. Line of sight also checks that the body fits along the line, so infected no longer press into the lip of a hole. Squad gunfire is heard, and infected only spawn where they can actually reach you. In the same software-GPU test, a lured infected went straight through a 1 m hole cut half a cell off the grid in about 4 s; the previous build ignored the hole and walked around the house.

The horde now remembers up to six noises at once instead of one. Before, every new sound replaced the last, so the moment you fired a gun a pack walking toward a collapse across the street forgot it and turned around. Each noise now keeps its own place, radius and timer; repeats within 4 m merge into one louder, longer noise; and a seventh noise replaces whichever has the least time left. Infected walk to the closest noise they are inside the range of, and the heard flow field leads to all of them. In the software-GPU test, 12 infected 8.8 m from a collapse noise closed to 4.0 m before it expired, even though two newer noises went off elsewhere. The previous build turned them around within half a second; they were 13.2 m away after 4 s.

Loud noises are also remembered longer, scaled by how loud they were: a gunshot for about 4 s, a collapsing house for about 11 s. That means the horde actually arrives instead of giving up halfway. Once a noise fades, an infected that came to investigate does not suddenly know where you are. If you are more than 18 m away, it shuffles slowly around the spot until it loses interest. Get within 18 m and it comes for you as before. In the software-GPU test, a group that heard a noise stayed within about 1 to 3 m of it for 10 s. The previous build turned them toward a player 66 m away, and they had walked 15 m toward the player by the 14 s mark.

## Readable text

HUD text and panels are drawn on a separate 2D canvas layered over the game, using Bangers for headlines and Rubik for everything else, at the screen's full pixel density. The old stretched bitmap-style glyphs are gone, and text stays sharp at the lower-quality tiers below because it does not follow the 3D render scale. If the browser cannot create a 2D canvas, the original GPU glyphs come back. Press ? for a controls card drawn as key caps; in the sandbox it also lists the three house rules. The loading screen uses the same fonts. The sandbox has its own title card and an evacuation card that shows neighbors saved, infected put down, infected crushed and your time. The fonts load from Google Fonts; offline, the browser falls back to Impact or a system sans-serif.

## Low-end GPUs

The renderer now steps its quality down by itself when the frame rate stays under 45 FPS for 3 seconds of play. The simulation and horde size never change, only the picture:

| Tier | Render scale | MSAA |
| --- | --- | --- |
| 0 (default) | 100% | 4x |
| 1 | 100% | off |
| 2 | 80% | off |
| 3 | 67% | off |

Pin a setting with `?tier=0`–`3`, `?q=0.5`–`1` (render scale) or `?msaa=1|4`; pinning turns the automatic step-down off. F3 shows the current tier. The same pass trims GPU work that changed nothing: the crowd search covers 3×3 cells instead of 5×5 (still exact), sight rays stop once sight is already lost, an unused pressure grid is no longer read or cleared, and infected passes are sized to the live population. Infected standing in a partly walled cell, such as a door frame, now head for the cheapest open neighbour instead of stalling. The squad bots used to scan every infected on the map several times a frame, all on one GPU thread; they now look only at the grid cells inside each check's range (4 to 12 m), which turns roughly 30,000 serial record reads per frame into a few hundred near the bots. No GPU timings were measured in development; try it on the weakest machine you have.

## Parity audit fixes

An independent source audit against [DEAD ENDS v29.2](https://github.com/TrentSterling/deadends/blob/a547496c931a047c832a21d35165026df091025b/index.html) found and this build fixes:

- **Director stall after a bot death.** A dead bot kept counting as downed stress (+0.4), so the director could never relax out of FADE and stopped sending ordinary hordes and specials for the rest of the chapter. Dead bots are now skipped, as elsewhere in the same shader.
- **Missing car alarms in Mercer and Burnout.** The captures had dropped the source's `alarm` flag. Car 23 (Mercer) and car 22 (Burnout) are restored, verified by running DEAD ENDS `startMap` at the captured seeds. They become live props exactly like Deadweight's alarm car.
- **Accidental save loss.** N needs a second press within 2.5 seconds. L, T and F6 no longer silently disable saving in ordinary play.
- **Click-to-play after alt-tab** on the title card no longer needs a hidden Escape press.
- **Weapon HUD.** A bottom-centre loadout strip shows all six slots with their keys, magazines/reserves and pipe/molotov/medkit counts. It appears when gear, stock or upgrades change and fades after about 2.5 seconds. The weapon label now shows RELOADING, EMPTY R and NO AMMO, and the ammo ring goes neutral while a throwable or medkit is selected.

`node tests/audit-fixes25.test.cjs` covers these with CPU host checks; all 40 WGSL modules also pass Chrome 141's Tint compiler. Gameplay, GPU startup and the HUD's look still need an owner playtest.

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

The compact minimap is restored at the upper right during active play. Press Tab to toggle the larger field map. Help, pause and hidden-HUD mode hide the compact map. Both sizes use the same existing GPU renderer and live collision/entity data.

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

Click to start. Move with WASD or arrow keys and aim with the mouse. LMB fires or uses selected gear; RMB or Space shoves. Select guns with 1/2/3, reload with R, and return to the last gun with Q. 4/G/C cycles throwables; 5/F/H selects a medkit. Hold LMB to heal yourself or RMB to heal a nearby ally. Hold Shift to sprint, E to interact, V to toggle dragging, and X to issue a squad order. Tab toggles the field map. Wheel cycles available gear; Ctrl-wheel zooms. Escape pauses, ? shows controls, Backspace retries the chapter, N twice starts a new campaign (the first press only warns), M mutes, F1 hides the HUD, F3 shows statistics, and F2 exports diagnostics. The developer keys L (lab), T (demo) and F6 (population) only work with `?dev` or `?lab`; they switch the run to practice, which stops checkpoint and record saving and shows a PRACTICE notice.

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
