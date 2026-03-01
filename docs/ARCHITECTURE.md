# Architecture

## Module boundaries

- `src/main.ts`: bootstrapping and dependency wiring.
- `src/core/`: camera math + fixed timestep loop.
- `src/input/`: input abstraction for keyboard, mouse, and touch/pinch.
- `src/gl/`: low-level WebGL2 utilities and renderer orchestration.
- `src/world/`: world data model, chunk math, procedural generation, mesh construction.
- `src/world/tileMetadata.json` + `src/world/tileMetadata.ts`: validated tile metadata registry (terrain autotile variant maps, connectivity/material grouping, gameplay flags like `solid` / `blocksLight` / `liquidKind`, plus non-autotile render `atlasIndex` / `uvRect` metadata; authored-atlas region validation is still a later task).
- `src/ui/`: debug DOM overlay.

## Update loop

`GameLoop` uses:

- fixed update step (`60hz`) for deterministic simulation hooks,
- render interpolation alpha (currently unused but available).

Current update phase applies input-driven camera movement.

## Render pipeline

Renderer initialization first attempts to fetch and decode an authored atlas image from `/atlas/tile-atlas.png`.
If that asset is absent or decoding fails, initialization falls back to the generated placeholder atlas so the
existing tile rendering path still boots.

1. Ensure canvas backbuffer matches CSS size × `devicePixelRatio`.
2. Build camera matrix (`world -> clip`) for orthographic projection.
3. Compute visible chunk bounds from camera viewport and tile scale.
4. Queue visible (and nearby prefetch) chunk mesh builds, then process a small per-frame build budget.
5. Draw ready chunk VAOs with a shared shader + atlas texture.
6. Prune far chunk/world caches outside the retain ring.
7. Update debug overlay with frame timing and renderer telemetry.

## Chunk meshing

- Chunk data uses compact `Uint8Array` tile IDs.
- Mesher scans all tiles in a chunk.
- For each non-zero tile:
  - emits two triangles (6 vertices) for one quad,
  - writes per-vertex world position and UV.
- UVs are resolved through tile metadata (terrain autotile variant maps or non-autotile render metadata), then mapped into the fixed placeholder atlas grid (`4x4` currently).
- Output is uploaded once per chunk as static vertex data.

This is intentionally simple and easy to evolve (greedy meshing, layered tiles, occlusion rules can be added later).

### Placeholder terrain autotile layout

Terrain autotile placeholder variants currently occupy the full `4x4` atlas and are addressed by a row-major
variant index derived from the normalized cardinal adjacency mask (`N/E/S/W` bits mapped to `1/2/4/8`).
Diagonal neighbors are sampled and normalized for corner-gating, but placeholder UV selection collapses to the
16 cardinal combinations for now. The current mapping is defined in `src/world/tileMetadata.json` and validated at
startup by `src/world/tileMetadata.ts`.

Non-autotile tiles also resolve UVs through the same metadata registry via explicit render metadata:
- `render.atlasIndex`: atlas slot index in the placeholder `4x4` grid.
- `render.uvRect`: normalized UV rectangle (`u0/v0/u1/v1`) for direct sub-rect mapping.

| Atlas row | Variant indices | Cardinal mask combinations |
| --- | --- | --- |
| 0 | `0 1 2 3` | `----`, `N---`, `-E--`, `NE--` |
| 1 | `4 5 6 7` | `--S-`, `N-S-`, `-ES-`, `NES-` |
| 2 | `8 9 10 11` | `---W`, `N--W`, `-E-W`, `NE-W` |
| 3 | `12 13 14 15` | `--SW`, `N-SW`, `-ESW`, `NESW` |
