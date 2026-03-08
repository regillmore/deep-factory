# Architecture

## Module boundaries

- `src/main.ts`: bootstrapping, app-shell coordination, dependency wiring, renderer entity-pass submission assembly from entity-registry snapshots, render-frame camera-follow alignment to interpolated standalone-player snapshots, and render-frame debug telemetry selection.
- `src/mainWorldSave.ts`: versioned top-level world-save envelope helpers that validate and normalize `TileWorld` snapshots together with standalone-player state, camera-follow offset, and migration metadata for future persistence or restore wiring.
- `src/mainWorldSessionSave.ts`: session-owned save export helper that reads the current world snapshot through a provider such as `Renderer.createWorldSnapshot()` and assembles it with standalone-player plus camera-follow session state into the top-level world-save envelope.
- `src/core/`: camera math, camera-follow offset helpers, and fixed timestep loop.
- `src/input/`: input abstraction for keyboard, mouse, touch/pinch, standalone player intent extraction, persisted in-world shell-action keybinding storage and validation, and shortcut resolution helpers including paused-main-menu and in-world shell shortcut availability helpers, a shared runtime shortcut-context composer, and an in-world-only debug-edit keyboard-action guard used by runtime wiring.
- `src/gl/`: low-level WebGL2 utilities, authored-atlas loading plus layout-driven placeholder fallback generation, world rendering orchestration, the interpolated entity draw pass, and the grounded-idle, grounded-walk, jump-rise, fall, wall-slide, and briefly latched ceiling-bonk standalone player placeholder draw path with nearby world-light modulation.
- `src/world/`: world data model, chunk math, collision queries, spawn and player-state helpers, standalone-player render-snapshot cloning helpers that combine `PlayerState` with pose-driving wall or ceiling contact plus bonk-hold timing, a minimal entity registry that tracks per-entity fixed-step hooks plus previous/current render-state snapshots for future interpolation, a shared helper that blends world position from those snapshots via render alpha, and authoritative standalone-player entity state ownership, procedural generation, sparse edited-tile overrides that survive chunk streaming prune, runtime world snapshot export/load that preserves deterministic resident-chunk ordering plus sparse edited overrides and liquid-simulation parity on top of the chunk snapshot codec, resident per-chunk liquid fill storage plus fixed-step loaded-chunk liquid simulation that transfers downward before sideways pair equalization across the current active-liquid chunk band plus immediate horizontal neighbors, shared normalized liquid-surface top-height resolution now consumed by chunk meshing for exposed partial-liquid tops and top-aligned partial-liquid UV crops, resident per-chunk light storage plus dirty-light local-column invalidation that widens zero-range non-emissive `blocksLight` edits to the edited column's immediate neighbors, further widens edge edits across loaded neighboring `chunkX` boundary columns and those boundary columns' immediate interior neighbors, and still widens nearby non-emissive blocker edits around reachable resident emissive sources, resident lighting recomputation that layers top-down sunlight plus neighboring `chunkX` boundary transport with local emissive falloff on dirty local columns and can report which resident chunk light fields actually changed for renderer invalidation, mesh construction, plus authored atlas-region layout data.
- `src/world/chunkSnapshot.ts`: versioned resident-chunk and edited-chunk snapshot schemas plus JSON-safe row-major dense RLE payload and sparse tile-index/value payload encoders/decoders now consumed by `TileWorld` world snapshots for future save/load work.
- `src/world/tileMetadata.json` + `src/world/tileMetadata.ts`: validated tile metadata registry (terrain autotile variant maps, liquid-render variant maps with liquid-only connectivity groups, gameplay flags like `solid` / `blocksLight` / `liquidKind` plus optional `emissiveLight`, and non-autotile render `atlasIndex` / `uvRect` metadata with optional animated `frames` / `frameDurationMs` sequences compiled into dense lookups and elapsed-frame resolvers backed by `src/world/authoredAtlasLayout.ts`; liquid variant animations compile into parallel per-tile-per-cardinal-mask frame lookups; renderer boot now validates authored atlas-index sources plus direct `uvRect` metadata, including liquid variants, against the loaded atlas dimensions and whole-pixel atlas edges).
- `src/gl/animatedChunkMesh.ts`: renderer-side helper that rewrites baked chunk UVs for animated non-terrain quads and animated liquid-variant quads keyed by their resolved liquid cardinal masks when elapsed time advances to a new metadata frame, while preserving the meshed partial-liquid top-height crop on animated liquid quads.
- `src/ui/`: app shell plus shell-state helper factories and selectors, overlay menu-section card layouts and in-world shell chrome, debug DOM overlays, spawn marker, and touch-only player controls.

## Update loop

`GameLoop` uses:

- fixed update step (`60hz`) for deterministic simulation hooks,
- render interpolation alpha, now consumed by the renderer entity pass to place snapshot-backed entities between fixed updates.

A minimal `EntityRegistry` now steps inside that fixed-update path, rotates `previous/current`
render snapshots once per completed fixed tick, and owns the authoritative standalone-player
entity state. `src/world/entityRenderInterpolation.ts` now provides the shared world-position
blend helper that the renderer entity pass uses when drawing snapshot-backed entities.
`src/main.ts` assembles entity-pass entries directly from registry snapshots, each standalone-player
snapshot now carries pose-driving wall or ceiling contact plus bonk-hold timing beside the cloned
player state, render frames now reapply camera follow from that same interpolated standalone-player
snapshot focus point before pointer inspect and telemetry reads, the renderer resolves placeholder
pose from snapshot `current`, and nearby-light telemetry now samples around the interpolated render
position instead of reading the authoritative player state separately.

