# deep-factory

A minimal TypeScript + Vite WebGL2 foundation for a chunked tile world.

## Setup

```bash
npm install
npm run dev
```

Open the local Vite URL in Chrome/Firefox/Safari.

## Scripts

- `npm run dev` - start local development server
- `npm run build` - type-check and build production bundle
- `npm run preview` - preview production build
- `npm run test` - run Vitest unit tests
- `npm run lint` - run ESLint
- `npm run format` - run Prettier

## Controls

### Desktop
- Debug edit control state (shared touch mode + active brush + panel visibility) persists across reloads with a metadata-safe brush fallback
- Move camera: `WASD` or arrow keys
- On-screen debug edit controls: click a brush tile to set the active place brush (shared with touch)
- On-screen debug edit controls: click `Collapse` / `Expand` to hide or show the panel body (collapsed header shows mode, brush, and undo/redo counts)
- On-screen debug edit controls: click `Reset Prefs` to restore default touch mode/brush/panel visibility and clear saved debug edit prefs
- On-screen debug edit controls: click `Undo` / `Redo` to revert or reapply the last debug paint stroke
- Debug touch mode shortcuts (shared `Pan` / `Place` / `Break` state): `P` pan, `L` place, `B` break
- Debug edit brush shortcuts: `1`-`0` select visible brush slots, `[` / `]` cycle active brush
- Debug edit panel shortcut: `\` collapse / expand the shared debug-edit controls panel
- Debug eyedropper shortcut: `I` sets the active brush from the hovered tile (non-empty tiles)
- Debug flood fill shortcuts: `F` arms a one-shot brush flood fill, `Shift+F` arms a one-shot break flood fill; next canvas click applies (resident chunk bounds only, `Esc` cancels while armed)
- One-shot armed fill/line/rect fill/rect outline/ellipse fill tools show an on-canvas status badge with the current armed action and cancel hint (`Esc`)
- On-screen debug edit controls: click `Line Brush` / `Line Break` to arm a one-shot line tool, then drag on the canvas to apply a single undoable line stroke (with on-canvas endpoint preview)
- On-screen debug edit controls: click `Rect Brush` / `Rect Break` to arm a one-shot rectangle fill tool, then drag a box on the canvas to apply a single undoable rectangle stroke (with on-canvas box preview)
- On-screen debug edit controls: click `Rect Outline Brush` / `Rect Outline Break` to arm a one-shot rectangle outline tool, then drag a box on the canvas to apply a single undoable outline stroke (with on-canvas box preview)
- On-screen debug edit controls: click `Ellipse Brush` / `Ellipse Break` to arm a one-shot ellipse fill tool, then drag bounds on the canvas to apply a single undoable ellipse stroke (with on-canvas ellipse preview)
- Debug edit history shortcuts: `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` redo
- Mouse drag: debug paint on hovered tile cursor (`left` place active brush / `right` break, line-stepped + per-tile deduped)
- `Shift` + mouse drag: pan
- Mouse wheel: zoom in/out
- Debug tile edit: drag-paint active brush / break tiles (canvas context menu suppressed)

### Mobile / touch
- On-screen debug edit controls: touch mode buttons (`Pan` / `Place` / `Break`) + shared brush palette
- On-screen debug edit controls: tap `Collapse` / `Expand` to hide or show the panel body (collapsed header shows mode, brush, and undo/redo counts)
- On-screen debug edit controls: tap `Reset Prefs` to restore default touch mode/brush/panel visibility and clear saved debug edit prefs
- On-screen debug edit controls: touch `Undo` / `Redo` buttons revert or reapply the last debug paint stroke
- Touch history gestures (`Pan` mode): `two-finger tap` undo / `three-finger tap` redo (debounced; stationary taps avoid pinch conflicts)
- Touch eyedropper gesture (`Pan` mode): `long-press` a tile to set the active brush from that tile (non-empty tiles)
- On-screen debug edit controls: tap `Fill Brush` / `Fill Break` to arm a one-shot flood fill, then tap a world tile (resident chunk bounds only)
- One-shot armed fill/line/rect fill/rect outline/ellipse fill tools show an on-canvas status badge while armed
- On-screen debug edit controls: tap `Line Brush` / `Line Break`, then tap a start tile and tap an end tile to apply a single undoable line stroke (with a persistent on-canvas start-anchor indicator between taps)
- On-screen debug edit controls: tap `Rect Brush` / `Rect Break`, then tap a first corner and tap an opposite corner to apply a single undoable rectangle fill stroke (with a persistent on-canvas corner anchor indicator between taps)
- On-screen debug edit controls: tap `Rect Outline Brush` / `Rect Outline Break`, then tap a first corner and tap an opposite corner to apply a single undoable rectangle outline stroke (with a persistent on-canvas corner anchor indicator between taps)
- On-screen debug edit controls: tap `Ellipse Brush` / `Ellipse Break`, then tap a first corner and tap an opposite corner to apply a single undoable ellipse fill stroke (with a persistent on-canvas corner anchor indicator between taps)
- One-finger drag: pan (`Pan` mode)
- One-finger drag: debug paint active brush / break hovered tile (`Place` / `Break` mode, line-stepped + per-tile deduped)
- Two-finger pinch: zoom (works while touch debug edit modes are active)

## What exists so far

- WebGL2 renderer with shader utilities, buffer helpers, texture loading, and DPR-aware resize.
- Orthographic camera with anchored zoom and pan controls for mouse + touch.
- Chunked world model with `32x32` tiles per chunk and `16px` tiles.
- Procedural terrain fill stub and per-chunk mesh generation (quad per non-empty tile).
- Chunk visibility culling with padded chunk streaming retention.
- Budgeted per-frame mesh build queue (visible-first, prefetch around the camera).
- Tile edit events with edge/corner neighbor-chunk mesh invalidation (prep for adjacency-aware meshing).
- Cross-chunk 8-neighbor tile sampling plus autotile adjacency/normalization utilities and a placeholder terrain variant resolver wired into chunk meshing (with tests).
- Mesher UV-selection tests now cover terrain autotile variant resolution, including chunk-edge neighborhood sampling; placeholder `4x4` variant layout is documented in `docs/ARCHITECTURE.md`.
- Placeholder terrain autotile atlas mapping is now defined in validated JSON tile metadata (`src/world/tileMetadata.json`) with loader validation tests.
- Terrain autotile adjacency now uses metadata-driven connectivity groups/material tags, so related terrain tile IDs (for example surface grass and stone) can share seams.
- Terrain autotile adjacency now also compiles into a dense connectivity lookup (`Int32Array` group IDs + material-tag bitmasks), and mesher adjacency checks use it in the hot path.
- Chunk meshing now supports a reusable `TileNeighborhood` scratch sampling path (`sampleNeighborhoodInto`), and the renderer uses it to avoid per-terrain-tile neighborhood object allocations.
- Tile metadata now also carries validated gameplay flags (`solid`, `blocksLight`, `liquidKind`) with helper accessors to prepare collision, lighting, and liquid systems.
- Gameplay metadata now compiles into a dense property lookup (`Uint8Array` bitflags + `Int8Array` liquid-kind codes), and gameplay helpers use it for hot-path collision/lighting queries.
- Tile render metadata now compiles into a dense render lookup (per-tile static UV rect table + flattened terrain variant atlas-index table), and render/variant resolvers use it for mesher UV selection hot paths.
- Atlas-slot UV rect objects are now precomputed and reused by atlas-index and terrain-autotile UV resolution, avoiding per-call allocations in mesher hot paths.
- Placeholder terrain autotile variant selection now uses a precomputed `normalizedAdjacencyMask -> cardinal placeholder variant` lookup table (256 entries), and chunk meshing indexes it directly in the terrain UV hot path.
- Tile render metadata now also precomputes a dense `tileId x normalizedAdjacencyMask -> terrain atlasIndex` lookup (256 entries per tile), and terrain UV resolution / chunk meshing use it directly.
- Tile render metadata now also precomputes a dense `tileId x rawAdjacencyMask -> terrain atlasIndex` lookup (corner normalization baked in), and terrain chunk meshing uses it to skip per-tile normalized-mask work.
- `buildChunkMesh` now pre-counts non-empty tiles and writes directly into an exact-sized `Float32Array`, removing the intermediate `number[]`/`push` allocation path.
- Non-autotile tiles now use explicit metadata-driven render UVs (`atlasIndex` or normalized `uvRect`), and the mesher no longer falls back to raw `tileId -> atlas slot`.
- Shared DPR-aware screen/canvas/world/tile picking utilities now centralize pointer coordinate conversion, and `InputController` zoom anchoring reuses them instead of inlining duplicate math.
- Camera and picking tests now cover viewport coordinate round-tripping and DPR-aware client-to-tile selection (including negative-world tile flooring).
- Debug overlay now includes a pointer inspect readout (`client`, `canvas`, `world`, `tile`) powered by the shared picking utility, making mixed-DPR input validation visible before edit-brush work.
- A hovered-tile cursor highlight overlay now renders in client space from world tile coordinates (camera + DPR aware), de-risking world-space cursor visuals before tile editing.
- Desktop debug tile editing now supports hovered-tile drag painting (`left` place / `right` break) with per-stroke line-stepped interpolation, per-tile dedupe, and a `Shift`-drag pan override, wired through the shared picking path.
- Shared on-screen debug edit controls now support touch `Pan` / `Place` / `Break` mode switching plus a metadata-driven brush palette with an active brush indicator used by both desktop and touch place edits.
- Debug tile editing now records per-stroke tile deltas (desktop mouse and touch paint strokes) with shared on-screen `Undo` / `Redo` controls for fast iteration while testing world systems.
- Shared debug edit controls now expose keyboard shortcut bindings (`1`-`0`, `[` / `]`, undo/redo combos), and desktop shortcuts trigger the same brush/history actions as the on-screen UI.
- Touch debug history shortcuts now support `two-finger tap` undo / `three-finger tap` redo in `Pan` mode with tap debounce and pinch-distance conflict guards to avoid accidental undos during pinch zoom.
- Shared debug edit controls now also surface keyboard touch-mode bindings (`P` pan / `L` place / `B` break), and desktop shortcuts toggle the same `Pan` / `Place` / `Break` state as the on-screen UI.
- Shared debug edit controls now include a collapse/expand toggle to hide the panel body while keeping a compact header on-screen.
- Shared debug edit control state (`touch mode`, active brush tile, and panel visibility) now persists across reloads via local storage, with a safe brush fallback when tile metadata no longer contains the saved tile ID.
- Shared debug edit controls now include a `Reset Prefs` action that restores the default touch mode/brush/panel visibility and clears persisted debug edit control state.
- Debug eyedropper now supports keyboard `I` (desktop hovered tile) and touch long-press in `Pan` mode to set the active brush from world tiles.
- Shared debug edit controls now include one-shot flood-fill tools (`Fill Brush` / `Fill Break`) plus `F` / `Shift+F` desktop shortcuts; the next canvas click/tap applies a resident-chunk-bounded fill as a single undoable stroke.
- Shared debug edit controls now support keyboard `\` collapse/expand and show a compact collapsed summary (mode, active brush, undo/redo counts).
- Shared debug edit controls now also include one-shot line tools (`Line Brush` / `Line Break`) with desktop drag and touch two-point workflows, and each line applies as a single undoable stroke.
- Shared debug edit controls now also include one-shot rectangle fill tools (`Rect Brush` / `Rect Break`) with desktop drag-box and touch two-corner workflows, and each rectangle fill applies as a single undoable stroke.
- Shared debug edit controls now also include one-shot rectangle outline tools (`Rect Outline Brush` / `Rect Outline Break`) with desktop drag-box and touch two-corner workflows, and each rectangle outline applies as a single undoable stroke.
- Shared debug edit controls now also include one-shot ellipse fill tools (`Ellipse Brush` / `Ellipse Break`) with desktop drag-bounds and touch two-corner workflows, and each ellipse fill applies as a single undoable stroke.
- Armed one-shot debug fill/line/rect fill/rect outline/ellipse fill tools now show an on-canvas preview/status overlay (desktop line endpoint + rectangle/ellipse bounds previews; touch line-start + rectangle/ellipse corner anchors) and support `Esc` cancellation.
- Debug overlay showing FPS + rendered chunk count.

See `docs/ARCHITECTURE.md` and `docs/NEXT.md` for implementation details and roadmap.
