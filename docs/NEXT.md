# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Authored asset pipeline

39. Add an authored-atlas asset regression test that every explicitly unused committed atlas region remains fully transparent in the committed PNG.
40. Add an authored-atlas asset regression test that committed non-transparent pixels do not spill outside authored regions referenced by default metadata or regions documented as intentionally unused.
41. Add an authored-atlas asset regression test that default animated direct `render.uvRect` frames stay aligned to whole atlas pixels in the committed PNG.
42. Add an authored-atlas asset regression test that any default animated direct `render.uvRect` frame differs from its prior frame in the committed PNG.

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
27. Add grounded-walk placeholder pose variants to the renderer-side standalone player draw pass so horizontal movement direction reads before sprite assets land.

## Player debugging

31. Surface standalone player auto-respawn events in the debug overlay when embedded-tile recovery triggers.
32. Surface standalone player collision AABB telemetry (`min`, `max`, `size`) in the debug overlay after collision-contact telemetry lands.
33. Surface standalone player camera-follow telemetry (`focus`, `offset`) in the debug overlay after collision AABB telemetry lands.
