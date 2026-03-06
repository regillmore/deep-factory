# Architecture

## Module boundaries

- `src/main.ts`: bootstrapping, app-shell coordination, and dependency wiring.
- `src/core/`: camera math, camera-follow offset helpers, and fixed timestep loop.
- `src/input/`: input abstraction for keyboard, mouse, touch/pinch, and standalone player intent extraction.
- `src/gl/`: low-level WebGL2 utilities, authored-atlas loading plus layout-driven placeholder fallback generation, world rendering orchestration, and the grounded-idle, grounded-walk, jump-rise, fall, wall-slide, and briefly latched ceiling-bonk standalone player placeholder draw pass with nearby world-light modulation.
- `src/world/`: world data model, chunk math, collision queries, spawn and player-state helpers, a minimal entity registry that tracks per-entity fixed-step hooks plus previous/current render-state snapshots for future interpolation, procedural generation, sparse edited-tile overrides that survive chunk streaming prune, resident per-chunk light storage plus dirty-light local-column invalidation that widens zero-range non-emissive `blocksLight` edits to the edited column's immediate neighbors, further widens edge edits across loaded neighboring `chunkX` boundary columns and those boundary columns' immediate interior neighbors, and still widens nearby non-emissive blocker edits around reachable resident emissive sources, resident lighting recomputation that layers top-down sunlight plus neighboring `chunkX` boundary transport with local emissive falloff on dirty local columns and can report which resident chunk light fields actually changed for renderer invalidation, mesh construction, plus authored atlas-region layout data.
- `src/world/tileMetadata.json` + `src/world/tileMetadata.ts`: validated tile metadata registry (terrain autotile variant maps, liquid-render variant maps with liquid-only connectivity groups, gameplay flags like `solid` / `blocksLight` / `liquidKind` plus optional `emissiveLight`, and non-autotile render `atlasIndex` / `uvRect` metadata with optional animated `frames` / `frameDurationMs` sequences compiled into dense lookups and elapsed-frame resolvers backed by `src/world/authoredAtlasLayout.ts`; liquid variant animations compile into parallel per-tile-per-cardinal-mask frame lookups; renderer boot now validates authored atlas-index sources plus direct `uvRect` metadata, including liquid variants, against the loaded atlas dimensions and whole-pixel atlas edges).
- `src/gl/animatedChunkMesh.ts`: renderer-side helper that rewrites baked chunk UVs for animated non-terrain quads and animated liquid-variant quads keyed by their resolved liquid cardinal masks when elapsed time advances to a new metadata frame.
- `src/ui/`: app shell plus in-world shell chrome, debug DOM overlays, spawn marker, and touch-only player controls.

## Update loop

`GameLoop` uses:

- fixed update step (`60hz`) for deterministic simulation hooks,
- render interpolation alpha (currently unused but available).

A minimal `EntityRegistry` now steps inside that fixed-update path and rotates `previous/current`
render snapshots once per completed fixed tick, but the standalone player still uses the pre-entity
path until task `17` moves it onto that layer.

Bootstrap now mounts the app shell first, initializes renderer plus input behind the `boot` screen, renders one static world preview for the `main menu`, and only starts the `GameLoop` after the shell first enters `in-world`. After that first start, the shell can return to `main menu` without rebuilding renderer or world state; fixed updates and in-world overlay visibility pause until the same session resumes, a paused-menu `Reset Shell Toggles` action can clear persisted in-world shell-toggle visibility and restore the default-off shell layout for that paused session before the next resume, and a separate paused-menu `New World` action replaces the renderer-owned world plus session-owned runtime state before re-entering play. In-world shell toggle visibility (debug HUD, edit panel, edit overlays, spawn marker, shortcuts overlay) now loads from local persistence with an all-off fallback default and writes back to persistence when toggles change. Once active, the in-world shell chrome can independently return to the main menu, recenter the camera on the standalone player, or show or hide the text debug HUD, the full debug-edit control panel, the compact debug-edit overlay layer, and the standalone player spawn marker overlay while the current update phase applies debug tile-edit actions, spawn refresh after tile edits, embedded-player respawn recovery from the latest resolved spawn when edits trap the current AABB in solid terrain, standalone player stepping through shared movement, gravity, and collision helpers from mixed-device intent, and camera follow that targets the player body center while preserving manual pan or zoom offsets from pointer interaction.

