# Decisions

Record only durable design decisions here. Keep each entry short: date, decision, reason, and consequence.

### 2026-03-02: World runtime starts behind explicit app-shell states

- Decision: Boot now flows through explicit `boot`, `main menu`, and `in-world` shell states, and the fixed-step world loop starts only after the main-menu enter action fires.
- Reason: Upcoming shell and menu work needs a stable state boundary above renderer/input bootstrap instead of auto-starting gameplay directly from `main.ts`.
- Consequence: Future shell, pause, and menu tasks should transition through the app-shell state model rather than assuming world simulation begins as soon as bootstrap finishes.

### 2026-03-02: Returning to the main menu pauses and preserves the current world session

- Decision: Leaving `in-world` through the shell's `Main Menu` action now returns to the main menu without rebuilding renderer, world, player, or debug-edit state; the same session resumes through the menu's primary action.
- Reason: Shell navigation needs a reversible pause boundary before reset or multi-session work lands, and that boundary should preserve the current mixed-device runtime instead of treating menu navigation as a hard restart.
- Consequence: Future main-menu, pause, or shortcut work should treat `main menu` as a resumable paused-shell state once a world session exists, and should introduce explicit reset paths instead of implicitly reinitializing the world on every menu return.

### 2026-03-02: Fresh world resets session runtime without reinitializing renderer or input

- Decision: The paused main menu now exposes an explicit `New World` action that replaces the renderer-owned `TileWorld`, spawned player runtime, camera follow state, undo history, and shell visibility toggles, while keeping the bootstrapped renderer/input stack and persisted debug-edit preferences alive.
- Reason: The project needs a clean session restart path that behaves like first launch without paying the cost or complexity of full renderer/input teardown and re-bootstrap after every reset.
- Consequence: Future fresh-world, reset, or multi-session work should go through the explicit session-reset path instead of partially mutating world/player state or rebuilding the full app bootstrap by default.

### 2026-03-02: Debug HUD visibility is controlled by in-world shell chrome

- Decision: The text debug overlay now defaults hidden and is shown only when the in-world shell toggle enables it.
- Reason: The project needs debug telemetry available on demand without forcing an always-on HUD over normal play and menu flows.
- Consequence: Future debug HUD additions should respect the shell-controlled visibility state instead of assuming the overlay is permanently visible once gameplay starts.

### 2026-03-02: Compact debug-edit overlay visibility is controlled by in-world shell chrome

- Decision: The compact debug-edit status strip, inspect outlines, and one-shot preview overlays are now shown or hidden through a dedicated in-world shell toggle instead of always rendering whenever gameplay is active.
- Reason: Mixed-device play needs a quick way to declutter the screen for normal movement and inspection without disabling edit controls, one-shot tool state, or simulation.
- Consequence: Future compact debug-edit overlay work should respect the shell-controlled visibility state instead of assuming those overlays are always visible during in-world runtime.

### 2026-03-02: Full Debug Edit panel visibility is controlled separately from compact overlays

- Decision: The full `Debug Edit` control panel now has its own in-world shell toggle and visibility state instead of sharing the compact overlay toggle.
- Reason: The compact inspect and preview layer is optional clutter on desktop, but the full touch-first edit control surface has different value and should be independently available or dismissible.
- Consequence: Future debug-edit UI work should explicitly choose whether it belongs to the full panel or the compact overlay layer, and respect the matching shell visibility state.

### 2026-03-02: Standalone player spawn marker visibility is controlled by in-world shell chrome

- Decision: The resolved standalone player spawn marker overlay is now shown or hidden through a dedicated in-world shell toggle instead of always rendering whenever gameplay is active.
- Reason: Spawn validation needs to stay available during world-edit and movement work, but the marker should be dismissible when it becomes visual clutter during normal play.
- Consequence: Future spawn-marker overlay work should respect the shell-controlled visibility state instead of assuming the overlay is always visible during in-world runtime.

### 2026-03-02: Shell camera recenter resets preserved follow offset

- Decision: The in-world shell's `Recenter Camera` action now snaps the camera back to the standalone player's focus point by zeroing the preserved follow offset instead of layering another camera correction on top of it.
- Reason: Manual inspection already accumulates pan and zoom deltas into the follow offset, so recentering should clear that accumulated state directly rather than introducing a second reset path that can drift from the follow model.
- Consequence: Future recenter controls or shortcuts should reuse the follow-offset reset behavior rather than bypassing player follow with ad hoc camera mutations.

