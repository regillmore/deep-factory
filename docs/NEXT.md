# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

232. Add a grappling-hook traversal slice after entity scaffolding: mixed-device aimed hook firing, solid-tile latch plus pull-and-release rules, and fixed-step hook-state regressions.
246. Add a bow-and-arrow ranged-combat slice after hostile-slime jump-chase locomotion and inventory basics: stackable arrow ammo, left-click-or-tap aimed firing through the shared play-mode item-use path, fixed-step projectile flight plus terrain or slime hits, and deterministic ammo-consumption regressions.
338. Add a bed-checkpoint respawn slice after inventory basics and save/load: placeable bed items, mixed-device checkpoint claim and respawn interactions, obstructed-checkpoint fallback to world spawn, and snapshot regressions for claimed checkpoint state.
350. Add a chest-storage slice after inventory basics and save/load: placeable chest items, mixed-device open or close interactions, fixed-slot storage transfer rules, and snapshot regressions for chest contents plus chest placement state.
352. Add a door utility slice after starter building-block placement and save/load: stackable door hotbar slots, mixed-device two-tile doorway placement plus open/close collision swapping, and snapshot regressions for placed door state.
364. Add a recall-mirror recovery slice after inventory basics and bed-checkpoint respawn: a non-stackable mirror hotbar slot, mixed-device use input with fixed-step channel/cancel rules, teleport to the latest valid checkpoint or world spawn, and deterministic cooldown regressions.
372. Add a bucket liquid-transfer utility slice after inventory basics and save/load: stackable empty, water, and lava bucket hotbar slots, mixed-device source pickup plus nearby-tile pour placement, deterministic liquid-volume regressions, and snapshot regressions for bucket contents plus resident liquid state.
502. Add a fishing utility slice after inventory basics and save/load: a non-stackable fishing rod hotbar slot, mixed-device water casting plus bite timing, fish-item catches into inventory, and deterministic bite/catch regressions.
519. Add a mana-crystal upgrade slice after mana-resource magic and inventory basics: a stackable mana-crystal hotbar item, mixed-device hidden-panel consume rules, saved max-mana increase plus cap handling, and snapshot regressions for upgraded mana state.
557. Add a distinct atlas sprite for surface flowers after the surface-flower decoration slice: committed placeholder bloom art plus authored-atlas regressions. The look should align with the tall-grass and grass tile sprites.
561. Add seeded small-tree sapling worldgen after seeded small-tree worldgen: deterministic planted-sapling anchors between mature surface trees outside the protected origin corridor, plus terrain regressions.
562. Refresh the small-tree sapling atlas sprite after the tall-grass and surface-flower art refresh: committed placeholder sprout art aligned with the surface-decoration palette, plus authored-atlas regressions.