## Player state foundation

- Standalone player simulation state currently lives in `src/world/playerState.ts`.
- `PlayerState.position` uses bottom-center world coordinates so spawn placement, collision AABB derivation, and future controller updates share one anchor convention.
- Shared helpers can initialize player state directly from spawn-search output, advance position from velocity on fixed steps, recover embedded state by respawning from the latest resolved spawn, resolve normalized movement intent into grounded walk acceleration or braking plus jump impulse, expose a body-center camera focus point, apply gravity before movement, and resolve x-then-y collision sweeps plus post-move grounded support without mixing render interpolation into the source-of-truth state.
- `src/main.ts` owns the current standalone-player orchestration: it seeds the player from the resolved spawn once, pulls shared desktop or touch movement intent from `src/input/controller.ts`, advances that state in fixed updates via a narrow renderer world-query wrapper only while the shell is `in-world`, steps a minimal `EntityRegistry` for future non-player entity work while the standalone player still remains outside that layer, folds manual pan or zoom camera deltas into a persistent follow offset, loads and saves in-world shell-toggle visibility through local persistence with all-off fallback defaults, lets the shell either pause back to the main menu without discarding the current session, clear persisted in-world shell-toggle preferences from that paused menu while restoring the current session to the same default-off shell layout used on first start, abandon that paused session through a fresh-world reset that restores first-start runtime defaults while preserving initialized renderer/input and persisted debug-edit prefs, or recenter the camera by zeroing that offset and snapping back to the player's focus point, and passes the latest state plus current sided wall contact, ceiling contact, and a short presentation-only ceiling-bonk hold latch into the renderer's temporary world-space placeholder draw pass until entity rendering exists.

## Render pipeline

Renderer initialization first attempts to fetch and decode the committed authored atlas image served from
`public/atlas/tile-atlas.png` at runtime through a compile-time URL derived from the active Vite base path.
If that asset is unavailable or decoding fails, initialization falls back to a generated placeholder atlas derived
from the authored atlas layout so the existing tile rendering path still boots with atlas-index regions in the same
places. After the atlas is loaded, renderer startup validates direct tile
`render.uvRect` metadata plus atlas-index-backed render, terrain, and liquid-variant sources against the runtime
atlas dimensions, stores warning telemetry, and emits a console warning if any static, animated, terrain, or liquid
variant source falls outside the source image or any direct `uvRect` source lands between whole atlas pixels.

1. Ensure canvas backbuffer matches CSS size x `devicePixelRatio`.
2. Build camera matrix (`world -> clip`) for orthographic projection.
3. Compute visible chunk bounds from camera viewport and tile scale.
4. Ensure draw-range chunks are resident, then recompute dirty resident chunk light fields by propagating sunlight top-down from exposed resident chunk tops only within resident chunk columns that currently contain dirty light chunks, writing sunlight onto the first blocking tile before terminating each lit column, then transport sunlight across loaded neighboring `chunkX` boundary columns on dirty edge columns, then light blocking tiles in dirty columns that are cardinally adjacent to sunlit non-blocking tiles (including one-tile recessed vertical air pockets whose horizontal neighbors are sunlit), then merge local emissive source falloff over that sunlight base while also writing emissive light onto the first blocking tile reached by each falloff path before terminating that path, while limiting those passes to the dirty local sunlight columns collected for each resident `chunkX` column before chunk rendering work consumes those caches.
5. Invalidate cached chunk meshes only for resident chunks whose light arrays actually changed during that relight pass, then queue visible (and nearby prefetch) chunk mesh builds and process a small per-frame build budget.
6. Patch ready animated chunk meshes to the current elapsed metadata frame when needed, including liquid-variant frame swaps keyed by the meshed liquid cardinal mask, then draw chunk VAOs with a shared atlas shader that multiplies tile color by the baked per-vertex light value.
7. Draw the standalone player placeholder in world space from the latest `PlayerState`, with facing plus grounded-idle, grounded-walk, jump-rise, fall, wall-slide, and ceiling-bonk pose selection handled in the placeholder shader from render-frame player state plus current sided wall and ceiling contact state and a short render-only bonk hold after blocked ceiling transitions, while sampling nearby resolved world-light tiles around the player AABB and passing that normalized factor into the placeholder shader.
8. Prune far chunk/world caches outside the retain ring.
9. Update debug overlay with frame timing and renderer telemetry.

