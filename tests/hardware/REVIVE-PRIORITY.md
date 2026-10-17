# Self-medkit and manual-revive priority

Status: reviewed-candidate preparation; hardware and ordinary gameplay are deferred. Depends on patient-validity backup `84199cab543e9e07a5c9a65432592dde47d47767`, including the unmerged extraction, pin and requested downed-crawl stack. Exact bytes are pinned in `candidate.json`. The separate fire-cadence correction is absent.

## One bounded correction

The final [DEAD ENDS source](https://github.com/TrentSterling/deadends/blob/a547496c931a047c832a21d35165026df091025b/index.html) updates self-medkit progress and completion in `updateBasePlayer` before calling interaction (lines 494–497). A selected eligible revive then clears only self-heal progress (line 1185). A nearby threat returns before that reset. Secondary teammate medicine uses the distinct `teamHeal` timer after base interaction (lines 1230–1233).

Tiny's equipment pass previously advanced self-medkit progress and its later successful manual-rescue branch never cleared it. A sustained primary-medkit plus E hold could therefore consume a kit and heal the player while also rescuing a teammate. This is proven by controlled production-code/source tests; natural occurrence has not been observed in this batch.

The runtime changes one existing manual-revive branch. After its current eligibility checks pass, and only for source Chapters 1–5 with a self-heal target (`heal12.y < 0`), it clears `heal12.x` and the `supplies.w` progress mirror. No eligibility condition, health value, inventory, completion counter, gear selection or extraction behavior changes.

Important retained distinctions:

- A nearly completed self-medkit can finish in the earlier equipment pass on the first E frame. The source permits this ordering; the patch does not undo that committed heal or refund a kit.
- Threat-blocked rescue does not clear healing. The nearest selected downed patient is used even if that patient is blocked; it does not fall through to a farther patient.
- Secondary medicine for a different living teammate can continue while E rescues. Its nonnegative target keeps the shared Tiny medical timer distinct from self-healing.
- Closed final-door reopening can outrank a nearby revive. Dragged, dead, out-of-range, blocked or unselected patients do not trigger this reset.
- Tiny's existing line-of-sight check is stricter than the source revive interaction. It is retained here. Existing bot bleed/damage processing order also remains unchanged.
- After successful 35-HP rescue, continued self-medkit input may start fresh on the following frame. Existing 2.35-second rescue timing and resource/counter rules remain intact.

## Cloud evidence and scope

Run `node tests/revive-priority.test.cjs`. It composes exact production medical-equipment and mission-selection fragments with the complete production buddy updater/GOAP in their actual pass order. It covers all three patient slots and all five source chapters, 30/60/120 Hz, precharged first-frame completion, threat transitions, secondary healing, selection priority, drag/death/range/LOS, pin/down/movement/release/health-damage interruptions, pause/terminal guards, ordinary rescue completion and exact host save/retry resources. Legacy mode retains its prior behavior.

This adapter controls geometry, threats and movement; it does not execute the complete begin or mission shader, nor compile WGSL. Its pause/terminal early returns represent scheduler preconditions. An independent oracle evaluates actual final source functions and production fragments/full buddy behavior. The strict inverse removes only the literal reviewed insertion and recovers the exact parent runtime. All prior scripted suites, lexical shader checks and audio identity checks remain required.

## Deferred ordinary-input acceptance

Use an authorized dedicated test profile and exact runtime/harness hashes. Record actual video plus read-only health, kit count, medical target/progress/mirror, selected interaction, rescue progress and counters. Never inject state or import a fabricated save and label it ordinary play.

1. With a wounded standing player, equipped medkit and nearby downed teammate, hold primary medicine and E together from zero progress. Self-medkit progress must clear each successful rescue frame, the kit must remain, and the teammate should receive the normal 35-HP rescue after 2.35 eligible seconds.
2. Repeat with a nearby threat blocking rescue. Self-medicine may proceed normally. Clearing the threat before medicine completes must clear the uncommitted self progress when rescue next advances. Record any unobserved timing as unqualified.
3. Separately precharge medicine near completion before beginning E. If the kit completes during the earlier equipment pass, its HP/resource/counter result must remain committed while rescue starts. Do not require a refund.
4. With a third living wounded teammate in reach, observe secondary medicine plus E on the downed patient. Both independent source actions remain allowed. Cover final-door reopen priority, range/LOS, drag and ordinary interruptions where naturally reachable.
5. Retain the patient-validity, crawl, live pin, extraction and fresh same-candidate five-chapter checkpoint/retry/reload/final-progress acceptance in the other notes. The prepared crawl fixture is begin-only and cannot qualify this buddy correction.

Verify all 37 compute pipelines, original counts/allocations, 43 audio decodes, actual frames and browser/GPU errors. Audio decoding is not a listening test. This backup is unmerged; no GPU performance, ordinary-gameplay or full source-parity claim is made.
