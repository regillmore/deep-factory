# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Collision and player foundation

## Liquid rendering

202. Add a fixed-step liquid simulation slice that flows water and lava downward first, then sideways across loaded chunks, with deterministic chunk-boundary regression coverage.
203. Extend chunk meshing to support metadata-driven partial liquid fill heights (`0..8`) so liquid tops render flat or sloped by neighbor fill levels, with mask-to-geometry regression tests.
204. Add standalone-player liquid interaction basics: water buoyancy plus swim drag, lava contact damage ticks with respawn fallback, and fixed-step player-state regressions.

## Lighting

217. Add a sunlight regression where toggling a boundary `blocksLight` tile then unloading and reloading the adjacent boundary chunk preserves transported boundary-adjacent and recessed-gap solid-face sunlight on both sides.
218. Add a sunlight levels toggle, visually differentiating tiles in direct sunlight, horizontal sunlight transport, and darkness.
233. Add a sunlight regression where a clean boundary emissive source does not horizontal-transport `MAX_LIGHT_LEVEL` into streamed-back dirty neighboring boundary air after the adjacent chunk unloads and reloads.
235. Add a renderer regression where a streamed-back one-tile-gap roof build across an `x` chunk boundary still invalidates both lower-row chunk meshes before the first rebuilt draw.
307. Add a renderer regression where reclosing a streamed-back row-below bottom-corner boundary blocker from the opposite chunk side still invalidates both row-below chunk meshes before the first rebuilt draw.

## Entities and interpolation

17. Move the player onto the entity layer once the standalone controller works.
18. Render entities in a separate pass with interpolation between fixed updates.
228. Re-route standalone-player placeholder pose selection and nearby-light telemetry through the entity render-snapshot path once tasks `17-18` land, with focused renderer regression coverage.

## Save/load

19. Define a versioned chunk snapshot format with explicit metadata and tile payload encoding.
20. Implement save/load serialization for resident chunks and edited world state.
21. Add a local persistence adapter (`localStorage` or downloadable JSON) on top of the snapshot format.

## Networking scaffolding

22. Define serializable message shapes for player input, chunk tile diffs, and entity snapshots.
23. Add a client-side interest set calculator for chunk and entity relevance.
24. Stub a snapshot/delta application path that can replay remote state into the local world/entity layers.

## App shell

199. Add shell-level keybinding remap settings for in-world actions (`Main Menu`, `Recenter Camera`, `Debug HUD`, `Edit Panel`, `Edit Overlays`, `Spawn Marker`) with conflict validation and persisted preferences.
200. Add import/export actions for shell and debug-edit preference profiles so keybinding and toggle setups can be shared or restored across browser sessions.
239. Add shortcut and readiness metadata rows inside structured first-launch main-menu action cards so enter-world and mixed-device guidance stay visible without relying on button tooltips.
302. Add current saved on/off rows to the paused-menu persistence-summary card so the next `Resume World` previews the actual persisted in-world shell layout, with focused shell-state and view-model regressions.

## Ambitious vertical slices

213. Add a hostile-slime combat slice after entity scaffolding (`17-18`): deterministic spawn windows near the player, jump-chase movement, player contact damage plus invulnerability cooldown, and fixed-step combat regressions.
214. Add a dropped-item + hotbar inventory slice after entity scaffolding (`17-18`): stackable world pickups with proximity pickup rules, hotbar assignment and selection, and save/load snapshot regressions for item stacks.
215. Add a placeable-workbench crafting slice after inventory basics: recipe registry for a minimal starter set, in-world station-range gating, shell or debug panel crafting actions, and recipe resolution regressions.
221. Add a starter melee-weapon follow-up after hostile-slime combat (`213`): fixed-step swing windup/active/recovery timing, slime hit detection plus knockback, and deterministic hit-cooldown regressions.
232. Add a grappling-hook traversal slice after entity scaffolding (`17-18`): mixed-device aimed hook firing, solid-tile latch plus pull-and-release rules, and fixed-step hook-state regressions.
243. Add a torch-lighting utility slice after inventory basics (`214`): stackable torch hotbar slots, mixed-device solid-face placement of light-emitting torch tiles, and lighting regressions for placed torches.
246. Add a bow-and-arrow ranged-combat slice after hostile-slime combat (`213`) and inventory basics (`214`): stackable arrow ammo, mixed-device aimed firing, fixed-step projectile flight plus terrain or slime hits, and deterministic ammo-consumption regressions.
301. Add a healing-potion survival slice after hostile-slime combat (`213`) and inventory basics (`214`): stackable potion items, mixed-device consume input, fixed-step healing plus overheal clamp and use-cooldown rules, and save/load regressions for health plus consumable stacks.

## Refine, Extract, Refactor, Restructure
