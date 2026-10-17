# Fresh campaign persistence coverage

Run `node tests/campaign-chain.test.cjs`, or pass an explicit HTML path as its first argument. The test uses the existing CPU host harness; it needs no browser or packages.

The frozen runtime reviewed for this addition has SHA-256 `2df704d882c5df5404ca880e1e4623ce63877846047de1f7349f3996d4b34f70`. This is a test-only addition to the unpublished extraction, pin, crawl and medical-priority stack. It changes no runtime or hardware acceptance status.

## Gap addressed

The earlier chapter and readback suites mostly begin with manually prepared checkpoint chains. Their individual transition checks did not establish that the first fresh Chapter 1 save could generate the complete chain consumed by all five chapters. The first Chapter 1-to-Burnout delayed-victory readback was also missing.

This suite has 24 checks built around one fresh host and its generated saves:

- No imported checkpoint or fabricated entry chain at Chapter 1.
- Each chapter retries its exact generated entry after changed HP, resources and transient down, pin, medical and extraction state.
- Each synthetic victory saves changing four-person carry and independently expected cumulative kills, time and downs exactly once.
- Each continuation consumes the generated checkpoint, applies the existing entry recovery/resource/weapon rules, and survives reload from only that serialized chain.
- A delayed Chapter 1 victory cannot complete unplayed Burnout; the discarded callback still unmaps and releases its readback lock.
- Final completion preserves all five clears and the aggregate record, durably removes the continuation checkpoint, never creates Chapter 6, and retains exact same-tab final-entry retry.
- A repeated exact ranking tie keeps the original record; starting a new campaign preserves history and unrelated/legacy storage.

## Evidence boundary and remaining gaps

The test executes the candidate's host save, parser, continuation, retry, reset and delayed-readback code. Victory states, carry, damage and transient flags are synthetic CPU fixtures. It does not execute the simulation shaders, objectives, combat or extraction; its terminal states are not earned gameplay. Existing tests still provide the separate storage-failure and later-chapter stale-readback cases.

A fresh matched five-chapter browser run is still needed to verify the complete simulation-to-readback-to-save path, naturally acquired carry, objective completion and extraction. Natural pin/crawl, interrupted rescue/medical actions, occupancy/reopening and negative extraction cases also remain hardware work. CPU host composition cannot establish GPU ordering, shader compilation, device correctness, frame rate or full source parity.
