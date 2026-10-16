# Revive-priority candidate qualification

Hardware testing is deferred. The latest correction cancels uncommitted self-medkit progress only when an eligible manual revive actually advances. Threat-blocked rescue and secondary teammate medicine remain independent; a precharged kit can still complete earlier on the first E frame. See `REVIVE-PRIORITY.md` for source ordering and the measured acceptance plan. This candidate depends on patient-validity backup `84199cab543e9e07a5c9a65432592dde47d47767`.  This dependent candidate prevents retained bot heal plans from spending a medkit on a patient who has become downed, dead or invalid. The invalid action clears progress/plan and normal replanning can choose rescue on the next update. See `HEAL-VALIDITY.md` for the exact scope and complete-updater CPU evidence. This candidate restores the user-requested 0.60 m/s movement while downed, including the existing downed pistol. A live leaper pin still locks directional movement and facing. Current 40-second bleedout, 35-HP revival, collision and healthy movement remain unchanged. This is an intentional user customization rather than the source game's downed immobility. See `DOWNED-CRAWL.md` for cloud evidence, the prepared owned-buffer fixture and the separate natural-gameplay acceptance route.

This candidate depends on reviewed crawl backup `5f459814c4471385a1cdc256ba24761b3a1f653f`, which depends on the reviewed, unmerged pin backup `fb3f5ecc140649f75eebc7e00ae9b3411ff9ea4f`, whose parent is extraction backup `b38093b3ff8dc7374b93ffd49117e34089e1a4e1`. Pin behavior is documented in `LEAPER-PIN.md`; extraction initiation and inherited limits are in `EXTRACTION-HOLD.md`. The separate fire-cadence candidate is not included.

## Exact transfer and dependency

Use this candidate in a separate test worktree. Preserve deployed rollback `022abe3a384fe06ef9ed4620c3fef36ce7b6a1e9`, earlier hardware-qualified rollback `bd6bc8c9157eea06e351beeaf94049ebaea68323`, and the original chapter candidate `247aa55a5647954d8da995ad94782a22443af710`. The local extraction commit `30311a7a6fa376035b9836c76d224bd93bf69b55` and remote backup `b38093b3ff8dc7374b93ffd49117e34089e1a4e1` have the same tree. The patient-validity backup is a child of the remote crawl backup; the revive-priority backup is its child. Extraction, pin, crawl and both medical corrections remain unmerged. Main subsequently received the README-only correction `e39eced80529eab76a679b347b22a28a2ed51942`, which changed no runtime bytes. The deployed Chapters 4–5 were published by owner request with GPU testing deferred; their deployment does not establish hardware acceptance. Transfer the full checkout, including `index.html`, all 43 `assets/audio/*.flac` files and `tests/hardware`. `candidate.json` pins the runtime; the wrapper verifies local and served bytes, including reloads. Use this committed harness rather than an older local copy.

The test computer/browser must be authorized and available before execution. Use its separately started approved Chrome test profile and loopback HTTP server. The harness does not install software, start Chrome/server, change flags/permissions, clear/import saves or publish. Node 22+ with built-in WebSocket is required.

Set `TINY_CDP_URL`, `TINY_QA_URL`, `TINY_QA_INPUT` (default `index.html`) and `TINY_QA_OUTPUT` (new/empty private evidence directory), then run `node tests/hardware/cdp-qa.mjs`. Endpoints must be loopback HTTP. `TINY_ROUTE_WALL_MS` defaults to 20 minutes; expiry means incomplete observation, not a demonstrated game defect.

## Three matched routes

1. `TINY_QA_ROUTE=regression`: fresh dedicated profile/origin, no resume report. Retains the prior Chapters 1–3 navigation paths, with a new extraction controller at each final door, then verifies earned Chapter 4 entry/reload/retry and stops. Keep its accepted wrapper and route report.
2. `TINY_QA_ROUTE=code-red`: requires that naturally earned map-3 save on the same origin/profile. Set `TINY_QA_RESUME_REPORT` to the accepted route report and optionally `TINY_QA_RESUME_WRAPPER` (otherwise sibling `report.json`). Plays the hospital shutter/alarm/rifle-equivalent auto shotgun route, extracts, and now verifies map-4 → Chapter 5 entry/reload/retry. It does not stop at the old unported boundary.
3. Default `TINY_QA_ROUTE=deadweight`: requires the accepted CODE RED wrapper/report and matching naturally earned map-4 save, again on the same origin/profile. Verifies Chapter 5 entry/carry/seed/totals, active retry/reload, winch and final extraction/persistence.

