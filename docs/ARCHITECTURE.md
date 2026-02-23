# Architecture

## Module boundaries

- `src/main.ts`: bootstrapping and dependency wiring.
- `src/core/`: camera math + fixed timestep loop.
- `src/input/`: input abstraction for keyboard, mouse, and touch/pinch.
- `src/gl/`: low-level WebGL2 utilities and renderer orchestration.
- `src/world/`: world data model, chunk math, procedural generation, mesh construction.
- `src/ui/`: debug DOM overlay.

## Update loop

`GameLoop` uses:

- fixed update step (`60hz`) for deterministic simulation hooks,
- render interpolation alpha (currently unused but available).

Current update phase applies input-driven camera movement.

## Render pipeline

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
- UVs map into a fixed tile atlas grid (`4x4` currently).
- Output is uploaded once per chunk as static vertex data.

This is intentionally simple and easy to evolve (greedy meshing, layered tiles, occlusion rules can be added later).
