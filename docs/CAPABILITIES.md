# Capabilities

This document describes the current project state. Unlike the changelog, it should read as a grouped inventory of what exists now.

## Core Runtime

- WebGL2 renderer with shader utilities, buffer helpers, texture loading, and DPR-aware resize.
- Renderer atlas initialization ships with an authored atlas at `public/atlas/tile-atlas.png` exposed as `/atlas/tile-atlas.png`, then falls back to a generated placeholder atlas whose canvas size and painted regions derive from `src/world/authoredAtlasLayout.ts` if that asset cannot be fetched or decoded.
- Renderer boot validates authored atlas-index regions plus direct tile `render.uvRect` metadata against the loaded atlas dimensions, logs a warning when any atlas-backed source falls outside the source image or any direct static or animated `uvRect` edge lands between atlas pixels, and surfaces the warning count plus first warning in debug telemetry.
- Renderer animates non-terrain tiles from metadata-driven frame sequences at draw time by patching chunk UVs only when an animated tile's elapsed frame changes; terrain autotile and static tile UV resolution remain unchanged.
- Renderer draws the standalone player through a facing-aware world-space placeholder pass with distinct grounded and airborne silhouettes instead of a client-space DOM marker.
- Orthographic camera with anchored zoom, pointer pan controls, and standalone-player follow that tracks the player body center while preserving manual inspection offsets.
- Fixed-step game loop (`60hz`) with separate render interpolation alpha.
- Chunked world model with `32x32` tiles per chunk and `16px` tiles.
- Procedural terrain fill stub backing the current resident world.

## World Streaming And Meshing

- Chunk visibility culling with padded chunk streaming retention.
- Chunk pruning can evict resident world chunks from memory without losing edited tile values; sparse per-chunk tile overrides are reapplied when those chunks stream back in.
- Budgeted per-frame mesh build queue with visible-first scheduling and nearby prefetch.
- Tile edit events trigger edge and corner neighbor-chunk mesh invalidation.
- Chunk meshing currently emits one quad per non-empty tile; static chunks upload once, while chunks with animated non-terrain quads keep CPU-side vertex copies so UV-only updates can be reuploaded on frame boundaries.
- `buildChunkMesh` pre-counts non-empty tiles and writes directly into an exact-sized `Float32Array`.
- Chunk meshing supports reusable `TileNeighborhood` scratch sampling so terrain meshing avoids per-tile neighborhood allocations.

## Tile Metadata And Terrain Resolution

- Tile definitions live in validated JSON metadata at `src/world/tileMetadata.json`.
- Tile metadata covers render data, terrain autotile data, connectivity groups, material tags, and gameplay flags such as `solid`, `blocksLight`, and `liquidKind`.
- Render metadata can optionally define animated frame sequences through `frames` plus `frameDurationMs`, while the current meshing path continues to use the base static `atlasIndex` or `uvRect` as frame-zero fallback.
- The default tile set now includes an animated `debug_blink` brush tile that exercises the renderer-side frame resolver against the authored atlas.
- Committed-asset regressions also verify that every default animated atlas-index frame differs from its prior committed PNG frame, so shipped atlas-backed animations do not silently collapse into repeated art.
- Atlas-backed render metadata resolves through explicit authored atlas region definitions in `src/world/authoredAtlasLayout.ts`, while the generated placeholder fallback atlas paints those same authored regions and direct sub-rect metadata can still use normalized `uvRect` values that are runtime-validated against whole atlas-pixel edges.
- Committed-asset regressions also verify that every default direct `render.uvRect` source covers at least one non-transparent pixel in the shipped atlas PNG, so blank authored sub-rects do not silently ship through the direct-UV path.
- The authored atlas layout also records any intentionally unused committed slots, and committed-asset regressions require every authored region index to be either referenced by default tile metadata or documented there as deliberately unused.
- Terrain autotile adjacency supports cross-chunk 8-neighbor sampling plus normalization helpers.
- Terrain autotile connectivity uses metadata-driven connectivity groups first, then shared material tags for seam compatibility.
- Placeholder terrain autotile layout still uses 16 cardinal-mask variants documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), but those atlas indices now resolve through the authored atlas region layout.

## Collision Foundations

