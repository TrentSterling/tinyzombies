# Recovery after combat settles

Status: CPU-qualified candidate only. Windows GPU and ordinary-input gameplay validation are still required before merge or deployment. No browser or GPU workload was launched for this batch; Jet retains the shared GPU lease.

Tiny's released director leaves FADE after 16 seconds even when squad intensity remains at its maximum. Its 17–24-second recovery period can therefore expire during the same fight, after which normal enemy replenishment resumes. Renewed pressure or an objective alarm during recovery also consumes that timer.

The candidate requires three continuous seconds below the existing 0.34 intensity threshold, with no active alarm, before entering recovery. Renewed pressure or an alarm during recovery returns the director to FADE and resets that calm interval. Once calm returns, the existing recovery duration starts again. Automatic replenishment stays suppressed during FADE/RELAX; forced alarms retain their existing override. Existing enemies remain active throughout.

The runtime diff is three added lines and one removed line inside the existing mission director block. It reuses the phase timer and adds no buffers, dispatches, per-enemy work or loops. BUILD/PEAK timing, the movement-based recovery exit, intensity calculation, objective logic, population settings, art, audio and controls remain byte-equivalent outside that block.

## Reference grounding

The actual [DEAD ENDS](https://tront.xyz/deadends/) source was inspected at SHA-256 `209a9d39f79649304c278ed229a0fcba52c7a610ce6c7113cbd048c46f82837e`, lines 1038–1100. It transitions from FADE to RELAX only at low intensity, without Tiny's 16-second escape. It pauses automatic waves/specials during those phases while preserving forced events. Its actual running preparation/doorway behavior was inspected in the preceding batch; this batch's director evidence is source inspection, not a new reference gameplay run.

Valve's [The AI Systems of Left 4 Dead](https://cdn.cloudflare.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf), Michael Booth, PDF pages 80–82, describes Peak Fade as allowing the current fight to finish without spending the following Relax period. This candidate applies that principle to Tiny's existing director. The continuous calm timer and interrupted-recovery reset are Tiny-specific choices, not a claim to reproduce every DEAD ENDS or L4D rule.

## Exact identities

- Released baseline: `d72ef66ddd988b7a7e760a40525436cfcc73f213`, 397,543-byte HTML, SHA-256 `6a8b47bcce3eb65b236240ffc1be9d9052b5ab6ab026089405566fb63bea4572`.
- Candidate: 397,717-byte LF HTML, SHA-256 `fedee3e5054b56841bda85903d261cb740e955a289a4e5ddcfc6d17b67f76192`.
- Exact baseline/candidate snapshots and full CPU trace are preserved in the local task's `encounter-pacing/` directory.
- Uploaded V9 remains unchanged at 368,656 bytes, SHA-256 `787cdb9b13b91e27313e550826580e4030ce314fb571299ec171ddf051f99349`. It was not launched.

## CPU evidence

[Executable check](../tools/check_recovery_pacing.cjs) extracts the exact current mission WGSL director block, transcribes only unsigned numeric suffixes and one atomic increment, and executes its scalar control flow with controlled inputs. It parses the full host JavaScript and verifies that only `mission5` changes and that all HTML outside the director block is identical. It does not compile WGSL, simulate enemies/perception, execute GPU atomics, or establish float32 timings or performance.

Fourteen scenarios, twelve timestep/RNG boundary cases, a deterministic repeat, and pause checks pass. With the controlled RNG sample 0.5 and 1/60-second steps:

| Controlled scenario | Released baseline | Candidate |
| --- | --- | --- |
| Maximum pressure for 60 seconds, starting in FADE | Recovery at 16 s; automatic replenishment allowed at 36.5 s | Remains in FADE throughout |
| Maximum pressure ends at 40 seconds | Replenishment already resumes at 36.5 s | Recovery begins at 46.3 s; replenishment allowed at 66.8 s |
| Recovery interrupted by pressure from 2–7 s | BUILD at 12.5 s | FADE at 2 s; fresh recovery at 11.28 s; BUILD at 31.78 s |
| Recovery interrupted by an alarm from 2–12 s | BUILD at 12.5 s | Alarm override retained; fresh recovery at 15 s; BUILD at 35.5 s |
| Player advances 18 m during quiet recovery | BUILD at 7.02 s | Same |

Other checks cover intermittent calm, a downed survivor, sustained and cleared awake-crowd counts, normal timeout, preparation, lab, not-started/completed runs, and zero-delta pause. The twelve boundary cases use timesteps 1/120, 1/60, 1/30 and 0.1 seconds and controlled RNG samples 0, 0.5 and 0.999. Expected durations allow one simulation step of threshold rounding.

[Machine-readable summary](recovery-pacing-cpu.json) retains phase events, final states, per-scenario sample hashes, all boundary results and the full trace hash. Reproduce with an exact baseline HTML extracted from the baseline commit:

```text
node tools/check_recovery_pacing.cjs baseline.html index.html candidate-cpu.json
```

The first diagnostic assertion rejected a transition logged at exactly 16 seconds because accumulated double-precision time crossed the threshold while the indexed timestamp equaled 16. The assertion was corrected to tolerate that boundary before the runtime edit. This was a harness issue, not a candidate behavior failure.

## Required leased Windows validation

After the parent hands over the GPU slot, use the established isolated-profile harness and GPU-fault monitor. Confirm exact served hashes, shader compilation, frame-zero boot and one bounded frame before scenario work. Stop immediately on device loss or a Windows GPU reset.

Exercise the same controlled director transitions on the actual GPU, including high pressure, intermittent calm, alarm interruption and the movement exit. Then use normal controls for a bounded encounter/objective run at the unchanged 2,048-zombie / 32,768-particle settings. Record intensity, phase/time, alarms, awake counts, replenishment, health, objectives and frame/GPU timing. Check prep doorway behavior and audio as part of that run; close all owned processes before handing back the lease.

The main gameplay risk is the existing global awake-count intensity floor: 55 awake zombies already exceed the calm threshold, even if some are distant. The CPU checks establish that this input holds FADE and that clearing it allows recovery. Gameplay must establish that it produces a useful lull rather than an excessively long suppression of replenishment. Do not change that metric or add an emergency timeout without evidence. Route progress is still the existing maximum distance from the start; correcting route semantics is outside this batch.

This is an implementation-owner review, not an independent second review. The candidate must remain unmerged until hardware evidence resolves the risk above. Rollback before release is simply to discard/revert this isolated branch; the live doorway release remains the baseline. Any later published rollback must use a history-preserving revert.
