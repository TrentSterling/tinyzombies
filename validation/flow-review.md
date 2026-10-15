# Authored route prototype: CPU review

Unpublished. No browser or GPU work was run during this review. MEGABUTT retains the current GPU window. The live game remains the separately validated minimap/contrast build, SHA-256 `b16d90b1e63f82b4b07def0888345ad854c811803a33b82e6b2257a99a655540`.

The reviewed prototype HTML is SHA-256 `ca3675b42b5ec46776153a26ea847e7af77c7ce30f57e426b4eb3dc1e1fcff1c`. The original `42102ea` prototype remains in history.

## Actual change and route intent

World generation reserves the existing mission route before placing generic buildings, cover and barrels. Six destructible freight buildings frame the bends; five clear pockets surround the existing rescue, relay, cell and extraction areas. Ground material boundaries follow the authored routes instead of the district grid. Mission order, objective coordinates, supply/trap behavior, enemy director and all simulation shaders remain unchanged. These are new spaces for the existing encounters, not new authored enemy waves or scripted encounter logic.

| Section | Actual route | Purpose |
| --- | --- | --- |
| Prep and rescue | Start `(-64,52)`, through the existing east door, turn at `(-54,52)` toward rescue `(-40,48)` | Explicit 3 m doorway approach opening into a 7 m lane and rescue yard |
| West relay | Return to `x=-52`, travel north to `z=8`, enter relay `(-48,8)` | Avoid the existing trap supports near the older proposed `x=-48` route |
| Cell | Turn through `(-48,0)`, cross to `(1,0)`, approach cell `(-4,-8)` | A clear cross-freight connection and cell pocket |
| East relay | Follow `x=1` north through the existing trap structure, then turn to `(12,-28)` | 5 m connector between its existing supports |
| Extraction | East to `(48,-28)`, south to `(48,24)`, turn through `(40,24)` and `(40,32)` | Two bends into the west-facing safehouse entrance; the final approach narrows to 2 m |
| Rescue supply loop | `(-40,48)` via `x=-31,z=32`, rejoining `(-52,32)` | Alternate approach near the existing `(-35,32)` medkit and rescue trap |
| Central bypass | `(-16,0)` via `z=-10` to `(1,-10)` | Reach the existing `(-8,-10)` cache while bypassing the older blocked service alignment |
| Extraction flank | `(48,0)` via `(32,0)`, `(32,24)` to `(40,24)` | Detour near the existing `(31,23)` cache, `(28,20)` medkit and extraction trap |

The source review corrected two narrow issues: the seven-metre prep lane label overlapped the existing doorway edges, so that doorway now has its own three-metre approach; the lab curb retains its published width and colors. Geometry and entity limits were not expanded by these corrections.

## CPU evidence

Run from the repository with a saved copy of the published `b16d90b1...` HTML:

`node tools/check_route_flow.cjs /path/to/published-baseline.html`

The test parses the actual JavaScript and generates worlds in a Node VM without calling the browser entry point. `validation/flow-cpu-audit.json` contains the complete assertions and inputs.

- Three chapters times seeds `73129`, `1`, and `1048573`: all nine combinations pass. Quarter-metre sweeps sample 40,534 positions per world across the declared lane widths, using the actual 0.24 m actor footprint and a model of the game's half-metre dynamic collision raster. No blocked samples remain when tactical doors are raised.
- Rescue, both relays, cell, extraction, all six caches, four switches and active medkits have reachable interaction positions. Medkits use their actual 0.8 m pickup distance. Each scripted slab can be lowered individually without removing access to these targets; simultaneous traps and accumulated wreckage are not covered.
- Twelve authored doorway centers align with physical openings: raised clears, closed blocks. The existing prep door also passes both states. Automatic opening and squad behavior still need runtime coverage.
- All 493 structural components have ground support. The largest group has 288 cells, below the repaired 512-cell limit. Six explicit geometric breach probes become passable after removal of their wall aperture. These probes do not execute damage or fracture shaders.
- A CPU model of the existing 256-node, 192-expansion squad search makes progress over every route segment, using up to four repeated searches for the longest segment. It does not simulate live steering, crowd avoidance or concurrent door changes.
- World budgets remain bounded: 90,260 voxels, 463-466 occupied pages, 138-141 props, 480 group slots. The published world has 74,848 voxels, so the increase still needs GPU measurement.
- Every simulation shader source, state layout and fracture-data builder is exact. Only the render shader changes for road materials. Lab block, prop and occupancy buffers match the published build across all nine combinations.

## Next GPU window

1. Use a fresh isolated profile and fault monitor. Compile with animation disabled, then allow one active frame before a bounded ten-second gate. Stop on a device loss or Windows GPU fault.
2. Capture published and candidate seed `73129` at the same camera and frame. Inspect the prep transition, route bends, building doors, support visibility and ground markings.
3. Use ordinary movement, aiming, firing and E interactions to leave prep, reach rescue and approach the west relay; record health, squad progress, positions and any stalls. No health override or teleport belongs in the ordinary-input proof.
4. Cover the remaining bends, supply loops and extraction approach in additional bounded segments. Any positioned or reduced-population fixture must be labelled separately from normal gameplay.
5. Exercise an authored wall breach and a trap drop, then verify actual collision/nav updates and squad passage. Capture the short gameplay proof and retain the exact HTML hash.

Do not merge or publish this prototype before those runtime checks and visual review pass.
