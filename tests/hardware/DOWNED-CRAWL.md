# Restore requested downed crawl

Status: independently reviewed code/CPU candidate, prepared hardware fixture. GPU execution and ordinary-input gameplay are deferred. This backup depends on pin commit `fb3f5ecc140649f75eebc7e00ae9b3411ff9ea4f`, then extraction commit `b38093b3ff8dc7374b93ffd49117e34089e1a4e1`. Neither dependency is deployed. The runtime hash is pinned in `candidate.json`. This does not include the separate fire-cadence correction.

## Intent and bounded change

The user requested slow movement while downed. Tiny implemented 0.60 m/s in commit `8a4589e5533ecc7123fb180b4cda88b8aef55fee` and retained it through `868e36c`. The selected-gear port `933b008de323456065944d8a167452edde59d352` then zeroed downed movement while adopting DEAD ENDS weapon behavior. That removed a requested customization. The final source's immobility is not the desired behavior here.

This restoration changes one comment and two expressions in the production beginning shader:

- Keep directional input in the existing downed action-suppression branch.
- Select 0.60 m/s outside every healthy sprint, drag, fuel and healing speed multiplier.

Existing input normalization, axis collision/sliding, world bounds and pause/menu/terminal guards are retained. A live leaper pin still zeroes input afterwards. All inherited pin aim/reload guards are unchanged. The current downed pistol, 40-second bleedout, 35-HP revive, 3-second revive protection and exact chapter-entry retry remain unchanged. Healthy movement is byte-for-byte the prior expression.

At full normalized input, five simulated seconds cover 3.0 m on clear ground. Half input covers 1.5 m. Diagonal or oversized input is normalized. Downed sprint does not increase speed, and stale drag/fuel/heal flags on the first downed frame cannot reduce it. Once revived, the existing healthy speed and next-frame weapon restoration resume.

## Cloud checks and their limits

- `node tests/downed-crawl.test.cjs`: 95 controlled production-fragment/host assertions. Covers 30/60/120 Hz, jitter/pause, input normalization, 16 stale-flag combinations, pin/release/revival, current pistol/down-entry behavior, bleedout, revive range/LOS/threat cancellation, current host input layout, collision and 14 authored open/closed door cases across five chapters.
- `node tests/leaper-pin.test.cjs`: 85 inherited pin assertions, adapted only for the now-allowed unpinned crawl. Downstream retained body/gun facing is included. The exact inverse runtime test recovers the reviewed pin parent after reversing only the three crawl lines.
- `node tests/downed-crawl-fixture.test.cjs`: 11 JavaScript/mock checks of fixture identity guards, current layouts/bindings, isolated resources and cleanup on failure. These do not execute WGSL.
- A separately retained 106-case source oracle checks the actual final DEAD ENDS wrapper chain, pin/facing/reload/equipment behavior, and the intentional crawl override. Source files and private reports are not published with this repository.
- Existing chapter, extraction, checkpoint/readback, navigation, route/controller and lexical shader suites continue to apply. A lexical shader scan is not shader compilation.

The scalar movement adapter offers double-precision and float32-rounded vector variants, with controlled collision. It does not execute the full GPU dispatch sequence, natural AI or projectile damage. The existing pin adapter simplifies sprint readiness and models pause by skipping steps. Counts, assets and all 43 real FLAC files remain unchanged.

## Prepared current-layout GPU fixture

`downed-crawl-fixture.mjs` exports `fixtureExpression(expectedRuntimeSha256)`. It builds one asynchronous browser expression. It is not run by `cdp-qa.mjs` automatically and has not been executed for this candidate.

When hardware is authorized again:

1. Fetch this exact backup into a dedicated test worktree, including audio and tests. Verify `index.html` against `candidate.json`. Preserve the deployed runtime rollback and original test profile.
2. Serve that checkout on approved loopback HTTP at `127.0.0.1`. Use a separate fresh test tab/profile and wait for all production pipelines to compile, without entering a run. The fixture refuses a started game, a different origin/runtime, non-default counts or an unexpected layout.
3. In the already approved browser automation host, import `fixtureExpression` from this checkout and pass `candidate.json.runtimeSha256`. Evaluate the returned expression in that owned test page with `awaitPromise: true` and `returnByValue: true` (CDP `Runtime.evaluate`). Save the returned report, including any partial failure, real adapter and errors. Do not paste it into a normal campaign tab.
4. Expect 24 cases and `passed: true`, or preserve the exact first failure. Do not count only returned cases if the report has `error`, `cleanupError`, or `passed: false`.

