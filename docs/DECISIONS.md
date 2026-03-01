# Decisions

Record only durable design decisions here. Keep each entry short: date, decision, reason, and consequence.

### 2026-03-01: Player state uses a feet-centered position anchor

- Decision: Standalone player state stores `position` at the player's bottom center and derives the collision AABB from explicit `size`.
- Reason: Spawn search already resolves a standing feet position plus AABB, and sharing that anchor avoids ad hoc transforms between spawn, collision, and future controller code.
- Consequence: Player movement, debug markers, and later entity migration should treat player `position` as bottom-center world space and use the shared AABB helper instead of introducing alternate anchor conventions.

### 2026-02-28: Simulation runs in fixed steps, rendering interpolates

- Decision: Authoritative game state advances in the fixed `60hz` update loop, while rendering receives interpolation alpha and frame timing separately.
- Reason: This keeps simulation hooks deterministic and gives later systems like player movement, entities, lighting, and networking a stable update model.
- Consequence: New gameplay state should update in fixed-step code paths. Render code can smooth presentation, but should not become the source of truth for simulation state.

### 2026-02-28: Tile metadata is the source of truth for tile behavior and rendering

- Decision: Tile render data, terrain connectivity, and gameplay flags live in validated tile metadata and are resolved through the metadata registry instead of scattered hardcoded tile rules.
- Reason: The project already uses tile metadata to drive meshing and gameplay tags, which keeps authored content extensible and avoids duplicating tile semantics across subsystems.
- Consequence: New tile types or tile-specific behavior should usually start with metadata schema and validation updates, then consume that data from helpers instead of adding ad hoc tile ID conditionals.

### 2026-02-28: Metadata compiles into dense hot-path lookup tables

- Decision: After validation, tile metadata is compiled into dense lookup structures such as typed arrays and flattened tables for gameplay and render queries.
- Reason: Meshing already runs in hot loops, and planned systems like collision, liquids, and lighting will need predictable per-tile access without repeated parsing or allocation.
- Consequence: Preserve the compile-once, lookup-many pattern for hot-path tile queries. Avoid re-reading raw metadata or constructing new objects inside per-tile simulation or meshing loops.

### 2026-02-28: Mixed-device editing features share underlying state and actions

- Decision: Desktop and touch debug-edit workflows share the same conceptual state for mode, brush selection, undo history, and armed one-shot tools, even when the interaction surfaces differ.
- Reason: This project targets mixed-device play, and the current tooling already treats desktop shortcuts, touch gestures, and on-screen controls as alternate views over the same editing model.
- Consequence: New edit or inspect features should usually be implemented in shared controller or state layers first, then exposed through device-specific bindings rather than forked behavior.

### 2026-02-28: Chunk rendering stays simple until a stronger need exists

- Decision: World chunks are currently meshed as one quad per non-empty tile and built through a budgeted queue instead of introducing greedy meshing or more complex visibility rules early.
- Reason: The current renderer favors correctness, debuggability, and incremental evolution over early geometric optimization.
- Consequence: Future performance work should first preserve the existing simple chunk pipeline and optimize around lookup tables, queueing, and cache behavior before replacing the mesh model outright.

## Template

### YYYY-MM-DD: Decision title

- Decision: What was chosen.
- Reason: Why this path was taken instead of the main alternative.
- Consequence: What later agents should assume because of this choice.
