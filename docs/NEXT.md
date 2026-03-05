# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Collision and player foundation

## Liquid rendering

194. Add an authored-atlas asset regression that verifies both animated lava `N---` single-side direct-`uvRect` frames sample non-transparent committed pixels.
195. Add an authored-atlas asset regression that verifies lava single-side masks (`N---`, `-E--`, `--S-`, `---W`) sample distinct committed pixels per animation frame.

## Lighting

162. Surface resident dirty-light chunk counts in a compact debug-edit summary chip when the text debug HUD is hidden.
177. Add a sunlight regression where toggling a non-emissive `blocksLight` tile beside an emissive source at a resident-boundary edge does not leak stale light into unloaded neighboring columns when those chunks stream back in.
189. Add renderer telemetry fields for standalone-player nearby-light source chunk and chunk-local tile coordinates alongside the existing source world tile coordinates.
191. Add a sunlight regression where toggling a non-emissive `blocksLight` boundary tile at a loaded chunk-boundary corner (`localY = CHUNK_SIZE - 1`) updates transported sunlight in the loaded chunk row below on both sides.

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

66. Surface the in-world recenter-camera shortcut in shell copy once the keyboard action exists.
67. Surface the in-world debug-HUD shortcut in shell copy once the keyboard action exists.
68. Surface the in-world spawn-marker shortcut in shell copy once the keyboard action exists.
82. Surface the in-world edit-panel shortcut in the touch debug controls keyboard reference once task 69 adds the keyboard action.
83. Surface the in-world edit-overlay shortcut in shell copy once the keyboard action exists.
158. Surface the paused-menu `Resume World` shortcut in the shell button tooltip alongside the existing paused-session copy.
188. Surface the paused-menu `Resume World (Enter)` shortcut in the paused-session camera and undo reset detail line alongside the existing `New World (N)` reset guidance.

## Player debugging

134. Surface standalone player live camera chunk-local tile coordinates in the compact debug-edit status strip once task 133 lands camera world chunk coordinates.
148. Surface standalone player live camera chunk-local tile coordinates in the text debug HUD once camera world tile and world chunk telemetry are both available.

## Project structure optimization