## Chunk meshing

- Chunk data uses compact `Uint8Array` tile IDs.
- Mesher scans all tiles in a chunk.
- For each non-zero tile:
  - emits two triangles (6 vertices) for one quad,
  - writes per-vertex world position, UV, and resolved light level from the chunk light cache,
  - records animated non-terrain quad offsets plus animated liquid quad offsets keyed by the resolved liquid cardinal mask so the renderer can patch only those UVs later.
- UVs are resolved through tile metadata (terrain autotile variant maps or non-autotile static render metadata), with atlas indices translated through the authored atlas region layout instead of a synthetic grid cache.
- Optional animated render frames compile beside the static render lookup; chunk meshes still bake the static frame-zero UVs, and the renderer mutates only the recorded animated quad UVs when the elapsed frame changes.
- Liquid variant render metadata now compiles beside the base static render lookup, and chunk meshing resolves liquid UVs from sampled NESW liquid-connectivity masks with an isolated-mask fallback when neighborhood sampling is unavailable.
- Animated liquid variant frames compile into per-tile-per-mask lookups; chunk meshes still bake the static liquid frame-zero UVs, and the renderer mutates only the recorded liquid quad UVs when the elapsed frame changes.
- Static chunks upload once as static vertex data; chunks containing animated non-terrain or liquid quads keep a CPU-side vertex copy so the renderer can reupload UV-only changes on frame boundaries.

This is intentionally simple and easy to evolve (greedy meshing, layered tiles, occlusion rules can be added later).

### Placeholder terrain autotile layout

Terrain autotile placeholder variants currently occupy the first `4x4` block of the authored atlas and are addressed
by a row-major variant index derived from the normalized cardinal adjacency mask (`N/E/S/W` bits mapped to `1/2/4/8`).
Diagonal neighbors are sampled and normalized for corner-gating, but placeholder UV selection collapses to the
16 cardinal combinations for now. The current mapping is defined in `src/world/tileMetadata.json` and validated at
startup by `src/world/tileMetadata.ts`, while the atlas indices themselves resolve through the explicit authored
region list in `src/world/authoredAtlasLayout.ts`. The current authored layout also reserves one spare documented
unused region plus transparent exterior padding to the right of the authored regions so committed-asset regressions
have real empty atlas space to inspect.

Non-autotile tiles also resolve UVs through the same metadata registry via explicit render metadata:
- `render.atlasIndex`: authored atlas region index.
- `render.uvRect`: normalized UV rectangle (`u0/v0/u1/v1`) for direct sub-rect mapping.

| Atlas row | Variant indices | Cardinal mask combinations |
| --- | --- | --- |
| 0 | `0 1 2 3` | `----`, `N---`, `-E--`, `NE--` |
| 1 | `4 5 6 7` | `--S-`, `N-S-`, `-ES-`, `NES-` |
| 2 | `8 9 10 11` | `---W`, `N--W`, `-E-W`, `NE-W` |
| 3 | `12 13 14 15` | `--SW`, `N-SW`, `-ESW`, `NESW` |
