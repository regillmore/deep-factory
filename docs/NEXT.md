# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Entities and interpolation

366. Add runtime coverage that paused-menu New World resets keep standalone-player placeholder interpolation snapped to the fresh spawn without one-frame smear.

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

## Optimize liquids

367. Add liquid-step instrumentation and no-liquid regression coverage: expose world or renderer counters for resident chunks scanned, horizontal pairs tested, and transfers applied per fixed step, then add deterministic regressions that cover zoomed-out no-liquid scenes and verify the liquid step does no useful work when no liquid is present.
368. Track resident chunks with liquid and skip dormant liquid simulation when the active set is empty: maintain active-liquid chunk membership through tile edits, transfers, prune, and streamback, and make stepLiquidSimulation return immediately when no resident chunk can flow.
369. Restrict sideways liquid equalization to active liquid chunks plus immediate neighbor chunks: stop scanning every resident tile pair each tick while preserving deterministic chunk-boundary behavior and adding regressions for cross-boundary flow.
370. Add liquid chunk sleep or wake rules for settled fluid: remove unchanged chunks from the active set until a local edit or neighboring transfer wakes them, with regressions for settled pools resuming after a disturbance.

## Refine, Extract, Refactor, Restructure

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
352. Add a door utility slice after starter building-block placement (`308`) and save/load (`19-21`): stackable door hotbar slots, mixed-device two-tile doorway placement plus open/close collision swapping, and snapshot regressions for placed door state.
363. Add a bomb-demolition combat slice after hostile-slime combat (`213`) and inventory basics (`214`): stackable bomb hotbar slots, mixed-device throw aiming with fixed-step fuse timing, terrain blast edits plus player/slime damage falloff, and save/load regressions for cratered terrain plus remaining bomb stacks.
364. Add a recall-mirror recovery slice after inventory basics (`214`) and bed-checkpoint respawn (`338`): a non-stackable mirror hotbar slot, mixed-device use input with fixed-step channel/cancel rules, teleport to the latest valid checkpoint or world spawn, and deterministic cooldown regressions.