### 2026-03-02: Visible authored-atlas pixels must stay inside documented authored regions

- Decision: Non-transparent pixels in the committed atlas PNG must stay inside authored regions touched by shipped metadata or explicitly documented as intentionally unused.
- Reason: Exterior padding and uncovered canvas gaps only work as reliable spill-detection space if visible art cannot drift into them unnoticed.
- Consequence: Future atlas edits should expand authored-region documentation or metadata coverage together with any intentional new visible area; otherwise uncovered canvas should remain fully transparent.

### 2026-03-02: Explicitly unused authored atlas regions must stay fully transparent

- Decision: Any authored atlas region documented in `AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS` must remain fully transparent in the committed PNG.
- Reason: A documented spare slot is only a reliable regression target if stray committed art cannot accumulate inside it unnoticed.
- Consequence: Future atlas edits should either keep unused documented regions blank or remove them from the intentionally-unused table as part of the same change.

### 2026-03-02: Explicitly unused authored atlas regions must stay unreferenced by default metadata

- Decision: Regions documented in `AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS` must not be referenced by shipped `atlasIndex` metadata or overlapped by default direct `render.uvRect` sources.
- Reason: A reserved spare slot only remains a trustworthy blank regression target if metadata cannot silently start sampling it through either authored-region indices or direct UV sub-rects.
- Consequence: Future tile metadata changes should remove a region from the intentionally-unused table before any default atlas-index or direct-UV source is allowed to target it.

### 2026-03-02: Exterior authored-atlas padding strip must stay fully transparent

- Decision: The entire committed PNG strip beyond the right edge of all authored atlas regions must remain fully transparent, not merely partially empty.
- Reason: Atlas spill regressions need one unambiguous blank band where any non-transparent pixel is automatically an authored-content leak.
- Consequence: Future atlas growth should preserve a fully transparent exterior strip or update the authored layout, committed asset, and related regressions together.

### 2026-03-02: Default direct `render.uvRect` sources must stay out of the exterior padding strip

- Decision: Every shipped direct `render.uvRect` source, including animated frames, must stay entirely outside the fully transparent committed atlas strip beyond the authored-region bounds.
- Reason: Direct UV metadata bypasses authored atlas-index ownership, so the exterior blank band only remains a trustworthy spill-detection target if metadata cannot sample it either.
- Consequence: Future direct-UV authoring should stay within the authored-region span or update the authored layout, committed asset, and related regressions together.

### 2026-03-02: Authored atlas keeps a spare unused region plus exterior padding

- Decision: The committed authored atlas now expands to `96x64`, preserves the original `4x4` used region block, reserves authored region `16` as intentionally unused, and leaves exterior transparent padding beyond the authored-region bounds.
- Reason: Upcoming committed-asset regressions for unused-region transparency and content spill need real empty atlas space instead of a fully packed image.
- Consequence: Future atlas edits should preserve equivalent documented spare space or deliberately update the related asset-regression coverage and docs at the same time.

### 2026-03-02: Default animated direct `render.uvRect` frames must differ in committed atlas content

- Decision: Consecutive default animation frames that resolve through direct `render.uvRect` metadata must not point at identical committed PNG pixels.
- Reason: Direct-UV animation metadata can otherwise exercise the renderer path while shipping a visually static repeated frame, which hides authored-asset drift until later art work builds on it.
- Consequence: Future direct-UV animation authoring should change committed atlas content from one frame to the next whenever a tile is intended to animate visibly.

### 2026-03-02: Default animated direct `render.uvRect` frames must stay inside authored atlas regions

- Decision: Every default animated frame that resolves through direct `render.uvRect` metadata must stay fully inside the explicit authored atlas region set.
- Reason: Direct-UV animation frames can bypass atlas-index ownership, so uncovered atlas canvas would otherwise remain vulnerable to silent metadata drift even when the committed PNG still looks correct.
- Consequence: Future direct-UV animation authoring should keep each frame within documented authored regions or update the authored layout and related regressions in the same pass.

### 2026-03-02: Default animated atlas-index frames must differ in committed atlas content