Each continuation checks the prior wrapper acceptance, report digest, chronology and exact existing raw checkpoint. No save is imported. Each report says which earlier chapters were not played in that run. A passed continuation does not replace a fresh matched regression.

The wrapper opens/closes only its own tab and uses ordinary keyboard/pointer input with read-only telemetry. Screenshots, JPEG screencast frames, diagnostics, runtime hash, adapter and route reports are recorded. Evidence can contain local saves and machine metadata; keep it private unless separately reviewed. Audio decode is not a listening test.

## Chapter 5 acceptance route

- Enter from the earned CODE RED map-4 checkpoint. Verify original carry, seed, kills/time/known downs and retries before leaving Toll.
- Approach `(-30.5,17)`, open the east Toll door with E, depart through `(-28.5,17)` and `(-26.5,17)`, then turn at `(-21.5,17)` → `(-21.5,.5)` → `(1.5,.5)`.
- At `(1.5,3.5)`, idle without E, interrupt a partial hold, then continuously hold E for 2.4 simulation seconds. One EVENT is requested. Pause must freeze the independent opening timer.
- Release E and move away to `(3,.5)`. Observe the gate remaining closed before 17 elapsed seconds and opening at/after 17. Then cross `(5,.5)` → `(21.5,.5)`. The 17-second winch activity does not imply 17 seconds of forced director pressure; EVENT pressure is 12 seconds.
- Reach Checkpoint via `(21.5,-16)` → `(19,-16)` → `(16.5,-16)` and take the heavy rifle at `(14.4,-15.94)`. Exit through the same original east connector to `(17.5,-16)` → `(21.5,-16.5)`.
- Approach west final door `(29.5,-16.5)` → `(31.9,-16.5)`, gather at `(35,-16.5)`, then return to `(31.9,-16.5)` and seal only with all four alive and inside.
- Verify campaign totals and final clear, no Chapter 6, active checkpoint removed, repeated Enter unchanged, exact same-tab entry retry, and reload returning to the menu without the completed checkpoint. Progress/records must survive reload. The harness retries before reloading because final entry is intentionally retained only in memory.

## Chapter 4 regression route

The retained route opens the north hospital door, operates the shutter from `(-4.75,5.5)` with a 2.3-second hold, detours through Ward C's connector/auto shotgun, and silences the relay from `(21.5,-5.5)` with a 1.8-second hold. The global 360-source-tick alarm includes shelter staging. A relay-free extraction is allowed by runtime conditions; it is a separate acceptance case. The source control centers are blocked by retained props, so keep the reviewed stand-off points.

## Remaining required observations and known limits

- Explicit X-order winch, shutter and relay operation; ordinary followers must not operate simply by proximity. Revive-first/down/pin interruptions, order-target changes, destroyed relay and alarm-active extraction need separate earned observations.
- Seal cancellation, occupied-door rejection and outside-living-bot reopening remain required. Natural combat may not create these cases; unobserved cases stay unqualified.
- Inspect actual frames for east Toll departure, static river/deck/road markings, original connector/rifle, prompts and all-squad extraction. The 3D adaptation retains full voxel boundary walls and collision; ground colors/markings use the source's final bridge masks and tint, with a mean deck base instead of its 2D pixel noise. No water animation is added.
- Dense CPU sweeps pass the human route. Eight of nine final formation plans have clear continuous edges; one coarse shortcut grazes the doorway. All fixed-anchor scalar movement cases arrive via physical collision/replanning. This is not an earned squad outcome.
- Hold/timer eligibility remains variable-step. Correct scalar timing is not full fixed-step equivalence. CODE RED's f32 phase clock has ordinary one-frame boundary quantization at some rates.
- Old checkpoints have no aggregate down count. They stay playable and can set chapter-local records, but final campaign best comparison is skipped rather than inventing zero downs. New runs carry known down totals. Ranking is survivors, fewer downs, then lower time; kills never break ties. Time uses the existing sampled boundary-time policy, not an independently reconstructed source tick timeline.
- Final progress uses only the isolated Tiny source-port progress/checkpoint keys. Original DEAD ENDS storage and prior Tiny keys stay untouched. If persistence fails, the UI warns and same-tab retry remains usable; reload can restore a checkpoint whose removal failed.
- The inherited initiation contract and remaining extraction differences are listed in `EXTRACTION-HOLD.md`. This batch does not claim full source parity for every shared combat, extraction, mode, networking or AI behavior.

Record the real adapter, all 37 compute pipelines, 43 decoded audio files, unchanged counts/allocations and browser/GPU errors. No hardware performance or live-release claim is made until matched evidence exists.
