# Chapter 1–2 bot objective rescue priority

Status: CPU-tested candidate; hardware, shader compilation and ordinary gameplay are deferred. Depends on revive-priority backup `7b9f18df2be90d38e8b83b4c014f8f28c04e81f4`, including the prior five-fix stack and fresh five-chapter host checkpoint-chain coverage. Exact runtime bytes are pinned in `candidate.json`. No publication or desktop testing is part of this batch.

A follow-on startup-only syntax correction adds the two parentheses required by WGSL around the buddy busy predicate. See `../WGSL-STARTUP-HOTFIX.md`. The original bot-priority reports remain historical at runtime `bae0595b`; new `validation/wgsl-startup-hotfix` reports cover runtime `d59ea2d5`. This changes no bot-priority or other gameplay semantics.

## One bounded correction

In the final [DEAD ENDS source](https://github.com/TrentSterling/deadends/blob/a547496c931a047c832a21d35165026df091025b/index.html#L1170-L1185), `nearestAction` selects another downed, nondead, nondragged survivor at strictly less than 90 pixels before gate/fuel operation. Interaction checks threats after this selection. The bot `operate` action calls that interaction path ([lines 1005–1011](https://github.com/TrentSterling/deadends/blob/a547496c931a047c832a21d35165026df091025b/index.html#L1005-L1011)).

Tiny previously advanced ordered Chapter 1 bot cranking and Chapter 2 bot fuel delivery in its mission pass, before the buddy pass could select a rescue. A near-complete operation could therefore finish while an eligible patient was already nearby. The new mission-local `botReviveFirst23` helper adds the missing priority guard to those two readiness checks only.

- Human down state uses the existing `player7.x > 0` timer. Bot down state uses nonpositive HP with `botLife13.y < .5`. The operator's own slot and the dragged bot slot are excluded.
- Selection uses XZ distance strictly less than `90/64`; exactly 90 pixels does not block the operation. Threats and line of sight do not remove selection priority, even when the later rescue cannot progress.
- Chapter 1 keeps its existing accumulated crank progress while interrupted, and resumes the original 4.2-second total. A fresh blocked crank starts no event or alarm.
- Chapter 2 keeps its inherited ready-loss reset: an interrupted pour restarts its 2.1-second hold. No fuel is consumed and no delivery is counted while blocked. An eligible other operator remains independent; the second completed delivery starts one event.
- The activated Chapter 2 11-second opening remains autonomous. Nearby downed survivors do not stop an already activated timer.
- No new kit use, HP change, rescue counter, source eligibility rule, world data, audio, population, layout or user customization is introduced. The full literal inverse recovers the exact reviewed parent runtime, `2df704d882c5df5404ca880e1e4623ce63877846047de1f7349f3996d4b34f70`.

## Reproduction and evidence

Run `node tests/bot-objective-priority.test.cjs`. It extracts the exact Ch1 crank, Ch2 fuel and autonomous-opening fragments and optionally follows them with the complete existing production buddy update, claims and GOAP CPU adapter. It covers both chapters, all three operators, the human and both other bot patients, strict radius boundaries, self/dead/dragged/live exclusions, mixed state predicates, fresh and near-complete holds, resources/counters, ordinary guards, resume conditions, 30/60/120 Hz, independent operators, active opening, scheduler-inactive preconditions, and full-buddy 35-HP rescues followed by objective resumption. Parent negative controls demonstrate that the same blocked-operation oracle catches the original behavior.

`validation/bot-objective-priority/focused.json` records the focused cases, candidate and fragment hashes. The companion regression reports and summary cover all 18 inherited scripted suites. `tests/hardware-route.test.cjs` and `tests/downed-crawl-fixture.test.cjs` are CPU harness checks despite their names; running them is not hardware testing.

Geometry, threat and movement helpers are controlled. The mission adapter executes selected fragments, omitting other mission work such as order expiry and demo/config guards; inactivity checks are scheduler preconditions. JavaScript timing does not establish WGSL f32 precision. No full mission/begin shader execution, shader compilation, GPU ordering, naturally earned gameplay or hardware performance is claimed.

The mission pass still precedes buddy movement and rescue completion. A patient entering range later in the buddy pass can permit the earlier mission increment; a patient revived later can delay resumption by a frame. Tiny also retains its existing interrupted fuel-hold reset rather than the source's shared interaction timer. These are explicitly retained boundaries, not newly qualified complete ordering parity.

## Deferred ordinary-input acceptance

Use a separately authorized computer and dedicated profile with the exact runtime/harness hashes. Keep actual frames plus read-only objective, fuel, health, down/dead/dragged, order, rescue and event telemetry.

1. In Chapter 1, observe an explicitly ordered bot near the crank with a nearby eligible downed human or other bot. Verify no fresh event or near-complete crank commit; moving/reviving/removing eligibility lets the retained crank progress resume. Cover all three operator slots where naturally reachable.
2. In Chapter 2, observe a fuel-carrying bot with a nearby patient. Verify the pour resets, the can remains, no delivery/event is counted, and normal rescue can complete before a fresh pour. Verify a second unaffected operator can deliver independently.
3. Cover strict radius boundaries, dead/dragged/self exclusions, blocked rescue, downed/pinned operators, pause/resume and already activated autonomous opening. Natural combat may not produce every condition; unobserved cases remain unqualified.
4. Retain the prior five-fix acceptance and fresh same-runtime five-chapter checkpoint/retry/reload/final-progress routes. Do not label state injection or imported checkpoints ordinary play.

Verify all 37 compute pipelines, 43 audio decodes, unchanged entity allocations and browser/GPU errors. Decoding is not a listening test. Stop at this candidate and the prior five-fix stack; additional behavior, hardware work and publication require their own scope.
