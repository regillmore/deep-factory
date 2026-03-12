# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## App shell

473. Move paused-menu action buttons into their owning sections after tasks `471-472` so `Overview`, `World Save`, `Shell`, and `Danger Zone` no longer duplicate the footer action row, with section-action regressions.
474. Add inline desktop shortcut badges to section-owned paused-menu actions after task `473` so moved `Resume World` and `New World` controls keep `Enter` and `N` discoverable without the footer row, with section-shortcut-badge regressions.
475. Convert the expanded paused-menu `Shell` profile preview into metadata-first layout and hotkey diff groups after task `467` so preview details stay scannable once help-text paragraphs are removed, with shell-preview-diff regressions.
476. Add compact status badges to paused-menu `Recent Activity` cards after task `469` so success and attention states stay scannable once help-text paragraphs are removed, with recent-activity-badge regressions.
477. Convert the expanded paused-menu `Shell Hotkeys` helper paragraph into compact metadata or inline status copy after task `469` so the editor no longer depends on a prose intro block, with shell-editor-intro regressions.
478. Add compact warning badges to paused-menu `Danger Zone` action cards after task `470` so `Reset Shell Toggles` and `New World` stay scannable once the dashboard layout lands, with danger-zone-badge regressions.
479. Add a paused-dashboard top-jump link after task `472` so long `Shell` editor sessions can return to `Overview` quickly on touch and desktop, with paused-dashboard-top-link regressions.
480. Preserve keyboard focus on the current paused-dashboard section anchor when `Shell` expands or collapses after task `472` so hotkey editing does not drop keyboard users back into the broader overlay flow, with shell-section-focus regressions.

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
411. Add an umbrella fall-control utility slice after inventory basics (`214`) and fall-damage survival (`399`): a non-stackable umbrella hotbar slot, mixed-device hold-to-glide input, fixed-step fall-speed clamp plus early-release rules, and deterministic glide regressions.
