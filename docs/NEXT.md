# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Authored asset pipeline

3. Add runtime pixel-alignment validation for tile `render.uvRect` metadata so authored sub-rects snap to whole atlas pixels at boot.
4. Make the generated placeholder fallback atlas derive its canvas size and painted regions from the authored atlas layout so atlas-index previews stay aligned when the layout changes.
5. Add debug telemetry for animated chunk UV uploads so renderer-side tile animation cost stays visible as authored frame counts grow.

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

25. Add an app shell with explicit `boot`, `main menu`, and `in-world` states.
26. Move debug overlay visibility behind shell/UI toggles instead of always-on bootstrap wiring.
27. Add grounded and airborne placeholder pose variants to the renderer-side standalone player draw pass so jump state is readable before sprite assets land.

## Player debugging

28. Surface live standalone player-state telemetry (`position`, `velocity`, `grounded`, `facing`) in the debug overlay once movement is wired.
29. Surface live standalone player input-intent telemetry (`move`, `jumpHeld`, `jumpPressed`) in the debug overlay alongside the player state readout.
30. Surface standalone player collision-contact telemetry (`support`, `wall`, `ceiling`) in the debug overlay after live player-state telemetry lands.
31. Surface standalone player auto-respawn events in the debug overlay when embedded-tile recovery triggers.