The expression reuses only the compiled production `begin` pipeline with its own uniforms, state, counters, occupancy, dummy props, pin claim and readback buffers. All seven buffers are destroyed in cleanup. It writes no production buffers, saves or settings. The synthetic collision fixture is bounded below 20 MiB and validates unchanged production counts/allocation bookkeeping.

Current layout checks are state buffer 16,384 bytes with a 3,896-float meaningful prefix, 400-byte uniforms, 384-byte counters and 112-byte infected stride. It explicitly supplies the pin counter before each pinned dispatch and uses the current UI flags so downed pistol emission is enabled. The historical `tools/check_downed_crawl.cjs` predates these layouts and expects different bleedout/revive values; it is not a valid current acceptance harness.

The 24 prepared cases cover 30/60/120 Hz crawl inputs, stale flags, fresh knockout, emitted pistol shots, pin lock, zero dt, terminal defeat and synthetic wall/slide/corner collision. This is synthetic begin-pipeline qualification only. It does not run the later aim, bullet impacts, buddy/revive or complete mission pipelines; it does not prove natural gameplay or measure performance.

## Deferred ordinary-input acceptance

Use a fresh, hash-matched dedicated run with normal input and read-only telemetry/video. Do not import or synthesize a campaign save. Preserve the three-route same-candidate chapter evidence chain described in README, including the inherited extraction and pin requirements.

1. Obtain a natural human knockout while at least one teammate is alive. Verify downed pistol, the 40-second initial bleedout and the existing on-screen state. If no knockout occurs within the agreed observation window, mark this unobserved.
2. On clear ground, hold cardinal and diagonal input for five simulation seconds, tracking actual displacement and external impulses. Expect approximately 3 m from full input. Shift must not accelerate crawl. Pause must freeze movement and bleedout.
3. Crawl and fire the existing pistol. Confirm shot emission and actual impacts separately; inspect the downed model, facing and gun placement. Check collision against walls and an authored closed/open doorway without passing through geometry.
4. Let a teammate start a normal revive, then crawl beyond the existing range before completion. Verify revive progress cancels. Stop in a clear reachable location and obtain a normal revive to 35 HP; verify healthy movement/weapon restoration and protection.
5. During a natural live leaper pin, directional movement and facing must remain locked. Normal zero-HP downed actors fail acquisition and trigger release. Tiny tests HP rather than the separate down timer here; the crawl-only parent had an inherited stale-heal defect that could create mixed positive-HP/downed state. This dependent candidate blocks that path as described in `HEAL-VALIDITY.md`, but the guard-precedence fixtures do not prove every mixed state unreachable. Treat simultaneous pin/down fixtures as guard-precedence tests; record any natural mixed-state event separately. Observe a downing → pin-release → crawl transition only when naturally reachable, and mark it unobserved otherwise. Complete the inherited reload/equipment/pin-release cases in `LEAPER-PIN.md` when naturally reachable.
6. Record terminal defeat, retry/reset, the matched chapter progression/checkpoint/record regressions, all 37 compiled compute pipelines, 43 decoded audio files, original counts/allocations and browser/GPU errors. Audio decode is not an audible-quality test.

## Retained behavior and limits

Movement state, animation and pistol spread use requested normalized input, not measured collision displacement. Holding crawl into a wall therefore retains the existing moving-shot spread and walking-in-place presentation. Restoring input intentionally activates those existing formulas; it adds no new spread or animation rule.

Natural rescue can interrupt a timed displacement observation. Existing readback latency and variable-step timing also remain. A late-frame damage source can enter downed state on the next beginning pass under unchanged pass ordering. External displacement is separate from directional speed. Full GPU ordering, natural downing/pin/rescue and hardware performance remain unqualified until observed.