- Decision: Consecutive default animation frames that resolve through authored atlas indices must not point at identical committed PNG pixels.
- Reason: Atlas-index animation metadata can otherwise exercise the renderer path while shipping a visually static repeated frame, which hides authored-asset drift until later art work builds on it.
- Consequence: Future atlas-index animation authoring should change committed atlas content from one frame to the next whenever a tile is intended to animate visibly.

### 2026-03-02: Fully transparent RGB drift does not count as authored animation frame change

- Decision: Authored-atlas animation regression comparisons ignore RGB differences on pixels whose alpha is zero in both compared committed PNG frames.
- Reason: PNG tooling can rewrite invisible transparent-pixel RGB without changing shipped visuals, so that drift should not satisfy frame-distinctness regressions for atlas-index or direct-`render.uvRect` animations.
- Consequence: Future authored animation regression work should look for visible committed frame changes instead of treating hidden transparent padding churn as meaningful content.

### 2026-03-02: Default direct `render.uvRect` tiles must point at visible committed atlas content

- Decision: Default tile metadata that uses direct `render.uvRect` mapping must resolve to a committed atlas sub-rect containing at least one non-transparent pixel.
- Reason: Direct UV sources bypass authored atlas-index coverage, so they need their own committed-asset regression guard against silently pointing at blank atlas space.
- Consequence: Future direct-UV tile authoring should ship visible atlas content in the referenced sub-rect or avoid referencing that rect from default metadata.

### 2026-03-02: Static direct `render.uvRect` tiles must stay inside authored atlas regions

- Decision: Every default static direct `render.uvRect` source must stay fully inside the explicit authored atlas region set.
- Reason: Static direct UV metadata bypasses atlas-index ownership just like animated frames, so uncovered atlas canvas would otherwise remain vulnerable to silent metadata drift even when a tile is not animated.
- Consequence: Future direct-UV tile authoring should keep each base static source inside documented authored regions or update the authored layout and related regressions in the same pass.

### 2026-03-02: Committed authored atlas regions must be accounted for explicitly

- Decision: Every region declared in `src/world/authoredAtlasLayout.ts` must either be referenced by default tile metadata or listed in the same module as intentionally unused with a reason.
- Reason: Committed atlas asset regressions need to distinguish deliberate spare or blank slots from accidental content drift between the PNG, the layout table, and tile metadata.
- Consequence: Future atlas edits should update the authored layout's unused-region documentation whenever a committed slot is left blank or reserved instead of referenced immediately.

### 2026-03-01: Chunk streaming prune must not discard edited tile state

- Decision: `TileWorld` now keeps sparse per-chunk edited tile overrides separate from resident chunk instances, reapplies them when pruned chunks stream back in, and drops an override only when a tile is reset to its procedural value.
- Reason: Streaming caches need to stay disposable for memory control, but renderer and gameplay state should not silently lose user edits just because an off-screen chunk was evicted.
- Consequence: Future world streaming, save/load, and networking work should treat resident chunk objects as rebuildable caches over procedural generation plus persisted edits, rather than the only copy of authoritative edited terrain.

### 2026-03-01: Direct `uvRect` tile render sources must resolve to whole atlas pixels at runtime

- Decision: Renderer boot now validates direct static and animated `uvRect` render metadata against the loaded atlas dimensions and warns when any edge resolves between atlas pixels, while atlas-index-backed sources continue to derive from authored pixel regions.
- Reason: Normalized sub-rect metadata is only sampling-safe when it lands on exact texel boundaries for the atlas image that actually loaded at runtime.
- Consequence: Future direct `uvRect` authoring should start from atlas pixel coordinates or move to `atlasIndex`; atlas-size changes that preserve bounds but break whole-pixel mapping are still considered invalid content.

### 2026-03-01: Animated non-terrain tiles advance through renderer-side UV patching

- Decision: Chunk meshes continue to bake static frame-zero UVs, while the renderer retains CPU-side vertex copies only for chunks containing animated non-terrain quads and rewrites those UVs when elapsed time advances to a new metadata frame.
- Reason: This preserves terrain autotile and static-tile mesh resolution, avoids per-frame remeshing, and lets authored animation metadata layer onto the existing chunk format with a narrow renderer-only update path.
- Consequence: Future tile animation work should reuse the compiled animation lookup plus animated-quad patch path; tiles whose animation changes topology or adjacency still need a different pipeline.

