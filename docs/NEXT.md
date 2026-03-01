# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Authored asset pipeline

2. Update tile render metadata validation so authored atlas regions are the source of truth instead of placeholder `4x4` slot assumptions.
3. Add a render-time animated-tile frame resolver that maps elapsed time into `render.frames` / `frameDurationMs` without changing terrain or static tile UV resolution.

## Collision and player foundation

8. Add a renderer-side placeholder player draw pass that renders the standalone player in world space instead of relying on the DOM overlay.

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

25. Add an app shell with explicit `boot`, `main menu`, and `in-world` states.
26. Move debug overlay visibility behind shell/UI toggles instead of always-on bootstrap wiring.
27. Add runtime atlas-bounds validation that warns when tile `render.uvRect` metadata falls outside the loaded atlas dimensions.

## Player debugging

28. Surface live standalone player-state telemetry (`position`, `velocity`, `grounded`, `facing`) in the debug overlay once movement is wired.
29. Surface live standalone player input-intent telemetry (`move`, `jumpHeld`, `jumpPressed`) in the debug overlay alongside the player state readout.
30. Surface standalone player collision-contact telemetry (`support`, `wall`, `ceiling`) in the debug overlay after live player-state telemetry lands.
31. Surface standalone player auto-respawn events in the debug overlay when embedded-tile recovery triggers.
