# Bounded extraction-hold correction

Status: source/CPU candidate only. Hardware qualification is deferred. Do not treat a deployment or a scalar test as earned gameplay.

Parent: deployed merge `022abe3a384fe06ef9ed4620c3fef36ce7b6a1e9`, whose tree includes the unchanged chapter candidate `247aa55a5647954d8da995ad94782a22443af710`. Earlier hardware-qualified rollback: `bd6bc8c9157eea06e351beeaf94049ebaea68323`. `candidate.json` pins this candidate's runtime. The separate fire-cadence branch is excluded.

## Changed behavior

- An open final door starts sealing after held E reaches 0.18 simulation seconds when every nondead survivor is inside, or 1.6 seconds when someone remains outside. It no longer starts on the first key edge. Downed and pinned teammates still count as living; only the human closer must be up and unpinned. Ordinary mixed-squad followers do not initiate sealing.
- The subsequent 0.6-second closing motion remains independent of E. Releasing E after initiation does not cancel it. Existing closer/doorway cancellation, outside-bot reopening, victory and persistence logic are retained.
- Nearby nondead, non-dragged rescue takes precedence over OPEN-door initiation in all five chapters. The closest eligible patient is selected. A CLOSED final door instead reopens on a fresh effective E edge from either side, ahead of revive. The global edge is preserved across action changes and frozen while downed.
- Shared pending hold accumulates during valid blocked-door or revive interaction. Release, pin and no action reset it; downing freezes it. Ordinary supplies retain carry, while doors and weapon/axe actions reset it. Human objective completion clears the mirrored hold; bot objective completion does not. Holding during an existing seal can accumulate again, so a cancelled seal may retry without another key edge.
- Prompts distinguish ready, teammates outside, occupied, closing and closed. No actor counts, buffer sizes, collision geometry, audio assets, fire damage or extraction save policy are changed.

## Source and CPU evidence

The source basis is final DEAD ENDS v29.2: the v14 held-interaction wrapper (0.18/1.6), final `beginSeal14`/`updateFinalSafe14`, v19 closed-door priority/edge handling, base shared `interactHold`, and final nearest-action wrappers. An independent private oracle executes those actual source wrappers against extracted Tiny fragments; the source audit itself is not shipped.

Run `node tests/extraction-hold.test.cjs` for directed production-fragment/f32/host checks and all prior `tests/*.test.cjs` suites for regressions. The new suite covers all chapters; 30/60/120Hz and bounded jitter; thresholds, release/pause/down/pin/occupancy, shared carry, dynamic outside status, rescue and closed-door priority, effective key edges, bot reopening, save-once telemetry and reset. Prior readback tests retain late-sample/reset/save-race coverage. The existing closing block is locked to its original fingerprint after removing only the explicit initiation helper call and previously reviewed down-count telemetry.

`tests/extraction-hardware.test.cjs` exercises the real acceptance controller with deterministic callbacks. `tests/hardware-route.test.cjs` checks route wiring, privacy, persistence predicates and physical waypoint segments. These are controller/static tests, not browser runs. The lexical shader check is not a WGSL compiler.

## Matched ordinary-input acceptance

Use the exact committed harness and runtime together, following `README.md`. Run fresh `regression` (Chapters 1–3), then `code-red` and `deadweight` using only their naturally earned saves and accepted reports. Navigation points are retained; extraction inputs intentionally change, so compare both runtime and harness versions. No save import, state writes, damage injection or teleporting is allowed.

At each final door, with all four alive and inside and action 7 selected, `extraction-contract.mjs` now requires:

1. A measured positive E hold below 0.18 seconds, released before initiation. Observe hold zero and no closure for at least another 0.65 simulation seconds. A zero-tick tap is insufficient.
2. Another measured partial hold, pause with Escape, verify simulation time/hold/door remain frozen, release E and resume to zero hold.
3. A continuous hold bracket around 0.18 seconds. Record the last pending hold and first closing sample; a missed short window is incomplete, not a pass.
4. Release E, pause during closing, verify frozen state, resume without E, and observe the independent approximately 0.6-second closure with all four living inside and victory. Screenshots and chapter-prefixed traces accompany the result.

The wrapper cannot accept the route without every played chapter's extraction contract. Resume validators intentionally retain older earned-save compatibility: they verify prior report digest, chronology and raw-save match, but do not force the prior runtime/harness to equal this candidate or require its earlier extraction contract. Therefore a passed continuation qualifies only chapters actually played. Before claiming matched five-chapter acceptance, independently verify a fresh Chapters 1–3 report plus both continuations, all with this exact runtime/harness and their digest chain. A CPU success does not establish that the timing-sensitive controller can observe every window on real hardware; excessive latency or natural combat must produce an incomplete observation, not a fabricated game failure or pass.

Additional earned hardware cases remain manual/explicit, not implied by the automated happy path:

- Use ordinary squad move order to keep a living teammate outside but clear of the doorway. Verify the outside prompt, reject a measured 0.5–0.8-second hold, then bracket the full 1.6-second hold. The closed door must not win while someone living is outside. Observe normal outside up/unpinned bot reopening within reach, regroup and finish. Do not move the player/bot through telemetry.
- Create a natural nearby downed patient: rescue must preempt open-door sealing, including a second non-dragged patient while dragging another. Closed-door fresh-edge reopening must take priority without simultaneously advancing manual revive.
- Observe natural pin/down, closer exit/out-of-reach, occupied doorway and cancellation/retry; release after initiation must not cancel. Missing natural combat cases stay unqualified.
- Check Chapter 1–4 carry/checkpoint/retry/reload and Chapter 5 final progress/record durability, checkpoint removal, repeated Enter and exact same-tab retry. Preserve the existing delayed-readback regression tests.
- Verify actual frames/prompts, all 37 compute pipelines, 43 audio decodes, unchanged counts/allocations, diagnostics and real adapter. Audio decode is not a listening test. Do not compare hardware performance with software-rendered runs.

## Deliberately retained differences

- Chapter 1–2 use their existing outer safehouse bounds; source uses a strict 22-pixel inset. Changing the shared inside helper would also change squad goals/director behavior and is a separate geometry task.
- Doorway occupancy retains Tiny's box/footprint checks, versus source circle/rectangle radius margins. Tiny wins on the closing frame; source finishes on the following closed-door update. The existing `.0001` closing sentinel is retained.
- Objective holds still have independent timers. Preloading shared carry before an objective can make source complete/reset sooner than Tiny. The new mirror does not claim universal interaction equivalence; no normal authored route carrying that difference through all intervening no-action gaps to extraction was established in review.
- Final source axe/window wrappers can override closed-door reopening in artificial overlap states. Tiny retains final-door priority; authored axes are in starting shelters.
- Eligibility and hold accumulation remain variable-step, with ordinary f32 boundary quantization. No global fixed-step simulation, autopilot/all-bot mode, full networking or complete DEAD ENDS parity is claimed.
