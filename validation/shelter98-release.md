# Shelter evacuation: finish rescuing living followers

Baseline: `97321ee12099e228e8765d703a0250080179e9c4` (Maple Street default, not DEAD ENDS).
Candidate HTML SHA-256: `91cc5b7b5a1252a7305e273533a6861f74229f0dc031e36dd521d01071863d0c`.

## Demonstrated issue and intended scope

The existing shelter counted waiting neighbors but not recruited followers. A controlled real-WebGPU fixture with all main objectives and three squad bots ready, 11 saved neighbors and one living follower 20 m outside completed the evacuation countdown. The same fixture with one waiting neighbor correctly blocked. The end card then described the street as evacuated with only 11/12 saved and zero lost.

The existing final mission says "Bring everyone left to the fallout shelter" and "Get everybody inside". This correction requires living waiting/following neighbors to reach either valid refuge before arming or completing the final seal. Saved and lost remain terminal; losses still do not prevent completion. It does not require perfect attendance.

## Changes

- Count active waiting/following civilian states below 2.5 at both arming and final sealing.
- Add the visible shelter/objective prompt `Bring followers to safety: N` when nobody remains waiting but a follower still needs safety.
- No changes to civilian movement/save-zone rules, objectives, combat, director, difficulty, voice bank, startup, or legacy campaign. Of 43 composed WGSL shaders, only mission5 differs; the other 42 are byte-identical to baseline.

## Verification

- `node tests/shelter98.test.cjs` passes the exact production scalar gate expressions and real host objective text for waiting, panicked waiting, following, saved, lost, inactive and non-civilian entries. Baseline fails the intended follower/final-latch assertions.
- Actual Chrome WebGPU, PC1 NVIDIA Blackwell/RTX5070 Ti: candidate waiting/following and latched waiting/following scenarios block; saved/lost scenarios complete. Zero page errors. Full game startup compiles the candidate.
- Separate targeted movement fixture dispatches real navigation, civilian and mission passes. A follower starts west of the actual final doorway, crosses it, changes to saved, increments saved to12, and only then permits arming and final completion. No deadlock observed.
- Candidate screenshot at1280x720 verifies `Bring followers to safety: 1` is visible and readable. Fixture screenshots are explicitly labeled; they are not full-run gameplay evidence.
- `first-rescue-cue97`, `roadmap96-opening`, and `roadmap96-specials` CPU regressions pass.
- Separate ordinary-controls cautious pass on unchanged baseline: standard default seed73129, WASD walking/E door only, readback-assisted route past an occupied house and a5-second cover pause, then return home at38.48 game-seconds. Player HP100, all12 waiting, zero recruited/saved/lost and zero player shots. The squad retains its autonomous behavior. This is not a detection-break or full evacuation claim. A first bounded harness attempt stalled at a corner; corrected steering completed the loop without a runtime change.

## Limits and reproduction

The gate fixtures deliberately arrange objective/squad/civilian state, with civilian movement frozen for the state matrix and enabled only for the doorway-crossing scenario. No full ordinary-input evacuation, individual detection-break, audio listening, weak-hardware, large-horde, or collapse qualification is claimed.

Run `tests/shelter98-gpu.cjs` with installed Chrome and Playwright (`PLAYWRIGHT_MODULE` can select its module path; `TINY_QA_DIR` selects the artifact directory). All network requests are locally fulfilled or blocked, audio is muted, and the owned browser closes in finally. The fixture hooks are injected into the served copy only, never the shipped HTML. Acquire the shared GPU/browser test claims before running on a shared machine.
