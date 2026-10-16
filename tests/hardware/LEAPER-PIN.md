# Human leaper-pin input correction

Status: code/CPU candidate; GPU compilation and ordinary-input gameplay are deferred. No release is implied. This batch depends on extraction backup `b38093b3ff8dc7374b93ffd49117e34089e1a4e1`, on deployed Chapters 4–5 merge `022abe3a384fe06ef9ed4620c3fef36ce7b6a1e9`. The earlier hardware-qualified rollback remains `bd6bc8c9157eea06e351beeaf94049ebaea68323`. The separate fire-cadence candidate is absent.

## Contract and exact scope

The final DEAD ENDS player wrapper replaces the effective input of a living leaper-pinned human with their retained angle and zero direction. That also removes newly requested reload actions. Equipment selection runs before this replacement; already-started reloads continue afterwards. Source: [final source commit](https://github.com/TrentSterling/deadends/blob/a547496c931a047c832a21d35165026df091025b/index.html), lines 489–494, 1219, 1227–1228 and 2430–2456; retained by wrappers at 3235, 5262 and 5979. `p.pin`'s brute slowdown is distinct from `p.pinnedBy`'s leaper immobilization.

Tiny previously applied a 0.4 speed multiplier while leaper-pinned, permitting 82 source pixels/second (1.28125 m/s), copied raw aim, and accepted a fresh R. This change adds three input guards plus the downstream pinned-aim branch:

- Zero human directional input after the current pin latch is sampled.
- Skip the beginning-pass facing write while pinned, retaining the stored direction exactly.
- After ray reduction and cursor picking, the pinned aim pass retains body and gun orientation/sweep state, updates only the grip from retained facing/current position, and returns before the free-aim writers. Unpinned aim smoothing is unchanged.
- Acknowledge a new reload command but call the reload function only when unpinned.

The existing movement collision, reload countdown, gear selection, bot handling, pin acquisition/follow/release, 3-second grace and at least 1-second release protection are unchanged. The guard does not anchor world position. External movement and dragging must be assessed separately.

## Cloud evidence

`node tests/leaper-pin.test.cjs` executes exact production movement, pin-latch, sprint, gear, reload and downstream aim-output fragments with controlled collision and precomputed free-aim inputs, plus actual host reset. It covers 30/60/120 updates per second, jitter/pause, cardinal/diagonal/analog input, facing retention, release/re-pin, existing protection, reload consumption and completion, and all six equipment categories. Float32-rounded vector and f64 variants are included; these are adapters, not WGSL execution. An inverse normalization proves the runtime equals the extraction parent after removing exactly these four bounded blocks and the later, separately reviewed crawl restoration described in `DOWNED-CRAWL.md`.

The adapter skips zero-dt steps to represent pause and simplifies sprint readiness; acquisition/follow and bot guards are lexical invariants. Release cases establish the existing grace/protection assignments, not complete GPU acquisition enforcement.

A separately retained source oracle compares the actual final source wrapper chain and candidate fragments, including the full post-reduction aim lane. Source files and private evidence are not included in this repository. All prior chapter, extraction, persistence, navigation and static harness suites must continue to pass. Lexical shader scans are not compilation.

## Deferred ordinary-input acceptance

Use the transfer/setup in README and verify `candidate.json`'s exact served/local runtime hash. Do not reuse an older harness or import a save. Preserve the separate three-route fresh same-candidate evidence chain for Chapters 1–5. The existing route records chapter progression but cannot manufacture or guarantee a natural pin; passing it alone does not establish this fix.

In a separately authorized dedicated test profile, use ordinary movement and combat to encounter a living leaper outside a safehouse. Keep video and read-only state telemetry with simulation timestamps, pin owner, player position, facing, down timer, weapon, reload remaining, ammunition and input acknowledgements. Record natural acquisition and release. If no pin occurs before the bounded observation window ends, label these cases unobserved, not passed.

1. During a confirmed held pin, hold cardinal and diagonal movement, try sprint and sweep aim. Input-driven displacement must remain zero; stored facing must not change. Inspect the actual character frames. Do not confuse external displacement with accepted directional movement.
2. With a partial magazine and no running reload, press and release R while pinned. The command acknowledgement advances, reload remains zero, and the old command is not replayed on rescue. A fresh R after release must work.
3. Start a reload before natural acquisition. Verify its timer and ammunition continue through the pin. Check shotgun shell continuation separately if naturally reachable.
4. Change permitted equipment while pinned. Selection remains possible; a gun switch still cancels an old reload under the existing contract. Selection must not enable firing or movement.
5. Let a squadmate release the pin or kill/stagger the owning leaper through normal play. Direction and facing resume when the claim clears; existing grace/protection remains. A later natural pin must lock control again.
6. Cover pause/resume and retry/reset, then the retained fresh same-candidate Chapters 1–5 extraction/checkpoint/record routes. Record all 37 compute pipelines, all 43 decoded audio files, unchanged counts/allocations and browser/GPU errors. Decode does not establish listening quality.

## Remaining limits

- Pin ownership is published across existing GPU passes. CPU fragment tests do not qualify real dispatch timing, stale claims or all simultaneous combat/rescue cases.
- Source held physical keyboard R may start a reload when a pin clears because its old key level remains set. Tiny retains its existing command-edge-only reload behavior. The suppressed press-and-release contract is the scope here.
- The user's requested 0.60 m/s downed crawl was lost in the earlier selected-gear source port. The pin backup preserved that inherited regression so its correction could be reviewed separately. This dependent candidate now includes the restoration described in `DOWNED-CRAWL.md`; live pin immobilization still takes priority.
- Existing extraction geometry/occupancy and variable-step timing limits in `EXTRACTION-HOLD.md` still apply. No full-source-parity, hardware-performance or live-release claim is made.
