# LAST BUS OUT terminal credit

## Scope and source
- Exact released baseline: 7d273b6e7786df61fa9d332b162def5777e559c8, SHA256 174363198212eea4f8d6bfd426a7af29a9313b1acadab0744320f863ed3c5141.
- Candidate runtime SHA256: a69fa4b7517a1ac40455fa7b3cb514f883379bcb89d37f9472cdfe53788e00d4.
- Four scoped line changes: LAST BUS OUT done predicate is exact terminal state 1; the Maple Street victory branch calls questHUD65 before the existing evacuation card; an optional terminal flag suppresses the redundant transient quest banner behind that card, while preserving the mission-complete label and radio subtitle.
- No shader, audio bank, DSP, other quest, simulation, neighbor gate, score formula or save-key changes. Final quest credit increases by its existing 1000 points only when the last quest is reached and the run clears.

## Reproduction and CPU evidence
tests/last-bus-terminal100.test.cjs runs the production hud() and questHUD65(), with graphics/audio backends stubbed and deliberately arranged terminal state. Baseline clear displays MAPLE STREET EVACUATED but remains quest index 6, bonus 6000, no sign-off. Baseline negative control fails the assertion that a victory HUD frame completes LAST BUS OUT.

Candidate clear reaches index 7, bonus 7000 and one existing priority sign-off/jingle across 121 HUD frames. Overrun retains index 6/6000 and emits neither terminal sign-off nor quest jingle. The final predicate rejects states 0, 2 and 3. Hidden normal HUD, legacy campaign exclusion and reset opening are covered. Player state, counters and combo bonus remain unchanged by terminal HUD presentation. Entire HTML differs only by those four line changes; all 43 shaders match. All six earlier quest credits and radio cues are also compared directly to the baseline.

Existing first-rescue cue97, BLOCK PARTY cue99, shelter98, roadmap96 opening/specials and WGSL lexical tests pass. Loading-progress passes five behavioral groups but fails its historic exact-inverse source comparison identically on the released baseline and candidate. No claim that every historical repository test passes.

## Renderer evidence
Passed on PC1 NVIDIA Blackwell at 1280 x 720. The dedicated harness uses exact unmodified HTML, local asset fulfillment, an isolated muted Chrome profile and explicit terminal host/GPU-buffer fixtures. It stops ordinary simulation and runs the real frame/HUD renderer. It records calls and return values from unchanged audio functions, not human listening. Both baseline and candidate use the same terminal setup.

An initial fixture counted the existing saved-neighbor jingle from its own injected 0-to-4 saved jump. The fixture was corrected to initialize the prior saved-audio cache, so the terminal quest event is isolated. No runtime audio change was made.

## Honest ordinary full-route plan
A future earned-clear pass must use Standard, ordinary keyboard/mouse controls and read-only steering only: leave the start, recruit/return neighbors, kick cheese, bounce, save at least four, survive to the normal HOA boss and defeat it, complete the existing Gary/generator/battery/truck objectives, resolve every remaining neighbor as saved or lost, bring the squad inside and hold E at the fallout shelter through sealing. Record terminal state, quest index/bonus, subtitle/card and repeated frames. A separately earned overrun must not receive final credit. Stop on a bounded navigation stall or lost party rather than silently converting the route into a fixture. Current first-rescue proof does not establish this whole route, which requires at least the six-minute Standard boss wait and is not necessary to reproduce the host-call defect.

## Release status and limits
Root reviewed and authorized the exact final candidate for release; publication verification is pending. At release, preserve 7d273b6e as rollback, recheck main/claims, and verify Pages plus exact live bytes. Full ordinary evacuation, audible mix/listening, weak hardware and gameplay performance are not qualified.

## Final renderer results
Baseline clear: quest 6/6000 bonus, total score 13000, no sign-off/jingle. Candidate clear: quest 7/7000, total 14000, one successful existing priority sign-off and jingle. Both overruns: quest 6/6000, total 13000, no sign-off/jingle. Values remained stable through 121 rendered frames per fixture. No page errors. The Chatterbox matched sign-off clip was loaded and the real announcement returned true; system output was muted, so no listening verdict is claimed.

First visual review rejected the redundant quest banner showing through the translucent evacuation card. A terminal-only presentation flag removes that duplicate; the final exact hash was rerun and second independent screenshot review accepted the card, completion label and radio subtitle with no remaining faults. Both owner-exclusive GPU claims were released, and no owned Chrome process remained.

The terminal card does not display total score; score consistency is a production-formula state assertion, not a visible-score claim. Normal play presentation is unchanged. The comparison reused owned browser profiles, so startup times are not comparable performance evidence.
