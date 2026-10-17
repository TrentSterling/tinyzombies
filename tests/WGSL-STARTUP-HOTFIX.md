# Historical candidate propagation of startup-only WGSL fix

This document records the earlier candidate stage. The corrected restoration is now included in the owner-playtest release [PR 18](https://github.com/TrentSterling/tinyzombies/pull/18), without a browser/gameplay acceptance claim. Main's original hotfix evidence is preserved under `validation/wgsl-startup-hotfix/historical-main/`.

The published main runtime and this independent candidate shared an ungrouped `&&`/`||` expression in the buddy shader's busy predicate. [WGSL section 8.20](https://www.w3.org/TR/WGSL/#operator-precedence-associativity) requires grouping between these operator families. Main received the startup-only fix through [PR 16](https://github.com/TrentSterling/tinyzombies/pull/16); this branch separately carries the same two parentheses without merging its broader correction stack into main.

Parent candidate runtime SHA-256: `bae0595bd9e851593b0800df7fb2d19c01afaa65ade725750c2d5a713c17dde2`
Fixed candidate runtime SHA-256: `d59ea2d5596f1fef2498a0d4e51c5a71fe77496b9bc10a528fe3f00da08a1aee`

The two characters group the command-owned machinery clause. All existing independent activity and fuel conditions retain their intended meaning. The exact-match inverse in `wgsl-logical-grouping.cjs` lets earlier scoped regression checks recover their original reviewed parents; it cannot remove unrelated edits.

Run `node tests/wgsl-logical-grouping.test.cjs`. All 19 focused grouping cases pass, including a narrow guard over all 40 evaluated shader strings and 17,280 actual-expression truth-table combinations. The unfixed main and candidate fail this guard. All 20 current candidate suites pass, independently rerun; fresh results are in `validation/wgsl-startup-hotfix`.

Cloud Chromium could not launch. No actual shader compilation, browser startup or hardware gameplay acceptance is claimed. The original 247-case bot-priority report and earlier regression reports retain their original runtime hashes as historical evidence. This candidate remains a separate backup; main contains only the startup fix. No new features or further parity work are included.
