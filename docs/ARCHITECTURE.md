# Architecture

## Module boundaries

- `src/main.ts`: bootstrapping, app-shell coordination, and dependency wiring.
- `src/core/`: camera math, camera-follow offset helpers, and fixed timestep loop.
- `src/input/`: input abstraction for keyboard, mouse, touch/pinch, and standalone player intent extraction.
- `src/gl/`: low-level WebGL2 utilities, authored-atlas loading plus layout-driven placeholder fallback generation, world rendering orchestration, and the grounded-versus-airborne standalone player placeholder draw pass.
- `src/world/`: world data model, chunk math, collision queries, spawn and player-state helpers, procedural generation, sparse edited-tile overrides that survive chunk streaming prune, mesh construction, plus authored atlas-region layout data.
- `src/world/tileMetadata.json` + `src/world/tileMetadata.ts`: validated tile metadata registry (terrain autotile variant maps, connectivity/material grouping, gameplay flags like `solid` / `blocksLight` / `liquidKind`, plus non-autotile render `atlasIndex` / `uvRect` metadata and optional animated `frames` / `frameDurationMs` sequences compiled into dense lookups and elapsed-frame resolvers backed by `src/world/authoredAtlasLayout.ts`; renderer boot now validates authored atlas-index sources against the loaded atlas dimensions and direct `uvRect` metadata against both atlas bounds and whole-pixel atlas edges).
- `src/gl/animatedChunkMesh.ts`: renderer-side helper that rewrites baked chunk UVs for animated non-terrain quads when elapsed time advances to a new metadata frame.
- `src/ui/`: app shell plus in-world shell chrome, debug DOM overlays, spawn marker, and touch-only player controls.

## Update loop

`GameLoop` uses:

- fixed update step (`60hz`) for deterministic simulation hooks,
- render interpolation alpha (currently unused but available).

Bootstrap now mounts the app shell first, initializes renderer plus input behind the `boot` screen, renders one static world preview for the `main menu`, and only starts the `GameLoop` after the shell enters `in-world`. Once active, the in-world shell chrome can independently show or hide the text debug HUD and the compact debug-edit overlay layer while the current update phase applies debug tile-edit actions, spawn refresh after tile edits, embedded-player respawn recovery from the latest resolved spawn when edits trap the current AABB in solid terrain, standalone player stepping through shared movement, gravity, and collision helpers from mixed-device intent, and camera follow that targets the player body center while preserving manual pan or zoom offsets from pointer interaction.

## Player state foundation

- Standalone player simulation state currently lives in `src/world/playerState.ts`.
- `PlayerState.position` uses bottom-center world coordinates so spawn placement, collision AABB derivation, and future controller updates share one anchor convention.
- Shared helpers can initialize player state directly from spawn-search output, advance position from velocity on fixed steps, recover embedded state by respawning from the latest resolved spawn, resolve normalized movement intent into grounded walk acceleration or braking plus jump impulse, expose a body-center camera focus point, apply gravity before movement, and resolve x-then-y collision sweeps plus post-move grounded support without mixing render interpolation into the source-of-truth state.
- `src/main.ts` owns the current standalone-player orchestration: it seeds the player from the resolved spawn once, pulls shared desktop or touch movement intent from `src/input/controller.ts`, advances that state in fixed updates via a narrow renderer world-query wrapper, folds manual pan or zoom camera deltas into a persistent follow offset, and passes the latest state into the renderer's temporary world-space placeholder draw pass until entity rendering exists.

## Render pipeline

Renderer initialization first attempts to fetch and decode the committed authored atlas image served from
`public/atlas/tile-atlas.png` at runtime as `/atlas/tile-atlas.png`.
If that asset is unavailable or decoding fails, initialization falls back to a generated placeholder atlas derived
from the authored atlas layout so the existing tile rendering path still boots with atlas-index regions in the same
places. After the atlas is loaded, renderer startup validates direct tile
`render.uvRect` metadata plus atlas-index-backed render and terrain sources against the runtime atlas dimensions,
stores warning telemetry, and emits a console warning if any static, animated, or terrain variant source falls
outside the source image or any direct `uvRect` source lands between whole atlas pixels.

1. Ensure canvas backbuffer matches CSS size × `devicePixelRatio`.
2. Build camera matrix (`world -> clip`) for orthographic projection.
3. Compute visible chunk bounds from camera viewport and tile scale.
4. Queue visible (and nearby prefetch) chunk mesh builds, then process a small per-frame build budget.
5. Patch ready animated chunk meshes to the current elapsed metadata frame when needed, then draw chunk VAOs with a shared shader + atlas texture.
6. Draw the standalone player placeholder in world space from the latest `PlayerState`, with facing plus grounded-versus-airborne pose selection handled in the placeholder shader.
7. Prune far chunk/world caches outside the retain ring.
8. Update debug overlay with frame timing and renderer telemetry.

## Chunk meshing

- Chunk data uses compact `Uint8Array` tile IDs.
- Mesher scans all tiles in a chunk.
- For each non-zero tile:
  - emits two triangles (6 vertices) for one quad,
  - writes per-vertex world position and UV,
  - records animated non-terrain quad offsets so the renderer can patch only those UVs later.
- UVs are resolved through tile metadata (terrain autotile variant maps or non-autotile static render metadata), with atlas indices translated through the authored atlas region layout instead of a synthetic grid cache.
- Optional animated render frames compile beside the static render lookup; chunk meshes still bake the static frame-zero UVs, and the renderer mutates only the recorded animated quad UVs when the elapsed frame changes.
- Static chunks upload once as static vertex data; chunks containing animated non-terrain quads keep a CPU-side vertex copy so the renderer can reupload UV-only changes on frame boundaries.

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
