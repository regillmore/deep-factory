# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Collision and player foundation

## Liquid rendering

202. Add a fixed-step liquid simulation slice that flows water and lava downward first, then sideways across loaded chunks, with deterministic chunk-boundary regression coverage.
203. Extend chunk meshing to support metadata-driven partial liquid fill heights (`0..8`) so liquid tops render flat or sloped by neighbor fill levels, with mask-to-geometry regression tests.
204. Add standalone-player liquid interaction basics: water buoyancy plus swim drag, lava contact damage ticks with respawn fallback, and fixed-step player-state regressions.

## Lighting

177. Add a sunlight regression where toggling a non-emissive `blocksLight` tile beside an emissive source at a resident-boundary edge does not leak stale light into unloaded neighboring columns when those chunks stream back in.
211. Add a sunlight regression where a boundary bottom-corner `blocksLight` toggle (`localY = CHUNK_SIZE - 1`) followed by unloading and reloading the adjacent row-below chunk keeps transported sunlight and boundary-adjacent solid-face relighting correct on the invalidated columns.
217. Add a sunlight regression where toggling a boundary `blocksLight` tile then unloading and reloading the adjacent boundary chunk preserves transported boundary-adjacent and recessed-gap solid-face sunlight on both sides.
218. Add a sunlight levels toggle, visually differentiating air tiles in direct sunlight, horizontal sunlight transport, and darkness.

## Entities and interpolation

16. Add a minimal entity registry with fixed-step update hooks and render-state snapshots.
17. Move the player onto the entity layer once the standalone controller works.
18. Render entities in a separate pass with interpolation between fixed updates.

## Save/load

19. Define a versioned chunk snapshot format with explicit metadata and tile payload encoding.
20. Implement save/load serialization for resident chunks and edited world state.
21. Add a local persistence adapter (`localStorage` or downloadable JSON) on top of the snapshot format.

## Networking scaffolding

22. Define serializable message shapes for player input, chunk tile diffs, and entity snapshots.
23. Add a client-side interest set calculator for chunk and entity relevance.
24. Stub a snapshot/delta application path that can replay remote state into the local world/entity layers.

## App shell

82. Surface the in-world edit-panel shortcut in the touch debug controls keyboard reference once task 69 adds the keyboard action.
188. Surface the paused-menu `Resume World (Enter)` shortcut in the paused-session camera and undo reset detail line alongside the existing `New World (N)` reset guidance.
198. Add an in-world `Shortcuts (?)` overlay that lists current desktop and touch controls, opens from both a shell button and `?`, and preserves visibility across pause/resume.
199. Add shell-level keybinding remap settings for in-world actions (`Main Menu`, `Recenter Camera`, `Debug HUD`, `Edit Panel`, `Edit Overlays`, `Spawn Marker`) with conflict validation and persisted preferences.
200. Add import/export actions for shell and debug-edit preference profiles so keybinding and toggle setups can be shared or restored across browser sessions.
219. Add app-shell regressions that paused-menu `Resume World (Enter)` and `New World (N)` tooltip titles clear when first-launch main-menu copy is restored without a resumable session.

## Player debugging

134. Surface standalone player live camera chunk-local tile coordinates in the compact debug-edit status strip once task 133 lands camera world chunk coordinates.
148. Surface standalone player live camera chunk-local tile coordinates in the text debug HUD once camera world tile and world chunk telemetry are both available.

## Ambitious vertical slices

213. Add a hostile-slime combat slice after entity scaffolding (`16-18`): deterministic spawn windows near the player, jump-chase movement, player contact damage plus invulnerability cooldown, and fixed-step combat regressions.
214. Add a dropped-item + hotbar inventory slice after entity scaffolding (`16-18`): stackable world pickups with proximity pickup rules, hotbar assignment and selection, and save/load snapshot regressions for item stacks.
215. Add a placeable-workbench crafting slice after inventory basics: recipe registry for a minimal starter set, in-world station-range gating, shell or debug panel crafting actions, and recipe resolution regressions.

## Project structure optimization
