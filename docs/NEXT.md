# Next incremental tasks

These items are intentionally scoped to fit a focused implementation pass with tests, rather than a full feature pillar.

## Grappling hook traversal

571. Add a grappling-hook use foundation after entity scaffolding: define a non-stackable grappling-hook hotbar item, route mixed-device aimed use through the shared hidden-panel play-mode item-use path, and cover blocked-versus-fired hook-state regressions.
572. Add grappling-hook projectile flight after task 571: spawn a fixed-step hook entity toward the requested world point, stop it on range failure or the first solid-tile latch, and cover deterministic in-flight versus latched state transitions.
573. Add grappling-hook pull-and-release traversal after task 572: pull the player toward a latched anchor, support mixed-device cancel or release cleanup, and cover fixed-step hook-state regressions through latch, pull, and detach.

## Bow and arrow ranged combat

575. Add aimed bow firing after bow-and-arrow inventory foundations and hostile-slime jump-chase locomotion: require carried arrows, route mixed-device aimed firing through the shared hidden-panel play-mode item-use path, and cover blocked-shot rules without consuming ammo.
576. Add arrow projectile terrain resolution after task 575: advance fixed-step arrow flight deterministically, despawn arrows on first solid-terrain contact, and cover ammo consumption on successful fired shots.
577. Add hostile-slime arrow hits after task 576: apply deterministic arrow damage, knockback, defeat, and gel-drop consequences when projectiles hit hostile slimes.

## Bed checkpoint respawn

578. Add placeable bed items after starter building-block placement and save/load: define a bed hotbar item, validate two-tile bed placement footprints, and preserve placed bed tiles through world snapshots.
579. Add bed checkpoint-claim interactions after task 578 and death-and-respawn recovery: let nearby mixed-device interactions claim a placed bed as the latest checkpoint and cover claimed-bed session-state regressions.
580. Add bed-based respawn resolution after task 579: respawn the player at the latest valid claimed bed when its stand area stays clear and fall back deterministically to world spawn when that checkpoint is obstructed.
581. Persist claimed bed checkpoints after task 580 and save/load: export or import the claimed checkpoint reference, clear it when the matching bed is removed or mismatched after load, and cover snapshot restore regressions.

## Chest storage

582. Add placeable chest items after inventory basics and save/load: define a chest hotbar item, create anchored empty chest storage records on successful placement, and cover chest-placement snapshot regressions.
583. Add chest open-or-close interactions after task 582: let nearby mixed-device interactions open one placed chest at a time, close that chest on explicit close or range loss, and cover active-chest session-state regressions.
584. Add chest-to-hotbar transfer rules after task 583: support fixed-slot stack merge or move rules between the open chest and the player hotbar, including blocked inventory-full cases, with deterministic transfer regressions.
585. Persist chest contents after task 584 and save/load: export or import chest placement plus stored contents together and clear orphaned chest records when their placement tiles no longer exist.

## Door utility

586. Add placeable door items after starter building-block placement and save/load: define a stackable door hotbar item, validate two-tile doorway placement footprints, and preserve placed closed-door state through world snapshots.
587. Add mixed-device door open-or-close interactions after task 586: toggle nearby placed doors between closed and open states without consuming the carried stack and cover paired tile-state regressions.
588. Add door collision and cleanup rules after task 587: swap blocking behavior with the current open-or-closed state, clear unsupported doors deterministically, and preserve open or closed door state through snapshot restore.

## Recall mirror recovery

589. Add a recall-mirror use foundation after inventory basics and task 580: define a non-stackable recall-mirror hotbar item, route mixed-device use-start input through the shared hidden-panel play-mode item-use path, and cover blocked dead-or-busy use regressions.
590. Add fixed-step recall channel-and-cancel rules after task 589: keep recall progress in session-owned fixed-step state, cancel it on invalidating movement or state changes, and cover deterministic channel-reset regressions.
591. Add recall-mirror teleport resolution after task 590: complete the channel by teleporting the player to the latest valid checkpoint or world spawn, start a deterministic cooldown, and cover interrupted-versus-complete recall regressions.

## Bucket liquid transfer

592. Add empty-and-water bucket inventory foundations after inventory basics and save/load: define stackable empty and water bucket hotbar items, swap the carried stack state on successful water-source pickup, and cover deterministic liquid-removal regressions.
593. Add water bucket pour placement after task 592: pour carried water into nearby valid cells through the shared hidden-panel play-mode item-use path and cover deterministic resident-liquid wake or volume regressions.
594. Add lava bucket pickup-and-pour after task 593: extend the same mixed-device pickup, carried-state swap, and nearby placement rules to lava sources and lava pours with deterministic liquid-volume regressions.
595. Persist carried bucket states after task 594 and save/load: preserve empty, water, and lava bucket stacks together with the resulting resident liquid edits through world-save export, import, and browser resume.

## Fishing utility

596. Add a fishing-rod cast foundation after inventory basics and save/load: define a non-stackable fishing-rod hotbar item, validate mixed-device water-only cast targets, and cover blocked-versus-cast regressions.
597. Add fishing bobber bite timing after task 596: spawn a bobber entity for valid casts, advance deterministic wait-and-bite windows over water, and cover cancel or recast cleanup regressions.
598. Add fish-item catches after task 597: convert successful bite resolution into fish items added to inventory, reject full-inventory catches cleanly, and cover deterministic catch plus carried-fish save or restore regressions.

## Bomb utility

599. Add bomb inventory foundations after inventory basics and save/load: define a stackable bomb hotbar item, expose it through the item catalog, and cover carried-bomb save or restore regressions.
