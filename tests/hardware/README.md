# CODE RED candidate qualification

Hardware testing is deferred. This candidate extends the source-backed campaign through Chapter 4 and stops before Chapter 5. CPU checks, source capture and navigation models are not shader compilation or gameplay acceptance. The separate fire-cadence candidate is not included.

## Exact transfer

Use the reviewed candidate commit in a separate test worktree. Preserve shipped rollback `bd6bc8c9157eea06e351beeaf94049ebaea68323` and all existing history. Transfer the complete checkout, including `index.html`, 43 `assets/audio/*.flac` files, and `tests/hardware`. `candidate.json` pins the runtime hash; the wrapper verifies local and served bytes, including reloads. Never substitute an older private harness.

The test computer/browser must be authorized and available before execution. Use its separately started approved Chrome test profile and loopback HTTP server. The harness does not install software, start Chrome/server, change flags/permissions, clear/import saves, or publish. Node 22+ with built-in WebSocket is required.

Set `TINY_CDP_URL`, `TINY_QA_URL`, `TINY_QA_INPUT` (default `index.html`) and `TINY_QA_OUTPUT` (new/empty private evidence directory), then run `node tests/hardware/cdp-qa.mjs`. Endpoints must be loopback HTTP. `TINY_ROUTE_WALL_MS` defaults to 20 minutes; expiry means incomplete observation, not a demonstrated game defect.

## Two matched routes

1. Default `TINY_QA_ROUTE=code-red`: requires an existing naturally earned Last Train map-3 save on the same origin/profile. Set `TINY_QA_RESUME_REPORT` to its accepted `route-report.json` and optionally `TINY_QA_RESUME_WRAPPER` to its accepted wrapper (otherwise sibling `report.json`). The wrapper hash, acceptance, timestamps and existing raw save must match. No save is written/imported to establish entry. This mode marks Chapters 1–3 as not played in the current run.
2. `TINY_QA_ROUTE=regression`: run from a fresh dedicated profile/origin, without a resume report, to earn Chapters 1–3 again. The original accepted movement/combat paths are retained. The former Chapter-3 terminal check now verifies earned continuation/reload/retry into Chapter 4, then stops. Its accepted report can supply route 1 on that same origin/profile.

The wrapper opens/closes only its own tab and uses ordinary keyboard/pointer input plus read-only telemetry. Screenshots, JPEG screencast frames, diagnostics, runtime hash, adapter identity and route reports are recorded. Evidence may contain a local save and machine metadata; keep it private unless separately reviewed for sharing. Audio decode is not a listening test.

## Chapter 4 route

- Verify map-3 → CODE RED carry, seed, totals, active retry and reload before leaving shelter.
- North door: approach `(-27.5,12.5)`, use E, then continue north through `(-27.5,8.5)` to let all squadmates depart.
- Reach shutter from `(-27.5,2.5)` → `(-3.5,2.5)` → `(-4.75,5.5)`. The exact control center is blocked by an authored prop, so use this stand-off point. Idle without E, interrupt a partial hold, then hold E for 2.3 simulation seconds. Shutter opens immediately and alarm starts. Pause must freeze clock/alarm elapsed.
- Through shutter: `(-3.5,10)` → `(-3.5,15)` → `(3.5,15)` → `(4.5,15.5)` → `(7.5,15.5)` → auto shotgun `(8.05,14.22)`. These bends respect Ward C's original crate and connector wall.
- Continue via `(8,15.5)` → `(12.5,15.5)` → `(14.5,16.5)` → `(20.5,16.5)` → `(20.5,-5.5)` → relay stand-off `(21.5,-5.5)`. Idle, interrupt a hold, then hold E for 1.8 seconds. Alarm must stop; inspect queue/pressure evidence. The relay remains actionable if its decorative prop is destroyed.
- Final approach: `(20.5,-7.5)` → `(29.5,-7.5)` → gather at `(35,-7.5)` → seal at `(31.9,-7.5)`. All four survivors must be alive and strictly inside source bounds; red door must close and victory must be earned. Alarm silence is not an extra extraction prerequisite in the runtime.
- Verify map-4 completion, exact entry chain/totals, reload and retry restoring map-3 entry carry. Repeated Enter must stop at the explicit Chapter-5 boundary.

The 360-source-tick ALARM phase includes shelter staging, rather than six seconds since activation. CPU f32 tests cover phase boundaries, activation/silence on a pulse tick and long runs. Render-step interaction/eligibility remains quantized; ordinary f32 rounding may place an exact nominal-time boundary one render frame later at some refresh rates. Do not infer full fixed-step gameplay equivalence from pulse counts.

## Required additional observations

From earned entry, separately test explicit X-order shutter and relay operation, changing an order while near the other control, revive-first/down/pin interruption, already-FADE silence, destroyed decorative relay, and alarm-active extraction. Verify final seal cancellation, occupied-door rejection and outside-living-bot reopening. Natural combat may not produce every case; unobserved cases stay unqualified.

Inspect actual frames for hospital layout/label, north exit, Ward C connector/auto shotgun, prompts, alarm pressure and all-squad extraction. Record real adapter, all 37 compute pipelines, 43 decoded audio files, unchanged counts/allocations and browser/GPU errors. No performance, live-release or full-five-chapter claim is made until the corresponding evidence exists.
