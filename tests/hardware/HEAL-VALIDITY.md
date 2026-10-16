# Revalidate bot medical patients at execution

Status: code/CPU candidate; hardware and ordinary-input gameplay remain deferred. Depends on the reviewed crawl backup `5f459814c4471385a1cdc256ba24761b3a1f653f`, including the unmerged pin and extraction corrections. The separate fire-cadence candidate is absent. The exact runtime is pinned in `candidate.json`.

## Defect and narrow correction

A bot can retain a valid teammate-healing plan during its existing 0.32-second think interval. If its patient becomes downed near the end of that hold, the original execution branch still completes: it spends a kit and adds 65 HP. For a human, the down timer remains active, producing an inconsistent positive-HP/downed state. Rescue reservation can already be correct while the old action still executes. This was reproduced in the complete production buddy updater with a controlled scene and an initialized pre-existing plan, both on the deployed-main runtime and the crawl parent. It was not observed through natural gameplay.

The final [DEAD ENDS source](https://github.com/TrentSterling/deadends/blob/a547496c931a047c832a21d35165026df091025b/index.html), lines 1230–1233, checks that the teammate exists and is neither dead nor downed on each medical tick. It resets progress when the patient is invalid or changes.

This patch adds one buddy-shader helper and wraps the existing heal-ally/self execution body:

- Reject patient IDs outside exactly -1 through 2 before target-array access. -1 is the human; 0–2 are squad slots.
- Human patients require positive HP and no active human down timer.
- Bot patients require positive current HP and no terminal-death flag. Self-healing uses the healer's current local HP, not its older shared snapshot.
- Invalid actions clear only medical progress and the retained plan length. They do not spend a kit, add HP, increment healing/rescue counters or emit a completed-heal radio event. The existing empty-plan condition triggers normal replanning next update.
- The entire valid-heal branch is otherwise unchanged: amounts, duration, cap, range, sight/threat/damage interruptions and resource accounting retain their existing rules.

The bot bleed timer and previous-down weapon latch are transitional during sequential rescue writes. They are not treated as current down flags: a legitimately revived positive-HP bot remains eligible. Existing planner target changes already reset medical progress, so no new target-tracking state or AI rewrite is added.

## Cloud evidence

`node tests/heal-validity.test.cjs` executes the complete production buddy update and GOAP bodies through a mechanical JavaScript adapter, plus exact host save/retry checks. The scene's geometry/threat helpers and movement are controlled. Struct/vector value copies are preserved at mutable boundaries; unadapted implicit vector operations throw. It is not a WGSL implementation.

Coverage includes near-completion downing at 30/60/120 Hz, human and bot victims, death, positive-HP/down-timer mismatch, invalid IDs, no kit/counter/HP side effects, next-update rescue replanning and normal 35-HP rescue, valid/capped/full-health and self-heals, legitimate transitional latches, existing interruption conditions, planner patient switching, pause/terminal guards and unchanged checkpoint entry/retry state. The strict inverse scope check recovers the exact reviewed crawl runtime after removing only this helper/wrapper.

An independent read-only oracle runs the complete production updater, production GOAP and clear-terrain movement adapter against the source contract. It includes every healer/ally pairing and explicit invalid-index guards. Private source and reports are not included in this checkout. Previous extraction, pin, crawl, chapter, host-readback, navigation and harness checks remain required. All 43 FLAC files, art, controls, counts and buffer layouts are unchanged.

The inherited `downed-crawl-fixture.mjs` still exercises only the production beginning pipeline. It does not test this buddy-shader correction. Passing it or an ordinary chapter route alone cannot certify the new healing cases.

## Deferred acceptance route

Use a dedicated, authorized, exact-hash test profile and keep actual video with read-only telemetry. A naturally reachable sequence is required for a gameplay claim; do not manufacture a campaign save or edit live state to label it ordinary play.

1. Observe a bot begin healing a living wounded human, then have that patient become downed before completion. Record healer slot, target, plan/action, progress, kit stock, both health/down states and heal/rescue counters. The stale medical action must abort with no kit use or false heal.
2. Observe normal rescue ownership take over. Confirm revival uses the normal 35-HP rescue and protection, not a 65-HP medical completion. Cover a bot patient separately, including different squad processing orders.
3. Observe a patient die before a medical action completes, and a valid target change. No kit or false completion may be charged to an ineligible target. Natural timing may not produce these cases within a bounded session; unobserved cases stay unqualified.
4. Confirm valid human/ally/self healing, full-health cap, ordinary interruptions, and the retained crawl/pin/extraction requirements. Preserve the fresh same-candidate three-route chain for all five chapters and checkpoint/retry/reload/final-record checks.
5. Verify all 37 compute pipelines, 43 audio decodes, original counts/allocations, actual rendered behavior and browser/GPU errors. Decode is not an audible-quality test. Keep raw evidence private.

## Remaining limits

This correction prevents the demonstrated medical action from creating a mixed human state. It does not repair an arbitrary pre-existing synthetic positive-HP/down-timer snapshot or change leaper acquisition, rescue eligibility, global scheduling, medical target selection, extraction or combat timing.

The inherited human self-medkit/manual-revive conflict was outside this patient-validity patch. The subsequent dependent correction is documented in `REVIVE-PRIORITY.md`, including the threat-blocked exception and the legitimate precharged-kit completion boundary. No full source-parity, GPU performance or live-release claim is made here.
