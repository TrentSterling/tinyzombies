# Fire simulation-time cadence qualification

The current candidate is pinned by candidate.json. Its rollback is the deployed Last Train merge bd6bc8c9157eea06e351beeaf94049ebaea68323. The change only replaces three render-frame fire predicates with crossed 60 Hz simulation phases. Damage, actor staggering, collision/visibility, invulnerability, populations and allocations remain unchanged.

## Isolated GPU contract

On an already approved test computer/browser, serve the complete candidate checkout over the existing authorized loopback HTTP route. Open tests/hardware/fire-cadence.html in a new owned tab. The page verifies the served runtime hash, extracts the actual production host clock and WGSL bit-test, then dispatches that WGSL on a real adapter. It does not change game state, use a save, reduce game counts or install anything.

Wait for PASS in the title and result. Save window.__fireCadenceResult and inspect the page. Require the candidate hash, zero mismatches across all actor cases, no shader/device errors, and the actual adapter identity. It covers 30/60/120 Hz input traces, jitter, all twelve infected offsets, all four survivor phases, and fractional pause/resume. These are simulated timing inputs dispatched on the GPU, not proof that the browser rendered gameplay at those refresh rates. The fixture owns and destroys its own buffers/device.

The fixture checks the production phase helper, not complete entity/visibility/damage simulation. Full game shader compilation and normal gameplay are separate requirements.

## Actual game regression

Use the ordinary-input harness in README.md with the same candidate. Verify all 37 pipelines, all 43 decoded audio files, normal 2,048 infected and 32,768 particles, unchanged allocation limits, Chapter 1–3 objectives/extraction and save/retry/reload. An accepted existing earned checkpoint may be resumed only with the documented byte match; never import a save to force entry.

Include an ordinary-input molotov throw and visually inspect the resulting flame and infected damage/kills. If practical, separately observe survivor fire exposure without state injection. Record what was actually observed, keep failed attempts, and do not label the isolated GPU fixture as playtesting. Preserve the previous hardware-unobserved Chapter 3 rescue/pin/occupied-door limitations unless new ordinary play establishes them.

## Explicit residual limit

This is not a full fixed-step physics conversion. Eligibility (position, fire lifetime, collision, survivor invulnerability) is still evaluated at variable-step frame endpoints. With strongly irregular frame timing, the unchanged 0.37-second survivor invulnerability can defer a fire hit even though no source phase was lost. The CPU suite records a concrete example: source hits at 0.2/0.6 seconds, while the jittered endpoint model hits at 0.231/0.8. Do not claim exact jitter-independent survivor HP or entry/expiry timing.

CPU checks: node tests/fire-cadence.test.cjs. All twelve infected offsets receive the expected 950 incoming damage over ten simulated seconds at 30/60/120 Hz; survivor phase and fixed-rate invulnerability cases are checked separately. CPU results are not shader compilation or gameplay.
