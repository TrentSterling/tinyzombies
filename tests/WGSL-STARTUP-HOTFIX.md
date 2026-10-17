# Startup-only WGSL logical grouping hotfix

The published five-chapter runtime's evaluated buddy shader line 673 mixed short-circuit AND and OR without explicit grouping. WGSL does not assign a precedence relationship between these two groups; [WGSL section 8.20](https://www.w3.org/TR/WGSL/#operator-precedence-associativity) explicitly marks `x && y || z` invalid.

The fix adds exactly two parenthesis characters around the command-owned machinery clause. Activity actions (revive/heal/interact) and fuel delivery remain independent busy conditions. No gameplay tuning, source parity, world data, audio, entity allocation or user customization changes. The separate unmerged correction stack is not included in this main-based hotfix.

Parent runtime SHA-256: `e035eca088efe289cad54707d8eec9ef758444b6eeba6ff063663f96a104450f`
Fixed main runtime SHA-256: `ddc87b5c85e111be9b8d24d4d0af712fca67cc4beca5acb928b7e2d4b225a05b`

Run `node tests/wgsl-logical-grouping.test.cjs`. Its 19 cases include a narrow mixed-operator guard on all 40 evaluated shader strings, 17,280 actual-expression combinations against an independent boolean oracle, and an exact inverse that recovers the unchanged parent runtime. The unfixed main is a negative control and fails the grouping checks. All ten inherited scripted suites also pass on the fixed main.

The previous `wgsl-source.test.cjs` checked reserved words only, so it could not catch this grammar defect. The new guard is still not a full WGSL compiler. Cloud Chromium could not launch in the available environment; shader compilation, actual browser startup and hardware gameplay remain unverified here. Source grammar evidence and CPU results do not imply hardware acceptance. Existing Chapter 4–5 and broader gameplay qualification limits still apply.
