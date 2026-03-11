# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Networking scaffolding

479. Add a transport-facing diagnostics logger configuration-snapshot restore callback invoker after task `478` that accepts one nullable unknown-snapshot restore callback and returns a no-op-safe restore function for transport lifecycle wiring, with restore-invoker regressions.
480. Add a transport-facing diagnostics logger configuration-snapshot restore callback reconfiguration helper after task `479` that rebuilds one nullable restore callback from updated holder, registry, live runtime callbacks, and optional restore-lifecycle loggers, with restore-reconfiguration regressions.
481. Add a transport-facing diagnostics logger configuration-snapshot restore callback state holder after task `480` that owns one nullable restore callback plus a no-op-safe restore entrypoint across reconfiguration, with restore-callback-holder regressions.

## App shell

200. Add import/export actions for shell and debug-edit preference profiles so keybinding and toggle setups can be shared or restored across browser sessions.
318. Add paused-menu persistence-summary copy that surfaces when some persisted in-world shell-action keybindings were rejected during load while a mixed custom/default binding set still remains, with shell-action storage regressions.
424. Add a first-launch main-menu persistence-preview card that explains browser resume becomes available only after the first world session starts and pauses, with shell guidance regressions.
426. Add paused-menu `Reset Shell Hotkeys` result copy that distinguishes stale load-fallback recovery from ordinary custom-set resets, with hotkey-reset regressions.

## Optimize liquids

383. Expose split downward-vs-sideways liquid-step counters in the compact hidden-HUD status strip after task `382` lands so mixed-device wake testing can stay off the full debug HUD.
404. Expose sideways candidate-band chunk bounds in renderer telemetry and the debug HUD after task `382` lands so chunk-sleep wake testing can compare neighbor-band expansion against active-liquid bounds.
408. Expose sleeping-liquid chunk bounds in renderer telemetry and the debug HUD so wake testing can localize settled pools after awake bounds disappear.
409. Expose the derived liquid-step phase summary in the compact hidden-HUD status strip after task `384` lands so wake testing can confirm last-step flow state without opening the full debug HUD.

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
372. Add a bucket liquid-transfer utility slice after inventory basics (`214`) and save/load (`19-21`): stackable empty, water, and lava bucket hotbar slots, mixed-device source pickup plus nearby-tile pour placement, deterministic liquid-volume regressions, and snapshot regressions for bucket contents plus resident liquid state.
399. Add a fall-damage survival slice after entity scaffolding (`17-18`): fixed-step landing-speed thresholds, player health loss plus brief recovery invulnerability, and save/load regressions for post-fall health state.
401. Add a passive-bunny ambient-entity slice after entity scaffolding (`17-18`): deterministic surface spawn rules near the player, hop-and-turn movement with ledge avoidance, and fixed-step spawn/despawn regressions.
403. Add a starter boomerang combat slice after hostile-slime combat (`213`) and inventory basics (`214`): a non-stackable boomerang hotbar slot, mixed-device aimed throw-and-return rules, terrain/slime hit detection, and deterministic return regressions.
