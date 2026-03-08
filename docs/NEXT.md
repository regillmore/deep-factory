# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Lighting

322. Add a renderer regression where a clean boundary emissive source does not horizontal-transport `MAX_LIGHT_LEVEL` into streamed-back dirty neighboring boundary air on the first resumed draw.

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
318. Add paused-menu persistence-summary copy that surfaces when some persisted in-world shell-action keybindings were rejected during load while a mixed custom/default binding set still remains, with shell-action storage regressions.

## Ambitious vertical slices

213. Add a hostile-slime combat slice after entity scaffolding (`17-18`): deterministic spawn windows near the player, jump-chase movement, player contact damage plus invulnerability cooldown, and fixed-step combat regressions.
214. Add a dropped-item + hotbar inventory slice after entity scaffolding (`17-18`): stackable world pickups with proximity pickup rules, hotbar assignment and selection, and save/load snapshot regressions for item stacks.
215. Add a placeable-workbench crafting slice after inventory basics: recipe registry for a minimal starter set, in-world station-range gating, shell or debug panel crafting actions, and recipe resolution regressions.
221. Add a starter melee-weapon follow-up after hostile-slime combat (`213`): fixed-step swing windup/active/recovery timing, slime hit detection plus knockback, and deterministic hit-cooldown regressions.
232. Add a grappling-hook traversal slice after entity scaffolding (`17-18`): mixed-device aimed hook firing, solid-tile latch plus pull-and-release rules, and fixed-step hook-state regressions.
243. Add a torch-lighting utility slice after inventory basics (`214`): stackable torch hotbar slots, mixed-device solid-face placement of light-emitting torch tiles, and lighting regressions for placed torches.
246. Add a bow-and-arrow ranged-combat slice after hostile-slime combat (`213`) and inventory basics (`214`): stackable arrow ammo, mixed-device aimed firing, fixed-step projectile flight plus terrain or slime hits, and deterministic ammo-consumption regressions.
301. Add a healing-potion survival slice after hostile-slime combat (`213`) and inventory basics (`214`): stackable potion items, mixed-device consume input, fixed-step healing plus overheal clamp and use-cooldown rules, and save/load regressions for health plus consumable stacks.
308. Add a starter building-block placement slice after inventory basics (`214`): stackable dirt-block hotbar slots, mixed-device solid-face placement with player-overlap rejection, stack consumption, and save/load regressions for placed blocks plus remaining stack counts.
313. Add a rope traversal utility slice after inventory basics (`214`): stackable rope hotbar slots, mixed-device downward placement from solid anchors, climb-and-descent movement on rope tiles, and save/load regressions for placed rope plus remaining stack counts.
321. Add a starter pickaxe mining slice after inventory basics (`214`): a non-stackable pickaxe hotbar slot, mixed-device aimed tile mining with fixed-step swing timing, terrain break progress and completion rules, and deterministic break regressions.
338. Add a bed-checkpoint respawn slice after inventory basics (`214`) and save/load (`19-21`): placeable bed items, mixed-device checkpoint claim and respawn interactions, obstructed-checkpoint fallback to world spawn, and snapshot regressions for claimed checkpoint state.
349. Add a platform traversal slice after inventory basics (`214`): stackable platform hotbar slots, mixed-device one-way placement plus drop-through movement, and save/load regressions for placed platform runs.
350. Add a chest-storage slice after inventory basics (`214`) and save/load (`19-21`): placeable chest items, mixed-device open or close interactions, fixed-slot storage transfer rules, and snapshot regressions for chest contents plus chest placement state.

## Refine, Extract, Refactor, Restructure
