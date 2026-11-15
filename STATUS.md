# Status

## November 15: LAST BUS OUT terminal credit candidate
Separate follow-up to the released BLOCK PARTY fix. Baseline main 7d273b6e is missing the final quest credit and radio sign-off because questHUD65 runs only during active play, which excludes terminal frames. The candidate calls it on Maple Street victory, restricts the final predicate to terminal state 1 rather than defeat state 2, and suppresses only the redundant transient terminal banner behind the card.

CPU production-HUD fixtures reproduce the baseline failure and pass the candidate for clear/overrun, 121 repeated frames, hidden normal HUD, legacy exclusion, reset and unchanged simulation/counters/combo. All 43 shaders are byte-identical. Existing cue97, cue99, shelter98, roadmap96 opening/specials and WGSL lexical checks pass. Loading-progress behavioral checks pass, but its old exact-inverse source assertion fails identically on baseline and candidate; it is not reported as an all-green suite.

PC1 terminal renderer comparison passed against exact 7d273b6e, including repeated frames and successful existing audio event calls. Final independent screenshot review accepted the separate card/completion label/subtitle; both claims and owned Chrome are cleaned. Root approved publication of exact final SHA256 a69fa4b7517a1ac40455fa7b3cb514f883379bcb89d37f9472cdfe53788e00d4; release verification is pending. Full ordinary evacuation and human audio listening remain untested. See validation/last-bus-terminal100.md.

## November 15: truthful BLOCK PARTY instruction
A one-entry runtime repair is validated locally and awaiting release verification. The existing standard tutorial path still completes first rescue, cheese kick and trampoline bounce. The cue now agrees with the visible 1/4 saved count instead of announcing four already saved.

CPU regression, baseline negative control, unchanged-shader comparison, ordinary PC1 route, separate browser-host transition fixture and independent screenshot review all pass. No new gameplay system, audio asset or DSP change. Both shared GPU claims are released and owned Chrome processes are gone.

See validation/block-party-cue99.md for source hashes, reproduction, qualification limits and rollback. Full ordinary evacuation and human audio listening remain outside this pass.
