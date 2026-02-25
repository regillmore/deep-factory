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
- Move camera: `WASD` or arrow keys
- Mouse drag: pan
- Mouse wheel: zoom in/out
- Debug tile edit (temporary): left click places `debug_brick`, right click breaks hovered tile (canvas context menu suppressed)

### Mobile / touch
- One-finger drag: pan
- Two-finger pinch: zoom

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
- Desktop debug tile editing now supports one-shot click actions on the hovered tile (`left` place / `right` break, no drag painting yet), wired through the shared picking path.
- Debug overlay showing FPS + rendered chunk count.

See `docs/ARCHITECTURE.md` and `docs/NEXT.md` for implementation details and roadmap.
