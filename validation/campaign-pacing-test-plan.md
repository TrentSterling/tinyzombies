# Longer campaign pacing qualification plan

Prepared using source inspection and existing evidence only. The runs below have **not** been executed. This document changes no gameplay, schedules no work, and does not acquire the GPU lease. Future browser/GPU runs require a handoff after Jet's work.

The subject is released main `c28921129fad8a4b12dfc647757302f406841943`, HTML SHA-256 `fedee3e5054b56841bda85903d261cb740e955a289a4e5ddcfc6d17b67f76192`. The pre-recovery comparator is `d72ef66ddd988b7a7e760a40525436cfcc73f213`, SHA-256 `6a8b47bcce3eb65b236240ffc1be9d9052b5ab6ab026089405566fb63bea4572`. Freeze these exact files and all 43 approved SFX hashes before running; a later build needs its own identity.

Existing evidence establishes one 66-second encounter on one seed/adapter, distant-alert expiration, five isolated GPU director fixtures, controls and CPU invariants. It does not establish multi-leg progression, long alarm sequences, checkpoint continuation or long-duration recovery quality. See [the completed qualification](recovery-pacing-review.md).

## CPU preparation and long traces

Extend a separate diagnostic harness, without editing `index.html`, to run controlled 15-minute director traces. Reuse the exact-source extraction method in `tools/check_recovery_pacing.cjs`. Mark these as scalar control-flow models, not enemy simulation, WGSL compilation or performance evidence.

Test sustained pressure followed by calm; repeated short calm intervals; repeated alarm interruptions; downed-survivor pressure followed by revival; and at least 20 recovery cycles. Sweep intensity 0.3399 / 0.34 / 0.3401, awake counts 54 / 55 / 80, calm intervals 2.9 / 3.0 / 3.1 seconds, and movement gains 16.99 / 17 / 17.01 metres around the existing seven-second exit gate. Include zero-delta pauses during FADE and RELAX, completed/not-started runs and the lab guard. Use controlled RNG samples 0, 0.5 and 0.999 and normal frame timesteps 1/120, 1/60 and 1/30 seconds. Keep the existing 0.1-second isolated boundary case clearly separate from the renderer's capped normal timestep.

CPU source/fixture preparation must also verify three-leg seed increments, fresh phase/intensity state on reset, finite inventories, and checkpoint fields. Include seed 0 and unsigned-32-bit seed rollover as preparation cases. Do not infer successful campaign play from a generated map or a scalar trace.

## Campaign seed matrix

The game has three legs and advances its seed with `(seed + 7919) >>> 0`. Use the following authored campaigns:

| Campaign | Leg 1 seed | Leg 2 seed | Leg 3 seed | Focus |
| --- | ---: | ---: | ---: | --- |
| A | 73129 | 81048 | 88967 | Continuity with the released qualification; normal objective route |
| B | 1 | 7920 | 15839 | Another layout; deliberate reload/heal pauses and recovery-driven movement |
| C | 1048573 | 1056492 | 1064411 | Another layout; backtracking, doors and a temporarily separated squad |
| CPU boundary | 4294967295 | 7918 | 15837 | Seed rollover only; no campaign-play claim |

For each primary campaign, play all three legs using normal controls and the objectives appropriate to that leg: recruitment/rescue when required, relay A, cell, relay B and extraction. Preserve normal damage, ammunition, healing, ordnance, population and squad AI. Record upgrade choices and carried inventory at each transition. No teleporting, health restoration, actor removal or forced objective flags may be used to claim campaign completion.

Run until leg completion, legitimate defeat, or an eight-minute active-simulation cap. A cap or failed objective is an incomplete result, not a pass. Do not extend a run simply to manufacture success. Three candidate campaigns therefore have a maximum initial budget of 72 active minutes. Capture at least three encounter/recovery cycles per campaign when the objective route naturally permits them; record fewer cycles honestly.

The initial comparator budget is campaign A through all three legs, up to 24 active minutes, with the same intended route and upgrade-choice policy. Alternate build order between legs where checkpoint state allows it. Compare B/C against the prior release only if they expose a suspected regression or unexplained pacing result. Do not impose a frame-identical outcome: input timing, targets, deaths and atomic order diverge. Preserve and report differing inventories rather than silently editing them to match.

Split hardware work into independent lease windows of at most 20 wall minutes, normally one leg and its checks. Release the slot at each safe checkpoint. Resume only from a verified game-produced checkpoint, recording its seed, stage, modifications and upgrades. Restarting a fresh leg is a separate sample.

## Recovery edge cases

