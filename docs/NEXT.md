# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Collision and player foundation

## Liquid rendering

9. Define liquid-specific render metadata for water and lava tiles, including connectivity rules separate from terrain autotile grouping.
10. Add liquid autotile mask resolution for edge and surface variants.
11. Animate liquid tiles in the renderer from metadata-driven frame sequences.

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

27. Add grounded-walk placeholder pose variants to the renderer-side standalone player draw pass so horizontal movement direction reads before sprite assets land.
64. Surface the paused-main-menu fresh-world reset consequence in shell copy so the destructive action reads clearly before activation.
65. Surface the in-world main-menu shortcut in shell copy once the keyboard action exists.
66. Surface the in-world recenter-camera shortcut in shell copy once the keyboard action exists.
67. Surface the in-world debug-HUD shortcut in shell copy once the keyboard action exists.
68. Surface the in-world spawn-marker shortcut in shell copy once the keyboard action exists.

## Player debugging

63. Surface standalone player wall-side direction in the debug overlay when wall-contact events block or clear on the left versus right side.
72. Surface standalone player grounded-transition events in the compact debug-edit status strip when the text debug HUD is hidden.