### 2026-03-01: Authored atlas layout owns atlas-index resolution

- Decision: `atlasIndex` render metadata, terrain variant maps, and the generated placeholder fallback atlas now resolve through an explicit authored atlas layout definition instead of deriving UVs or fallback paint regions from hard-coded `4x4` slot math.
- Reason: Atlas validation, UV lookup, and fallback preview generation need one content-owned source of truth that can stay aligned with the committed PNG as authored regions evolve, without coupling runtime behavior to placeholder implementation details.
- Consequence: Future atlas edits should update `src/world/authoredAtlasLayout.ts` first, and new atlas-index validation, rendering, or fallback atlas work should consume that layout rather than reintroducing grid-derived assumptions.

### 2026-03-01: Temporary standalone player visualization lives in the WebGL renderer

- Decision: Until the entity layer lands, the spawned standalone player is drawn by a dedicated renderer-side world-space placeholder pass instead of a DOM overlay.
- Reason: World-space rendering keeps camera movement, zoom, and draw ordering aligned with terrain, and avoids maintaining a second client-space projection path for a temporary visual.
- Consequence: Future placeholder-player polish should extend the renderer pass or the later entity layer rather than reintroducing a standalone DOM marker.

### 2026-03-01: Animated tile metadata layers onto a static frame-zero render source

- Decision: Optional tile render animation metadata stays additive to the existing static `atlasIndex` / `uvRect`; when `frames` are present, `frameDurationMs` is required and `frames[0]` must resolve to the same UV rect as the static render source.
- Reason: The current mesher and renderer still consume one static UV rect per non-terrain tile, so animated tiles need a deterministic frame-zero fallback before render-time animation sampling exists.
- Consequence: Future animated tiles should always define a valid static frame-zero source, and later renderer animation work should sample the compiled animation lookup instead of bypassing the existing static UV metadata path.

### 2026-03-01: Manual camera inspection adjusts follow offset instead of disabling player follow

- Decision: Standalone player camera follow now targets the player body center by default, while manual pan and zoom input is preserved by folding camera deltas into a persistent follow offset instead of toggling into a separate free-camera mode.
- Reason: Mixed-device play needs player-centric framing, but debug inspection still needs drag and pinch camera control without fighting a second camera state machine.
- Consequence: Future camera controls should usually modify the follow offset or explicitly introduce a higher-level shell state, rather than bypassing player follow by mutating `Camera2D` indefinitely.

### 2026-03-01: Player input should resolve into movement intent before physics stepping

- Decision: Standalone player walk and jump behavior now enter the simulation as a normalized movement-intent object that the player-state helper resolves into horizontal velocity, jump impulse, gravity, and collision stepping.
- Reason: This keeps device-specific bindings out of the world layer, gives desktop and touch controllers one shared contract to target, and preserves a single fixed-step path for future entity migration.
- Consequence: Future input work should map controls into movement intent and call the shared player-step helper instead of mutating player velocity directly in `src/main.ts` or `src/input`.

### 2026-03-01: Standalone player gravity is applied before collision stepping

- Decision: The spawned standalone player now applies gravity and fall-speed clamping to `velocity.y` before each fixed-step collision move, rather than re-running spawn placement or using a separate gravity path.
- Reason: This makes unsupported players start falling immediately, keeps resting-on-ground behavior stable through the same collision helper, and gives later movement work one fixed-step path to extend.
- Consequence: Future walk, jump, respawn, or entity migration work should layer onto the gravity-step helper instead of introducing parallel gravity integration or bypassing the shared collision sweep order.

### 2026-03-01: Player collision stepping resolves horizontal then vertical sweeps

- Decision: Standalone player collision stepping moves the player through an `x` sweep first, then a `y` sweep, and determines `grounded` from a post-move support probe instead of trusting prior grounded state.
- Reason: This keeps fixed-step movement deterministic, lets wall and ceiling hits zero only the blocked axis, and makes ledge walk-off behavior correct even before gravity and input forces are layered in.
- Consequence: Future standalone-controller or entity migration work should reuse the shared collision-step helper for grounded resolution rather than introducing separate per-system sweep order or support checks.

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
