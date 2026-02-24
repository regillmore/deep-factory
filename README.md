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
- Non-autotile tiles now use explicit metadata-driven render UVs (`atlasIndex` or normalized `uvRect`), and the mesher no longer falls back to raw `tileId -> atlas slot`.
- Debug overlay showing FPS + rendered chunk count.

See `docs/ARCHITECTURE.md` and `docs/NEXT.md` for implementation details and roadmap.