- World collision helpers expose metadata-backed `isSolidAt` tile queries, world-space solid-overlap checks for half-open AABBs, and single-axis AABB sweep results that clamp movement to the first blocking tile.
- Player spawn queries can scan near a chosen origin tile for grounded standing headroom and return the resolved standing AABB plus supporting solid tile.
- Standalone player-state helpers track feet-centered `position`, `velocity`, explicit `size`, `grounded`, and `facing`, can seed that state from spawn output, derive the collision AABB plus one-step fixed-update integration from the same model, expose a body-center camera focus point, probe adjacent support, wall, and ceiling contacts from the current AABB, resolve normalized movement intent into grounded walk acceleration or braking plus a grounded jump impulse, advance through x-then-y collision sweeps that zero blocked velocity and recompute grounded support after movement, and apply gravity plus fall-speed clamping before the shared collision step.
- The fixed update loop now keeps a spawned standalone player state alive through shared keyboard and touch movement intent, so desktop keys and touch buttons can move and jump the player while debug edits still refresh spawn placement, unsupported tiles still make the player fall, and edits that trap the player inside solid tiles still respawn it from the latest resolved valid spawn.

## Hot-Path Lookup Strategy

- Gameplay metadata compiles into dense lookup arrays for collision, lighting, and liquid queries.
- Terrain connectivity compiles into dense connectivity-group and material-tag lookup tables.
- Tile render metadata compiles into dense static UV and terrain variant atlas-index lookup tables.
- Optional animated render metadata compiles into dense per-tile frame start, frame count, and frame duration tables plus a flattened UV-frame list for renderer-time elapsed-frame sampling.
- Placeholder terrain autotile resolution uses precomputed lookup tables for normalized adjacency masks and raw adjacency masks.
- Authored-atlas region UV rect objects are precomputed and reused by atlas-index and terrain-autotile resolution paths.

## Picking, Debugging, And Inspection

- Shared DPR-aware screen, canvas, world, and tile picking utilities centralize pointer coordinate conversion.
- Camera and picking tests cover viewport round-tripping, DPR-aware selection, and negative-world tile flooring.
- Debug overlay shows FPS, rendered chunk count, mesh telemetry, loaded atlas source kind plus atlas dimensions, atlas validation status, the resolved standalone player spawn tile plus world coordinates, live standalone player state telemetry (`position`, `velocity`, `grounded`, `facing`), live standalone player collision AABB telemetry (`min`, `max`, `size`), live standalone player collision-contact telemetry (`support`, `wall`, `ceiling` with tile coordinates and IDs when present), live standalone player input-intent telemetry (`move`, `jumpHeld`, `jumpPressed`), live pointer inspect data (`client`, `canvas`, `world`, hovered tile name plus tile ID, `tile`, `chunk`, `chunk-local`, `solid`, `light`, `liquid`), and a separate pinned tile metadata line when inspect pin is active.
- Debug overlay also reports resident animated chunk mesh counts plus recorded animated-quad totals alongside per-frame animated chunk UV upload cost as upload count, changed animated-quad count, and total uploaded bytes, so both steady-state authored animation footprint and frame-boundary UV churn stay visible.
- Hovered tile cursor overlay renders in client space from world tile coordinates and keeps pinned and hovered inspect outlines visible together when they differ.
- A dedicated spawn marker overlay outlines the resolved spawn AABB, support tile, and feet anchor in client space and refreshes after tile edits so spawn placement can be validated before movement is wired.
- On-canvas one-shot preview badges show live anchor plus endpoint tile coordinates, inclusive span dimensions, and affected-tile estimates for active previews and stay clipped to the visible canvas bounds on small or offset canvases, while anchored touch previews keep the endpoint, span, and affected-count text pending until the second point is chosen and show a persistent anchor label with the armed tool name, `Brush` or `Break` action text, and anchor tile coordinates that stays clamped inside the visible canvas bounds near viewport edges.
- Compact debug-edit status strip mirrors shared mode, active brush, armed tool state, mixed-device hints, lets summary chips wrap long brush or tool values inside the chip on narrow mobile viewports, shows active one-shot preview anchor plus endpoint tile coordinates with live inclusive span dimensions and estimated affected tile counts while preview state is live, wraps preview, inspect, empty-hover guidance, and shortcut hint details into segmented rows to stay inside narrow mobile viewports, stacks inspect action buttons vertically before they clip on narrow canvases, shows separate pinned plus hovered tile metadata lines plus a hovered-to-pinned offset when both inspect targets differ, labels deduplicated same-tile inspect state as shared, and includes world plus chunk and chunk-local tile coordinates in inspect metadata.
- Compact status-strip inspect action buttons retain the last mouse hover comparison state while the pointer is over the action row, so pinned plus hovered metadata does not flap when using `Pin Click` or `Repin Click`.
- Hovered and touched inspect readouts include tile name, tile ID, world plus chunk and chunk-local coordinates, and solid, light-blocking, and liquid flags.
- Desktop and touch both support pinned tile inspection through the compact status strip workflow.

