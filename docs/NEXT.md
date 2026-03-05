# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Collision and player foundation

## Liquid rendering

186. Populate a distinct placeholder lava liquid single-side source for the `-E--` mask once the dedicated lava isolated-body `----` source lands.
187. Populate a distinct placeholder lava liquid single-side source for the `---W` mask once the dedicated lava single-side `-E--` source lands.

## Lighting

162. Surface resident dirty-light chunk counts in a compact debug-edit summary chip when the text debug HUD is hidden.
177. Add a sunlight regression where toggling a non-emissive `blocksLight` tile beside an emissive source at a resident-boundary edge does not leak stale light into unloaded neighboring columns when those chunks stream back in.
183. Surface standalone-player nearby-light sample source chunk and chunk-local tile coordinates in the debug HUD and hidden-HUD compact strip once source world tile coordinates are available.
184. Add a sunlight regression that toggling a non-emissive `blocksLight` tile on either side of a resident chunk-boundary edge updates transported sunlight symmetrically across that boundary.

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