Bootstrap now mounts the app shell first, initializes renderer plus input behind the `boot` screen, renders one static world preview for the `main menu`, and only starts the `GameLoop` after the shell first enters `in-world`. After that first start, the shell can return to `main menu` without rebuilding renderer or world state; fixed updates and in-world overlay visibility pause until the same session resumes, a paused-menu `Reset Shell Toggles` action can clear persisted in-world shell-toggle visibility and restore the default-off shell layout for that paused session before the next resume, and a separate paused-menu `New World` action replaces the renderer-owned world plus session-owned runtime state before re-entering play. App-shell overlay states can now supply a concise headline plus optional structured menu-section cards so multi-action menus like the paused session overlay do not need to overload one status line and a flat detail list with all action consequences. In-world shell toggle visibility (debug HUD, edit panel, edit overlays, spawn marker, shortcuts overlay) now loads from local persistence with an all-off fallback default and writes back to persistence when toggles change, while the six in-world shell-action keybindings load once from validated local persistence before shortcut resolution, shell chrome labels, shortcuts overlay text, and the touch keyboard reference consume them. Once active, the in-world shell chrome can independently return to the main menu, recenter the camera on the standalone player, or show or hide the text debug HUD, the full debug-edit control panel, the compact debug-edit overlay layer, and the standalone player spawn marker overlay while the current update phase applies debug tile-edit actions, spawn refresh after tile edits, a resident liquid-simulation step that transfers water and lava downward before sideways spreading across the current active-liquid chunk band plus immediate horizontal neighbors and now returns immediately when no resident chunk currently contains liquid, standalone-player entity spawn refresh plus embedded-player respawn recovery from the latest resolved spawn when edits trap the current AABB in solid terrain, standalone-player entity fixed-step movement through shared movement, gravity, overlapped-liquid sampling, buoyancy, lava damage, and collision helpers from mixed-device intent, immediate lava-death respawn fallback from that latest resolved spawn, and camera follow that targets the player body center while preserving manual pan or zoom offsets from pointer interaction.

## Player state foundation

- Standalone player simulation state currently lives in `src/world/playerState.ts`.
- `PlayerState.position` uses bottom-center world coordinates so spawn placement, collision AABB derivation, and future controller updates share one anchor convention.
- Shared helpers can initialize player state directly from spawn-search output, clone player state into detached render snapshots, clone standalone-player pose presentation into detached render snapshots, carry health plus lava-damage tick cooldown, sample liquid overlap from per-tile fill levels, advance position from velocity on fixed steps, recover embedded state by respawning from the latest resolved spawn without healing or resetting liquid-damage cooldown, resolve normalized movement intent into grounded walk acceleration or braking plus jump impulse, expose a body-center camera focus point, apply gravity plus water buoyancy and drag before movement, apply periodic lava damage before the collision move, and resolve x-then-y collision sweeps plus post-move grounded support without mixing render interpolation into the source-of-truth state.
- `src/main.ts` now owns standalone-player entity orchestration rather than a parallel player-state variable: it seeds the player into `EntityRegistry` from the resolved spawn once, lets that entity's fixed-step hook pull shared desktop or touch movement intent and advance through a narrow renderer world-query wrapper only while the shell is `in-world`, updates standalone-player render-presentation state during that fixed-step path before registry snapshots rotate, replaces the entity-backed state through registry writes for embedded or fresh-world respawns, folds manual pan or zoom camera deltas into a persistent follow offset, loads and saves in-world shell-toggle visibility through local persistence with all-off fallback defaults, lets the shell either pause back to the main menu without discarding the current session, clear persisted in-world shell-toggle preferences from that paused menu while restoring the current session to the same default-off shell layout used on first start, abandon that paused session through a fresh-world reset that restores first-start runtime defaults while preserving initialized renderer/input and persisted debug-edit prefs, or recenter the camera by zeroing that offset and snapping back to the player's focus point, and now builds renderer entity-pass entries directly from registry snapshots whose standalone-player payload already includes sided wall contact, ceiling contact, and a short bonk-hold presentation latch for the temporary world-space placeholder draw until broader entity rendering exists while render-frame camera follow reads the same interpolated snapshot focus point as the placeholder draw.

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
6. Patch ready animated chunk meshes to the current elapsed metadata frame when needed, including liquid-variant frame swaps keyed by the meshed liquid cardinal mask while preserving any meshed partial-liquid top-height crop, then draw chunk VAOs with a shared atlas shader that multiplies tile color by the baked per-vertex light value.
7. Draw the entity pass. The current standalone-player entry places its placeholder quad from the interpolated entity-snapshot world position for the current render alpha, resolves facing plus grounded-idle, grounded-walk, jump-rise, fall, wall-slide, and ceiling-bonk pose selection from snapshot `current` plus the snapshot-owned wall, ceiling, and bonk-hold presentation fields captured on the fixed-step path, and samples nearby resolved world light around that interpolated render-position AABB before passing the normalized factor into the placeholder shader.
8. Prune far chunk/world caches outside the retain ring.
9. Update debug overlay with frame timing and renderer telemetry.

## Chunk meshing

- Chunk data uses compact `Uint8Array` tile IDs plus parallel `Uint8Array` liquid fill levels.
- Mesher scans all tiles in a chunk.
- For each non-zero tile:
  - emits two triangles (6 vertices) for one quad,
  - writes per-vertex world position, UV, and resolved light level from the chunk light cache, with liquid quads lowering only their exposed top-left and top-right vertices from shared `0..8` fill-height resolution, cropping bottom-edge `v` coordinates from those same top heights so the authored liquid surface stays aligned, while same-kind-covered liquid tiles stay full-height,
  - records animated non-terrain quad offsets plus animated liquid quad offsets keyed by the resolved liquid cardinal mask and meshed liquid top heights so the renderer can patch only those UVs later without losing the partial-liquid crop.
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