## Shared Debug Edit Model

- Desktop and touch share the same debug edit concepts: `Pan`, `Place`, and `Break` modes, active brush selection, undo and redo history, armed one-shot tools, and compact status reporting.
- Shared debug edit control state persists across reloads through local storage with a metadata-safe brush fallback.
- `Reset Prefs` restores default touch mode, brush, and panel visibility while clearing persisted debug-edit control state.
- Undo and redo operate on recorded per-stroke tile deltas.
- Flood fill, line, rectangle fill, rectangle outline, ellipse fill, and ellipse outline tools apply as single undoable strokes.
- Armed one-shot tools expose on-canvas status or preview overlays and support `Esc` cancellation.

## Desktop Controls

- Move player: `A` and `D` or left and right arrows.
- Jump: `W`, up arrow, or `Space`.
- Mouse wheel: zoom in or out.
- `Shift` + mouse drag: pan without painting.
- Mouse drag: debug paint on hovered tiles (`left` place active brush, `right` break).
- Debug edit brush shortcuts: `1`-`0` select visible brush slots, `[` and `]` cycle active brush.
- Debug touch-mode shortcuts: `P` pan, `L` place, `B` break.
- Debug panel shortcut: `\` collapses or expands the shared debug-edit controls panel.
- Debug eyedropper shortcut: `I` sets the active brush from the hovered non-empty tile.
- Debug history shortcuts: `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` redo.
- Debug flood fill shortcuts: `F` arms brush flood fill, `Shift+F` arms break flood fill.
- Debug one-shot shape shortcuts: `N` and `Shift+N` line, `R` and `Shift+R` rectangle fill, `T` and `Shift+T` rectangle outline, `E` and `Shift+E` ellipse fill, `O` and `Shift+O` ellipse outline.
- Desktop inspect pinning uses compact status strip actions: `Pin Click`, `Repin Click`, `Clear Pin`, and `Esc` to cancel an armed pin.
- Desktop one-shot tools use mouse drag bounds or endpoints for placement and show matching preview overlays.

## Touch Controls

- Shared on-screen debug controls expose `Pan`, `Place`, and `Break` modes plus a shared brush palette.
- A separate on-screen touch player pad exposes hold-to-move left, hold-to-move right, and hold-to-jump buttons without disabling the debug edit panel.
- One-finger drag pans in `Pan` mode.
- One-finger drag paints in `Place` or `Break` mode with line-stepped per-tile dedupe.
- Two-finger pinch zoom works while touch debug edit modes are active.
- Two-finger tap triggers undo in `Pan` mode.
- Three-finger tap triggers redo in `Pan` mode.
- Long-press eyedropper in `Pan` mode sets the active brush from the touched non-empty tile.
- Tap-to-pin inspect in `Pan` mode locks tile metadata and outline state until cleared or repinned.
- Touch flood fill arms through on-screen controls, then applies on the next tap.
- Touch line, rectangle, and ellipse tools use two-point or two-corner workflows and show persistent start-anchor or corner-anchor indicators while armed.

## Debug Edit UI

- On-screen debug edit controls support brush selection, mode switching, undo, redo, collapse and expand, reset prefs, and one-shot tool arming.
- Collapsed panel state still shows a compact header with current mode, active brush, and undo or redo counts.
- The compact status strip stays useful even when the larger panel is collapsed or out of the way.
