# Tiny Zombies: No One Left

A standalone WebGPU voxel zombie game. This is the 2026 V9 prototype, distinct from the 2015 Unity experiment.

Play at [tront.xyz/tinyzombies](https://tront.xyz/tinyzombies/). The former `/tiny-zombies/` address redirects here.

## V9.1 pipe bombs and smaller floor marks

This branch adds a pipe bomb on B, separate from the existing grenade on Space. It arcs toward the cursor, beeps after landing, attracts nearby zombies with line of sight, and detonates after six seconds using the existing blast, damage and destruction pipeline. It costs one ordnance and has a twelve-second cooldown. Long Distraction extends its fuse. The fuse and beep scheduler pause with the game.

Floor stamps shrink again: isolated droplets cover 9 paint cells instead of 21, and gore covers 1 instead of 9. Blood remains persistent; its existing shading, drying appearance and minimap rendering are preserved. Wall marks and particle emission, motion, colors, sizes and lifetimes are preserved.

The start/pause screens show both bomb controls. Press ? to open a complete controls overlay. Throwing with no ordnance or during a cooldown gives a brief contextual message.

The exact build passed shader compilation and bounded Windows gameplay on Chrome 155.0.8059.41 / NVIDIA RTX 5070 Ti, driver 591.86, with the default 2,048 zombies and 32,768 particles. Ordinary browser input moved the player out of the prep room, fired 91 rounds, detonated a pipe bomb and a grenade, opened controls and the field map, and passed pause/restart checks. No device errors or new Windows GPU faults were observed.

In an explicit four-zombie fixture, real B input attracted all four from an average 2.99 m to 0.49 m from the bomb; the delayed explosion killed them. Pause held the fuse and beep count. WebAudio scheduled 17 beeps, but the isolated browser output was muted, so audible quality is not verified. [Watch the actual fixture capture](assets/pipe-bomb-proof.mp4).

Paired GPU particle buffers and impact counts matched across isolated impacts and a seeded death event. At frame 120, floor coverage fell from 709 cells to 292 while the 96 active particles and 107 impacts matched exactly. This fixture omits pair solving to avoid atomic-order differences; ordinary gameplay exercises the complete pipeline. See `validation/v91-source-check.json` and `validation/v91-windows-summary.json` for methods and limits. These short checks do not replace a long stability run.

## Play locally

Serve this directory over localhost, for example `python -m http.server 8000`, and open `http://localhost:8000/` in a WebGPU-capable desktop browser with hardware acceleration. Public hosting requires HTTPS. No package installation, build step, external libraries, network assets, or WebGL fallback is required.

Click to start. Move with WASD or arrow keys and aim with the mouse. Left click fires the rifle; right click fires the shotgun; R reloads. B throws a pipe bomb and Space throws a grenade. Shift dashes; Z or middle click uses melee. E interacts, H heals, Tab shows the field map, F cuts a wall and C throws a vortex. Mouse wheel zooms, Escape pauses, ? shows controls, Backspace restarts, M mutes, and T toggles demo mode. F3 shows statistics and F2 exports diagnostics.

## V9 compatibility repair

The preceding V9 compatibility repair preserved the uploaded gameplay and quiet centered HUD. A narrow shader change moves bounded fracture, squad-navigation and buddy-planning scratch arrays into workgroup storage. Those kernels use one invocation per workgroup. Two helper functions now receive scalar upgrade values instead of copying the full state struct. Entity limits and gameplay budgets are unchanged.

The original reproduced a GPU device hang on an NVIDIA RTX 5070 Ti with Chrome 155 and driver 591.86. The repair passed the same previously failing active simulation/render frame. The repaired build also passed a bounded 60-second hardware gameplay test. This is evidence on the tested configuration, not a guarantee for every browser or GPU.

## Previous smaller floor blood release

The previous release reduced the ground-stamp radius to 2 paint cells for droplets and 1 for gore, previously 3 and 2. Isolated painted areas shrink from 37 to 21 cells and 21 to 9 cells. Particle counts, flight, colors, wall marks, impact intensity and persistence remain unchanged. Long sessions can still accumulate blood.

The exact two-byte change passed Windows paired GPU tests: identical particle buffers and impact counts, with the smaller painted areas above. Controlled seeded death-event frames 6 and 120 also matched particle buffers; that diagnostic omitted pair solving and is not a full-game physics equivalence test. A separate ordinary-gameplay smoke test completed 598 frames with pause/resume/restart and no GPU errors or new Windows faults. See `validation/blood-windows-summary.json`.

## Validation of the preceding compatibility build

The following longer and cloud tests apply to SHA `1be63cbf…`, before the two-byte blood-radius adjustment. They are retained as historical evidence, not relabelled as tests of the latest HTML.


- Windows hardware: Chrome 155.0.8059.41, NVIDIA RTX 5070 Ti, driver 591.86, 1280×720, default 2,048 zombies / 32,768 particles. A bounded 60-second test completed 3,600 active frames (10-second gate plus 50 seconds, with an inspection pause), approximately 60 FPS and median reported GPU time 3.87 ms. Movement, 983 rounds, two grenades, wall destruction/fracture, particles and pathfinding ran without game/device errors or new Windows GPU faults. Pause/resume/restart passed and restart restored health, ammunition and world. Simulation continued after the player was downed. Hosted URL testing is a separate deployment check.

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
