# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Collision and player foundation

## Liquid rendering

93. Populate distinct placeholder water liquid edge or surface variant sources now that liquid masks resolve.
117. Populate distinct placeholder lava liquid edge or surface variant sources now that liquid masks resolve.

## Lighting

12. Add per-chunk light storage plus invalidation hooks when edited tiles change `blocksLight` or emissive state.
13. Implement sunlight propagation from exposed chunk tops using the existing gameplay metadata.
14. Add local emissive light sources (start with a torch tile or debug light source) and merge them into the light field.
15. Modulate tile rendering by resolved light values.

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

65. Surface the in-world main-menu shortcut in shell copy once the keyboard action exists.
66. Surface the in-world recenter-camera shortcut in shell copy once the keyboard action exists.
67. Surface the in-world debug-HUD shortcut in shell copy once the keyboard action exists.
68. Surface the in-world spawn-marker shortcut in shell copy once the keyboard action exists.
70. Surface the in-world edit-panel shortcut in shell copy once task 69 adds the keyboard action.
82. Surface the in-world edit-panel shortcut in the touch debug controls keyboard reference once task 69 adds the keyboard action.

## Player debugging

116. Surface standalone player live camera-follow focus point in the compact debug-edit status strip when the text debug HUD is hidden.
123. Surface standalone player live camera world position in the compact debug-edit status strip when the text debug HUD is hidden.
127. Surface standalone player live camera world tile coordinates in the compact debug-edit status strip once task 123 lands camera world position.

## Project structure optimization

126. Extend deployment regression coverage to assert emitted HTML and CSS assets also omit the exact legacy root-relative `'/atlas/tile-atlas.png'` literal.