| Case | Setup and evidence sought |
| --- | --- |
| Repeated forced alarms | Trigger authored cache/relay/screamer events during FADE and RELAX; keep their timing and duration. Forced pressure must continue, then recovery must wait for sustained calm. Distinguish an alarm created after the director pass from a persistent error; inspect the next simulation tick. |
| Threshold chatter | Use isolated CPU/GPU fixtures for exact thresholds and a real crowded choke point for gameplay. Brief calm must not spend the recovery period. Do not use a fixture's edited state as evidence of ordinary play. |
| Distant awake population | Repeat the 80-alert fixture across all three primary seeds. Measure distance to **every active survivor**, not only the player, and retain authored positions/HP. If 80 valid distant actors are unavailable, report the available count; do not invent a passing setup. |
| Separated or downed squad member | Record the remote survivor's nearby threats, HP, revive state and pressure contribution. Recovery may legitimately remain blocked while that survivor is fighting. It should become available after the threat/downed condition clears. |
| Player movement during recovery | Check time-based recovery at rest, forward progress after seven seconds, movement before that gate, and backtracking. Maximum distance from the start is the current rule; do not mistake it for route progress or change it during qualification. |
| Long quiet FADE | After alarms and nearby combat end, record any FADE lasting more than 45 further seconds. Inspect active/near/far enemy counts, stuck enemies, all survivor pressure and alert refresh sources. This is an investigation trigger, not permission to add another timeout. |
| Repeated interruption | Interrupt three recovery windows with actual pressure/alarms, then allow the encounter to settle. Check that one complete recovery period is eventually available and the timer is neither consumed invisibly nor accumulated across interruptions. |
| Pause, restart and completion | Pause at the end of the calm gate and near the recovery timeout; confirm active time holds. Restart and inspect journey/phase/alarm state. Verify post-extraction and defeat stop progression normally. |
| Leg/checkpoint transitions | Continue legs 2 and 3 through the normal upgrade UI, then reload from a saved checkpoint in a fresh isolated profile. Verify seed, stage, inventory and fresh encounter timers; finish leg 3 and exercise the normal new-run path. |
| Scarce resources and door pressure | Reload or heal while enemies pressure a doorway; use a pipe bomb to create space. Record actual pursuit, threat return and finite resource costs. Retain approved SFX and ambient preparation behavior. |

Prioritize alarm chains, distant alerts and checkpoint continuation on the first available windows. Exact-boundary fixtures can be grouped into a short session; ordinary campaign evidence remains separate.

## Measurements and decision rules

Log phase, phase timer, intensity, selected recovery duration, alarm source/end, journey/progress, objectives, HP/downed states, ammunition, resources and deaths. Sample living awake enemies near each survivor and farther than 40 metres from **all** active survivors. Record actual dead-to-live replenishment separately from permission to replenish. Diagnostic readbacks must not drive gameplay. Capture timestamps/controls and brief clips around transitions; use quarter-second telemetry for campaign trends and per-tick readback for isolated boundary cases.

For each leg, report phase durations, completed/interrupted recovery windows, calm-gate duration, observed quiet time, alarm time, objective completion, HP/resource costs and causes of prolonged FADE. After departure, a FADE-to-RELAX transition must follow three continuous calm seconds, within one simulation tick of the strict threshold; preparation/reset may initialize phase zero directly. Without interruption or qualifying progress, the chosen 17–24-second recovery period should complete. Existing live attackers stay active. Normal replenishment is suppressed during FADE/RELAX, except for the existing alarm override; verify actual spawns, not only the phase label.

Record FPS, GPU median/p95, stalls and buffer/population settings. Use uncaptured matched quiet scenes as the controlled cost comparison; combat scenes change with the director. Investigate a repeated median regression above 15% or p95 above 25% in two matched checks with reversed order; these are investigation thresholds, not automatic proof of a defect. Keep all 2,048 enemies and 32,768 particles unless the test explicitly concerns an existing user setting.

An unexplained stall, impossible timer transition, missed objective, stuck checkpoint, unchanged distant pressure after its refresh sources expire, or resource/controls regression becomes a reproducible evidence item. Record the exact build, seed, stage, checkpoint, input timeline, raw state and clip. One occurrence warrants investigation; a safe repeat or independent source proof is required before proposing a gameplay change. Do not relaunch after a device loss or Windows GPU reset.

For future hardware sessions, use the existing isolated profile, exact served-byte checks, shader boot/single-frame gates and Windows fault monitor. Stop immediately on device loss/reset or unresponsive frame progress. Do not alter drivers, settings or other apps. Close owned processes and release the lease before analysis or packaging.

## Deliverables and status

Produce a per-run table with `planned / completed / defeated / capped / blocked` status, exact seed/stage/build, outcomes and linked raw traces. Deliver a campaign summary, a transition timeline per leg, short readable comparison clips, performance tables and any reproducible defects. Keep the qualified release and original V9 unchanged until evidence supports a separately reviewed change.

Current status: **plan only**. No new campaign run, GPU/browser session or gameplay modification was performed while preparing this document.
