# Decisions

Record only durable design decisions here. Keep each entry short: date, decision, reason, and consequence.

### 2026-03-31: Snapshot normalization strips malformed door remnants

- Decision: `TileWorld.loadSnapshot()` now clears orphaned or mismatched starter-door halves from resident chunk data and pruned edited overrides before restored world state becomes authoritative.
- Reason: Live world edits already clean up half-door remnants, so imported or restored saves should not be able to resurrect malformed door states through raw snapshot payloads or hand-edited JSON.
- Consequence: Future save, import, restore, or migration flows should continue routing world snapshots through shared `TileWorld` normalization instead of trusting raw paired-door tile payloads.

### 2026-03-30: Selected door previews prioritize paired-door interactions before placement copy

- Decision: When selected `Door` hover targets resolve a complete paired door, preview state now reports toggle-ready or toggle-blocked interaction feedback before generic empty-doorway placement feedback.
- Reason: Selected-door use already toggles complete pairs before placement, so the hover preview should match the real action instead of falling back to occupied placement copy on valid door interactions.
- Consequence: Future door hover, slot-feedback, or pair-footprint preview work should extend that interaction-first selected-door preview seam rather than deriving existing-door feedback from ordinary placement occupancy states.

### 2026-03-30: Thrown-bomb late-fuse opacity fades only on fast warning off-beats

- Decision: Thrown-bomb fuse warnings now keep full opacity during ordinary flight and the slow warning cadence, and only lower alpha on the fast late-fuse off-beats through the shared palette-shader uniform.
- Reason: Early warning beats still need a readable in-flight silhouette, while the final rapid blink needs a stronger urgency cue without introducing a bomb-only render path or frame-owned fade timer.
- Consequence: Future thrown-bomb warning tuning should extend the shared warning-visual helper and palette-shader alpha path instead of fading the whole fuse window or layering on a second opacity system.

### 2026-03-30: Direct door half-removal clears the remaining mate through TileWorld

- Decision: When gameplay or debug tile edits remove one half of a placed door pair, `TileWorld` resolves that door's shared bottom anchor from the removed tile and clears the remaining mate through the normal tile-edit path with the same edit origin.
- Reason: Direct single-tile door edits can come from debug breaks, undo/redo replay, or future gameplay tools, and leaving the untouched half behind would create orphaned door tiles that later pair logic intentionally ignores.
- Consequence: Future direct door-edit flows should keep using ordinary world tile writes and rely on world-owned mate cleanup instead of preserving half-door remnants or reimplementing paired cleanup in each caller.

### 2026-03-30: Gameplay door refunds follow gameplay-origin bottom-half door clears

- Decision: Starter-pickaxe, bomb, and gameplay support-collapse door removal now refund exactly one `Door` from the gameplay-origin tile-edit notification that removes a paired door's bottom half, while top-half door removals stay refund-free.
- Reason: Direct pair clears and support-collapse cleanup already converge on the same bottom-anchored door contract, so one bottom-half notification gives every gameplay removal path the same single-door refund without duplicating refund logic, and debug-origin cleanup can still stay silent by preserving its edit origin.
- Consequence: Future gameplay door-removal or support-collapse work should preserve one gameplay-origin bottom-half clear per removed pair and let the shared tile-edit listener own the refund instead of spawning door drops separately in each initiating tool path.

### 2026-03-30: Open-door blocking and cleanup follow the paired doorway support state

- Decision: Closed door pairs stay solid and light-blocking, open door pairs become non-solid and non-light-blocking, and `TileWorld` clears complete door pairs only when their shared doorway framing or solid-or-platform floor support disappears.
- Reason: Door collision, lighting, save/restore, and later refund work all need one consistent paired-door state contract, while support-collapse checks should reuse sparse world reads instead of forcing neighboring chunks resident.
- Consequence: Future door collision, cleanup, refund, and malformed-save follow-ups should treat door state as a paired bottom-anchored doorway concern rather than per-tile solidity or chunk-residency side effects.

### 2026-03-30: Door interactions toggle only complete paired door states in place

- Decision: Selected `Door` use now treats either targeted top or bottom door tile as a request to toggle the full paired doorway in place between closed and open tile ids, and leaves the carried stack untouched.
- Reason: Mixed-device interactions need one stable pair-resolution seam that both placement and later collision or refund work can reuse, while incomplete or mismatched pairs should fail safely instead of rewriting half a door.
- Consequence: Future door preview, collision, cleanup, refund, and save/load follow-ups should resolve doors through that complete bottom-anchored pair-toggle contract rather than editing individual door tiles or consuming inventory on interaction.

### 2026-03-30: Closed doors place as framed two-tile doorway pairs

- Decision: Door placement now treats the targeted cell as the bottom of a paired closed-door top/bottom write, requiring both door cells to be empty, solid left and right side columns across both rows, and a solid-or-platform floor below before consuming one `Door`.
- Reason: The first door slice needs one stable closed-state footprint that matches the simplified 1x2 doorway model and gives later open/close, collision, and cleanup work one shared frame rule to extend.
- Consequence: Future door interaction, cleanup, and refund work should operate on that paired bottom-anchored closed-door footprint instead of treating doors as single tiles or redefining what counts as doorway support.

### 2026-03-30: World-session replacement clears bow ammo reservations through shared projectile cleanup

- Decision: Fresh-world and paused save-restore replacement now clear active arrow projectile entities through one shared bow cleanup seam before session-owned entity registries reset, so reserved ammo does not leak into replacement sessions that do not persist projectile entities.
- Reason: Bow reservations are derived from runtime-only in-flight arrow projectiles, while new-world and save-restore replacement persist only inventory and restored session data.
- Consequence: Future world-session replacement or bow-runtime cleanup should release arrow-projectile-backed reservations through that shared cleanup seam instead of carrying stale projectile ids or reserved-ammo feedback into restored inventory state.

### 2026-03-30: Selected Arrow drop feedback follows the same droppable unreserved-arrow limit as runtime

- Decision: When `Arrow` is selected and in-flight bow projectiles reserve part or all of the carried stack, the selected-slot tooltip and hotbar `Drop 1` / `Drop` controls now describe the same droppable-versus-blocked limit that runtime drop actions enforce.
- Reason: The shared drop logic already preserves reserved ammo in inventory, so the selected-arrow UI should stop implying that the full carried stack can always leave inventory while shots are still unresolved.
- Consequence: Future arrow drop, transfer, or removal UI should reuse the same droppable unreserved-arrow calculation and reserved-arrow copy instead of deriving availability from the raw selected stack amount alone.

### 2026-03-30: Reserved arrows cannot leave inventory through hotbar drops

- Decision: Hotbar `Drop 1` now blocks when every carried `Arrow` is already reserved by in-flight bow projectiles, and hotbar `Drop` now removes only the selected stack's unreserved arrow count instead of dropping reserved ammo too.
- Reason: Active bow projectiles treat carried arrows as reserved backing ammo until they resolve, so inventory drop actions should preserve that same reservation invariant instead of letting players remove in-flight ammo from inventory out of band.
- Consequence: Future arrow-transfer or arrow-removal flows should keep at least the current reserved-arrow count in inventory until those projectiles resolve, rather than treating `Arrow` stacks as fully disposable while shots are still in flight.

### 2026-03-29: Selected bow slot feedback follows available unreserved arrows

- Decision: The selected bow hotbar readout now shows remaining available arrows after subtracting active projectile reservations, and its tooltip calls out any arrows still reserved in flight instead of mirroring the raw carried stack.
- Reason: Bow shot gating already depends on unreserved ammo, so the selected-slot feedback should match the actual next-shot availability while unresolved arrows still hold reservations.
- Consequence: Future bow slot or tooltip feedback should derive from the shared available-versus-reserved ammo calculation rather than reading the carried `Arrow` stack directly.

### 2026-03-29: Solid-block placement can replace surface decorations

- Decision: Shared solid-block placement now treats `tall_grass` and `surface_flower` tiles as replaceable decoration instead of occupied blockers, while still requiring solid-face support and preventing overlap with the standalone player.
- Reason: Surface decoration lives on the same foreground tile layer as ordinary blocks, but decorative foliage should not stop normal dirt, stone, or wood building on that cell.
- Consequence: Future solid placeables should preserve or deliberately override this replaceable-decoration exception instead of treating those surface foliage tiles as hard occupancy by default.

### 2026-03-29: Grappling-hook ready preview is reserved for in-range solid hovered tiles

- Decision: Inactive grappling-hook hover previews now show a ready cue only when the hovered tile is solid and the requested world aim stays within range, while in-range empty-air aims stay neutral and out-of-range aims remain blocked.
- Reason: The preview should only promise an immediate latch when the hovered tile itself can support the hook, instead of implying that empty air is just as ready as solid terrain.
- Consequence: Future grappling-hook preview or slot-feedback work should reuse the shared preview-target evaluation and reserve ready cues for in-range solid hovered tiles rather than any in-range aim.

### 2026-03-29: Selected grappling-hook slot feedback follows the inactive preview without overriding live hook states

- Decision: The selected grappling-hook slot now mirrors temporary inactive-preview `READY` feedback for in-range solid latch candidates and `RANGE` feedback for over-range aim, while live hook traversal and dead-player states still keep their existing `HOOK` and `DEAD` readouts.
- Reason: The hotbar should echo the same inactive hover cues the world preview already shows without hiding the more important active-hook cancel state or dead-use failure state.
- Consequence: Future grappling-hook slot-feedback work should extend that shared inactive-preview evaluation and preserve active/dead precedence instead of recomputing hover readiness or range separately or replacing live traversal feedback.

### 2026-03-29: Grappling-hook range preview follows the requested world aim only while no hook is active

- Decision: Selected grappling-hook range preview now evaluates the live requested world aim point against maximum range only while the hook is inactive, instead of using tile-center distance alone or overriding active-hook cancel behavior.
- Reason: Mouse and touch aim already resolve through requested world coordinates, so preview should match the same fire semantics both devices use while leaving follow-up active-hook taps free to cancel regardless of distance.
- Consequence: Future grappling-hook hover feedback should extend the shared aim-range helper plus inactive-hook preview path rather than recomputing range from hovered tiles only or replacing active-hook slot feedback during traversal.

### 2026-03-29: Bomb flash opacity reads fixed-step lifetime progress through the shared palette shader

- Decision: Bomb-detonation-flash placeholder alpha now lerps from fully opaque ignition toward a translucent ember from the same lifetime progress that already drives flash color, light, and radius, while routing through the shared palette-based entity shader instead of a bomb-only program.
- Reason: Flash opacity should cool in lockstep with the same fixed-step lifetime that decides the effect's visual phase, and reusing the existing palette shader keeps the entity pass consistent without introducing a second render-only fade path.
- Consequence: Future palette-placeholder fade work should prefer the shared shader alpha uniform plus the owning effect's fixed-step progress helper rather than adding bomb-specific shader branches or frame-rate-owned opacity timers.

### 2026-03-29: Bomb flash quad size reads fixed-step lifetime progress

- Decision: Bomb-detonation-flash placeholder geometry now contracts from the resolved blast radius toward a smaller ember-core radius from the same `secondsRemaining` and `durationSeconds` ratio that already drives flash color and light.
- Reason: The explosion silhouette should cool and shrink in lockstep with the same fixed-step lifetime that despawns the flash, so render cadence cannot leave a full-size quad after the effect has already entered its ember phase.
- Consequence: Future bomb-flash size or shape tuning should extend that shared placeholder lifetime-progress resolver instead of introducing a second render-owned geometry timer or ad hoc per-frame radius math.

### 2026-03-28: Grappling-hook anchor-loss cleanup reuses shared tile-edit notifications

- Decision: Latched grappling-hook traversal now detaches from the shared renderer tile-edit listener whenever the current anchor cell becomes non-solid, instead of relying on individual gameplay tools or debug-edit paths to clear hook state themselves.
- Reason: Anchor removal can come from multiple gameplay, debug-break, debug-history, or support-cleanup edits, so the shared tile-edit notification seam is the one place that sees every solid-tile removal consistently.
- Consequence: Future grappling-hook anchor-loss or terrain-edit cleanup should extend that shared tile-edit listener plus helper predicate rather than adding hook-specific detach code to each mining, bomb, or debug-edit path.

### 2026-03-28: Grappling-hook tether visuals derive from interpolated player hand-hold and hook snapshots

- Decision: The grappling-hook tether now renders by pairing the grappling-hook entity's interpolated head position with a facing-aware hand-hold point derived from the standalone player's interpolated render position plus current render snapshot, rather than storing separate tether endpoint state or timing.
- Reason: Hook visuals should stay aligned with the same fixed-step snapshots that already drive the player and hook head, while still starting from the visible player-side hold instead of the body-center camera focus.
- Consequence: Future grappling-hook tether follow-ups should extend that shared snapshot-derived hand-hold helper instead of persisting duplicate tether endpoints or adding a second hook-visual timer outside the entity pass.

### 2026-03-28: World-session replacement reuses shared grappling-hook cleanup

- Decision: Fresh-world and paused restore replacement paths now clear any active grappling-hook traversal through the same `clearActiveGrapplingHookTraversal(...)` helper used by death and same-item cancel before session-owned entity registries reset.
- Reason: Grappling-hook flight and pull state are runtime-only and do not persist through `New World` or imported-session replacement, so replacement should reuse the existing detach seam instead of zeroing hook state through a second ad hoc path.
- Consequence: Future grappling-hook replacement or restore cleanup should extend that shared clear helper rather than resetting hook entity ids or fired-state fields directly inside world-session replacement code.

### 2026-03-28: Grappling-hook pull reuses shared collision sweeps and the same item-use path releases it

- Decision: Once a grappling hook reaches the `latched` phase, later fixed steps now pull the player toward that anchor through the shared player collision helper, auto-detach when release range is reached, and treat a follow-up grappling-hook use from mouse or touch as an explicit cancel.
- Reason: Traversal should obey the same terrain collision rules as ordinary movement while keeping release behavior on the same mixed-device hidden-panel input path that already owns hook use.
- Consequence: Future grappling-hook follow-ups such as tether visuals, world-replacement cleanup, or anchor-loss cleanup should extend that shared latched traversal plus same-item release path instead of adding a second movement seam or device-specific detach logic.

### 2026-03-28: Grappling hook flight and latch stay on one detached state plus entity path

- Decision: Grappling-hook use now spawns one fixed-step hook entity that mirrors the detached grappling-hook session state, advances through an explicit `in-flight` phase, clears on range failure, and freezes into a `latched` phase at the first solid-tile hit.
- Reason: Hook traversal needs deterministic flight and anchor resolution for later pull and cancel work, while the renderer still needs an interpolated entity-pass target that does not invent its own timing or latch logic.
- Consequence: Future grappling-hook pull, tether, cancel, and cleanup follow-ups should extend the shared fired-state phase machine and its mirrored entity path instead of introducing separate latch flags, render-only hook timers, or anchor recomputation from the original aim point.

### 2026-03-28: Grappling hook starts from detached fired state before traversal

- Decision: `Grappling Hook` use now flips a session-owned runtime state from `idle` to `fired` through the shared hidden-panel item-use path, blocks refires while that fired state is still active, and leaves the equipped hook item unconsumed.
- Reason: This separates mixed-device use gating and selected-slot feedback from later projectile, latch, and pull work while giving future grappling-hook slices one stable state seam to extend.
- Consequence: Future grappling-hook projectile, latch, pull, and cancel work should extend the shared detached grappling-hook state instead of introducing a second use-start flag or consuming the hook at click time.

### 2026-03-28: Bow ammo reservations follow active arrow projectiles

- Decision: Bow shot availability now derives from carried `Arrow` ammo minus the current in-flight arrow projectile count, while inventory ammo still stays unchanged until each projectile resolves and spends its reserved arrow.
- Reason: This caps unresolved shots to the carried stack without introducing a second persisted ammo counter or moving actual ammo spending away from projectile resolution.
- Consequence: Future bow reservation follow-ups should treat active arrow projectile entities as the source of truth for reserved ammo and keep real ammo removal on the projectile-resolution seam.

### 2026-03-28: Bomb flash fade reads fixed-step lifetime progress

- Decision: Bomb-detonation-flash placeholder light and palette now derive from each flash entity snapshot's `secondsRemaining` and `durationSeconds` ratio instead of a separate render-time fade timer.
- Reason: The flash should cool from ignition to ember in lockstep with the same fixed-step lifetime that decides when the entity despawns, so render cadence cannot drift the effect ahead of or behind gameplay state.
- Consequence: Future bomb-flash visual tuning should extend the shared placeholder lifetime-progress resolver rather than introducing a second render-owned fade timer or per-frame effect state.

### 2026-03-28: Bomb detonation flashes stay on the fixed-step entity path

- Decision: Fuse-complete bomb blasts now spawn short-lived `bomb-detonation-flash` entities through the shared entity registry and renderer entity pass instead of timing the effect only in render code.
- Reason: The flash should start on the same fixed step as the resolved blast, expire deterministically, and reuse the existing snapshot interpolation path without tying visibility to frame-rate-dependent timers.
- Consequence: Future blast-coupled visual effects should extend the queued bomb-blast event seam plus fixed-step entity snapshots rather than introducing render-only timers that can drift from gameplay resolution.

### 2026-03-28: Bomb self-kills reuse the ordered death-cause candidate path

- Decision: Lethal thrown-bomb self-hits now append a `bomb-blast` candidate through `replacePendingStandalonePlayerFixedStepNextState` so the shared death-cause telemetry resolves them in the same ordered sequence as lava, drowning, fall, and hostile-contact damage.
- Reason: Bomb blast resolution lands after entity stepping but before the pending standalone-player fixed-step result flushes, so routing self-hit attribution through the shared candidate sequence preserves deterministic source priority when environmental damage and bomb self-damage happen on the same tick.
- Consequence: Future direct player-damage sources that resolve outside `stepPlayerState` should contribute ordered death-cause candidates through the same pending-result helper instead of overwriting death telemetry out-of-band.

### 2026-03-27: Bow draw cooldown stays in detached session-owned runtime state

- Decision: Bow shots now start a shared fixed-step draw cooldown in `src/world/bowFiring.ts`, and the selected hotbar slot shows `DRAW` feedback while that cooldown drains instead of persisting the timer in inventory or save data.
- Reason: Bow pacing is short-lived combat state like wand or potion cooldowns, and keeping it detached preserves deterministic shot gating without coupling save/load to transient draw timers.
- Consequence: Future bow follow-ups should reuse that shared cooldown helper and keep short draw pacing outside save-owned player or inventory state unless a later task explicitly requires persistence.

### 2026-03-27: Bow arrows spend ammo on projectile resolution instead of fire start

- Decision: Hidden-panel bow use now only starts when the player carries at least one `Arrow`, while the spawned arrow projectile ends on first solid-terrain contact or lifetime expiry and removes ammo only when that projectile resolves.
- Reason: That keeps mixed-device bow input separate from later projectile outcomes while giving terrain and future hostile-hit slices one authoritative ammo-spend seam.
- Consequence: Future arrow terrain, hostile-hit, or recovery follow-ups should extend the shared projectile-resolution path instead of subtracting ammo directly inside the use dispatcher.

### 2026-03-27: Thrown bombs bounce through shared solid-tile sweeps before detonation

- Decision: The thrown-bomb fixed-step helper now resolves pre-fuse travel against shared solid-tile AABB sweeps, clamps the projectile to the hit surface, and reflects blocked velocity components there instead of letting bombs tunnel through terrain until the fuse expires.
- Reason: Reusing the same solid-tile collision semantics as the rest of runtime keeps bomb travel deterministic while fixing the current fall-through-world behavior.
- Consequence: Future bomb follow-ups such as fuse visuals, self-damage, or bounce tuning should extend the shared `src/world/bombThrowing.ts` step helper instead of bypassing terrain resolution in `src/main.ts` or renderer-only code.

### 2026-03-27: Bomb blast consequences resolve through queued post-step combat events

- Decision: Fuse-complete thrown bombs now emit detached blast events during entity fixed updates, and `src/main.ts` applies their terrain-break plus hostile-slime damage, knockback, and lethal-drop consequences only after entity stepping finishes for that tick through the same shared combat flush that also handles wand firebolt hits.
- Reason: Deferring blast consequences until after entity updates keeps bomb detonation deterministic relative to fixed-step movement while avoiding a second direct-combat path inside the thrown-bomb entity hook itself.
- Consequence: Future bomb follow-ups such as player self-damage or explosion visuals should extend that queued blast-event path instead of resolving blast side effects directly inside the thrown-bomb fixed update.

### 2026-03-27: Bomb terrain destruction reuses pickaxe target rules and gameplay refund paths

- Decision: Bomb blasts now resolve overlapping breakable foreground and placed-utility targets through the shared starter-pickaxe target evaluation helper, explicitly ignore wall-only results, and let `src/main.ts` route the resulting tile clears through the same gameplay edit plus pickup-refund paths already used by starter-pickaxe mining.
- Reason: Reusing those target and refund seams keeps bomb breakability aligned with existing mineable terrain and placed-utility rules while preserving one authoritative source for item refunds and support-collapse cleanup without letting explosions erase background walls.
- Consequence: Future explosive terrain effects should extend the same blast-target scan and shared gameplay refund paths, and must opt into wall damage explicitly instead of inheriting it from pickaxe wall targeting.

### 2026-03-27: Paused-dashboard results no longer live in a dedicated Recent Activity section

- Decision: The paused main-menu dashboard now surfaces only `Overview`, `World Save`, and `Shell`, and it no longer renders a separate `Recent Activity` section or jump-back link.
- Reason: The owning `World Save` and `Shell` pages already expose the current state players need, so keeping a second results-only surface made the paused dashboard noisier without adding unique controls.
- Consequence: Future paused-menu status or feedback work should extend the owning page summaries or controls instead of reintroducing a standalone recent-activity surface.

### 2026-03-27: In-world touch and debug overlays mount under the shell world subtree

- Decision: In-world touch-player controls, debug HUD or compact status UI, and preview or marker overlays now accept a mount host and are routed from `src/main.ts` under the app shell's world subtree instead of appending directly to `document.body`.
- Reason: Keeping the live world canvas plus its touch and debug overlays inside the same shell-owned subtree is a prerequisite for later fullscreen work that targets the shell rather than the entire document.
- Consequence: Future in-world overlay UI should expose a host-mount path and join that shell-owned subtree by default instead of hardcoding top-level document mounts.

### 2026-03-27: Paused-menu fullscreen targets the top-level document

- Decision: The paused-menu `Overview` fullscreen toggle now enters or exits browser fullscreen against the top-level document rather than targeting only the canvas or world host.
- Reason: The fullscreen follow-up that narrows the target to the app-shell subtree has not landed yet, so the top-level document remains the current behavior while that retargeting stays queued.
- Consequence: Future fullscreen work should switch from the document to the shared shell-owned subtree now that the in-world touch and debug overlays are mounted inside it, rather than introducing another document-level toggle path.

### 2026-03-27: Clear Saved World is no longer a player-facing World Save control

- Decision: The shared `World Save` page now leads with `New World`, followed by `Export World Save` and `Import World Save`, and it no longer shows a `Clear Saved World` control or `Last Clear` summary row.
- Reason: Browser-resume deletion was mainly an early debug aid, while player-facing session management already has a clearer restart path through `New World` plus explicit export/import actions.
- Consequence: Future player-facing world-session controls should assume `New World`, export, and import are the supported `World Save` actions; any browser-resume clear behavior should stay internal-only unless a later task deliberately reintroduces it.

### 2026-03-27: Shell-layout reset now belongs to the Shell page, not a separate Danger Zone group

- Decision: `Reset Shell Toggles` now lives on the dedicated `Shell` page, and the paused-dashboard `Danger Zone` group is removed.
- Reason: Resetting shell visibility is a shell-management action, and keeping it on the `Shell` page avoids spending Overview space on a single-action secondary group.
- Consequence: Future shell-layout reset or maintenance controls should extend the `Shell` page, while paused Overview should stay focused on `Overview`, `World Save`, `Shell`, and optional `Recent Activity` surfaces.

### 2026-03-27: World-session replacement now belongs to World Save before Danger Zone is retired

- Decision: `New World` now lives on the shared `World Save` page beside `Clear Saved World`, while `Danger Zone` temporarily keeps only `Reset Shell Toggles`.
- Reason: The menu cleanup sequence is moving shell-reset controls toward `Shell`, so world-session replacement needed to converge first with the page that already owns import, export, and browser-resume management.
- Consequence: Future paused-menu actions that replace, clear, import, or export the current world session should prefer `World Save`, while `Danger Zone` should be treated as a temporary shell-reset-only section until it is removed.

### 2026-03-27: First-start reuses the shared main-menu dashboard instead of a separate menu layout

- Decision: First-time players now enter the same dashboard-style main-menu shell used by paused sessions, with first-start versus paused-session variants controlling copy plus which section-owned actions are visible.
- Reason: Upcoming menu follow-ups move actions between `Overview`, `World Save`, and `Shell`, and keeping a separate first-start layout would force every menu change to be reimplemented and retested twice.
- Consequence: Future main-menu UI work should extend shared dashboard sections through variant-specific copy or visibility flags rather than reviving a standalone first-start menu or separate callback path.

### 2026-03-27: Bomb throws now pass through a fuse-owned projectile entity before explosion work

- Decision: Successful `Bomb` use now consumes one carried bomb immediately and spawns a fixed-step thrown-bomb entity that owns the pre-explosion gravity arc plus fuse countdown instead of treating bomb use as an instant effect.
- Reason: This separates mixed-device aimed throw start from later blast-resolution work while reusing the existing entity interpolation path for visible in-flight travel.
- Consequence: Future bomb follow-ups should extend that thrown-bomb entity path with fuse-complete explosion consequences rather than bypassing it with direct use-time damage or terrain edits.

### 2026-03-26: Current-versus-max mana telemetry stays on the existing player-combat readout

- Decision: The full debug HUD and hidden-HUD compact status strip now render live mana as `current/max` on the existing `player-combat` readout, falling back to the prior single-value style only when telemetry lacks `maxMana`.
- Reason: Mana-crystal upgrades change the player's spellcasting ceiling, and showing both numbers on the established combat resource surface keeps that progression visible without adding a separate mana-only telemetry family or toggle.
- Consequence: Future mana telemetry should extend the existing `player-combat` readout and preserve fallback behavior for partial snapshots instead of splitting mana into a new telemetry family by default.

### 2026-03-26: Mana crystals are permanent max-mana upgrades, not temporary restoratives

- Decision: `mana-crystal` now consumes through the shared hidden-panel item-use path to raise max mana by `20` up to `200` while also filling current mana by only that granted upgrade amount, and use is blocked once the player is dead or already at the cap.
- Reason: This slice needs deterministic permanent mana progression that mirrors the existing heart-crystal upgrade model without overloading the same item into an ad hoc temporary mana-refill rule after the permanent cap is reached.
- Consequence: Future mana-item work should preserve `mana-crystal` as the save-owned permanent-upgrade path and add any separate temporary mana-restoration behavior through different items or explicitly new rules rather than silently changing cap-reached crystal use.

### 2026-03-26: Small-tree growth cadence lives in save-owned session state

- Decision: The detached small-tree growth scheduler now persists its remaining tick countdown plus next window index inside the top-level paused-session world-save envelope and restores that cadence before runtime growth resumes.
- Reason: Planted saplings should keep their deterministic growth schedule across pause, browser-resume, export/import, and reload boundaries instead of silently restarting from the default interval every time the session is restored.
- Consequence: Future small-tree growth follow-ups should treat cadence as save-owned session data and preserve it through any new save normalization, migration, or restore helpers rather than rebuilding the scheduler from defaults after load.

### 2026-03-26: Procedural saplings derive from midpoint searches between adjacent grown trees

- Decision: Untouched terrain now seeds planted `small_tree_sapling` anchors only between adjacent procedural grown-tree anchors, choosing the nearest valid exposed-grass column to that pair's midpoint whose future grown footprint stays clear and outside the protected origin corridor.
- Reason: Procedural saplings should read as natural regrowth between mature trees while still reusing the shared planted-anchor and growth-site contract instead of inventing a separate worldgen-only small-tree layout.
- Consequence: Future procedural small-tree density or spacing follow-ups should reuse or deliberately replace that adjacent-pair midpoint search, rather than scattering planted saplings independently from the mature-tree worldgen grid.

### 2026-03-26: Surface-flower authored art claims an interior atlas slot

- Decision: `surface_flower` now renders through dedicated authored atlas region `38` at `144x32` instead of reusing the small-tree sapling placeholder art.
- Reason: Surface decoration needed its own committed bloom sprite, and the current atlas still had uncovered interior slots that avoided widening the image or spending the exterior padding strip.
- Consequence: Future surface-decoration and sapling art refreshes should prefer the remaining uncovered interior atlas slots or existing owned regions before widening the atlas or borrowing unrelated vegetation sprites.

### 2026-03-26: Tall-grass authored art claims an interior atlas slot

- Decision: `tall_grass` now renders through dedicated authored atlas region `37` at `128x32` instead of reusing the small-tree sapling placeholder art.
- Reason: Surface decoration needed its own committed placeholder sprite, and the current atlas still had uncovered interior slots that avoided widening the image or spending the exterior padding strip.
- Consequence: Future surface-decoration art should claim the remaining uncovered interior atlas slots before widening the atlas or reusing unrelated vegetation sprites.

### 2026-03-26: Procedural small-tree worldgen reuses grown-tree anchor footprints

- Decision: Untouched terrain now seeds full grown small-tree footprints only from selected exposed `grass_surface` anchors whose entire canopy stays outside the protected origin corridor, reusing the existing anchored trunk-plus-canopy footprint contract instead of stamping a separate tree layout.
- Reason: Fresh surface chunks should already contain harvestable trees, and worldgen should agree with the same footprint, targeting, sky-check, and streaming rules that already understand grown small trees elsewhere in the runtime.
- Consequence: Future procedural tree variants should extend the shared small-tree anchor and footprint helpers while preserving spawn-corridor clearance, rather than writing ad hoc tree tiles directly into surface columns.

### 2026-03-26: Procedural tall-grass worldgen fills non-bloom surface anchors

- Decision: Untouched terrain now seeds `tall_grass` into the direct-cover tile above exposed procedural `grass_surface` anchors whenever the shared decoration hash does not reserve that anchor for `surface_flower`.
- Reason: Fresh chunks should match the resident surface-decoration contract instead of starting mostly bare and only filling in after later grass-growth passes revisit those anchors.
- Consequence: Future procedural surface-decoration work should treat exposed untouched grass anchors as fully owned by the shared flower-or-tall-grass selector unless a later feature explicitly reserves or clears specific anchors.

### 2026-03-26: Procedural surface-flower worldgen reuses the decoration anchor hash

- Decision: Untouched terrain now seeds `surface_flower` only into the direct-cover tile above exposed procedural `grass_surface` anchors selected by the same hashed anchor rule that later resident decoration growth already uses.
- Reason: Initial worldgen and later regrowth should agree on which anchors belong to blooms, so clearing and regrowing surface decoration does not silently reshuffle flower locations.
- Consequence: Future seeded surface-decoration worldgen should reuse that shared anchor-selection helper or explicitly document why its initial layout diverges from later resident regrowth.

### 2026-03-26: Surface flowers share the resident support-bound decoration contract

- Decision: The resident grass-growth scheduler now deterministically chooses either `tall_grass` or `surface_flower` for eligible empty direct-cover cells above sunlit `grass_surface`, and world support-loss plus open-sky checks treat both as support-bound sky-permeable surface decoration.
- Reason: Surface flowers need to coexist with tall grass without duplicate same-cell writes, floating bloom remnants, or passive surface-habitat regressions.
- Consequence: Future surface-decoration variants should join the same scheduler-owned decoration selection plus support-loss and sky-permeability rules instead of introducing ad hoc cover writes or one-off habitat exceptions.

### 2026-03-26: Tall grass is support-bound decorative cover grown by the grass scheduler

- Decision: The resident grass-growth scheduler may sprout non-solid `tall_grass` into the direct-cover cell above eligible sunlit `grass_surface`, world support-loss edits clear that decoration when the anchor stops being grass, and open-sky habitat checks ignore it as decorative vegetation.
- Reason: Tall grass belongs to the same deterministic resident surface-growth path as grass spread, but it should not leave floating cover behind or accidentally block surface-spawn sky checks just because it is a non-solid tile.
- Consequence: Future surface-decoration slices should extend the resident grass-growth path and declare whether their cover is support-bound and sky-permeable instead of inheriting generic non-solid tile behavior by accident.

### 2026-03-25: Grass spread now runs through resident fixed-step windows instead of edit hooks

- Decision: `grass_surface` no longer regrows directly inside `TileWorld` edit hooks; instead runtime now advances one deterministic resident tile-hash window per interval and writes qualifying grass spreads back through the renderer/world seam.
- Reason: Immediate regrowth was placeholder behavior that rewrote dirt during unrelated cover edits instead of letting surface grass advance as a fixed-step simulation slice.
- Consequence: Future grass follow-ups should extend the detached fixed-step scheduler rather than reintroducing edit-triggered regrowth hooks or nonresident override writes.

### 2026-03-25: Grass spread requires full sunlight, dry cover, and height-1 adjacency

- Decision: A dirt tile now spreads to `grass_surface` only when its resident light level is full sunlight, the direct tile above is non-solid and not `water` or `lava`, and a neighboring `grass_surface` tile exists one column away within one tile of vertical difference.
- Reason: Surface grass should creep over exposed lit slopes instead of instantly repainting arbitrary same-row dirt or flooded cover cells.
- Consequence: Future grass, flower, or biome-surface growth work should treat full resident sunlight plus dry direct cover and height-1 adjacency as the shared baseline contract for surface spread.

### 2026-03-25: Passive-bunny sky checks ignore non-solid small-tree foliage

- Decision: Passive-bunny ambient spawn sky exposure now ignores non-solid `small_tree_sapling`, `small_tree_trunk`, and `small_tree_leaf` tiles while still treating other overhead cover as blocking.
- Reason: Decorative small-tree canopy art should not disqualify otherwise open surface habitat, but the open-sky rule still needs to reject actual roofs and unrelated overhead clutter.
- Consequence: Future foliage or surface-decoration tiles should decide explicitly whether they count as sky-permeable decorative cover instead of inheriting the generic non-empty tile check by accident.

### 2026-03-25: Passive-bunny ambient spawns require an open-sky landing column

- Decision: Passive-bunny ambient spawn candidates now reject landing columns whose space from the support tile back up to the local surface is blocked, instead of treating covered ledges or cave-mouth floors as valid natural-spawn habitat.
- Reason: Keeping ambient bunny spawns surface-aligned still left roofed-over surface-adjacent floors eligible, which made natural critter spawns appear under cover rather than in genuinely open surface space.
- Consequence: Future passive-critter habitat checks should treat overhead sky exposure as a spawn-candidate filter in the shared search path rather than a post-spawn cleanup rule or a player-depth heuristic.

### 2026-03-25: Passive-bunny ambient spawns stay surface-aligned

- Decision: Passive-bunny ambient spawn windows now omit the player's current Y anchor so the shared spawn search re-centers each window on its local surface height instead of the player's underground depth.
- Reason: Passive bunnies are a surface critter, and underground players were unintentionally causing natural bunny spawns to resolve onto cave or tunnel floors nearer to the player than the surface.
- Consequence: Future passive-critter spawn follow-ups should preserve habitat-specific vertical anchoring instead of reusing the player's present depth for ambient spawn searches.

### 2026-03-25: Buried grass only reverts under direct solid cover

- Decision: A `grass_surface` tile now reverts immediately to dirt only when the direct foreground tile above it becomes solid, while non-solid cover stays grass-safe and any anchored small-tree footprint is cleared before that solid cover would orphan it.
- Reason: Buried grass should not survive under solid terrain, but saplings, foliage, and other non-solid content should not accidentally strip grass or leave floating tree remnants behind.
- Consequence: Future grass-spread, regrowth, or surface-decoration follow-ups should preserve direct solid cover as the burial trigger and keep tree-footprint cleanup aligned with that same support-column rule.

### 2026-03-24: Procedural dirt and stone bands use layered wall baselines

- Decision: Procedural world generation now seeds `dirt_wall` behind the dirt band plus the dirt-depth portion of cave-mouth openings, seeds `stone_wall` behind deeper underground stone plus copper-ore bands, carved cave air, and the deeper portion of cave-mouth openings, while surface sky and the untouched grass surface remain wall-empty and explicit wall edits may still override that generated background with `0`.
- Reason: Mining should reveal the same stable background baseline as the surrounding terrain layer, and cave-mouth entrances read better when their background transitions from dirt to stone with depth instead of using one wall material all the way down or exposing sky after mining.
- Consequence: Future worldgen, mining, or snapshot-migration follow-ups should treat background walls as a depth-layered procedural baseline that transitions from dirt to stone with underground depth, rather than spawning walls only when terrain breaks or assuming all underground background uses `stone_wall`.

### 2026-03-24: Hostile-slime ambient spawn skips crowded candidate AABBs before advancing windows

- Decision: Hostile-slime ambient spawn now filters each deterministic spawn candidate through live hostile-slime AABB overlap checks before accepting that candidate, so crowded spots fall back through the existing within-window and later-window search order instead of stacking slimes.
- Reason: Ambient hostile spawns still allowed overlapping slimes even after passive-bunny ambient spawn learned to reject crowded candidates through the shared spawn search.
- Consequence: Future hostile or combat-entity ambient-spawn follow-ups should treat live entity overlap as another spawn-candidate rejection rule and preserve the shared search-order fallback rather than spawning first and trying to separate entities afterward.

### 2026-03-24: Passive-bunny ambient spawn skips crowded candidate AABBs before advancing windows

- Decision: Passive-bunny ambient spawn now filters each deterministic spawn candidate through live passive-bunny AABB overlap checks before accepting that candidate, so crowded spots fall back through the existing within-window and later-window search order instead of stacking bunnies.
- Reason: Ambient respawns could still place a new bunny directly on top of an existing one even after manual bunny release learned to reject crowded landing AABBs.
- Consequence: Future critter ambient-spawn follow-ups should treat live entity overlap as another spawn-candidate rejection rule and preserve the shared search-order fallback rather than spawning first and trying to separate entities afterward.

### 2026-03-24: Bunny release skips crowded landing AABBs before consuming the stack

- Decision: Selected `Bunny` release now filters nearby-ground candidates through live passive-bunny AABB overlap checks and preserves the same deterministic nearby-ground fallback order when the requested landing tile is crowded.
- Reason: Releasing into already occupied critter space stacked passive bunnies on top of each other even when the shared nearby-ground search had another valid tile in range.
- Consequence: Future critter or pet release follow-ups should treat live entity overlap as another nearby-ground candidate-rejection rule before spawn or inventory consumption, instead of spawning first and trying to resolve crowding afterward.

### 2026-03-23: Stone-wall authored art claims an interior atlas slot before exterior padding

- Decision: `stone_wall` now uses dedicated authored region `36` at `112x32`, reusing an interior blank atlas slot instead of widening the atlas or consuming the transparent exterior padding strip.
- Reason: The cave-wall art foundation needed a dedicated wall sprite, and claiming an interior slot keeps the current `192x64` footprint plus the right-side spill-detection padding intact.
- Consequence: Future authored-wall additions should prefer remaining interior blank slots before widening the atlas or spending the exterior padding strip, and should update the same atlas-layout regressions when they intentionally change that balance.

### 2026-03-23: Small-tree leaf animation reuses cropped direct-uvRect frames inside one authored region

- Decision: `small_tree_leaf` now keeps its existing dedicated authored atlas region `25`, but renders and animates through two direct `uvRect` crops inside that same region instead of claiming a second atlas slot for foliage motion.
- Reason: The current atlas no longer has spare authored regions, and a subtle canopy sway fits inside the existing leaf art bounds without widening the atlas or sacrificing the transparent right-side padding strip.
- Consequence: Future small-tree foliage follow-ups should either reuse that same cropped-frame pattern inside the leaf region or intentionally grow the atlas and its regressions if they need truly separate frame art.

### 2026-03-23: Platform-supported bunny release stays liquid-safe

- Decision: Selected `Bunny` release searches continue reusing the shared liquid-overlap rejection from `findPlayerSpawnPoint(...)` even when one-way platform support is enabled.
- Reason: Platform-supported critter release should stay readable and safe, so flooded platform floors need to block or deflect release the same way ordinary solid-ground liquid overlap already does.
- Consequence: Future critter or pet release follow-ups should preserve dry-ground resolution for platform-supported landing candidates instead of special-casing platforms around water or lava overlap.

### 2026-03-23: Hostile slimes and passive bunnies reuse downward-only one-way platform support

- Decision: Hostile slimes and passive bunnies now treat one-way platforms as valid landing and support surfaces only during downward sweeps and support probes, while horizontal and upward collision checks continue ignoring platform tiles.
- Reason: Both chase hops and ambient bunny wandering needed to work across placed platform runs without turning platform edges into false side walls or rewriting those grounded hop models into pathfinding.
- Consequence: Future hostile or ambient creature platform traversal should preserve that downward-only support contract unless a later pass intentionally adds separate platform-specific steering or drop-through behavior.

### 2026-03-23: One-way platforms only catch downward player sweeps and reuse rope-drop intent

- Decision: Placed `platform` tiles now act as one-way floors only when the standalone player is moving downward from above them, and the existing armed rope-drop input path is reused to ignore those platform catches for an intentional drop-through step.
- Reason: Platform traversal needs readable Terraria-like top-only support without turning platform tiles into side walls or introducing a second mixed-device down-input rule that would diverge from rope traversal.
- Consequence: Future platform-follow-up work should preserve downward-only catches plus the shared rope-drop gesture unless the whole traversal input model is intentionally redesigned, and enemy or NPC platform support should match that same top-only collision contract instead of treating platforms as ordinary solid blocks.

### 2026-03-23: Authored atlas may consume formerly unused regions once metadata claims them

- Decision: The committed atlas no longer guarantees a blank spare authored region once shipped metadata needs that space; region `21` now belongs to `platform`, while transparent exterior padding to the right of the documented regions remains the persistent spill-detection target.
- Reason: Platform placement needed dedicated committed art without widening the atlas again, and explicit region accounting plus exterior padding already cover the asset-regression guarantees that mattered more than keeping one specific spare slot blank forever.
- Consequence: Future atlas edits may spend any intentionally unused region if they remove it from the unused-region table and claim it in metadata during the same pass, but they should preserve equivalent exterior padding or update the related regression expectations together.

### 2026-03-22: Standalone-player mana lives in save-owned player state

- Decision: `PlayerState` now carries `maxMana`, `mana`, `manaRegenDelaySecondsRemaining`, and `manaRegenTickSecondsRemaining`, while `src/world/playerMana.ts` owns spend plus regen helpers and starter-wand casts reset that regen delay instead of tracking a separate session-only magic resource.
- Reason: Mana upgrades and wand recovery need to round-trip through save/load with the rest of the standalone player, and the wand's delay-then-refill cadence is easier to keep deterministic when it extends the existing player fixed-step state.
- Consequence: Future mana-spending items or max-mana upgrades should mutate the shared save-owned player state through the common mana helpers, and later UI or networking work can treat mana as part of the authoritative player snapshot rather than a parallel runtime-only subsystem.

### 2026-03-22: Projectile hits apply after the entity fixed-update pass

- Decision: Starter-wand firebolt entities now queue terrain/slime hit events during their own `EntityRegistry` fixed updates, and `src/main.ts` flushes hostile-slime damage, knockback, defeat, and drop consequences only after `entityRegistry.fixedUpdateAll(...)` finishes for the tick.
- Reason: Firebolts can collide after hostile slimes have already taken their fixed-step update for that frame, so deferring those side effects avoids mid-pass sibling-entity mutation and order-coupled double stepping.
- Consequence: Future projectile slices should prefer queued post-registry hit application when they need to mutate or despawn other entities after an entity pass, instead of editing sibling entity state directly inside one projectile's `fixedUpdate`.

### 2026-03-22: Resync last-applied baseline metadata preserves world replacement counts

- Decision: `src/network/replicationResyncDiagnostics.ts` now stores `replacedTiles` and `replacedWalls` inside `lastAppliedBaseline` beside `tick` and `entityCount`, and detached diagnostics snapshots plus per-client log lines preserve that richer latest-baseline world metadata.
- Reason: Running resync totals show cumulative world replacement work, but transport diagnostics still need the specific tile and wall counts from the latest accepted baseline boundary.
- Consequence: Future resync diagnostics, snapshot, or log formatting work should treat `lastAppliedBaseline` as the source of latest baseline world counts instead of inferring them from cumulative totals or dropping them during cloning.

### 2026-03-22: Replication baseline world replacements report standardized tile and wall counts

- Decision: `applyAuthoritativeReplicatedStateBaseline()` world replacement callbacks now return `{ replacedTiles, replacedWalls }`, and downstream baseline summaries plus resync diagnostics preserve those world counts separately from entity replacement counts.
- Reason: Transport-facing resync summaries and diagnostics need a stable world-replacement contract instead of ad hoc callback results or entity-only telemetry.
- Consequence: Future baseline replacement callers should return standardized tile and wall counts, and later resync logging or transport work can assume those world totals exist without inspecting caller-specific result shapes.

### 2026-03-22: Authoritative chunk replay allows one tile diff and one wall diff per chunk tick

- Decision: `AuthoritativeReplicatedNetworkStateReplayer` now keeps one last-applied tick per chunk plus a same-tick layer bitmask, so one `chunk-tile-diff` and one `chunk-wall-diff` may each apply once for the same chunk and tick before later duplicate layer messages at that tick are rejected.
- Reason: Authoritative staging already emits separate tile and wall payloads for one tick, and client replay should preserve both chunk layers without letting stale or repeated layer packets roll either layer backward.
- Consequence: Future chunk replay or transport work should treat tile and wall diffs as separate once-per-tick layer messages under one shared per-chunk tick guard instead of collapsing them into one replay slot or maintaining unrelated chunk clocks per layer.

### 2026-03-22: Chunk-wall-diff messages reuse chunk tile cell indexing

- Decision: The new `chunk-wall-diff` protocol payload reuses the same row-major per-cell `tileIndex` ordering and `tileOrder` metadata already used by `chunk-tile-diff`, while swapping only the payload data from `{ tileId, liquidLevel }` to `{ wallId }`.
- Reason: Wall replication needs to target the same chunk cell grid as foreground tile diffs, and reusing that indexing contract keeps batching, validation, and future transport ordering aligned across both world layers.
- Consequence: Future wall staging, filtering, or replay work should preserve the shared chunk cell indexing contract instead of inventing a separate wall-coordinate ordering or a second intra-chunk ordering flag.

### 2026-03-22: Tile and wall edit notifications carry explicit write origins

- Decision: `TileWorld` and `Renderer` edit notifications now include an `editOrigin` of `gameplay`, `debug-break`, or `debug-history`, and support-collapse or anchor-loss follow-up clears keep the initiating origin instead of reclassifying themselves.
- Reason: Listener-driven systems like pickup refunds and future replication need to distinguish survival-facing writes from debug tooling without relying on ambient suppression flags around the caller.
- Consequence: Future listener consumers should branch on `event.editOrigin` instead of inferring source from call context, and cascaded world edits should propagate the initiating origin unless a later pass intentionally changes that classification.

### 2026-03-22: Debug edit removals do not spawn gameplay pickup refunds

- Decision: In-world debug-break strokes plus shared debug undo or redo replay now suppress tile and wall removal refunds, including support-collapse follow-up clears, even though those writes still flow through the ordinary renderer edit-listener seams.
- Reason: Debug editing is an authoring tool, so spawning gameplay pickups from destructive debug actions duplicates placed items and mutates survival-facing inventory state in surprising ways.
- Consequence: Future debug-edit removal tools should preserve that refund-suppression rule or surface an explicit edit origin before any pickup-refund listener treats them like mining or normal gameplay cleanup.

### 2026-03-22: Debug history keys same-cell wall edits separately from foreground tile edits

- Decision: Shared `DebugTileEditHistory` strokes now record a `layer` (`tile` or `wall`) with each edit and key same-cell changes by both coordinates and layer instead of collapsing everything onto one tile-coordinate entry.
- Reason: Wall-only debug-break undo or redo needs to restore background walls through the shared history path, and same-stroke foreground-then-wall clears at one cell would lose one layer unless the history model distinguished them explicitly.
- Consequence: Future debug-history follow-ups should preserve layer-aware stroke entries whenever a tool can touch both foreground tiles and background walls, rather than deduplicating by coordinates alone.

### 2026-03-22: Debug break only targets background walls after the foreground tile is empty

- Decision: In-world `Debug Edit` break actions now clear the foreground tile first and only fall back to clearing a background wall when that same cell's foreground tile is already empty, while routing wall-only clears through `Renderer.setWall(...)`.
- Reason: Wall-only debug break needed to work on placed dirt and wood walls without letting background walls shadow ordinary foreground tile breaks or duplicating refund logic outside the shared wall-edit listener seam.
- Consequence: Future debug-break preview, history, or tooling follow-ups should preserve that foreground-first targeting rule and keep wall refunds flowing through wall-edit listeners unless a later pass intentionally introduces dual-layer break behavior.

### 2026-03-22: Debug break previews reuse the same foreground-first target evaluator as applied writes

- Decision: Hovered debug-break cursor tones, armed break one-shot preview markers, and resolved affected-count summaries now all resolve through shared foreground-first target evaluation helpers instead of UI-only tile-versus-wall checks.
- Reason: Wall-only preview feedback needed to stay aligned with the actual break write path so occupied foreground cells do not preview wall clears, while empty foreground cells with background walls still advertise a valid break target.
- Consequence: Future debug-break hover, preview, flood-fill, or status follow-ups should consume the shared target-evaluation helpers rather than rebuilding wall-preview logic in `src/main.ts` or UI formatters.

### 2026-03-22: Wall-only inspect render telemetry resolves through shared wall-metadata helpers

- Decision: Wall-only inspect readouts now describe background-wall render source, UV rect, and atlas pixel bounds through shared helpers in `src/world/wallMetadata.ts` instead of formatting wall render metadata directly inside `src/main.ts` or the UI layers.
- Reason: Background-wall inspect needs wall ids, names, and authored atlas details to stay aligned with the renderer's metadata path without duplicating atlas-index-versus-`uvRect` branching in multiple callers.
- Consequence: Future wall inspect or wall-atlas debugging follow-ups should reuse the shared wall-metadata description helpers rather than rebuilding wall source formatting in runtime assembly or overlay formatters.

### 2026-03-22: Background-wall render metadata shares the runtime atlas-validation path

- Decision: Renderer startup now validates `src/world/wallMetadata.ts` render sources through the same atlas bounds and whole-pixel warning seam used for tile, terrain, and liquid metadata.
- Reason: Background walls now own dedicated authored regions, so wall-art drift should surface through the existing runtime atlas warning path instead of relying on tile-only validation or separate ad hoc checks.
- Consequence: Future wall render metadata should keep flowing through the shared atlas-validation helper, and later wall-art passes can treat renderer startup warnings as covering both tile and wall sources.

### 2026-03-22: Wood-wall background art uses its own authored region

- Decision: `wood_wall` now renders through dedicated authored atlas region `35` at `160x32` instead of reusing the solid `wood_block` region `33`.
- Reason: Background wood walls need to read distinctly from placed wood blocks while keeping the committed atlas at `192x64`, preserving the spare slot at region `21`, and leaving the exterior padding strip untouched.
- Consequence: Future background-wall art should continue claiming dedicated authored regions instead of borrowing solid foreground block art, and later atlas edits should preserve the current spare-slot and exterior-padding regressions unless they intentionally update them in the same pass.

### 2026-03-21: Starter pickaxe wall removal only targets empty foreground cells

- Decision: Starter pickaxe mining still prioritizes eligible foreground tiles, but when a foreground cell is empty it may target placed starter background walls and routes those refunds through the shared wall-edit listener seam.
- Reason: Early wall cleanup needed to reuse the existing pickaxe timing and refund flow without letting background walls shadow ordinary terrain mining or introducing a separate direct-spawn refund path.
- Consequence: Future wall-removal follow-ups should preserve foreground-tile precedence unless they intentionally allow multi-layer edits, and later wall refunds should keep subscribing to wall-edit notifications instead of spawning pickups ad hoc from each caller.

### 2026-03-21: Background-wall edits notify separately from tile edits

- Decision: `TileWorld` and `Renderer` now expose dedicated wall-edit listener seams with detached previous and next wall ids, while foreground tile and liquid writes stay on the existing tile-edit notification path.
- Reason: Background-wall follow-ups need authoritative wall-only invalidation and refund hooks without polluting tile-diff capture or forcing tile listeners to treat unchanged foreground state as a tile edit.
- Consequence: Future wall removal, refunds, or replication work should subscribe to the shared wall-edit listener seam instead of overloading tile-edit notifications, while tile-focused systems can keep assuming `onTileEdited` means foreground or liquid state changed.

### 2026-03-21: Starter background-wall placement only targets enclosed empty cells

- Decision: The starter `dirt-wall` and `wood-wall` hotbar placement path only writes to the separate wall layer on empty foreground cells whose four cardinal directions each find solid terrain within a short local scan, and it never treats player overlap as a blocker because walls stay non-solid.
- Reason: Starter wall placement needs a deterministic mixed-device preview rule that keeps early wall painting inside room-like pockets without introducing full housing validation or exposed-sky wall spam.
- Consequence: Future background-wall items and removal tools should reuse or deliberately replace that enclosed-empty-cell evaluator instead of falling back to ordinary solid-face placement rules.

### 2026-03-21: Background walls persist as a separate chunk layer

- Decision: `TileWorld` and chunk snapshots now store background-wall ids in a dedicated `wallIds` layer plus sparse wall overrides instead of overloading foreground tile ids, and legacy chunk snapshots that predate that layer decode missing wall payloads as empty walls.
- Reason: Upcoming wall rendering and placement need walls behind solid terrain without disturbing collision, liquid, or foreground-tile semantics, while existing save files still need to load cleanly.
- Consequence: Future wall features should read and write wall state through the shared wall-layer helpers and snapshot fields, and should treat missing wall payloads from older saves as an intentional empty-wall baseline rather than a malformed save.

### 2026-03-21: Background-wall rendering uses a separate wall-metadata registry and shared chunk ordering

- Decision: Background walls now resolve render UVs through `src/world/wallMetadata.ts`, and chunk meshing emits wall quads before any foreground quad in the same cell inside the existing shared chunk mesh.
- Reason: Wall ids already live in a separate layer, so they need independent authoring metadata without pretending they are foreground tile ids, while same-cell wall-before-tile ordering keeps walls visually behind foreground content without adding a second wall draw pass.
- Consequence: Future wall types should extend the wall metadata registry and rely on the shared wall-before-tile mesher order, while renderer invalidation or placement follow-ups should treat wall quads as part of the ordinary chunk mesh cache instead of inventing a separate wall buffer path.

### 2026-03-21: Dirt-wall background art uses its own authored region

- Decision: `dirt_wall` now renders through dedicated authored atlas region `34` at `160x16` instead of reusing the `dirt_block` region `30`.
- Reason: Background walls need to read distinctly from solid terrain while staying inside the current `192x64` committed atlas footprint and preserving the exterior padding regressions.
- Consequence: Future background-wall art should claim its own authored atlas regions and matching regressions instead of borrowing the foreground material sprite unless a later pass intentionally accepts identical visuals.

### 2026-03-21: Wood-block terrain art uses the first free right-column authored region

- Decision: `wood_block` now keeps its existing `wood` terrain connectivity metadata but renders through dedicated static authored region `33`, leaving the committed atlas at `192x64`, preserving spare region `21`, and moving the transparent exterior padding strip start to `x=176`.
- Reason: Placed wood blocks needed their own committed placeholder art without giving up the reserved blank slot or regressing the existing wood-only seam rules that already keep them visually separate from ground terrain.
- Consequence: Future wood-derived terrain can keep reusing the `wood` connectivity group while opting into dedicated authored art region overrides, and later atlas edits should preserve equivalent spare-slot and exterior-padding regression space unless they intentionally update those checks in the same pass.

### 2026-03-21: Stone and copper terrain art widens the atlas and renormalizes direct UV metadata

- Decision: The authored atlas now widens to `192x64`, gives `stone` and `copper_ore` dedicated authored regions `31` and `32`, keeps region `21` blank as the documented spare slot, and renormalizes every shipped direct `render.uvRect` source so the wider atlas preserves the same pixel rectangles for debug and liquid content.
- Reason: Stone and copper ore needed distinct committed terrain art, but consuming the spare slot or letting the wider atlas shift existing direct-UV content would weaken the committed-asset regressions that currently protect those authored sub-rects.
- Consequence: Future atlas-width changes should update direct-`render.uvRect` metadata and its whole-pixel regression coverage in the same pass as the layout change, and terrain tiles with dedicated art should continue to preserve their existing connectivity-group semantics instead of forking terrain adjacency rules.

### 2026-03-21: Grass and dirt terrain art uses the first free right-column authored regions

- Decision: `grass_surface` and `dirt_block` now keep their `ground` terrain connectivity metadata but render through dedicated static authored regions `29` and `30`, keeping the atlas at `160x64`, preserving spare region `21`, and moving the exterior padding strip start to `x=144`.
- Reason: Surface grass and placed dirt needed an immediate visual split from the shared placeholder terrain block, and the remaining `16x32` right-side authored space could absorb that pair without widening the atlas again or remapping the committed direct-`uvRect` liquid and debug content.
- Consequence: Future terrain-art passes can still spend the last free right-column pair on another dedicated full-tile placeholder before any wider atlas migration has to update the direct-`render.uvRect` content and its regression coverage.

### 2026-03-21: Workbench and furnace atlas art grows the canvas before consuming spare-slot regressions

- Decision: The authored atlas now widens again to `160x64`, keeps region `21` blank as the documented spare slot, moves the exterior padding strip start to `x=128`, and gives `workbench` plus `furnace` dedicated full-width authored regions `27` and `28`.
- Reason: The starter stations need distinct full-tile placeholder sprites, but consuming the spare slot or overlapping the direct-`uvRect` liquid and debug regions would weaken the existing committed-asset regression coverage.
- Consequence: Future dedicated utility-tile art should prefer adding new authored regions beyond the current `x=112` column while preserving at least one documented blank slot plus some exterior padding, unless the same pass intentionally relocates those regression targets.

### 2026-03-21: Starter wood-block crafting stays stationless and converts one wood into one wood block

- Decision: The first `wood-block` recipe now crafts `1` stackable `Wood Block` from `1 Wood` without requiring a nearby placed station.
- Reason: Early woodcutting should flow directly into shelter building through the existing shared crafting path instead of forcing a workbench gate before the player can turn chopped wood into placeable blocks.
- Consequence: Future early-building follow-ups can assume raw `Wood` converts directly into `wood-block` stacks anywhere unless a later progression pass intentionally rebalances that baseline.

### 2026-03-21: Wood-block terrain keeps its own autotile connectivity group

- Decision: The first placeable `wood-block` item now writes a dedicated solid `wood_block` terrain tile that reuses the terrain-autotile placeholder variant table but resolves through its own `wood` connectivity group instead of sharing the existing `ground` group used by dirt, grass, stone, and copper ore.
- Reason: Early building blocks should be able to use the shared solid-block placement seam without making placed wood visually merge into ground-material seams, and a dedicated group preserves that distinction without introducing a separate block-placement implementation.
- Consequence: Future wood-derived terrain or building tiles should opt into that `wood` connectivity group when they are meant to seam with placed wood blocks, and later solid-block follow-ups should not assume every autotiled solid tile belongs in the shared `ground` group.

### 2026-03-21: Starter wood-wall crafting stays stationless and converts one wood into four wood walls

- Decision: The first `wood-wall` recipe now crafts `4` stackable `Wood Wall` from `1 Wood` without requiring a nearby placed station.
- Reason: Early shelter interiors should branch directly from the same chopped-wood loop as `wood-block` crafting, and a cheaper wall output keeps background-wall building distinct from solid-block costs without adding another early station gate.
- Consequence: Future background-wall progression can assume raw `Wood` converts into `wood-wall` stacks anywhere at a cheaper-than-block rate unless a later balance pass intentionally changes that baseline.

### 2026-03-21: Starter torch crafting stays stationless and converts one gel plus one wood into three torches

- Decision: The first shared torch recipe now crafts `3` `torch` items from `1 gel + 1 wood` without requiring a nearby placed station.
- Reason: Early light replenishment should unlock directly from hostile-slime gel drops plus starter-axe woodcutting, while the existing workbench requirement remains reserved for later utility and recovery recipes that benefit from an explicit station gate.
- Consequence: Future early-utility crafting follow-ups can assume torches are available before a placed workbench exists, and later recipe-balance passes should treat the `3 torch` output plus stationless access as the baseline unless they intentionally redesign early progression.

### 2026-03-21: Starter axe chops resolve through the shared tree anchor and clear the full current stage

- Decision: Starter-axe targeting now resolves sampled `small_tree_sapling`, `small_tree_trunk`, and `small_tree_leaf` hits through the shared small-tree anchor helper, and successful chops clear the full planted or grown footprint at that resolved anchor while dropping `Wood` from the current stage (`1` from planted saplings and `5` from grown trees).
- Reason: Canopy hits, cleanup writes, and early wood loot all need one canonical tree-break contract instead of letting each caller guess which sampled tile or partial footprint should count as the chopped tree.
- Consequence: Future tree previews, loot, or larger-tree follow-ups should route through the shared anchor-and-stage chop path rather than introducing per-tile chop logic or stage-specific clear rules in other systems.

### 2026-03-21: Grown small-tree chops always return one acorn

- Decision: Successful starter-axe chops on grown small trees now drop `1 Acorn` alongside their existing `5 Wood`, while planted saplings still return only `1 Wood`.
- Reason: Early tree harvesting should feed the existing acorn planting loop deterministically instead of relying on previously carried seeds or another future replenishment path.
- Consequence: Future tree-loot, planting, or crafting follow-ups can assume every grown small-tree harvest returns one replantable acorn unless a later progression rebalance intentionally changes that baseline.

### 2026-03-21: Small-tree support-loss cleanup runs from world anchor edits

- Decision: When a `grass_surface` support tile changes away from grass, `TileWorld` now clears any planted or grown small-tree footprint above that anchor through the shared footprint writer and emits ordinary tile-edit notifications for those cleanup writes.
- Reason: Anchor-loss cleanup needs to stay authoritative at the world-commit seam so runtime tracked-sapling state, renderer listeners, and saved snapshots all observe one removal path instead of rediscovering orphaned trees separately.
- Consequence: Future small-tree break, cleanup, or loot work should route anchored tree removal through the shared world-owned footprint clear path or equivalent emitted tile-edit writes so listener-driven systems stay synchronized automatically.

### 2026-03-21: Small-tree growth tracks planted anchors and only checks resident footprints

- Decision: The small-tree growth scheduler now rebuilds planted sapling anchors from save snapshots, updates that tracked-anchor set from live tile edits, and rechecks one anchor-hash window per interval only across tracked anchors whose full planted-plus-grown footprint chunks are currently resident; planted saplings still only stay growable while their support tile remains `grass_surface`.
- Reason: Deterministic tree growth still needs predictable cadence without per-sapling save metadata, but the earlier resident-area scan caused periodic fixed-step hitches even in worlds with no saplings.
- Consequence: Future tree-growth or cleanup follow-ups should keep the tracked-anchor restore and tile-edit seams synchronized with any new sapling lifecycle rules, and should preserve the resident-footprint filter unless they replace it with another non-scanning scheduler.

### 2026-03-21: Acorn planting targets the clicked grass anchor and preserves that support tile

- Decision: The first `acorn` hotbar slice now targets the requested grass anchor tile through the shared play-mode item-use path but writes the sapling into the air tile directly above that support, while above-anchor blockage stays a later growth-time concern instead of blocking initial planting.
- Reason: The shared small-tree growth-site contract already separates clicked support targeting from above-ground tree occupancy, so acorn placement can stay mixed-device aligned with existing targeted item use without consuming terrain or duplicating obstruction rules.
- Consequence: Future acorn previews and item-use flows should keep highlighting the requested grass anchor tile, while planted and grown small-tree writes should preserve that support tile and only occupy the air cells above it.

### 2026-03-21: Small-tree planting anchors stay grass-only and growth keeps above-anchor cells clear

- Decision: Shared small-tree site evaluation now treats only `grass_surface` anchor tiles with no current anchored tree state as plantable and only allows planted-to-grown replacement when every grown-footprint cell not already occupied by the planted sapling is empty.
- Reason: Upcoming acorn planting and deterministic sapling growth need one reusable precondition contract instead of letting each caller guess which terrain anchors or partial overlaps count as valid.
- Consequence: Future acorn planting and small-tree growth paths should consult the shared site evaluator before writing saplings or grown trees, and should treat occupied above-anchor cells as blocked growth rather than overwriting them.

### 2026-03-20: Small-tree stage writes replace the full anchored footprint

- Decision: Shared small-tree world-write helpers now apply planted or grown states by writing the full next anchored footprint and clearing any prior-stage-only anchored cells through one mutable `getTile`/`setTile` seam.
- Reason: Upcoming acorn growth and starter-axe cleanup both need deterministic whole-tree state transitions without asking each caller to hand-maintain partial tile edits.
- Consequence: Future small-tree planting, growth, and removal should prefer the shared stage-write helpers over ad hoc per-cell tree mutations.

### 2026-03-20: Small-tree world hits resolve only through full planted-support footprints

- Decision: Sampled `small_tree_sapling` tiles resolve back to their planted support anchor below the sapling, while sampled `small_tree_trunk` and `small_tree_leaf` tiles only resolve when the complete planted-base-anchored grown-tree footprint is present around the candidate anchor.
- Reason: Upcoming acorn-growth and starter-axe targeting need canopy and trunk hits to converge on one canonical tree anchor without treating stray debug-painted leaf or trunk tiles as valid complete trees.
- Consequence: Future tree-targeting, growth, and cleanup helpers should resolve sampled tree hits through the shared anchor helper first and should treat incomplete small-tree footprints as invalid or cleanup-only states rather than as alternate tree variants.

### 2026-03-20: Small-tree footprints stay anchored at the planted support cell

- Decision: Shared small-tree footprint helpers now treat the planted support tile as the canonical anchor for both states: a planted sapling occupies only `(0,-1)`, while the grown placeholder tree occupies trunk cells at `(0,-1)` and `(0,-2)` plus leaf cells at `(-1,-3)`, `(0,-3)`, and `(1,-3)`.
- Reason: Upcoming acorn-growth and starter-axe work need one deterministic footprint contract that lets canopy or trunk hits map back to the same planted support origin without each feature re-encoding its own placeholder tree shape.
- Consequence: Future small-tree planting, growth, save/load, and woodcutting follow-ups should reuse that planted support anchor plus shared footprint helpers before introducing larger tree variants or alternate canopy layouts.

### 2026-03-20: Small-tree groundwork uses dedicated non-solid tile IDs

- Decision: Shared tile metadata now reserves dedicated `small_tree_sapling`, `small_tree_trunk`, and `small_tree_leaf` IDs with direct authored-atlas placeholder renders, and all three stay non-solid plus non-light-blocking in the groundwork pass.
- Reason: Upcoming acorn-growth and starter-axe work need stable tree targets without borrowing terrain-autotile semantics or changing traversal, collision, and light behavior before tree interaction rules exist.
- Consequence: Future tree growth, woodcutting, and wood-block follow-ups should target those explicit tile IDs first and should treat any later collision or lighting changes as a deliberate design step instead of an incidental side effect.

### 2026-03-19: Starter furnace reuses the single-tile station contract

- Decision: The first furnace is a stackable `furnace` item that places a single-tile non-solid floor-supported station, clears on support loss, and gates copper-bar smelting through the same nearby-station reach checks and shared crafting panel used by the workbench.
- Reason: Early smelting needs to extend the existing station-and-crafting seams without introducing multi-tile furniture footprints, a second interaction radius, or a separate station UI.
- Consequence: Future early crafting stations should prefer that same single-tile nearby-station path until a later pass explicitly redesigns furniture size or station interaction rules.

### 2026-03-19: Default hotbar starts empty and save decode preserves sparse inventories

- Decision: Fresh sessions and save payloads that omit standalone-player inventory now resolve to an empty ten-slot hotbar, and save decode no longer backfill missing starter items into sparse inventories.
- Reason: The debug item catalog can now seed tools explicitly, so implicit starter-loadout injection only hid inventory dependencies and made runtime regressions brittle.
- Consequence: Future traversal, combat, building, and save tests should seed the items they need through explicit save fixtures, catalog actions, pickups, or crafting instead of assuming a shared default starter toolbelt.

### 2026-03-19: Procedural ore pockets only replace untouched upper underground stone

- Decision: Seeded copper-ore pockets now resolve inside a shallow underground stone band only after cave-air carving, and they stay outside the protected origin spawn corridor so fresh-world spawn terrain remains safe.
- Reason: Early resource generation needs deterministic progression without destabilizing surface footing, overwriting edited terrain assumptions, or punching ore into the protected world-start area.
- Consequence: Future ore or underground resource follow-ups should layer onto that same "replace untouched stone after cave carving" seam and preserve the protected origin corridor unless a later pass intentionally redesigns early-world spawn safety.

### 2026-03-19: Debug recipe catalog quick-craft reuses the shared crafting path

- Decision: Quick-craft actions in the debug recipe catalog now evaluate and execute through the same shared crafting helpers that back the dedicated crafting panel, while their ready-versus-blocked copy also resolves from that shared evaluation instead of a catalog-only craft path.
- Reason: Dev-only recipe cards still need to stay aligned with shipped inventory, station-range, and recipe-consumption rules without asking future passes to duplicate or manually sync crafting logic across two debug surfaces.
- Consequence: Future recipe-catalog crafting or blocker-copy follow-ups should extend the shared crafting evaluation or action helpers first and let both debug panels reuse that result instead of introducing catalog-only recipe checks.

### 2026-03-19: Debug recipe catalog derives from the shared crafting registry

- Decision: The searchable debug recipe catalog now enumerates and filters directly from the shared crafting recipe registry while resolving output, ingredient, and station labels through the existing crafting and inventory helpers instead of maintaining a second recipe list or hand-written catalog text.
- Reason: Development-time recipe browsing needs to stay aligned with shipped recipe ids, outputs, ingredients, and station requirements without asking future passes to update duplicate catalog metadata.
- Consequence: Future recipe additions or crafting-station label changes should extend the shared crafting and inventory registries first, and later dev-catalog follow-ups should continue deriving recipe presentation from those same helpers instead of duplicating recipe text.

### 2026-03-19: Debug item catalog derives from the shared inventory registry

- Decision: The searchable debug item catalog now enumerates and filters directly from the shared `PlayerInventory` item-definition registry and spawns through the same hotbar add helper used by normal item gains instead of keeping a separate debug-only item list or spawn path.
- Reason: Development-time item spawning needs to stay aligned with shipped item ids, labels, and stack rules without asking future passes to update a second source of truth.
- Consequence: Future hotbar item additions should extend the shared inventory registry first, and later debug catalog or recipe catalog follow-ups should derive their entries from that same registry instead of duplicating item metadata elsewhere.

### 2026-03-19: Procedural cave mouths stay outside a protected origin spawn corridor

- Decision: Untouched terrain now opens occasional surface-connected cave mouths only in seeded column bands whose full opening stays outside a fixed protected corridor around `x=0`, while the origin corridor itself keeps the prior surfaced overburden.
- Reason: The world needs visible surface entrances into the underground cave layer, but fresh-world spawn search and early traversal still need dry, supported ground near the origin.
- Consequence: Future surface-cave, biome, or spawn-adjacent worldgen follow-ups should preserve or explicitly redesign that protected origin corridor instead of letting new entrances or hazards drift into the default spawn search area accidentally.

### 2026-03-19: Default world-spawn height anchors to the seeded origin surface

- Decision: When no explicit `originTileY` is supplied, default player-spawn search now anchors its vertical search around the procedural surface height at the requested origin column instead of assuming raw tile `y=0`, while still using the usual nearby grounded fallback search from there.
- Reason: Seed-varying surface heights and underground cave roofs made the old `y=0` anchor pick underground supports or miss the surface entirely on some fresh worlds.
- Consequence: Future world-spawn or checkpoint-default follow-ups should derive their baseline search height from world-owned spawn context such as the seeded surface or a saved checkpoint, rather than reintroducing a fixed `y=0` assumption.

### 2026-03-19: World generation randomness lives in snapshot-owned world seeds

- Decision: `TileWorld` now owns an unsigned 32-bit `worldSeed`, untouched procedural terrain resolves through seeded shared terrain helpers, fresh-world entry points generate a new seed, and world snapshots preserve that seed while older snapshots without one default back to legacy seed `0`.
- Reason: Procedural worlds need visible variety without giving up deterministic chunk rebuilds, stable save/load behavior, or backward-compatible restore of older browser saves.
- Consequence: Future cave, biome, ore, or world-info follow-ups should derive their procedural variation from the shared persisted world seed instead of introducing runtime-only randomness or parallel seed storage.

### 2026-03-19: Procedural terrain now layers grass, dirt, and stone from shared column samplers

- Decision: `TileWorld` now resolves untouched terrain through shared deterministic surface-height and dirt-depth samplers that emit grass on the exposed top tile, dirt through a shallow sub-surface band, and stone below that band.
- Reason: This upgrades the world beyond the old one-function placeholder surface while keeping chunk streaming, edited-tile reset comparisons, and future cave work anchored to one reusable procedural baseline.
- Consequence: Future cave, biome, or ore follow-ups should layer onto the shared procedural terrain resolver instead of hardcoding new generation branches directly inside chunk construction or edited-tile reset logic.

### 2026-03-19: Procedural cave carving stays below the starter surface bands

- Decision: Untouched procedural cave air now carves through seed-driven underground cave bands only after the shared dirt layer and a small stone overburden, leaving the near-surface starter spawn corridor supported and dry.
- Reason: Early-world traversal and spawn recovery still need reliable surface footing, but the underground needs deterministic cave space for later exploration and resource follow-ups.
- Consequence: Future cave-mouth, ore, or underground-biome passes should extend the shared cave carve rules instead of punching ad hoc near-surface voids or bypassing the existing spawn-clearance constraint.

### 2026-03-19: Starter armor uses dedicated equipment slots with flat contact defense

- Decision: Starter armor now lives in save-owned `head`, `body`, and `legs` equipment slots outside the hotbar, and hostile-slime contact damage subtracts total equipped defense down to a minimum of `1`.
- Reason: This ships a narrow first armor slice without spending scarce hotbar capacity or introducing inventory-transfer rules first, while flat defense keeps hostile-contact combat deterministic and easy to surface in the in-world equipment panel.
- Consequence: Future armor progression should extend the shared equipment-slot registry, save/load paths, and slot-oriented UI before adding inventory-carried armor items or more complex mitigation rules.

### 2026-03-19: Critter release previews keep hover intent and fallback landing separate

- Decision: Selected `Bunny` previews now keep the main highlight on the requested hovered tile and add a separate landing marker only when nearby-ground search resolves to a different release tile.
- Reason: The hovered tile still owns range checks and click-or-tap intent, while a secondary marker explains the redirected spawn without making it look like the actual input target moved.
- Consequence: Future critter or pet previews that redirect from the requested tile should preserve the requested-tile highlight and show any resolved fallback as secondary preview state instead of replacing the primary target box.

### 2026-03-18: Critter release reuses target-tile reach with nearby-ground search

- Decision: Selected `Bunny` hotbar stacks now release through the same hidden-panel primary-use path and shared target-tile hotbar reach as other play-mode items, while the actual passive-bunny spawn resolves to the nearest valid bunny-sized ground spot near that targeted tile.
- Reason: Reusing the shared click-or-tap item-use path keeps desktop and touch critter release aligned with existing play-mode input, and a small nearby-ground search makes release forgiving without adding a second cursor-only interaction contract.
- Consequence: Future critter or pet release follow-ups should prefer target-tile reach-gated nearby-ground resolution before introducing a separate release UI or a different range rule.

### 2026-03-18: Bug-net captures stay swing-limited and inventory-backed

- Decision: The starter bug net now captures at most one passive bunny per swing, and the runtime only despawns that bunny when one `bunny` item can be merged into the hotbar inventory.
- Reason: Critter capture should feel like one deliberate swing rather than an area vacuum, and direct inventory credit avoids spawning an immediate overflow pickup on successful captures while still keeping full-inventory misses understandable.
- Consequence: Future critter-capture follow-ups should treat capture as a swing-limited inventory action and should leave critters in-world when no matching or empty inventory slot can accept the result unless a later pass explicitly introduces a different overflow contract.

### 2026-03-18: Starter umbrella glide reuses held jump input while selected

- Decision: The starter umbrella now activates glide from the existing held-jump movement input whenever the umbrella hotbar slot is selected, instead of adding a separate pointer-use or shell button contract.
- Reason: Slow-fall is traversal state, not an aimed item-use action, and reusing the same held-jump path keeps desktop keyboard and touch jump-pad behavior aligned without fragmenting play-mode input ownership.
- Consequence: Future glide, wings, or other fall-control follow-ups should prefer enriching shared movement intent from equipment or hotbar selection before fixed-step player movement, rather than inventing a second item-use gesture for airborne traversal.

### 2026-03-16: Starter crafting begins with a single-tile placed workbench

- Decision: The first crafting station is a stackable `workbench` inventory item that places a single-tile non-solid floor-supported tile, and station-gated recipes resolve against nearby placed workbench tiles using the same reach distance as hotbar placement.
- Reason: This delivers a minimal station-gated crafting slice without introducing multi-tile furniture footprints, separate interaction radii, or a second always-visible crafting shell before the shared play-mode item-use loop is more mature.
- Consequence: Future early crafting follow-ups should reuse the shared recipe registry plus nearby-station lookup, and any move to multi-tile stations or a broader crafting surface should be treated as an explicit design change.

### 2026-03-16: Play-mode primary click belongs to item use, not camera pan

- Decision: In desktop play mode, ordinary left click now belongs to the shared hotbar item-use path, while camera pan starts only from middle-mouse drag or debug-edit `Shift`-drag; touch camera pan stays limited to touch debug `Pan` mode.
- Reason: Combat and building actions need reliable access to the shared primary pointer gesture, and reusing that same gesture for camera pan made sword swings and placement feel inconsistent whenever the pointer drifted.
- Consequence: Future desktop or touch play-mode actions should treat primary click or tap as reserved gameplay input unless the same pass intentionally introduces a new explicit gesture contract for camera movement.

### 2026-03-16: Hostile-slime health lives in authoritative slime state

- Decision: Per-slime health now lives directly on authoritative hostile-slime entity state, and starter-sword hits reduce that state before `main.ts` decides whether to keep or despawn the slime.
- Reason: Slime health must travel with the same fixed-step locomotion and render-snapshot state that survives between sword hits, while defeat should resolve from the entity's own state instead of a parallel runtime damage map.
- Consequence: Future hostile-specific combat values that need to persist between hits should default to hostile entity state, while short-lived weapon pacing like sword hit cooldowns can keep living in detached session-owned weapon state.

### 2026-03-16: Starter sword hit cooldowns stay in session-owned weapon state

- Decision: The starter sword now tracks per-slime hit cooldowns in detached session-owned melee state keyed by hostile-slime entity id instead of adding saved cooldown fields onto slime state.
- Reason: The sword cooldown is short-lived attack pacing state, and keeping it outside hostile-slime state avoids inflating shared slime locomotion data or accidentally persisting transient combat timers through save or restore flows.
- Consequence: Future short melee or tool hit lockouts should default to session-owned helper state unless the same pass intentionally needs enemy-specific cooldowns to survive save/load or to become part of authoritative entity state.

### 2026-03-16: Hostile-slime loot drops reuse the nearby-pickup cascade

- Decision: Defeated hostile slimes now route their one-stack `gel` reward through the same nearest-first overlapping dropped-item cascade already used by player drops and tile refunds.
- Reason: Reusing the shared cascade keeps enemy loot deterministic, avoids redundant overlapping pickups when gel already occupies the drop spot, and automatically inherits the existing hotbar pickup flow plus placeholder rendering.
- Consequence: Future hostile loot drops should reuse the shared dropped-item cascade and generic inventory item definitions unless the same pass intentionally introduces a different pickup contract.

### 2026-03-15: Non-liquid inspect render telemetry resolves from shared tile-metadata helpers

- Decision: Hovered and pinned inspect telemetry now resolves current non-liquid animated frame sources, UV rects, and atlas-pixel bounds through shared elapsed-time helpers in `src/world/tileMetadata.ts` instead of re-deriving frame selection inside `src/main.ts` or the UI formatters.
- Reason: Torch and debug-tile inspect readouts need to stay aligned with the same authored render metadata and elapsed-frame selection the renderer already uses, without duplicating atlas-index versus direct-`uvRect` branching in multiple places.
- Consequence: Future non-liquid inspect or atlas-debug follow-ups should reuse those shared elapsed-time tile-render helpers rather than recomputing current frame sources in runtime assembly or UI formatting code.

### 2026-03-15: Torch atlas animation keeps the spare-slot regression target

- Decision: The starter torch now animates between full-width authored regions `20` and `22`, while authored region `21` stays blank as the documented spare slot and the exterior padding strip now begins at `x=112`.
- Reason: The torch still needs full-square frames so the shared tile mesh does not stretch it, but consuming the only documented blank slot would weaken the committed-atlas spill and accidental-reference regressions.
- Consequence: Future authored utility animations should prefer adding new full-width regions while preserving at least one documented blank slot plus some exterior padding, unless the same pass explicitly relocates those regression targets.

### 2026-03-15: Torch full-square atlas fixes should grow the atlas before consuming spill space

- Decision: The authored atlas now widens to `128x64`, keeps the torch on a centered full `16x16` authored region at index `20`, preserves region `21` as a blank full-width spare slot, and keeps the exterior padding strip blank beyond the authored-region bounds.
- Reason: Default tile quads still render full width, so the torch needs a full square like the rope, and growing the atlas preserves spill-detection space while also creating room for later authored slots.
- Consequence: Future atlas growth should preserve some blank exterior padding and must update direct `render.uvRect` normalization together with the PNG and authored-region layout instead of assuming the old `96x64` atlas width.

### 2026-03-15: Current/max health telemetry stays on the existing player-combat readout

- Decision: The full debug HUD and hidden-HUD compact status strip now render live health as `current/max` when max health is available, falling back to the prior single-value health readout only when older or partial telemetry lacks `maxHealth`.
- Reason: Heart-crystal upgrades change the player's survivability ceiling, and showing both numbers on the existing combat line keeps that context visible without adding a second health-only telemetry line or a new toggle family.
- Consequence: Future player-combat telemetry should treat upgraded health capacity as part of the existing health readout and preserve formatter fallbacks for incomplete telemetry snapshots.

### 2026-03-15: Current-session death-count telemetry stays in runtime state

- Decision: The standalone-player death counter shown in player-combat telemetry now lives only in current-session runtime state and resets whenever a world session is replaced, restored, or freshly generated.
- Reason: Death totals are useful for the live run, but persisting them through save/import/browser-resume boundaries would blur run-local telemetry with save-owned progression data.
- Consequence: Future current-session counters should default to runtime ownership unless the same pass explicitly needs them to survive save/load boundaries.

### 2026-03-15: Death-location telemetry uses the lethal player world tile

- Decision: Latest death-cause telemetry now records the player's world tile from the lethal fixed-step state instead of inferring location later from respawn state or from a hostile-contact source tile.
- Reason: The death location should identify where the player actually died across fall, lava, drowning, bomb-blast, and hostile-contact kills, while hostile-contact source telemetry already covers the attacker's tile separately.
- Consequence: Future death-location, corpse, or checkpoint follow-ups should reuse the lethal player tile captured with the death-cause event instead of recomputing death position from later runtime state.

### 2026-03-15: Short consumable reuse cooldowns stay in session-owned runtime state

- Decision: The healing-potion reuse cooldown now lives in detached session-owned fixed-step state instead of joining `PlayerState` or the saved world envelope.
- Reason: The potion lockout is short-lived pacing state, and persisting it across export/import or browser resume would add save complexity without meaningful player value.
- Consequence: Future short consumable or tool cooldowns should default to session-owned fixed-step state unless the same pass intentionally needs cooldowns to survive save or restore boundaries.

### 2026-03-15: Hard-landing impact telemetry uses the pre-collision fixed-step fall speed

- Decision: The hard-landing telemetry now reports the same pre-collision downward speed that the fixed-step fall-damage rule evaluates, rather than the previous-tick velocity or the post-collision grounded speed.
- Reason: Landing steps end with `velocity.y = 0`, and the prior tick can miss same-step gravity, buoyancy, or rope-drop slowdown, so only the shared pre-collision impact speed matches the actual damage calculation.
- Consequence: Future landing-speed or fall-survival telemetry should derive from the shared fixed-step impact-speed helper instead of inferring impact from post-landing state or previous snapshots.

### 2026-03-15: Lethal damage source telemetry lives under player-combat

- Decision: The latest lethal damage source and applied damage now render under `player-combat` in both the full debug HUD and the hidden-HUD compact status strip.
- Reason: The lethal cause explains the same survival and recovery story as death-hold status, landing damage, drowning ticks, lava ticks, and hostile-contact hits, so it fits the existing combat telemetry slice better than a new separate death-only family.
- Consequence: Future death-cause or lethal-hit summary telemetry should extend `player-combat` unless a later pass intentionally redesigns the combat-versus-survival telemetry split.

### 2026-03-15: Boot-time dropped-item normalization rewrites browser-resume saves immediately

- Decision: When boot-time browser resume consolidates overlapping same-item dropped-item stacks during restore, the normalized world-save envelope is written back to browser storage immediately instead of waiting for the next pause or `pagehide`.
- Reason: Leaving the stale overlapping pickup payload in storage until a later save point would make resumed sessions repeatedly pay the same normalization cost and could preserve redundant pickup stacks across an unexpected reload before the next persistence boundary.
- Consequence: Future boot-time save-normalization passes should rewrite browser-resume storage as soon as they change restored session data, rather than relying on later autosave timing to eventually converge the persisted payload.

### 2026-03-15: Lava tick telemetry lives under player-combat

- Decision: The latest lava tick damage event and the live lava-damage cooldown now render under `player-combat` in both the full debug HUD and the hidden-HUD compact status strip.
- Reason: Lava cadence is an environmental survival timer that explains the same incoming-damage story as breath, fall recovery, and hostile-contact invulnerability, so it fits the existing combat telemetry slice better than a new separate family.
- Consequence: Future lava or related environmental survival telemetry should extend `player-combat` unless a later pass intentionally redesigns the combat-versus-survival telemetry split.

### 2026-03-15: Starter-pickaxe dirt refunds reuse the nearby-pickup cascade

- Decision: When the starter pickaxe breaks `grass_surface` or placed starter dirt, the refunded `dirt-block` first merges into overlapping matching dropped-item stacks before any new pickup entity spawns.
- Reason: Mining refunds should follow the same deterministic overlap and overflow behavior already used by torch refunds and player drops instead of creating redundant stacked pickups for the same item.
- Consequence: Future mined-tile refunds should reuse the shared nearby-pickup cascade unless the same pass intentionally changes broader world-drop rules.

### 2026-03-15: Hotbar reordering keeps selection attached to the moved slot

- Decision: One-step hotbar reordering now swaps the selected slot with its immediate left or right neighbor and moves `selectedHotbarSlotIndex` onto that destination, even when the selected slot is empty.
- Reason: Treating reordering as moving the selected slot keeps overlay buttons, keyboard shortcuts, persistence, and future drag-reorder work aligned around one consistent model instead of splitting slot movement from selection movement.
- Consequence: Future hotbar swap or drag-reorder follow-ups should preserve selection with the moved slot unless the same pass explicitly introduces a separate cursor-only action.

### 2026-03-14: Rope art uses a full tile atlas square because default tile quads render full width

- Decision: Rope render metadata now points at authored atlas region `19`, a full `16x16` square whose visible strand is centered inside transparent padding.
- Reason: Ordinary tile rendering maps atlas UVs across a full tile-width world quad, so placing rope in a narrower authored region made it render stretched even though the atlas art itself looked correct.
- Consequence: Future narrow-looking tiles should stay inside full-width authored regions unless the same pass adds non-liquid render bounds that let the mesher shrink world-space quad width intentionally.

### 2026-03-14: Single-item hotbar drops reuse the nearby-pickup cascade

- Decision: `Drop 1` now routes one selected hotbar item through the same overlapping same-item dropped-stack cascade used by full stack drops before spawning a new world pickup entity.
- Reason: Single-item drops should preserve the same deterministic merge order and overlap behavior as full stack drops instead of inventing a second drop rule when a matching pickup already occupies the spawn position.
- Consequence: Future hotbar drop variants should reuse the shared nearby-pickup cascade unless the same pass intentionally introduces a different world-drop placement contract.

### 2026-03-14: Rope quick-drop resolves the full rope column and eases through solid-ground endings

- Decision: Rope quick-drop now resolves the first non-rope tile below the full contiguous rope column under the player, and when that column ends on solid ground it caps descent through the final rope tile to the shared rope-landing safe speed before collision and fall-damage resolution.
- Reason: Looking only at the currently overlapped rope segment let fast drops reach solid ground as ordinary falls before the rope-bottom safety rules could engage.
- Consequence: Future rope, vine, ladder, or other climbable quick-drop follow-ups should base end-of-column landing rules on the full connected climbable run, not just the segment currently touching the player.

### 2026-03-14: Rope quick-drop uses a short down tap followed by a held second press

- Decision: Rope quick-drop now activates only when one short down press or tap is released and a second down press stays held within the shared double-tap window, and once active it ignores ordinary rope hold until that held input releases or the rope bottom catches the player.
- Reason: Ordinary held down input already owns readable slow rope descent on both desktop and touch, so fast drop needs a deliberate shared gesture instead of overloading the default climb-down hold.
- Consequence: Future rope, vine, ladder, or other climbable quick-descend follow-ups should preserve this deliberate arm-and-hold gesture with bottom catch rather than turning ordinary climb-down hold into the fast-drop path.

### 2026-03-14: Rope-drop telemetry lives under player-motion

- Decision: Rope quick-drop active state and the shared double-tap window armed state now render under `player-motion` in both the full debug HUD and the hidden-HUD compact status strip.
- Reason: Those readouts describe the player's current traversal input and rope-movement availability, not combat recovery or one-off event history.
- Consequence: Future climbable quick-descend telemetry should extend `player-motion` unless a later pass intentionally revisits the telemetry catalog split.

### 2026-03-14: Hostile-contact source telemetry lives under player-combat

- Decision: The latest hostile-contact source tile and facing readout now extends the existing `player-combat` telemetry in both the full debug HUD and the hidden-HUD compact status strip.
- Reason: That source data explains the latest damage or blocked-contact combat event, so keeping it beside health, invulnerability, and contact-hit readouts is more coherent than splitting it into the tracked hostile-slime locomotion telemetry.
- Consequence: Future hostile-contact source follow-ups should extend `player-combat` unless a later pass intentionally redesigns the combat-versus-tracker telemetry split.

### 2026-03-14: Hostile-slime chase-offset telemetry uses player-relative world-space deltas

- Decision: The hostile-slime tracker now reports chase offset as `trackedSlime.position - player.position` on the horizontal and vertical axes, using the same bottom-center world-space anchors that drive fixed-step movement.
- Reason: Player-relative world-space deltas explain the tracked slime's chase relationship without collapsing that spacing into tile-rounded values or introducing a second position convention just for telemetry.
- Consequence: Future hostile-slime chase, keep-band, or spacing telemetry should extend this player-relative world-space delta contract unless a later pass intentionally introduces a separate tile-space readout.

### 2026-03-14: Rope contact uses grounded-style braking for neutral horizontal inertia

- Decision: While the player overlaps a rope and left/right input is neutral, rope traversal now applies the same horizontal braking used for grounded movement before rope hold and centering resolve.
- Reason: Rope catches felt frictionless, which made it too easy to overshoot a neighboring rope and fall even after making contact.
- Consequence: Future rope, vine, ladder, or other climbable follow-ups should treat neutral-input rope contact as a lateral inertia stall, not as ordinary airborne drift, unless a later traversal redesign intentionally changes that feel.

### 2026-03-14: Rope self-centering only nudges during neutral horizontal input

- Decision: While the player still overlaps a rope after the horizontal sweep, rope traversal now applies a bounded horizontal nudge back toward the rope column only when left/right input is neutral, and that assist preserves the prior facing.
- Reason: Neutral-input centering makes rope navigation easier after small drift without fighting deliberate detach input or flipping the placeholder sprite because of an auto-centering correction.
- Consequence: Future rope, vine, ladder, or other climbable follow-ups should treat self-centering as a neutral-input assist and keep facing driven by player intent or actual traversal, not by the assist itself.

### 2026-03-14: Starter rope uses the touched segment for preview and reach, then resolves bottom extension

- Decision: Starter rope placement now treats an empty tile as supported when the direct tile above is solid or already rope or when either horizontal neighbor is solid, and using a hotbar rope on an occupied rope segment keeps that touched segment as the preview and reach-check tile while the actual edit target resolves to the first non-rope tile below the contiguous rope column before support checks run. Rope traversal still flows through one shared vertical climb intent where `W`/`Up`/`Space` climbs up and `S`/`Down` climbs down.
- Reason: Overhead-or-side support keeps rope placement deterministic and readable for mixed-device play without forcing underside-only targeting, bottom-resolution lets repeated rope use extend an existing column instead of failing on the clicked segment, and keeping preview plus reach on the touched rope segment avoids surprising far-away highlights or false out-of-range failures when the bottom has grown well below the player.
- Consequence: Future rope, vine, ladder, or other extendable climbable follow-ups should keep interaction preview and range tied to the player-chosen segment while separately resolving the eventual edit target, rather than collapsing both concepts onto the final target cell or inventing device-specific placement logic.

### 2026-03-14: Rope hold is decided after the horizontal sweep

- Decision: Fixed-step rope traversal now keeps rope hold or climb active only when the player's post-horizontal-sweep body-center column still overlaps a climbable tile.
- Reason: Sampling rope overlap only at tick start caused a sticky extra hold or climb frame after sideways movement had already cleared the rope column for that same fixed step.
- Consequence: Future rope, vine, ladder, or other climbable follow-ups should preserve this post-horizontal overlap rule whenever climbable movement competes with gravity inside the shared player step.

### 2026-03-14: Rope jump-off uses a fresh jump press plus horizontal input

- Decision: While overlapping a rope, a fresh jump press combined with left or right input now releases rope hold immediately into the shared jump path even if the same fixed step still overlaps the rope column after horizontal sweep prediction.
- Reason: Treating that input as ordinary climb-up made rope exits feel sticky and prevented a readable lateral jump-off when the player had clearly asked to leave the rope.
- Consequence: Future climbable traversal follow-ups should preserve this fresh-press plus horizontal-release rule instead of inferring jump-off from held climb input alone.

### 2026-03-14: Restore-time dropped-item consolidation preserves earlier save-order anchors

- Decision: Session restore now consolidates overlapping same-item dropped-item stacks in save-array order, preserving earlier stack positions as anchors and only carrying any overflow into later remainder entries.
- Reason: Browser-resumed or imported saves can contain redundant overlapping pickups, and restoring them raw would recreate avoidable duplicates instead of the deterministic stack set the live runtime already prefers.
- Consequence: Future save import or resume paths should reuse the shared dropped-item consolidation helper before spawning pickup entities rather than restoring overlapping same-item stacks directly.

### 2026-03-14: Default non-debug hotbar placement reach uses a five-tile body-to-cell gap

- Decision: Hidden-panel hotbar tile placement now uses a shared default reach of five tiles (`80px`), measured as the shortest gap from the player's body AABB to the target tile cell.
- Reason: Measuring from the player body instead of a single anchor point keeps desktop and touch placement reach intuitive near the player's silhouette while leaving one deterministic contract for later out-of-range preview feedback and range halos.
- Consequence: Future non-debug placement-range bonuses, visuals, and blocked-reason feedback should extend the shared body-to-cell helper instead of inventing item-specific reach math in `main.ts` or individual placement validators.

### 2026-03-14: Placed-tile refund pickups should follow authoritative tile-edit notifications

- Decision: Torch refund pickups now spawn from renderer-forwarded `TileWorld` edit notifications whenever a placed torch tile is replaced or cleared, including support-collapse edits.
- Reason: Refund behavior needs to stay aligned with world-owned support-collapse and any later edit source without re-deriving removed tiles from tool-specific input paths in `main.ts`.
- Consequence: Future placeable refund slices should prefer authoritative tile-edit notifications over inferring refunds only from the initiating action or UI tool.

### 2026-03-14: Dropped-item world stacks persist as session-owned entity state

- Decision: Active dropped-item stacks now save and restore through the top-level world-session envelope beside standalone-player inventory and camera state instead of being embedded into the `TileWorld` snapshot.
- Reason: Pickup stacks behave like runtime entities with stack counts and positions, so keeping them in the session-owned envelope preserves their entity-style lifecycle without coupling world-save terrain snapshots to transient actor state.
- Consequence: Future pickup-producing slices should persist uncollected world items through the same session-owned dropped-item path unless the same pass intentionally replaces broader entity-save ownership.

### 2026-03-14: Player drops should cascade through overlapping same-item pickups before spawning new stacks

- Decision: Dropping a hotbar stack now fills overlapping same-item world pickups in nearest-first order, preserving existing entity order on equal-distance ties, and only spawns a new dropped-item entity when overflow remains after that cascade.
- Reason: Cascading across nearby matching pickups keeps drop behavior readable, avoids unnecessary duplicate entities, and gives multi-pickup overlaps one deterministic merge order instead of whichever target happened to be checked first.
- Consequence: Future player-drop and nearby world-pickup follow-ups should preserve this nearest-first cascade behavior instead of reverting to one-target-only or always-spawn-new overlap handling.

### 2026-03-14: Tile refund pickups should merge before spawning new overlapping stacks

- Decision: Starter torch refund pickups now route through the same overlapping same-item dropped-stack cascade as player drops before spawning a new dropped-item entity.
- Reason: Reusing the shared merge path keeps removed-tile torch refunds from spraying redundant overlapping world pickups when a matching torch stack already occupies that spot.
- Consequence: Future tile-refund pickup slices should reuse the shared nearby-pickup merge cascade and only spawn a new entity for any overflow that remains afterward.

### 2026-03-14: Starter torches collapse from authoritative tile edits when support disappears

- Decision: `TileWorld.setTileState()` now automatically clears adjacent starter torch tiles when a solid-face edit leaves them without any remaining solid cardinal support.
- Reason: Torch attachment needs one authoritative cleanup rule that stays consistent across debug edits, renderer-backed world mutation, and later replay-oriented tile state paths without depending on callers to remember a second pass.
- Consequence: Future support-bound non-solid placeables should either reuse this world-owned support-collapse pattern or explicitly document a different persistence rule.

### 2026-03-14: Renderer snapshot loads refresh resident lighting from tile state

- Decision: `Renderer.loadWorldSnapshot()` now invalidates and recomputes resident chunk lighting from the restored tile state before attaching the replacement world.
- Reason: Imported or browser-resumed sessions should not depend on serialized light caches staying perfectly current, especially for emissive torch tiles whose saved light field can be stale or empty.
- Consequence: Future runtime world-snapshot restore paths should treat tile state as the lighting source of truth and refresh resident lighting on load instead of trusting saved light arrays for first-frame presentation.

### 2026-03-14: Death-hold telemetry lives under player-combat

- Decision: Current respawn-countdown and death-hold-status readouts now render under the existing `player-combat` telemetry type in both the full debug HUD and the hidden-HUD compact status strip.
- Reason: The death hold is a short survival timer that explains why the player is frozen and when control returns, so keeping it with health and other recovery timers avoids splitting one survival story across combat and event toggles.
- Consequence: Future death, revive, or checkpoint countdown readouts should extend `player-combat` unless a later pass intentionally re-slices survival telemetry.

### 2026-03-14: Peaceful mode persists as gameplay state and immediately clears hostile slimes

- Decision: Paused-menu `Peaceful Mode` now lives in its own persisted world-session gameplay state, immediately despawns active hostile slimes, and blocks future hostile-slime spawn or locomotion work until toggled off.
- Reason: The pause-menu recovery mode needs one authoritative hostile-disable gate that survives pause or resume and fresh-world transitions without being folded into world-save payloads or leaving already-spawned hostiles active.
- Consequence: Future difficulty or enemy-behavior toggles should extend the same gameplay-state ownership path and treat peaceful mode as the runtime authority for hostile suppression unless the same pass intentionally revisits broader rules-state ownership.

### 2026-03-14: Breath survival telemetry lives under player-combat

- Decision: Current breath and drowning-cooldown readouts now render under the existing `player-combat` telemetry type in both the full debug HUD and the hidden-HUD compact status strip.
- Reason: Breath depletion and drowning cadence are survival timers that directly explain incoming health loss, so reusing the combat gate keeps the paused-menu telemetry catalog compact without splitting closely related readouts across separate toggles.
- Consequence: Future player survival timers or damage-setup readouts should extend `player-combat` unless a later pass intentionally introduces a separately toggled survival telemetry family.

### 2026-03-14: Play-mode hotbar placement preview stays available with debug overlays hidden

- Decision: Play-mode hotbar placement previews now stay available whenever the in-world full `Debug Edit` panel is hidden, even when the compact debug overlay bundle is toggled off.
- Reason: Placement legality is core mixed-device play feedback for the hotbar building path, while the `Edit Overlays` toggle is meant to hide debug inspect and one-shot preview chrome rather than remove essential build affordances.
- Consequence: Future play-mode hotbar placement previews should stay decoupled from the debug overlay visibility toggle unless the same pass intentionally redesigns normal build feedback.

### 2026-03-14: Non-solid starter torches use support-only placement checks

- Decision: Starter torches now place only into empty tiles that touch a solid cardinal face, but unlike starter dirt blocks they ignore standalone-player overlap because the placed torch tile is non-solid.
- Reason: The torch slice needs the same readable mixed-device face-attachment rule as other placeables, while reusing the solid-block anti-trapping check would incorrectly reject harmless overlap cases and make torch placement feel inconsistent.
- Consequence: Future non-solid face-attached utility tiles should default to support-only placement validation unless a later pass intentionally adds a new occupancy hazard or interaction rule.

### 2026-03-13: Paused-menu dashboard should keep a single reading column on desktop

- Decision: The paused-menu dashboard now keeps `Overview`, `World Save`, `Shell`, `Recent Activity`, and `Danger Zone` in one vertical stack on desktop instead of splitting paused sections across multiple columns.
- Reason: The one-column paused layout is easier to scan top-to-bottom while reviewing session state, especially once section cards already carry dense metadata and grouped actions.
- Consequence: Future paused-menu layout work should preserve the single-column desktop reading flow unless the same pass intentionally reintroduces a multicolumn dashboard with updated tests and docs.

### 2026-03-13: Hidden Debug Edit panel routes canvas clicks and taps to play item use

- Decision: While the in-world full `Debug Edit` panel is hidden, canvas input now switches from debug paint to queued play-mode item-use requests, while the visible panel keeps existing debug paint, brush-slot, and tool-shortcut behavior.
- Reason: The starter inventory items need a mixed-device placement path without adding a second on-canvas control layer or breaking the established debug-edit workflow.
- Consequence: Future hotbar item interactions should plug into the shared play-mode item-use queue and respect the same panel-visible routing split instead of bypassing controller mode handoff.

### 2026-03-13: Starter solid-block placement requires support and must not overlap the player

- Decision: Starter dirt blocks now place only onto empty tiles that share a cardinal face with a solid tile and whose tile AABB does not overlap the standalone player's body.
- Reason: The first building slice needs simple deterministic placement that preserves terrain attachment and avoids trapping the player inside a newly placed solid tile.
- Consequence: Future placeable solid tiles should reuse or intentionally extend this validation contract rather than defaulting to unsupported placement or allowing solid placement through the player.

### 2026-03-13: Telemetry catalog storage defaults missing entries to enabled

- Decision: The persisted world-session telemetry catalog now treats any missing collection or type key in stored state as enabled when decoding older saved payloads.
- Reason: The telemetry-control rollout will keep growing the catalog over multiple agent passes, and older saved preferences should not silently hide newly added diagnostics just because the stored payload predates those keys.
- Consequence: Future telemetry-catalog expansions should add new collections or types with default-on semantics and rely on the shared decoder for backward compatibility instead of version-bumping storage solely to seed new keys.

### 2026-03-13: Hostile-slime locomotion telemetry tracks the nearest active slime

- Decision: The debug HUD and hidden-HUD compact status strip now sample hostile-slime locomotion telemetry from the nearest active slime to the player, breaking distance ties by lower entity id.
- Reason: Multiple slimes can stay active at once, and the locomotion telemetry slice needs one deterministic, player-relevant target without expanding into a multi-entity HUD list before broader hostile telemetry work lands.
- Consequence: Future hostile-slime telemetry follow-ups should extend this nearest-slime tracking contract unless the same pass intentionally broadens the HUD to summarize multiple slimes at once.

### 2026-03-13: Hostile-contact telemetry keeps the latest overlap result, including invulnerability blocks

- Decision: The debug HUD and hidden-HUD compact status strip now retain the latest hostile-slime overlap event, reporting the actual applied damage after lethal-or-survived resolution or `0` damage when the overlap was blocked by hostile-contact invulnerability.
- Reason: Debugging contact cadence needs to distinguish a fresh hit from a still-overlapping slime that correctly failed to deal damage during the invulnerability window, and live health alone cannot explain that difference.
- Consequence: Future hostile-contact telemetry follow-ups should treat invulnerability-blocked overlaps as reportable events and extend the same applied-damage event contract instead of inferring contact results only from current health or cooldown state.

### 2026-03-13: Zero-health damage enters a shared death hold before respawn

- Decision: Hostile contact, drowning, hard landings, and lava can now reduce the player to `0` health, and that zero-health state now holds the player at the fatal position through a short fixed-step respawn countdown before respawning from the latest resolved spawn with restored hostile-contact invulnerability.
- Reason: The dedicated death-and-respawn slice needs one shared recovery rule across existing damage sources instead of mixing old nonlethal clamps with the older immediate lava-only reset path.
- Consequence: Future combat, survival, checkpoint, or respawn work should treat zero health as a countdown-based death state rather than reviving immediately or reintroducing source-specific nonlethal clamps unless the same pass intentionally revisits the shared death model.

### 2026-03-13: Death countdown persists beside PlayerState as detached session state

- Decision: The short respawn countdown now persists in save or restore flow as its own session field instead of becoming another property on `PlayerState`.
- Reason: The countdown is orchestration-owned recovery state rather than part of the fixed-step movement or collision model, and keeping it detached avoids widening every player-state clone, render snapshot, and helper for a timer that only matters while dead.
- Consequence: Future death, checkpoint, or save/load work should treat the respawn countdown as session-owned state that is restored alongside the player, not as a permanent `PlayerState` field unless the same pass intentionally collapses those ownership boundaries.

### 2026-03-13: Water survival uses head-region overlap for breath

- Decision: Breath continues to drain only when water overlaps the player's top head-region sample, while drowning now participates in the shared zero-health death handling instead of a separate nonlethal clamp.
- Reason: Body-overlap water checks would still drain breath while merely wading, and the new death slice removes the earlier need for a survival-specific nonlethal exception.
- Consequence: Future water, breath, or drowning work should keep head-region submersion as the breath trigger unless the same pass intentionally broadens the underwater rules together.

### 2026-03-13: Hostile slime chase movement commits to grounded retargets and airborne hops

- Decision: Hostile slimes now face toward the player only while grounded, launch movement as discrete hop impulses on a fixed grounded cooldown, keep that hop direction while airborne, spend a dedicated short-range step-up hop when an immediate one-tile rise blocks takeoff, and only flip early when a remaining blocking wall cancels horizontal movement.
- Reason: Hidden airborne step-up correction made rough terrain feel almost free during close chase play, while a grounded-only climb hop keeps ledge clearance deterministic and readable without introducing continuous airborne steering, pathfinding, or a second collision-recovery state machine before combat lands.
- Consequence: Future slime combat, hit-reaction, or telemetry work should treat grounded retargeting, committed airborne hops, and grounded-only short step-up hops as the chase model unless the same pass intentionally revisits hostile locomotion.

### 2026-03-13: Hostile slime ambient spawn uses deterministic round-robin surface windows

- Decision: Hostile slimes now spawn from fixed-step round-robin grounded-search windows at fixed horizontal offsets from the player, reset their cooldown on every attempt, and despawn once they leave a broader keep band.
- Reason: The first hostile-entity slice needs regression-friendly spawn behavior that is easy to exercise from mixed-device play without introducing probabilistic ambient rules or a second non-registry entity lifecycle.
- Consequence: Future hostile-slime locomotion, combat, or telemetry work should preserve the deterministic spawn-window order and keep-band ownership unless the same pass intentionally revisits the broader enemy spawning model.

### 2026-03-13: Sleeping-liquid bounds should stay resident-state telemetry

- Decision: `TileWorld`, renderer telemetry, and the debug HUD now expose sleeping-liquid chunk bounds as the current resident-liquid minus awake-liquid envelope.
- Reason: Wake testing needs the present footprint of settled pools after awake bounds disappear, so sleeping bounds should reflect current settled residency rather than a last-step scan or transfer artifact.
- Consequence: Future liquid telemetry and HUD work should treat sleeping bounds as current-state settled-pool ownership and refresh them from resident-versus-awake membership changes instead of inferring them from phase counters or candidate-band coverage.

### 2026-03-13: Sideways candidate-band bounds should stay separate from current awake-liquid bounds

- Decision: `TileWorld`, renderer telemetry, and the debug HUD now expose last-step sideways candidate-band chunk bounds separately from the current awake active-liquid chunk bounds.
- Reason: The sideways band describes where equalization coverage expanded for the last fixed step, while awake-liquid bounds describe only chunks that are currently awake, so wake testing needs both envelopes without conflating scan coverage and awake-state ownership.
- Consequence: Future liquid telemetry or HUD work should keep candidate-band bounds as last-step scan-coverage telemetry and leave awake or sleeping bounds as current-state telemetry instead of substituting one envelope for another.

### 2026-03-12: Paused-menu async section actions should self-debounce locally

- Decision: Paused-menu `Import World Save`, `Import Shell Profile`, and `Apply Shell Profile` now keep their waiting state on the owning section button instead of locking the full overlay or relying on runtime-only guards.
- Reason: File pickers and preview applies need duplicate-activation protection, but the paused dashboard should keep surrounding context readable and avoid collapsing into a global busy mode for one section-owned async action.
- Consequence: Future paused-menu async actions should default to local button-level busy states and repeated-tap debouncing inside the owning section unless the same pass intentionally introduces a broader overlay transaction model.

### 2026-03-12: Paused-dashboard actions should live inside their owning sections

- Decision: The paused menu now renders `Resume World`, the three `World Save` actions, and the destructive `Danger Zone` actions as section-owned buttons inside `Overview`, `World Save`, and `Danger Zone`, while the shared footer action row stays first-launch-only.
- Reason: Once the paused overlay has stable dashboard sections, keeping actions in a shared footer duplicates controls, separates each action from its status metadata, and makes touch scanning worse.
- Consequence: Future paused-menu actions should be added to the owning dashboard section instead of the shared overlay footer unless the same pass intentionally changes the first-launch main-menu action model too.

### 2026-03-12: Destructive paused-menu actions should live together in Danger Zone

- Decision: The paused menu now keeps `Reset Shell Toggles` and `New World` together inside the dedicated warning-toned `Danger Zone` section instead of splitting shell reset into the shell tools area or leaving fresh-world guidance in a generic secondary card grid.
- Reason: Resetting shell layout and replacing the active session are both destructive or recovery-oriented actions, so grouping them makes the shell editor easier to scan and keeps consequence-heavy controls under one explicit warning label.
- Consequence: Future paused-menu actions that clear layout state, discard the current session, or otherwise act as destructive recovery paths should default to `Danger Zone` instead of `Shell`, `Overview`, or ad hoc secondary-card placement.

### 2026-03-12: Paused-dashboard sections should keep stable named region anchors

- Decision: The paused dashboard now gives `Overview`, `World Save`, `Shell`, `Recent Activity`, and `Danger Zone` stable section ids, labelled region semantics, and keyboard-focus anchors on their section wrappers.
- Reason: Upcoming jump-link, section-owned action, and accessibility work needs one consistent target contract on both desktop and touch layouts instead of ad hoc title lookups or card-order assumptions.
- Consequence: Future paused-menu navigation or focus-management work should target these existing section anchors and keep their ids and heading labels stable unless the same pass updates the related links, tests, and docs together.

### 2026-03-12: Keyboard-driven paused Shell toggles should restore the Shell section anchor

- Decision: Expanding or collapsing the paused-menu `Shell` section from its toggle button now returns keyboard focus to the existing Shell section anchor after rerender instead of leaving focus on the toggle or dropping it out of the dashboard flow.
- Reason: The paused Shell editor rerenders when it opens or closes, and keyboard users need one stable landmark target so hotkey editing and section navigation stay inside the paused dashboard instead of resetting to broader overlay traversal.
- Consequence: Future paused-dashboard expand, collapse, or section-rerender work should preserve keyboard flow by restoring the owning section anchor unless the same pass intentionally introduces a different documented focus target.

### 2026-03-12: Recent Activity visibility changes should restore the current or nearest surviving paused section anchor

- Decision: When paused-menu `Recent Activity` appears or disappears, the app shell now snapshots the focused paused-dashboard section anchor and restores either that same anchor or, if it just hid, the nearest surviving section anchor after rerender.
- Reason: Result-card visibility changes can hide the focused `Recent Activity` landmark or shift the secondary dashboard layout, so keyboard users need one explicit focus handoff that keeps navigation inside the paused dashboard instead of dropping focus out of the section flow.
- Consequence: Future paused-dashboard visibility-driven rerenders should preserve the focused section landmark or route focus to the nearest surviving section anchor rather than letting hidden section anchors silently blur.

### 2026-03-12: Default paused-menu cards should be metadata-first without a global help toggle

- Decision: The paused menu now removes the global `Show Help Text` toggle and keeps its default `Overview`, `World Save`, `Recent Activity`, and secondary action cards readable through concise titles plus metadata rows instead of paragraph-style help copy.
- Reason: The help toggle added another control to an already dense paused menu, while the default cards still needed to communicate their state and consequence immediately on both desktop and touch layouts.
- Consequence: Future default paused-menu cards should prefer terse metadata labels such as `Session`, `Reload`, `Replaces`, or `Next Resume`; longer explanatory prose should stay out of the default paused state unless a later task introduces a more targeted presentation.

### 2026-03-12: Shell-profile previews should show hotkeys as grouped diffs with badge empty states

- Decision: Expanded paused-menu `Shell Profile Preview` details now keep file, toggle, and saved-on or saved-off state in metadata rows, render hotkeys as grouped `Changed From Live` and `Matching Live` diff lists, and collapse no-row diff groups into compact badge-style empty states instead of prose lines plus one long replacement-hotkey metadata dump.
- Reason: Once the paused dashboard removed default help paragraphs, long comma-separated hotkey summaries became harder to scan quickly, especially on touch-width layouts where users need to separate actual diffs from unchanged bindings at a glance and still understand all-changed or no-change previews immediately.
- Consequence: Future shell or preference preview details should default to terse metadata rows for state summary, grouped diff lists for per-binding inspection, and compact empty badges when one diff group has no entries rather than reintroducing paragraph help copy or flattened binding dumps.

### 2026-03-12: Recent Activity should show only the latest paused-menu outcome plus required follow-up warnings

- Decision: The paused menu now keeps world-save and shell-setting feedback in `Recent Activity`, showing only the latest related outcome together with any still-relevant follow-up warning such as missing browser resume after a clear or import persistence failure.
- Reason: Accumulating every stored result made the paused menu longer and hid the activity most likely to matter next, while persistent follow-up warnings still need to stay visible when the latest action leaves unfinished attention items behind.
- Consequence: Future paused-menu feedback should update the latest-activity slot instead of growing a multi-result history, and ongoing warnings should only join `Recent Activity` when they directly explain the latest outcome's remaining consequence.

### 2026-03-12: Paused-menu cleanup should converge on a compact sectioned dashboard

- Decision: Future paused-menu cleanup work should consolidate the current card-heavy layout into stable `Overview`, `World Save`, `Shell`, `Recent Activity`, and `Danger Zone` sections, with terse metadata-first summaries in the default state and deeper controls or detail only inside the owning section.
- Reason: The current paused menu has accumulated too many flat cards, summary sentences, and cross-cutting toggles, which makes it long, verbose, and hard to scan on both desktop and touch-sized layouts.
- Consequence: Future paused-menu tasks should reduce section sprawl, keep one-off outcomes scoped to `Recent Activity`, and avoid adding new copy-only summary branches to the legacy card stack unless they directly support the redesign.

### 2026-03-12: Paused-menu dashboard should keep primary sections first on touch and secondary sections multicolumn on desktop

- Decision: The paused-menu dashboard now keeps `Overview` and `World Save` as the leading stacked sections on touch-sized layouts, while desktop reflows `Shell`, `Recent Activity`, and `Danger Zone` into a separate two-column secondary grid and leaves the footer action row in place until section-owned actions land.
- Reason: Resume-state and save-state context need to stay visible at the top of the paused menu on smaller screens, while desktop has enough width to make secondary tools and feedback scannable side-by-side without moving button ownership prematurely.
- Consequence: Future paused-menu layout work should preserve `Overview` plus `World Save` as the primary top stack and treat multicolumn layout as belonging to the secondary section area unless a later task intentionally changes that dashboard contract.

### 2026-03-11: Paused-menu transient feedback should collapse separately from persistent status cards

- Decision: One-off paused-menu `* Result` cards now live inside a local `Results` section that stays collapsed by default, while persistent cards such as `Saved World Status`, `Persistence Summary`, and `Shell Profile Preview` remain visible in the main grid.
- Reason: Recent export, import, and reset outcomes are useful to revisit, but leaving every transient feedback card inline makes the paused menu harder to scan for current session state and active controls.
- Consequence: Future paused-menu cards that report the latest one-off action outcome should usually join the `Results` section, while ongoing state or warning cards should stay outside it.

### 2026-03-11: Paused-menu help text should collapse independently from action metadata

- Decision: Paused-menu action cards now hide their descriptive paragraphs behind a local `Show Help Text` toggle by default, while titles and metadata rows stay visible.
- Reason: The paused menu is vertically dense, but shortcut, consequence, and result status data still need to stay scannable without reopening every card's longer guidance.
- Consequence: Future paused-menu cards should keep critical action state in titles or metadata rows instead of relying only on paragraph copy, and longer guidance can assume the help toggle may stay collapsed.

### 2026-03-11: Shell-profile previews should be dismissible without mutating the paused session

- Decision: Paused-menu shell-profile previews can now be explicitly cleared, which removes the staged preview state and preview card without applying any of that profile's shell toggles or hotkeys to the live paused session.
- Reason: Preview state is an imported candidate, not a tentative runtime mutation, so users need a direct way to abandon it without applying or replacing it with another import.
- Consequence: Future shell or preference-profile preview flows should keep preview dismissal separate from apply and should leave live session state unchanged when a preview is discarded.

### 2026-03-11: Shell-profile imports should preview validated changes before apply and still support session-only fallback

- Decision: Paused-menu `Import Shell Profile` now accepts only versioned `deep-factory.shell-profile` envelopes whose shell-toggle booleans and shell hotkeys validate exactly, stores the validated selection as a paused-menu preview, and leaves `Apply Shell Profile` as the step that reapplies those toggles plus hotkeys to the live paused session even if browser shell storage cannot be rewritten.
- Reason: Imported preference bundles are explicit user-selected artifacts, so malformed fields should still fail loudly, but previewing a valid profile before mutating live paused-session bindings makes hotkey and toggle changes easier to inspect and less surprising.
- Consequence: Future shell or preference-profile imports should keep validation-plus-preview separate from runtime mutation, reject malformed payloads with surfaced validation reasons instead of partially defaulting them, and may preserve valid applies as current-session-only state when persistence writes fail.

### 2026-03-11: Shell-profile export should snapshot live paused-session shell state instead of storage

- Decision: Paused-menu `Export Shell Profile` now builds a versioned `deep-factory.shell-profile` envelope from the live paused-session shell-toggle state plus the current in-world shell-action hotkey set owned by `src/main.ts`, then downloads that detached snapshot through dedicated shell-profile helpers.
- Reason: Browser shell storage can be unavailable, stale, or intentionally bypassed while the current paused session still has the exact shell layout and hotkeys that will resume in this tab, so export should preserve the live runtime state without mutating it.
- Consequence: Future shell-profile import/export or broader preference-profile work should reuse the versioned shell-profile helper and runtime-owned shell state instead of serializing raw browser storage payloads directly.

### 2026-03-11: Replication diagnostics restore-holder presence callback target refreshes should reuse holder-owned logger-bundle state

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackStateHolder.ts` now retains its current optional restore-wiring logger bundle and exposes `refreshHolder(...)`, which rebuilds the detached presence reconfigure-and-log callback only from updated restore-holder target state while keeping the holder-owned public callback seam stable.
- Reason: Transport lifecycle code needs one narrow refresh path for swapped restore-holder wiring without repeatedly threading unchanged restore-wiring logger bundles back through integration-owned wiring or rebinding downstream callback consumers.
- Consequence: Future restore-holder presence callback refresh helpers should use this holder-owned target refresh path when only restore-holder wiring changes, and reserve full `reconfigure(...)` for combined holder-plus-bundle changes.

### 2026-03-11: First-launch persistence preview should follow world-save storage availability

- Decision: `createFirstLaunchMainMenuShellState(...)` now accepts persisted world-save storage availability and switches its `Persistence Preview` card from `resume after first pause` guidance to a storage-unavailable warning when browser resume storage cannot be opened during boot.
- Reason: First-launch shell guidance should only promise resumable browser saves when the top-level world-save persistence path is actually available; otherwise the menu needs to set expectations before the first session starts.
- Consequence: Future first-launch resume or persistence-preview UI should consume persisted world-save availability instead of assuming browser resume can always be created after the first pause.

### 2026-03-11: Replication diagnostics restore-holder presence callback bundle refreshes should reuse holder-owned target state

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackStateHolder.ts` now retains its current restore-holder target and exposes `refreshLoggerBundle(...)`, which rebuilds the detached presence reconfigure-and-log callback only from updated restore-wiring logger-bundle state while keeping the holder-owned public callback seam stable.
- Reason: Transport lifecycle code needs one narrow refresh path for swapped presence loggers without repeatedly threading unchanged restore-holder targets back through integration-owned wiring or rebinding downstream callback consumers.
- Consequence: Future restore-holder presence callback refresh helpers should use this holder-owned bundle refresh path when only restore-wiring logger sinks change, and reserve full `reconfigure(...)` for target-holder changes.

### 2026-03-11: Replication diagnostics restore-holder presence callback holders should own the stable detached public reconfigure seam

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackStateHolder.ts` now stores the current detached presence reconfigure-and-log callback reconfiguration internally and exposes one holder-owned detached `reconfigureAndLogFromPresenceSnapshot(...)` seam while `reconfigure(...)` swaps the restore-holder target and optional restore-wiring logger bundle underneath it.
- Reason: Transport lifecycle wiring needs one callback object it can retain across restore-holder and presence-logger wiring changes without rebinding downstream callsites every time the callback target changes.
- Consequence: Future restore-holder presence callback refresh helpers should update this state holder's stored target state instead of recreating detached callbacks ad hoc at integration sites.

### 2026-03-11: Replication diagnostics restore-holder presence callback reconfiguration should rebuild only the detached callback seam

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackReconfiguration.ts` now returns a fresh detached `reconfigureAndLogCallback` built only from the current restore-holder plus optional restore-wiring logger bundle.
- Reason: The upcoming presence-callback state holder needs one narrow rebuild seam when holder wiring or shared bundle state changes, while live runtime and restore-lifecycle loggers already belong to the callback invocation contract.
- Consequence: Future restore-holder presence callback holders should rebuild callback identity through this reconfiguration helper instead of calling the factory directly or mixing holder-plus-bundle rebuild logic into their public methods.

### 2026-03-11: Replication diagnostics restore-holder presence callbacks should capture holder and bundle, not live logger inputs

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback.ts` now creates reusable restore-holder presence callbacks by closing over one holder plus optional restore-wiring logger bundle while accepting presence snapshots and live logger inputs per call.
- Reason: The upcoming presence-callback reconfiguration helper should only need to rebuild callback identity when holder or bundle state changes, not when each call supplies different live runtime or restore-lifecycle loggers.
- Consequence: Future restore-holder presence callback layers should pass live logger inputs through the callback invocation contract instead of closing over them at callback-construction time.

### 2026-03-11: Replication diagnostics restore-holder presence reconfigure-and-log helpers should log cloned line snapshots

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLog.ts` now snapshots previous and next detached `{ hasRestoreCallback }` state around one holder presence reconfigure, returns detached summary plus restore-wiring line and text output, and forwards only a cloned line-array view through the optional presence-change logger bundle.
- Reason: The upcoming reusable presence reconfigure callback factory needs one source of truth for returned restore-wiring diffs that does not let sink-side mutation rewrite the helper's result.
- Consequence: Future restore-holder presence callbacks should build on this helper instead of recomputing holder diffs manually or passing returned line arrays directly into logger bundles.

### 2026-03-11: Replication diagnostics restore-holder presence bundles should compose text before line through one shared sink

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle.ts` now composes optional restore-holder presence text and line loggers in `text`, then `line` order through one shared sink.
- Reason: The upcoming reconfigure-and-log helper needs one reusable restore-wiring bundle seam with deterministic callback order and shared input handling instead of branching over text/line combinations at each callsite.
- Consequence: Future restore-holder presence logging flows should accept one optional bundle or build one through this helper rather than wiring text and line callbacks independently.

### 2026-03-11: Replication diagnostics restore-holder presence line loggers should clone line arrays before callback invocation

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger.ts` now forwards restore-holder presence line arrays by cloning the supplied lines before invoking the injected callback.
- Reason: Restore-holder presence line loggers need mutation isolation before the upcoming shared bundle wiring, and sharing one mutable restore-wiring line array across sibling callbacks would let one sink corrupt the others.
- Consequence: Future restore-holder presence fan-out or bundle helpers should treat cloned line-array views as the per-sink boundary instead of sharing one mutable restore-wiring line array across callbacks.

### 2026-03-11: Replication diagnostics restore-holder presence text sinks should format shared line arrays at call time

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger.ts` now forwards restore-holder presence text by formatting the supplied restore-wiring line arrays when the sink is invoked instead of requiring callers to prejoin text first.
- Reason: Restore-holder presence text logging needs to share detached line arrays with sibling sinks, and rebuilding joined text outside the sink would duplicate the shared ordering and separator rules from the restore-holder presence text formatter.
- Consequence: Future restore-holder presence bundles or reconfigure-and-log helpers should pass shared line arrays through this sink helper instead of assembling ad hoc restore-wiring console text before callback fan-out.

### 2026-03-11: Replication diagnostics restore-holder presence text should join provided lines without reordering

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextFormatting.ts` now formats restore-holder presence text by joining the provided `RestoreCallbackPresenceChange` and `RestoreCallbackPresenceDiff` lines with newline separators and no extra framing.
- Reason: The upcoming restore-wiring text logger and bundle helpers need one text source of truth that preserves the shared line order and keeps empty input stable without inventing new section rules.
- Consequence: Future restore-holder presence text or text-logger helpers should reuse this formatter instead of rebuilding joined console text from summaries or relabeling the line section.

### 2026-03-11: Replication diagnostics restore-holder presence diff logs should use fixed restore-wiring labels

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineFormatting.ts` now renders detached restore-holder presence summaries as `RestoreCallbackPresenceChange` and `RestoreCallbackPresenceDiff`, with the diff line listing only `hasRestoreCallback` or the explicit placeholder `none`.
- Reason: The upcoming restore-wiring text and logger helpers need one stable label vocabulary that distinguishes wiring transitions from enabled-to-enabled logger refreshes without reinterpreting the detached presence summary.
- Consequence: Future restore-holder presence text or line logger helpers should reuse this formatter and label order instead of assembling ad hoc restore-wiring diff strings.

### 2026-03-11: Replication diagnostics restore callback holder presence diffs should compare detached install-state snapshots

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary.ts` now summarizes previous-versus-next detached `{ hasRestoreCallback }` snapshots into `changed` and `hasRestoreCallbackChanged` flags.
- Reason: Upcoming restore-wiring lifecycle formatters need one stable diff seam that keys off detached holder presence state, and enabled-to-enabled logger refreshes should not be mistaken for restore-wiring churn.
- Consequence: Future restore-holder presence line or text formatters should consume this summary helper instead of comparing holder internals, callback identity, or restore-lifecycle logger sets directly.

### 2026-03-11: Replication diagnostics restore callback presence snapshots should decide install state while filtering extra lifecycle loggers

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder.ts` now exposes `reconfigureFromPresenceSnapshot(...)`, and the transport-facing presence reconfigure helper resolves detached `{ hasRestoreCallback }` flags into either enabled restore wiring with supplied restore-lifecycle loggers or a disabled restore seam that clears any previously installed restore-lifecycle loggers.
- Reason: Transport lifecycle code needs one detached installed-state contract that can drive enable, disable, and enabled-to-enabled refresh flows without inferring intent from optional callback presence or accidentally leaving stale lifecycle loggers attached after a `false` snapshot.
- Consequence: Future restore-holder presence diff or formatting helpers should treat the detached presence snapshot as the source of truth for wiring state and should ignore extra supplied restore-lifecycle loggers whenever that snapshot is disabled.

### 2026-03-11: Replication diagnostics restore callback holder refreshes should reuse holder-owned target state

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder.ts` now retains its current target holder plus registry configuration and exposes `refreshLoggers(...)`, which reapplies live runtime and restore-lifecycle loggers onto the existing holder-owned restore seam while requiring restore wiring to already be enabled.
- Reason: Transport lifecycle code needs one narrow refresh path for swapped live logger functions without repeatedly threading unchanged holder or registry state back through transport-owned wiring or accidentally turning refreshes into enable or disable transitions.
- Consequence: Future presence-snapshot reconfigure helpers should use this holder-owned refresh path when restore wiring stays enabled, and should reserve `reconfigure(...)` for full target-holder or enabled-state changes.

### 2026-03-11: Replication diagnostics restore callback holder presence snapshots should expose installed state only

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder.ts` now reports restore wiring through a detached `{ hasRestoreCallback }` snapshot instead of exposing the live restore callback or invoker identities.
- Reason: Transport lifecycle code needs stable introspection that survives active-to-active reconfiguration without leaking function references or making downstream callers compare implementation identity.
- Consequence: Future restore-holder refresh or reconfigure helpers should consume this detached presence snapshot as the source of truth for installed restore wiring rather than reading holder internals or comparing callback references.

### 2026-03-11: Replication diagnostics restore callback holders should own the stable public restore seam

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder.ts` now stores the current restore-callback reconfiguration internally and exposes one holder-owned `restoreConfigurationSnapshot(...)` entrypoint while `reconfigure(...)` swaps the underlying nullable callback-plus-invoker pair.
- Reason: Transport lifecycle wiring needs one persistent object seam that callers can keep invoking while restore-lifecycle logging is enabled, disabled, or later rebuilt from different live runtime callbacks.
- Consequence: Future restore-callback presence snapshots and refresh helpers should extend this holder instead of passing raw callback or invoker functions around as transport-owned mutable state.

### 2026-03-11: Replication diagnostics restore callback reconfiguration should rebuild the nullable callback and public invoker together

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration.ts` now returns both the nullable restore callback and the matching no-op-safe restore invoker in one reconfiguration result.
- Reason: Transport lifecycle wiring needs one rebuild seam that keeps the internal optional callback and the always-callable public restore entrypoint synchronized when live runtime or restore-lifecycle loggers change.
- Consequence: Future restore-callback holders should store and refresh this paired reconfiguration result together instead of rebuilding the invoker separately from holder-owned callback state.

### 2026-03-11: Replication diagnostics restore callback invokers should stay branch-free while preserving active callback behavior

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker.ts` now wraps one nullable restore callback into an always-callable restore entrypoint that returns `null` when no callback is installed and otherwise forwards the active callback result and errors unchanged.
- Reason: Transport lifecycle wiring needs one stable restore seam that callers can invoke without branching on nullable callback installation, but enabled restore flows still need the shared lifecycle-emission contract and validation failures from the active callback.
- Consequence: Future restore-callback reconfiguration and holder helpers should build their public restore entrypoint through this invoker instead of exposing the nullable callback directly or swallowing active restore errors.

### 2026-03-11: Replication diagnostics restore callbacks should only be installed through the nullable factory when restore-lifecycle logging is configured

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackFactory.ts` now returns `null` when no restore-lifecycle text, line, or payload logger is configured and otherwise builds the shared restore-lifecycle logger bundle plus reusable restore callback through the existing callback creator.
- Reason: Transport lifecycle wiring needs one stable way to skip unused restore-lifecycle callback installation while still reusing the shared restore-lifecycle bundle and restore callback composition when any lifecycle sink is enabled.
- Consequence: Future restore-callback invoker, reconfiguration, and holder helpers should treat `null` from this factory as the disabled restore-lifecycle state instead of rebuilding the bundle-or-null branching ad hoc.

### 2026-03-11: Replication diagnostics restore-lifecycle mixed logger bundles should compose through the shared restore sink order

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle.ts` now composes optional restore-lifecycle text, line, and payload loggers in `text`, `line`, then `payload` order through the shared restore-lifecycle fan-out sink.
- Reason: Restore-aware caller code needs one reusable logger bundle seam with deterministic callback order and shared sink-side mutation isolation instead of branching over every callback combination.
- Consequence: Future restore-and-log helpers should accept one optional restore-lifecycle mixed logger bundle or build one through this helper rather than wiring text, line, and payload callbacks independently.

### 2026-03-11: Replication diagnostics restore-lifecycle fan-out sinks should clone payloads and line arrays per sink

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink.ts` now forwards restore-lifecycle emissions to each downstream sink through cloned payload data plus cloned lifecycle line arrays while reusing the emission-owned `lifecycleText`.
- Reason: Multiple restore-lifecycle sinks need the same mutation isolation as the periodic diagnostics fan-out path, but the joined lifecycle text is already immutable and should stay the shared text source of truth.
- Consequence: Future restore-lifecycle mixed logger bundles should compose through this helper instead of cloning payloads or lifecycle line arrays ad hoc around each callback.

### 2026-03-11: Replication diagnostics restore-lifecycle text loggers should consume emission-owned joined text

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger.ts` now forwards `emission.lifecycleText` directly to the injected callback.
- Reason: Restore-lifecycle emissions already carry joined text beside detached payload and lifecycle line arrays, so rebuilding text inside the adapter would duplicate lifecycle formatting rules and risk drift from the shared emission contract.
- Consequence: Future restore-lifecycle fan-out or mixed-logger helpers should treat emitted `lifecycleText` as the text source of truth and leave payload or line detachment to the sibling adapters.

### 2026-03-11: Replication diagnostics restore-lifecycle line loggers should clone line arrays before callback invocation

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger.ts` now forwards restore-lifecycle line arrays by cloning the emitted `configurationChangeLines` and `configurationRestoreLines` before invoking the injected callback.
- Reason: Restore-lifecycle line loggers need the same mutation isolation as payload loggers, but the restore-lifecycle adapter path still does not have a shared fan-out wrapper that detaches mutable line arrays for each sink.
- Consequence: Future restore-lifecycle fan-out or mixed-logger helpers should treat cloned line-array views as the per-sink boundary instead of sharing one mutable lifecycle-lines object across sibling callbacks.

### 2026-03-11: Replication diagnostics restore-lifecycle payload loggers should clone payloads before callback invocation

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger.ts` now forwards restore-lifecycle payloads by cloning the emitted payload before invoking the injected callback.
- Reason: Restore-lifecycle payload loggers need the same mutation isolation that the periodic diagnostics sink stack already provides, but the restore-lifecycle adapter path does not yet have a shared fan-out sink cloning wrapper.
- Consequence: Future restore-lifecycle line, text, or fan-out helpers should preserve this per-sink detachment rule instead of sharing one mutable emitted payload object across sibling callbacks.

### 2026-03-11: Replication diagnostics restore-lifecycle emissions should carry both snapshots plus shared formatted output

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission.ts` now emits restore-lifecycle data as one detached payload containing the previous and restored configuration snapshots plus their change summary, alongside separately detached lifecycle line arrays and joined text.
- Reason: Transport lifecycle logging needs one source of truth that captures both sides of a restore and the shared formatting derived from that restore, without requiring later sinks to re-read holder state or recompute diffs after mutation-sensitive reapply steps.
- Consequence: Future restore-lifecycle payload, line, or text logger helpers should consume this emission object instead of rebuilding previous-versus-restored snapshot comparisons or lifecycle strings ad hoc.

### 2026-03-11: Replication diagnostics lifecycle text sinks should format shared line arrays at call time

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationLifecycleTextLogger.ts` now forwards lifecycle text by formatting the supplied configuration-change and configuration-restore line arrays when the sink is invoked instead of requiring callers to prejoin text first.
- Reason: Lifecycle text sinks need to share detached line arrays with sibling loggers, and rebuilding joined text outside the sink would duplicate the shared ordering and separator rules from the lifecycle text formatter.
- Consequence: Future lifecycle fan-out, restore-emission, or text-only logger helpers should pass shared line arrays through this sink helper instead of assembling ad hoc configuration lifecycle console text before callback fan-out.

### 2026-03-11: Replication diagnostics lifecycle text should keep diff lines ahead of restore lines

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationLifecycleTextFormatting.ts` now formats lifecycle console text by joining the full `ConfigurationChange` section before the full `ConfigurationRestore` section while otherwise preserving the provided line order inside each section.
- Reason: Transport lifecycle logging needs one stable text order that explains configuration drift before the reapplied snapshot, and later sink or emission helpers should not have to guess how to concatenate those preformatted line arrays.
- Consequence: Future diagnostics logger lifecycle sinks or restore-emission helpers should reuse this formatter instead of manually joining or reordering configuration lifecycle line arrays.

### 2026-03-11: Replication diagnostics restore logs should inline diff labels beside restored values

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationRestoreLineFormatting.ts` now renders restore lifecycle lines as `ConfigurationRestore`, `ConfigurationRestoreSchedule`, and `ConfigurationRestoreCallbacks`, placing restored schedule and callback values beside inline diff labels while disabled cadence values render as `n/a`.
- Reason: Restore logging needs to show both the reapplied detached snapshot and the already-computed configuration drift in one stable line array so later lifecycle text helpers do not have to merge raw snapshot fields and diff labels ad hoc.
- Consequence: Future diagnostics logger restore or lifecycle text formatters should reuse this restore-line helper instead of formatting restored snapshot fields and diff labels separately.

### 2026-03-11: Replication diagnostics configuration diff logs should use fixed label order

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationChangeLineFormatting.ts` now renders lifecycle diff lines as `ConfigurationChange`, `ConfigurationScheduleDiff`, and `ConfigurationCallbackDiff`, listing only changed schedule fields in `disabled`, `intervalTicks`, `nextDueTick` order and changed callback fields in `hasTextLogger`, `hasLineLogger`, `hasPayloadLogger` order while unchanged groups emit `none`.
- Reason: The upcoming restore-line and lifecycle-text helpers need one deterministic label vocabulary and field order so transport lifecycle logging stays stable across summary-only and restore-aware formatting paths.
- Consequence: Future diagnostics logger lifecycle formatters should reuse this helper and label order instead of assembling ad hoc diff strings from configuration snapshots.

### 2026-03-11: Replication diagnostics configuration snapshot restores should compose decode and holder reapply

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotRestore.ts` now restores unknown diagnostics logger configuration payloads through one transport-facing helper that decodes the detached snapshot and reapplies it onto one existing holder using the supplied registry and live callbacks.
- Reason: Transport lifecycle code needs one restore seam for unknown payloads so callers do not hand-roll decode, callback-validation, and holder-reapply ordering or drift from the detached snapshot contract.
- Consequence: Future diagnostics logger persistence or lifecycle restore flows should call this helper instead of decoding unknown payloads and invoking holder snapshot reconfigure separately.

### 2026-03-11: Replication diagnostics configuration snapshot callback checks should reuse one transport-facing validator

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotCallbackValidation.ts` now validates and filters one supplied text, line, and payload logger callback set against detached configuration-snapshot callback-presence flags, throwing only when a required callback type is missing while ignoring extra supplied callbacks that the snapshot does not enable.
- Reason: Transport restore and reapply flows need one reusable pre-reapply seam for callback-presence enforcement, and scattering those checks across holders or restore helpers would risk drift from the detached snapshot contract.
- Consequence: Future diagnostics logger restore helpers should validate supplied live callbacks through this helper before reapply instead of open-coding snapshot flag checks or attaching every supplied callback unconditionally.

### 2026-03-11: Replication diagnostics configuration snapshot decoding should reject impossible disabled and enabled states

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationSnapshotDecode.ts` now decodes unknown diagnostics logger `{ schedule, callbacks }` payloads by requiring disabled snapshots to keep `intervalTicks` and `nextDueTick` null with all callback-presence flags false, while enabled snapshots must provide a positive `intervalTicks`, a non-negative `nextDueTick`, and at least one callback-presence flag.
- Reason: Persistence and transport handoff need one canonical validation seam before detached configuration JSON is diffed or reapplied, and accepting impossible snapshot shapes would let later holder lifecycle code observe states that no live holder can emit.
- Consequence: Future diagnostics logger configuration import or restore helpers should decode unknown payloads through this helper instead of casting JSON directly to the snapshot type or revalidating enabled-versus-disabled invariants ad hoc.

### 2026-03-11: Replication diagnostics configuration diffs should compare detached snapshot fields

- Decision: `src/network/replicationDiagnosticsLoggerConfigurationChangeSummary.ts` now summarizes previous-versus-next detached diagnostics logger configuration snapshots by comparing schedule `disabled`, `intervalTicks`, and `nextDueTick` fields plus callback-presence booleans, returning grouped change flags instead of diffing holder internals or live callback references.
- Reason: Transport lifecycle and persistence code needs one JSON-safe way to detect diagnostics logger configuration drift between exports, restores, and reconfigurations without depending on runner state or function identity.
- Consequence: Future diagnostics logger configuration restore or logging helpers should diff detached `{ schedule, callbacks }` snapshots through this summary helper and should treat its flags as the source of truth for configuration change detection.

### 2026-03-11: Paused-menu shell hotkey remaps should reuse the shared keybinding validator and save path

- Decision: The paused main-menu shell hotkey editor now routes each attempted `Main Menu`, `Recenter Camera`, `Debug HUD`, `Edit Panel`, `Edit Overlays`, and `Spawn Marker` remap through `src/input/shellActionKeybindings.ts`, applies valid results immediately to the live paused session through `src/main.ts`, and treats browser-storage write failures as session-only fallback instead of discarding the valid remap; valid no-op re-saves are still allowed so a recovered safe set can replace previously invalid persisted payloads.
- Reason: The paused summary, in-world shell chrome, shortcuts overlay, touch keyboard reference, and keyboard shortcut resolver all consume the same binding set, so ad hoc UI-side mutation or raw storage writes would drift those surfaces and leave stale invalid payloads behind.
- Consequence: Future shell hotkey reset, import/export, or fallback-clearing flows should reuse the shared remap-plus-save-or-session-fallback path instead of mutating stored keybinding JSON directly or bypassing the runtime refresh path.

### 2026-03-10: Replication diagnostics configuration snapshots should reapply through live callbacks, not serialized functions

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now reapplies detached configuration snapshots through `reconfigureFromConfigurationSnapshot(...)`, which accepts a registry plus live text, line, and payload logger callbacks separately, keeps disabled snapshots disabled, and uses snapshot callback-presence flags to choose which supplied callbacks become active.
- Reason: The detached configuration snapshot is intentionally JSON-safe and cannot own function references, but transport lifecycle code still needs one holder-owned path to restore enabled or disabled logger state without bypassing the existing reconfiguration validation path.
- Consequence: Future diagnostics logger snapshot restore helpers should pass live callbacks beside the detached snapshot and let snapshot callback-presence flags control which callback types are reattached, rather than widening the snapshot shape to contain functions.

### 2026-03-10: Replication diagnostics logger configuration snapshots should null disabled schedule cadence

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now exposes `getConfigurationSnapshot()` as a detached `{ schedule, callbacks }` export where disabled holders report `schedule: { disabled: true, intervalTicks: null, nextDueTick: null }`, while enabled holders report the active `intervalTicks` and current `nextDueTick` beside the separate callback-presence flags.
- Reason: Transport lifecycle code needs one JSON-safe diagnostics logger configuration export for later reapply and diff helpers, and disabled holders should not present inert cadence numbers as if they were still active schedule state.
- Consequence: Future diagnostics logger snapshot reconfigure or diff helpers should consume this detached configuration shape instead of reading runner state or raw holder configuration directly.

### 2026-03-10: Replication diagnostics callback-presence snapshots should stay separate from schedule snapshots

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now exposes `getCallbackPresenceSnapshot()` as a separate `{ hasTextLogger, hasLineLogger, hasPayloadLogger }` snapshot instead of widening `getScheduleSnapshot()`.
- Reason: Transport lifecycle code needs callback-presence introspection for later configuration export work, but the existing schedule snapshot should stay focused on disabled-versus-next-due state.
- Consequence: Future holder configuration helpers should compose schedule and callback-presence snapshots together when they need a fuller view, rather than expanding the schedule snapshot contract.

### 2026-03-10: Enabled replication diagnostics holder schedule-cadence-and-callback refreshes should preserve only the registry

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now retains its current registry, and `refreshScheduleAndCadenceAndCallbacks(...)` reapplies explicit `nextDueTick`, `intervalTicks`, plus logger callbacks on enabled holders without re-reading runner internals.
- Reason: Transport lifecycle code needs one holder-owned path for replacing all mutable diagnostics logger settings together while keeping the owning registry stable and validation centralized in the shared reconfiguration path.
- Consequence: Future full-holder refresh helpers should reuse holder-owned registry state and should route validation through reconfiguration instead of mutating cadence or callback subparts independently.

### 2026-03-10: Enabled replication diagnostics holder schedule-and-cadence refreshes should preserve callbacks

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now retains its current registry and logger callback configuration, and `refreshScheduleAndCadence(...)` reapplies explicit `nextDueTick` plus `intervalTicks` on enabled holders without changing the current logger callbacks.
- Reason: Transport lifecycle code needs one holder-owned path for retargeting both diagnostics schedule values together without forcing callers to resupply unchanged logger sinks around that refresh.
- Consequence: Future holder refresh helpers that change schedule and cadence together should reuse holder-owned callback state instead of rebuilding sink configuration outside the holder.

### 2026-03-10: Enabled replication diagnostics holder schedule-plus-callback refreshes should preserve cadence

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now retains its current registry and `intervalTicks`, and `refreshScheduleAndCallbacks(...)` reapplies an explicit `nextDueTick` plus logger callbacks on enabled holders without changing the current cadence.
- Reason: Transport lifecycle code needs one holder-owned path for retargeting the next diagnostics boundary while swapping sinks, without forcing callers to resupply unchanged cadence settings.
- Consequence: Future schedule-composition helpers should preserve holder-owned cadence through the same internal configuration snapshot instead of rebuilding it outside the holder.

### 2026-03-10: Enabled replication diagnostics holder schedule refreshes should preserve cadence and callbacks

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now retains its current registry, `intervalTicks`, and logger callback configuration, and `refreshSchedule(...)` reuses holder-owned configuration to swap only `nextDueTick` on enabled holders.
- Reason: Transport lifecycle code needs to retarget the next diagnostics boundary without forcing callers to rebuild unchanged cadence or logger callback settings around that schedule change.
- Consequence: Future holder schedule-composition helpers should reuse the holder-owned non-schedule configuration when they override `nextDueTick`, instead of asking callers to thread unchanged cadence or callback settings back into the holder.

### 2026-03-10: Enabled replication diagnostics holder cadence-plus-callback refreshes should preserve the current due tick

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now retains its current registry and logger callback configuration, and `refreshCadenceAndCallbacks(...)` reuses `getScheduleSnapshot()` to swap `intervalTicks` plus logger callbacks on enabled holders without changing the current `nextDueTick`.
- Reason: Transport lifecycle code needs one narrow holder-owned path for simultaneous cadence and sink updates without forcing callers to thread the countdown state or unchanged registry back in manually.
- Consequence: Future holder refresh helpers that change multiple diagnostics settings together should reuse the holder-owned configuration snapshot plus schedule snapshot instead of rebuilding partial state outside the holder.

### 2026-03-10: Enabled replication diagnostics holder cadence refreshes should preserve the current due tick

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now retains its current registry and logger callback configuration, and `refreshCadence(...)` reuses `getScheduleSnapshot()` to swap `intervalTicks` on enabled holders without changing the current `nextDueTick`.
- Reason: Transport lifecycle code needs to adjust periodic diagnostics cadence without forcing callers to track and resupply an already-counting-down due tick or unchanged logger callbacks.
- Consequence: Future combined cadence-plus-callback or schedule refresh helpers should reuse the holder-owned configuration plus schedule snapshot instead of rebuilding cadence state outside the holder.

### 2026-03-10: First-launch main-menu guidance should preview entry controls through its own card

- Decision: The first-launch `main menu` now includes a dedicated `Controls Preview` section card that lists desktop movement and jump bindings plus when the touch player pad appears after `Enter World`.
- Reason: New players need one pre-launch control summary without opening the in-world shortcuts overlay, and keeping that summary in its own card preserves the existing menu-section guidance pattern.
- Consequence: Future first-launch onboarding copy should extend dedicated section cards for entry controls or other runtime previews instead of expanding the headline or flat detail text.

### 2026-03-10: Enabled replication diagnostics holder callback refreshes should preserve the current due tick

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now retains its current registry, interval, and logger callback configuration, and `refreshCallbacks(...)` reuses `getScheduleSnapshot()` to swap callbacks on enabled holders without changing the current `nextDueTick`.
- Reason: Transport lifecycle code needs an ergonomic way to replace logger sinks after boot without forcing callers to track and resupply the holder's current schedule boundary.
- Consequence: Future cadence-refresh and combined-refresh holder helpers should reuse the holder-owned configuration snapshot plus schedule snapshot instead of asking callers to thread unchanged cadence or callback settings back in manually.

### 2026-03-10: Replication diagnostics logger holder schedule snapshots should stay narrow

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now exposes `getScheduleSnapshot()` as a narrow union that reports either `{ disabled: true, nextDueTick: null }` or `{ disabled: false, nextDueTick }` based on the holder-owned runner state.
- Reason: Upcoming holder refresh helpers need to preserve current schedule state without reading the runner directly or widening the holder API beyond transport-facing lifecycle details.
- Consequence: Future holder refresh helpers should reuse `getScheduleSnapshot()` to detect disabled logging and carry forward active `nextDueTick` values instead of reaching into runner or cadence instances.

### 2026-03-10: Replication diagnostics logger holders should own callback reconfiguration and poll through it

- Decision: `src/network/replicationDiagnosticsLoggerStateHolder.ts` now stores the current diagnostics logger reconfiguration result, exposes `poll(tick)` by calling the current nullable fixed-step callback when present, and refreshes that stored state only through `src/network/replicationDiagnosticsLoggerReconfiguration.ts`.
- Reason: Transport wiring needs one mutable owner for diagnostics logger enablement and callback swaps, but duplicating runner-plus-callback state transitions outside the shared reconfiguration helper would risk stale callback retention.
- Consequence: Future holder-oriented diagnostics helpers should treat this state holder as the owner of the current logging callback state, should call `reconfigure(...)` instead of mutating runner or callback pieces independently, and can treat disabled polling as a silent no-op through the absent callback state.

### 2026-03-10: Replication diagnostics logger reconfiguration should rebuild runner and poll callback together

- Decision: `src/network/replicationDiagnosticsLoggerReconfiguration.ts` now rebuilds both the nullable diagnostics logger runner and the matching nullable fixed-step poll callback from one set of cadence settings plus optional text, line, and payload logger callbacks.
- Reason: Later transport holders need one shared reconfiguration seam that keeps schedule ownership and fixed-step polling composition aligned instead of recreating runners and callbacks through separate code paths.
- Consequence: Future diagnostics logger holders should swap active logging through this helper, and should treat the returned `null` runner-and-callback pair as the only disabled state instead of caching stale callbacks across reconfiguration.

### 2026-03-10: Fixed-step replication diagnostics polling should no-op only when the runner is absent

- Decision: `src/network/replicationDiagnosticsLoggerPoll.ts` now lifts one nullable diagnostics logger runner into a raw-`tick` fixed-step callback that returns a silent no-op only when the runner is `null`, and otherwise delegates directly to `runner.poll({ tick })`.
- Reason: Update-loop wiring needs one narrow callback shape for diagnostics polling, but active logging should keep the runner's existing cadence behavior and tick validation instead of introducing a second polling contract that can drift from the runner.
- Consequence: Future diagnostics callback reconfiguration or state-holder helpers should rebuild and store this callback shape for fixed-step wiring, and should keep `null` confined to the runner-or-callback disabled state rather than adding more special-case branches at poll call sites.

### 2026-03-10: Replication diagnostics logger factories should short-circuit to null before cadence creation

- Decision: `src/network/replicationDiagnosticsLoggerFactory.ts` now returns `null` when text, line, and payload logger callbacks are all omitted, and only builds the cadence, bundle, and runner stack when at least one logger callback is configured.
- Reason: Transport code needs one narrow seam that can disable periodic diagnostics cleanly without carrying an unused silent runner or forcing callers to satisfy cadence validation for logging that will never poll.
- Consequence: Future nullable polling and reconfiguration helpers should treat `null` as the disabled diagnostics state and should rebuild active logging through this factory instead of instantiating empty bundles or cadences directly.

### 2026-03-10: Mixed replication diagnostics logger runners should reuse the shared sink wrapper

- Decision: `src/network/replicationDiagnosticsLoggerRunner.ts` now builds a dedicated ready-to-poll runner by wrapping one existing cadence plus one existing mixed logger bundle inside `AuthoritativeClientReplicationDiagnosticsLogSink`.
- Reason: The runner layer needs a transport-facing type above the mixed bundle, but reusing the existing sink wrapper preserves its due-only polling and emission-cloning behavior instead of duplicating that logic.
- Consequence: Future nullable factories and poll helpers should build on this runner helper rather than bypassing it or reconstructing cadence-plus-sink composition by hand.

### 2026-03-10: Mixed replication diagnostics logger bundles should compose optional adapters in a fixed order

- Decision: `src/network/replicationDiagnosticsLoggerBundle.ts` now adapts any configured text, line, and payload logger callbacks into one due-only sink by wiring the existing adapters through the fan-out sink in text, line, then payload order.
- Reason: Transport code needs one narrow mixed-logger seam above the individual adapters so later runner and factory helpers do not rebuild optional sink lists by hand or drift in side-effect ordering.
- Consequence: Future diagnostics logger runner and factory helpers should build mixed logging through this bundle helper, should treat omitted callbacks as omitted sinks rather than ad hoc conditionals, and should leave the "no logger configured" null short-circuit to higher-level factory layers instead of special-casing it here.

### 2026-03-10: Periodic replication diagnostics emissions should expose frozen payloads beside text and lines

- Decision: `src/network/replicationDiagnosticsLogEmission.ts` now returns the frozen structured log `payload` beside detached `logLines`, joined `logText`, and `nextDueTick`, and the cadence plus sink layers forward that payload with explicit `null` on silent polls.
- Reason: Structured transport sinks need the same detached per-emission aggregate and client snapshot data that text and line loggers already reuse, and that payload should travel through the existing due-only logging seam instead of being recomputed downstream.
- Consequence: Future payload-oriented diagnostics loggers should consume the emission-owned `payload` through cadence or sink results, and any sink or fan-out helper that clones emissions should clone the payload together with `logLines`.

### 2026-03-10: Replication diagnostics fan-out sinks should clone each downstream emission

- Decision: `src/network/replicationDiagnosticsFanOutSink.ts` now forwards one due diagnostics emission to multiple sink callbacks in declaration order while cloning the emission, including `logLines`, for each downstream sink.
- Reason: Text and line logger adapters need to share one cadence emission without one sink's mutation of its received line array leaking into the next sink or forcing every caller to reimplement ordered fan-out.
- Consequence: Future mixed diagnostics logger wiring should compose multiple sinks through this helper, should rely on declaration order for side effects, and should treat each sink callback as receiving its own isolated emission copy.

### 2026-03-10: Structured replication diagnostics loggers should consume detached payloads through a sink adapter

- Decision: `src/network/replicationDiagnosticsPayloadLogger.ts` now adapts one injected `(payload) => void` callback into an `AuthoritativeClientReplicationDiagnosticsLogSinkCallback` by forwarding only `emission.payload`.
- Reason: Structured transport logging should reuse the existing due-only sink path and should not rebuild payload data when joined text and detached lines may still be needed by other loggers.
- Consequence: Future payload-oriented diagnostics loggers should compose through this helper, should treat the received payload as their sink-owned copy, and should leave text and line output available for separate adapters.

### 2026-03-10: Line-array replication diagnostics loggers should consume detached emitted lines through a sink adapter

- Decision: `src/network/replicationDiagnosticsLineLogger.ts` now adapts one injected `(logLines) => void` callback into an `AuthoritativeClientReplicationDiagnosticsLogSinkCallback` by forwarding only `emission.logLines`.
- Reason: Line-oriented transport logging should reuse the existing due-only sink path and should not split joined text when later text or structured loggers may still need `logText`.
- Consequence: Future line-oriented diagnostics loggers should compose through this helper, should treat the received `logLines` array as their sink-owned copy, and should leave joined `logText` available for separate logger adapters.

### 2026-03-10: Console-style replication diagnostics loggers should consume joined emitted text through a sink adapter

- Decision: `src/network/replicationDiagnosticsTextLogger.ts` now adapts one injected `(logText) => void` callback into an `AuthoritativeClientReplicationDiagnosticsLogSinkCallback` by forwarding only `emission.logText`.
- Reason: Text-oriented transport logging should reuse the existing due-only sink path and should not rejoin detached lines when other sinks may still need the original `logLines`.
- Consequence: Future console-style diagnostics loggers should compose through this helper, should treat joined `logText` as the source of truth for text output, and should leave detached `logLines` available for separate line-oriented or fan-out sinks.

### 2026-03-10: Replication diagnostics sink callbacks should receive due-only cloned line arrays beside joined text

- Decision: `src/network/replicationDiagnosticsLogSink.ts` now wraps `AuthoritativeClientReplicationDiagnosticsLogCadence` and invokes its injected sink only when cadence emits, forwarding `nextDueTick`, joined `logText`, and a cloned `logLines` array.
- Reason: Transport logger adapters need one side-effect seam above cadence that forwards both text and line output without duplicating due-tick checks or letting sink mutation leak back into the returned poll result.
- Consequence: Future diagnostics loggers should compose through this sink helper, should not expect sink calls on non-due polls, and should treat the sink's `logLines` array as its own isolated copy.

### 2026-03-10: Replication diagnostics cadence should forward due lines but keep non-due polls explicitly line-free

- Decision: `src/network/replicationDiagnosticsLogCadence.ts` now returns due results by forwarding the full emission contract, including detached `logLines`, while non-due polls return both `logLines: null` and `logText: null`.
- Reason: Transport polling code needs one cadence seam that can pass line-oriented diagnostics through without recomputing them, while idle ticks should remain unambiguous no-output results instead of exposing stale or empty line arrays.
- Consequence: Future cadence consumers should read `logLines` only when `emitted === true` and should preserve the current explicit null contract for non-due polls rather than inventing empty-array silent results.

### 2026-03-10: Replication diagnostics emissions should expose detached lines beside joined text

- Decision: `src/network/replicationDiagnosticsLogEmission.ts` now returns detached `logLines` beside joined `logText` for the same frozen registry snapshot.
- Reason: Alternate sinks need the exact emitted line ordering without splitting newline-joined text.
- Consequence: Future transport sinks and cadence helpers should forward emission `logLines` directly when they need line-oriented output instead of rebuilding or re-splitting the same diagnostics text.

### 2026-03-10: Whole replication diagnostics logs should expose detached line arrays before joining

- Decision: `src/network/replicationDiagnosticsLogLineFormatting.ts` now exposes a transport-facing helper that assembles the fixed diagnostics header, aggregate lines, client divider, and ordered per-client sections into one detached string array before `src/network/replicationDiagnosticsLogFormatter.ts` joins it with newlines.
- Reason: Alternate transport sinks need the shared log ordering without depending on a newline-joined formatter output and then splitting that text back into lines.
- Consequence: Future emission or cadence helpers that need reusable diagnostics lines should consume this whole-log line helper and preserve its aggregate-first, payload-order client layout instead of rebuilding root log assembly independently.

### 2026-03-10: Replication diagnostics cadence should stay silent before the due tick and reschedule from the emitted tick

- Decision: `src/network/replicationDiagnosticsLogCadence.ts` now tracks one mutable `nextDueTick`, returns a silent non-due result while `tick < nextDueTick`, and emits at most once per poll by delegating due ticks to `createAuthoritativeClientReplicationDiagnosticsLogEmission()` before resetting `nextDueTick` to that emitted tick plus the interval.
- Reason: Transport fixed-step loops need one narrow polling seam that avoids formatting logs on non-due ticks and does not burst through every missed interval after schedule slippage.
- Consequence: Future transport logging should poll this cadence helper once per fixed tick and treat a late poll as one current emission plus one new `tick + intervalTicks` boundary rather than replaying backlogged diagnostics intervals.

### 2026-03-10: Aggregate replication diagnostics log headers should be reusable as labeled line arrays

- Decision: `src/network/replicationDiagnosticsLogLineFormatting.ts` now exposes a transport-facing helper that formats one aggregate diagnostics summary into the same fixed client-count, replay, send, and resync labeled header lines used by the integrated text formatter.
- Reason: Alternative transport sinks may need to reuse the shared multi-client diagnostics header without coupling themselves to the full newline-joined formatter or rebuilding its header ordering by hand.
- Consequence: Future aggregate diagnostics sinks should consume this helper for header lines and preserve its current aggregate line order instead of hand-formatting payload totals again.

### 2026-03-10: Per-client replication diagnostics log sections should be reusable as labeled line arrays

- Decision: `src/network/replicationDiagnosticsLogLineFormatting.ts` now exposes a transport-facing helper that formats one ordered client diagnostics entry into the same fixed replay, send, and resync labeled lines plus explicit `n/a` metadata placeholders used by the integrated text formatter.
- Reason: Alternative transport sinks may need to reuse per-client diagnostics sections without coupling themselves to the full multi-client string formatter or rebuilding the same label ordering and placeholder rules.
- Consequence: Future per-client diagnostics sinks should consume this helper for client sections and preserve its current line order plus `n/a` placeholder convention instead of hand-formatting client snapshots again.

### 2026-03-10: Periodic replication diagnostics emissions should snapshot once and schedule from the emitted tick

- Decision: `src/network/replicationDiagnosticsLogEmission.ts` now snapshots the per-client diagnostics registry once per emission, builds and formats the log from that frozen snapshot, and returns `nextDueTick` as `tick + intervalTicks`.
- Reason: Transport polling loops need one deterministic log text that cannot mix aggregate and per-client data from different registry states, while still receiving one simple cadence result without reimplementing the next-boundary math themselves.
- Consequence: Future transport sinks or cadence wrappers should call this helper once per due emission and forward its returned `logText` plus `nextDueTick` instead of separately snapshotting the registry or recomputing the next periodic boundary.

### 2026-03-10: Replication diagnostics text logs should emit aggregate lines first and use explicit n-a placeholders for missing client metadata

- Decision: `src/network/replicationDiagnosticsLogFormatter.ts` now formats periodic replication diagnostics as fixed aggregate lines first, then ordered client sections, and renders missing per-client `lastProcessed`, `lastStaged`, and `lastAppliedBaseline` metadata as explicit `n/a` text.
- Reason: Operators need one stable multi-line console shape that stays diff-friendly across idle ticks, reconnect resets, and mixed client activity, while omitted or blank metadata fields would make it harder to distinguish "zero totals" from "metadata not observed yet."
- Consequence: Future extracted aggregate or per-client formatter helpers should preserve this line ordering and `n/a` placeholder convention rather than suppressing missing-metadata lines or moving client sections ahead of the aggregate header.

### 2026-03-10: Multi-client replication diagnostics log payloads should keep aggregate totals and ordered client snapshots as sibling fields

- Decision: `src/network/replicationDiagnosticsLogPayload.ts` now returns one periodic summary object with top-level `aggregate` totals plus a top-level ordered `clients` list, rather than nesting aggregate counters inside each client entry or flattening every client snapshot into one shared counter bag.
- Reason: Periodic transport logging needs one JSON-safe payload that exposes fleet-wide totals beside still-ordered per-client detail, and keeping those views as siblings lets later text formatting or emission helpers read both without reconstructing either one.
- Consequence: Future text-format and emission helpers should consume `payload.aggregate` for shared headers and iterate `payload.clients` for per-client detail instead of trying to recompute totals from client rows or duplicate aggregate counters into each client section.

### 2026-03-10: Multi-client replication diagnostics aggregates should sum totals without merging per-client last-tick metadata

- Decision: `src/network/replicationDiagnosticsAggregate.ts` now reduces ordered per-client diagnostics snapshots into `clientCount` plus aggregate replay, send, and resync totals only; it does not invent merged `lastProcessed`, `lastStaged`, or `lastAppliedBaseline` metadata.
- Reason: Periodic multi-client log headers need one stable fleet-wide counter view, but the per-client latest-tick fields have no single meaningful cross-client merge and remain more useful on the ordered client entries themselves.
- Consequence: Future replication log-payload or text-format helpers should consume this aggregate for shared totals and keep latest tick or baseline detail sourced from the per-client snapshot list instead of trying to collapse those metadata fields again.

### 2026-03-10: Registry snapshot exports should sort by ascending client id instead of insertion order

- Decision: `src/network/replicationDiagnosticsRegistrySnapshot.ts` now exports per-client diagnostics registry entries by sorting client ids in ascending string order before reading detached snapshots.
- Reason: Periodic multi-client logging needs deterministic output across reconnects, resets, and differing insertion order, while relying on `Map` iteration would couple log order to mutation history instead of client identity.
- Consequence: Future aggregate, payload, or text-log helpers should consume this ordered registry snapshot helper rather than iterating registry client ids directly or assuming insertion order is stable enough for logs.

### 2026-03-10: Per-client replication diagnostics registry reset should upsert a zeroed client snapshot

- Decision: `src/network/replicationDiagnosticsRegistry.ts` now stores detached combined diagnostics snapshots by client id, and `reset(clientId)` always replaces that client entry with a zeroed snapshot even when the client id was not already present.
- Reason: Reconnect or client-replacement flows need one registry operation that can both clear stale diagnostics for an existing client and initialize a fresh client slot without requiring transport code to special-case missing entries or share mutable snapshot objects.
- Consequence: Future ordered-snapshot or aggregate helpers should treat registry reset as a zeroed upserted client entry and should read or replace registry state through the registry accessors rather than mutating stored snapshot objects directly.

### 2026-03-10: Combined per-client replication diagnostics resets should clear every section together

- Decision: `src/network/replicationDiagnosticsReset.ts` now resets combined per-client diagnostics by clearing replay, send, and resync totals plus their latest-tick metadata together while returning a detached snapshot instead of mutating the stored one in place.
- Reason: Reconnect or client-replacement flows need one reset seam for the whole sectioned diagnostics shape so transport code does not partially zero one section, leave stale metadata behind, or couple registry state to in-place mutation.
- Consequence: Future registry or logging helpers should treat combined diagnostics resets as whole-snapshot replacement and should reuse this helper instead of manually zeroing replay, send, or resync sections.

### 2026-03-10: Combined per-client replication diagnostics snapshots should preserve replay, send, and resync as separate sections

- Decision: `src/network/replicationDiagnosticsSnapshot.ts` now produces one detached JSON-safe per-client diagnostics snapshot with explicit `replay`, `send`, and `resync` sections instead of flattening the three accumulator outputs into one mixed counter bag.
- Reason: Replay, send, and resync diagnostics use different counter meanings and metadata shapes (`applied/skipped`, `forwarded`, and baseline entity counts), so flattening them would either lose semantics or force awkward field renaming in every transport log consumer.
- Consequence: Future reset, registry, or transport logging helpers should accept and return this sectioned snapshot shape directly, and should extend a named section when they add new metadata rather than merging unlike counters together.

### 2026-03-10: Per-client send diagnostics should accumulate totals separately from the latest staged tick metadata

- Decision: `src/network/replicationSendDiagnostics.ts` now keeps running chunk and entity `dropped`, `trimmed`, and `forwarded` totals under `totals` while storing only the latest staged tick under separate `lastStaged` metadata, and empty summaries leave that metadata unchanged because they do not represent a new staged batch.
- Reason: Long-lived transport send diagnostics need cumulative send counters across many staged batches, but operators still need the most recent batch boundary, and idle summaries should not erase the last meaningful staged tick.
- Consequence: Future send-side or combined replication diagnostics should add new batch-filter summaries through this accumulator and keep later send metadata beside `lastStaged` rather than embedding per-batch state into the running totals.

### 2026-03-10: Per-client resync diagnostics should accumulate totals separately from the latest applied baseline metadata

- Decision: `src/network/replicationResyncDiagnostics.ts` now keeps running spawned, updated, and removed totals under `totals` while storing the latest applied baseline metadata under separate `lastAppliedBaseline`.
- Reason: Transport resync logs need long-lived replacement counters across many baselines, but operators still need the most recent accepted baseline boundary without overloading or resetting those totals.
- Consequence: Future transport resync or combined replication diagnostics should add new baseline summaries through this accumulator and keep later metadata additions beside `lastAppliedBaseline` rather than embedding per-baseline state into the running totals.

### 2026-03-10: Send-batch filter summaries should count forwarded payloads separately from trimmed payloads

- Decision: `src/network/replicationBatchFilterSummary.ts` now reduces one staged client send batch into `staged.tick` metadata plus chunk and entity `dropped`, `trimmed`, and `forwarded` counters, where `forwarded` includes both fully kept and trimmed payloads.
- Reason: Transport send diagnostics need to know how many messages were actually sent in one batch while still exposing how many of those forwarded payloads were trimmed by interest filtering before send.
- Consequence: Future send-side diagnostics and accumulators should consume this summary helper, treat `trimmed` as a subset of `forwarded`, and preserve the one-staged-tick invariant instead of inferring batch totals directly from raw per-message diagnostics.

### 2026-03-10: Per-client replication diagnostics should accumulate totals separately from the latest processed tick

- Decision: `src/network/replicationDiagnostics.ts` now keeps running chunk and entity `dropped`, `trimmed`, `applied`, and `skipped` totals under `totals` while storing only the latest processed fixed-step tick under separate `lastProcessed` metadata.
- Reason: Long-lived transport diagnostics need cumulative status counters across many dispatch batches, but operators still need to know which tick those totals were last updated from without resetting or overloading the counters themselves.
- Consequence: Future transport diagnostics should add new per-client batches through this accumulator and keep later metadata additions beside `lastProcessed` rather than embedding batch-boundary state into the running totals.

### 2026-03-10: Transport baseline summaries should keep baseline tick metadata but collapse raw entity ids to counts

- Decision: `src/network/replicationBaselineSummary.ts` now reduces `applyAuthoritativeReplicatedStateBaseline()` results into `baseline.tick`, `baseline.entityCount`, and `entities.spawned`, `entities.updated`, and `entities.removed` counts instead of preserving the raw spawned, updated, and removed entity-id arrays in downstream diagnostics.
- Reason: Transport resync logs and future diagnostic accumulators need concise applied-baseline metadata, while carrying full replacement id arrays past the baseline apply result adds noise without helping the common logging path.
- Consequence: Future transport resync diagnostics should consume this shared summary helper for log-ready baseline outcomes and keep the raw replacement ids only when a workflow explicitly needs per-entity detail.

### 2026-03-10: Authoritative replication dispatch summaries should keep separate chunk and entity status buckets

- Decision: `src/network/replicationDispatchSummary.ts` now reduces dispatch results into separate `chunks` and `entities` buckets with `dropped`, `trimmed`, `applied`, and `skipped` counters instead of flattening all authoritative replay outcomes into one total.
- Reason: Per-client transport diagnostics need to distinguish terrain replication health from entity replication health, and the existing filter/replay result model already exposes those status dimensions independently.
- Consequence: Future transport logging or running diagnostics should consume this shared summary helper and preserve separate chunk/entity status counters rather than merging dispatch outcomes into one aggregate figure.

### 2026-03-10: Transport-side authoritative batch filtering should separate forwarded payloads from filter diagnostics

- Decision: `src/network/replicationBatchFilter.ts` now maps staged authoritative chunk/entity batches through the existing interest filter, returns only the forwarded messages that should be sent to one client, and reports per-message `dropped`/`kept`/`trimmed` diagnostics beside that filtered batch.
- Reason: Authoritative transport code needs to send only client-relevant payloads while still logging or summarizing which staged messages were culled or trimmed, and reconstructing that from the forwarded payload alone would lose dropped-chunk information.
- Consequence: Future authoritative send loops should filter staged per-tick batches through this helper and consume its diagnostics directly instead of mutating staged arrays in place or inferring filter outcomes after the fact.

### 2026-03-10: Transport resync baseline application should wrap one world callback plus one entity baseline in the replay replacement seam

- Decision: `src/network/replicationBaseline.ts` now routes one caller-supplied world replacement callback plus one entity-snapshot baseline through `AuthoritativeReplicatedNetworkStateReplayer.replaceAuthoritativeBaseline()` and returns the applied entity replacement summary from inside that callback.
- Reason: Transport resync needs a narrower helper than the generic replay replacement seam so callers do not have to remember how to pair world replacement, entity baseline application, and post-success replay-guard clearing by hand.
- Consequence: Future transport resync code should replace world state through this helper when it also needs one entity baseline, and should consume the returned entity replacement summary instead of re-deriving spawned, updated, or removed ids after the guard reset.

### 2026-03-10: Per-tick authoritative replication staging should validate once and emit tile diffs, then wall diffs, before the entity snapshot

- Decision: `src/network/replicationStaging.ts` now validates that the caller-supplied entity snapshot already uses the staged tick before draining captured tile edits or wall edits, then stages one deterministic batch whose tile chunk diffs precede wall chunk diffs and whose cloned entity snapshot remains last for that same tick.
- Reason: Authoritative transport code needs a stable tile-before-wall-before-entity send order, and a tick mismatch should not accidentally consume pending world-layer edits for the wrong frame before the caller notices.
- Consequence: Future authoritative batching should build one entity snapshot per tick, stage it through this helper with the matching tile-edit and wall-edit captures, and treat staging failures as non-draining validation errors.

### 2026-03-10: Authoritative replication dispatch should keep filter and replay diagnostics separate

- Decision: `src/network/replicationDispatch.ts` now reports interest filtering as `dropped`/`kept`/`trimmed` and guarded replay as `applied`/`skipped` for each authoritative chunk or entity payload instead of flattening them into one status.
- Reason: A payload can be trimmed by client interest and still skip as stale or duplicate during replay, so transport diagnostics need to distinguish interest culling from replay-guard rejection.
- Consequence: Future transport batching or telemetry should consume both dispatch fields and avoid assuming every trimmed payload was applied or every skipped payload was unfiltered.

### 2026-03-10: Baseline replacement clears replay guards only after replacement succeeds

- Decision: `AuthoritativeReplicatedNetworkStateReplayer.replaceAuthoritativeBaseline()` now runs one caller-supplied replicated-state replacement callback and clears chunk and entity replay guards only after that callback returns successfully.
- Reason: Resync code needs one seam that cannot forget to clear both guard sets, while a failed replacement callback should not silently discard existing replay tick bookkeeping before a new baseline is actually in place.
- Consequence: Future transport resync or out-of-band baseline replacement should route world plus entity replacement through this helper, and replacement callbacks may use `ReplicatedEntitySnapshotStore.applyEntitySnapshotMessage()` internally because the helper clears its tick guard after the replacement finishes.

### 2026-03-10: Authoritative tile-edit capture should snapshot full tile-plus-liquid state at notification time

- Decision: `TileWorld` edit notifications now include previous and next liquid levels beside tile ids, and `src/network/tileEditCapture.ts` records detached notification snapshots before draining them through same-tick chunk-diff batching.
- Reason: Authoritative replication batching needs coherent previous/next tile state even when later same-tick edits mutate the same tile again, and networking should not reread mutable `TileWorld` or renderer-owned state to reconstruct that history.
- Consequence: Future authoritative transport code should subscribe to world edit notifications and drain the capture helper per tick instead of walking world diffs ad hoc or querying tile state again after notification delivery.

### 2026-03-10: Interest filtering should drop chunk deltas but preserve empty entity replacements

- Decision: `src/network/snapshotFilter.ts` now returns `null` for chunk-tile-diff messages whose chunk lies outside the current client chunk interest, but always returns an entity-snapshot message for the current tick even when entity-id filtering removes every entry.
- Reason: Chunk diffs are already isolated per chunk and can be skipped wholesale, while entity snapshots replace the entire local replicated entity set for one tick and still need an empty replacement to clear stale entities after client interest moves away.
- Consequence: Future client replication should filter authoritative payloads through this helper before replay, drop uninterested chunk diffs outright, and avoid suppressing fully trimmed entity snapshots.

### 2026-03-10: Replay-guard resets clear tick memory without clearing replicated contents

- Decision: `ReplicatedEntitySnapshotStore.resetReplayGuard()` and `AuthoritativeReplicatedNetworkStateReplayer.resetReplayGuards()` now clear only authoritative replay tick bookkeeping; they do not clear the current replicated entity set or any already-applied local world state.
- Reason: Transport resync and full replicated-session replacement may need to accept an older baseline tick again, but those flows should decide state replacement explicitly instead of having a guard reset silently discard current replicated contents.
- Consequence: Future transport resync code should pair any explicit replicated-state replacement with the guard-reset helper deliberately, and should not assume that clearing replay guards also wipes the existing replicated baseline in memory.

### 2026-03-10: Authoritative replay guards chunk diffs per chunk and entity snapshots per stream

- Decision: `src/network/stateReplay.ts` now guards authoritative replay by tracking last-applied ticks per chunk for chunk-tile-diff messages and one last-applied tick for the replicated entity-snapshot stream, skipping duplicate or older messages instead of mutating local replicated state.
- Reason: Chunk diffs can arrive independently across different chunks, while entity snapshots replace the whole visible replicated set at one tick, so a single global guard would reject valid chunk updates and no guard would let stale packets roll local state backward.
- Consequence: Future client replication should route remote authoritative updates through the guarded replay helper, and any transport resync or full replicated-state replacement must reset or replace that guard state deliberately instead of replaying older packets through it.

### 2026-03-10: Same-tick chunk-diff batching keeps the first previous state and the last resulting state per tile

- Decision: `src/network/chunkDiffBatching.ts` now batches authoritative tile edits by y-major chunk order, retains the first previous tile state seen for each tile in a tick, updates that tile's outgoing diff to the last same-tick result, and omits the tile entirely when the final state matches the same-tick starting state.
- Reason: Replication needs one deterministic chunk-diff message set per tick without resending transient intermediate writes or net no-op edits, and the batching path still needs enough state to reject incoherent same-tick edit chains.
- Consequence: Future authoritative terrain replication should feed coherent same-tick tile edits through this helper instead of emitting ad hoc per-edit chunk messages or treating temporary within-tick states as wire-visible.

### 2026-03-10: Authoritative entity replay replaces the full replicated snapshot set while chunk replay stays delta-based

- Decision: `src/network/stateReplay.ts` now applies chunk-tile-diff messages incrementally through a liquid-aware `setTileState()` seam, while each entity-snapshot message replaces the full local replicated-entity snapshot store for the current interest-scoped view.
- Reason: Chunk messages already describe sparse terrain deltas, but entity snapshots describe the authoritative visible entity set at one tick, so omitted entity ids need to disappear locally instead of lingering as stale replicated actors.
- Consequence: Future client replication should feed terrain through the tile-state replay seam and treat each entity-snapshot payload as the complete current replicated set unless the protocol intentionally changes to a delta model.

### 2026-03-10: Liquid-step phase summary should describe applied flow, not scan coverage

- Decision: Derived `liquidStepPhaseSummary` telemetry now maps `none`, `downward`, `sideways`, and `both` from split downward-versus-sideways transfer counts rather than from the phase scan counters.
- Reason: Wake testing needs one quick label for whether liquid actually moved in the last fixed step, while the scan counters remain available separately for coverage and candidate-band analysis.
- Consequence: Future HUD or telemetry surfaces should keep the phase summary transfer-based and rely on the existing scan counters when they need phase coverage detail instead of movement state.

### 2026-03-10: Active-liquid chunks sleep only after two quiet steps and active telemetry now reflects awake work

- Decision: `TileWorld` now keeps `activeLiquidChunkKeys` as the awake subset of resident liquid chunks, sleeps unchanged chunks only after two quiet fixed steps, and wakes nearby resident liquid chunks again on local edits or liquid transfers.
- Reason: Sideways equalization alternates horizontal-pair parity every tick, so sleeping after one quiet step can skip valid opposite-parity flow, while settled pools still need to disappear from active-scan telemetry until a disturbance reintroduces work.
- Consequence: Future liquid telemetry and wake-debug surfaces should treat active chunk counts and bounds as awake-work indicators, not as a census of every resident chunk that still contains liquid.

### 2026-03-10: Client networking interest should derive from viewport bounds with separate chunk and entity padding

- Decision: `src/network/interestSet.ts` now derives client interest from the camera-centered viewport world rect, expands chunk relevance in chunk space and entity relevance in world space, and keeps chunk/entity membership plus enter/exit diffs deterministic via y-major chunk ordering and ascending entity ids.
- Reason: Replication needs view-aligned client relevance without tying transport code to renderer internals, while chunks and entities need independent buffering because chunk streaming is coarser than entity movement.
- Consequence: Future client replication or snapshot filtering should reuse this module and tune its padding inputs rather than inventing separate unsorted chunk-frustum or entity-distance filters.

### 2026-03-10: Networking scaffolding uses versioned discriminated JSON messages with deterministic chunk and entity ordering

- Decision: `src/network/protocol.ts` now owns the shared wire contract for player-input, chunk-tile-diff, and entity-snapshot messages; each message carries a discriminating `kind`, protocol `version`, fixed-step `tick`, chunk diffs address tiles by row-major `tileIndex`, and entity snapshots keep shared `position`/`velocity` fields plus a flat scalar `state` bag.
- Reason: Future interest-set, replication, and transport work needs one transport-agnostic JSON-safe contract that matches the current fixed-step loop and chunk snapshot conventions without rediscovering message shapes at each call site.
- Consequence: Future networking work should extend or version this protocol module instead of inventing ad hoc socket payloads, and chunk/entity message producers should preserve the deterministic tile-index and entity-id ordering that the shared decoders now require.

### 2026-03-09: Liquid-step scan telemetry should stay phase-owned

- Decision: `TileWorld` last-step liquid stats and renderer telemetry now keep separate downward active-chunk scan counts, sideways candidate-chunk scan counts, and sideways pair counts instead of generic scan totals.
- Reason: Chunk-sleep and wake work needs to inspect downward active coverage separately from sideways candidate-band coverage without inferring phase ownership from ambiguous field names.
- Consequence: Future liquid telemetry and HUD surfaces should preserve these phase-owned scan counters instead of collapsing them back into generic chunk or pair totals.

### 2026-03-09: Unsaved paused-session warning state should stay separate from clear-saved-world autosave suppression

- Decision: The paused menu now tracks `Saved World Status` warning cause separately from the explicit `Clear Saved World` autosave-suppression flag, so imported sessions that failed to rewrite browser resume data can keep warning copy visible until a later save succeeds without inheriting clear-save suppression behavior.
- Reason: An imported session can be unsaved in browser storage even though autosave should still be allowed on later pause or page-hide paths, so one boolean cannot safely represent both warning copy and persistence suppression.
- Consequence: Future paused-menu save-status warnings should extend the shared saved-world-status cause state, while only explicit clear-save flows should suppress paused-menu autosave.

### 2026-03-09: Reset-shell-toggle clear failures should keep the live paused-session reset while warning that browser storage was not cleared

- Decision: When paused-menu `Reset Shell Toggles` reapplies the default-off shell layout in memory but clearing browser shell storage fails, the current paused session keeps that reset live and surfaces warning copy instead of restoring the previous browser-saved layout.
- Reason: The live paused session has already switched to the reset layout by that point, and silently rolling it back because browser persistence could not be cleared would contradict the behavior the player just requested in the current tab.
- Consequence: Future shell-toggle persistence failure handling should treat reset-clear failures as current-session-only warnings until a later successful shell save rewrites browser storage.

### 2026-03-09: Import persistence failures should keep the restored paused session live while warning that browser resume was not rewritten

- Decision: When a paused-menu import successfully restores world and session state in memory but the follow-up browser-resume save rewrite fails, the current tab keeps the restored paused session active and surfaces warning copy instead of rolling the runtime back.
- Reason: Runtime restore has already replaced world-owned and session-owned state by that point, and forcing a rollback would require a transactional restore path that does not exist yet.
- Consequence: Future paused-menu import or persistence work should treat browser-resume rewrite as a second-stage warning after in-memory restore unless a deliberate transactional rollback seam is added.

### 2026-03-09: Clearing a paused saved world should survive browser exit until the session resumes or is replaced

- Decision: The paused-menu `Clear Saved World` action now removes the persisted `deep-factory.world-save` envelope immediately and suppresses paused-menu `pagehide` autosave for that same paused session until the player resumes it or another save-replacing path such as import or fresh-world reset runs.
- Reason: Clearing the saved paused session would be ineffective if the browser rewrote the same envelope during the next paused `pagehide`, and the action still needs to leave the live paused runtime session intact in the current tab.
- Consequence: Future paused-menu save actions should explicitly decide whether they re-arm browser persistence for the current session, instead of assuming every page-hide or paused-state transition can blindly rewrite the local save envelope.

### 2026-03-09: Local persisted world sessions should store the same top-level save envelope and restore through the shared runtime seam

- Decision: Browser-saved world sessions now write the same `deep-factory.world-save` envelope through `src/mainWorldSaveLocalPersistence.ts`, and both boot-time session resume and paused-session replacement restore that envelope through `src/mainWorldSessionRestore.ts` plus `Renderer.loadWorldSnapshot()`.
- Reason: Download export, local persistence, and restore should share one validated payload and one runtime swap path instead of drifting into separate storage shapes or boot-only world replacement logic.
- Consequence: Future autosave, clear-saved-session UI, or import work should reuse the persisted-envelope helper and shared session-restore seam instead of inventing a second local-storage format or bypassing the existing restore path.

### 2026-03-09: Paused-session restore should reset session-only edit interaction state while reusing renderer and input

- Decision: `src/main.ts` now applies decoded paused-session restore envelopes through the shared restore helper while keeping the existing renderer and input instances alive, then clears debug-edit history, armed tools, pinned inspect state, and player-transition presentation before rerendering the paused preview.
- Reason: Importing or resuming saved world state should replace world-owned and session-owned runtime data without dragging old-world undo stacks, armed edit tools, or placeholder transition latches across the restore boundary, and rebuilding renderer or input would duplicate bootstrap work unnecessarily.
- Consequence: Future paused-session import or persistence restore wiring should extend this runtime restore action and its reset scope instead of rebuilding renderer/input or preserving old-world interaction state across a restore.

### 2026-03-09: Session restore should flow through a shared helper and renderer snapshot-load seam

- Decision: Decoded `deep-factory.world-save` envelopes now restore through `src/mainWorldSessionRestore.ts`, which re-normalizes the envelope and loads the nested `TileWorld` snapshot through `Renderer.loadWorldSnapshot()` before forwarding cloned standalone-player and camera-follow session state to a session-owned restore target.
- Reason: Import and local-persistence work need one restore path that preserves the existing renderer and input wiring instead of rebuilding runtime ownership ad hoc in `src/main.ts` or leaking mutable `TileWorld` instances across subsystem boundaries.
- Consequence: Future world-save import, browser persistence, or resume wiring should call the shared session restore helper and renderer snapshot-load API instead of constructing replacement worlds directly in main-runtime code.

### 2026-03-08: Liquid-step transfer telemetry stays split by phase

- Decision: `TileWorld` last-step liquid stats and renderer telemetry now expose separate `downwardTransfersApplied` and `sidewaysTransfersApplied` counters instead of one aggregate transfer total.
- Reason: Mixed-flow scenes need to show which half-step still performs work while chunk sleep or wake rules land, and future HUD surfaces should not have to infer phase activity from a combined count.
- Consequence: Future liquid telemetry or debug-surface work should preserve and consume the split phase counters rather than collapsing them back into one transfer metric.

### 2026-03-08: Downward liquid transfer scanning only visits active chunks

- Decision: The downward half-step in `src/world/world.ts` now snapshots the resident active-liquid chunk set at the start of the fixed step and only scans those chunks for falling transfers before sideways equalization runs.
- Reason: Only chunks that already contain liquid can donate downward flow, so rescanning dry resident chunk tiles wastes work without affecting loaded chunk-boundary falls or the same-step downward-then-sideways sequence.
- Consequence: Future liquid optimizations and telemetry should treat downward scan coverage as an active-chunk metric and keep same-step sideways candidate collection based on the post-downward active set.

### 2026-03-08: Sideways liquid equalization only scans the active chunk band

- Decision: The sideways half-step in `src/world/world.ts` now snapshots resident candidate chunks from the current active-liquid chunk set plus immediate left and right neighbors after downward transfers, instead of testing every resident horizontal pair each tick.
- Reason: Whole-world pair scans waste work in large dry resident regions, while cross-boundary equalization still needs inactive neighbor chunks on both sides of the active band to preserve deterministic seam behavior.
- Consequence: Future liquid optimizations and telemetry should treat sideways equalization as an active-band operation and keep candidate collection aligned to the post-downward active set rather than falling back to full resident-world pair scans.

### 2026-03-08: Active-liquid chunk membership stays resident runtime state

- Decision: `TileWorld` now keeps a resident active-liquid chunk-key set that is rebuilt from resident chunks on snapshot load or stream-back, updated on tile commits, liquid transfers, and prune, and used to early-out the liquid step when no resident chunk currently contains liquid.
- Reason: Dry worlds should not rescan every resident tile pair just to discover that no liquid exists, and follow-up liquid optimizations need one stable runtime index without changing the save format.
- Consequence: Future liquid chunk sleep or wake work should evolve this resident runtime set in place and rebuild it from resident chunk contents after load or stream-back rather than serializing separate active-liquid metadata or rescanning every resident chunk each tick.

### 2026-03-08: Session save export should read the renderer-owned world through a snapshot seam

- Decision: `src/mainWorldSessionSave.ts` now builds top-level save envelopes from a `WorldSessionSaveSource`, and `Renderer` exposes `createWorldSnapshot()` instead of leaking direct `TileWorld` access to session code.
- Reason: The renderer currently owns the live `TileWorld`, so save export needs one stable read seam that preserves that ownership boundary while still letting session-level persistence assemble the full envelope.
- Consequence: Future save UI, adapters, and restore wiring should call the session export helper or renderer snapshot API instead of reaching into renderer internals or duplicating world ownership in `src/main.ts`.

### 2026-03-08: Session persistence should wrap world snapshots in one versioned save envelope

- Decision: `src/mainWorldSave.ts` now defines the top-level `deep-factory.world-save` envelope with root `kind`, `version`, `migration`, `session`, and `worldSnapshot` fields, where `session` carries standalone-player `PlayerState` plus camera-follow offset and nested world validation reuses `TileWorld.loadSnapshot()`.
- Reason: The chunk and world snapshot codecs now cover terrain state, but future persistence adapters and restore helpers still need one shared outer contract for player or camera session data instead of storing that state beside the world snapshot in ad hoc shapes.
- Consequence: Future save/export/import work should extend or version this envelope and keep terrain state nested under `worldSnapshot` rather than inventing parallel top-level persistence formats for player or camera session state.

### 2026-03-08: TileWorld snapshots should preserve deterministic chunk ordering and liquid-step parity

- Decision: `TileWorld.createSnapshot()` and `TileWorld.loadSnapshot()` now serialize world state through sorted resident and edited chunk snapshot arrays plus `liquidSimulationTick`, and loads reject duplicate resident or edited chunk coordinates together with edited overrides that disagree with resident chunk payloads.
- Reason: Save/load needs one world-owned snapshot contract that produces stable JSON diffs and restores deterministic sideways-liquid behavior instead of rebuilding state from unordered maps or resetting liquid equalization parity.
- Consequence: Future save envelopes, persistence adapters, or restore helpers should wrap this world snapshot shape and preserve its chunk ordering plus `liquidSimulationTick` instead of inventing a second world-state serialization path.

### 2026-03-08: Chunk snapshots should use versioned metadata with explicit dense and sparse payload encodings

- Decision: `src/world/chunkSnapshot.ts` now defines chunk snapshot metadata with fixed `version`, `chunkSize`, `tileCount`, and row-major tile order, stores resident chunk `tiles`, `liquidLevels`, and `lightLevels` through run-length/value pairs, and stores sparse edited tile or liquid overrides through sorted tile-index/value pairs.
- Reason: Save/load needs deterministic JSON-safe chunk payloads that can validate current resident caches and sparse edited state without depending on typed-array internals or ad hoc per-call-site JSON shapes.
- Consequence: Future world persistence, migration, or networking work that serializes chunk state should extend this shared snapshot metadata or bump its version rather than inventing a second chunk JSON contract.

### 2026-03-08: Standalone-player render-frame camera follow should use the same interpolated snapshot as placeholder drawing

- Decision: `src/main.ts` now resolves preview and in-world camera follow from the standalone-player entity snapshot interpolated with the current render alpha before render-frame pointer inspect and telemetry assembly.
- Reason: Driving the camera from authoritative current state while the placeholder draws from an interpolated snapshot makes the visible player appear to trail a ghost copy behind the camera target.
- Consequence: Future local-player interpolation work should keep camera follow, pointer inspect, and any render-frame presentation tied to the same snapshot timeline as the visible placeholder instead of mixing current-state camera targets with interpolated draws.

### 2026-03-08: Standalone-player pose-driving contact and bonk state should live inside render snapshots

- Decision: Standalone-player render snapshots now clone `PlayerState` together with wall contact, ceiling contact, and bonk-hold timing, and both `src/main.ts` pose telemetry and `src/gl/renderer.ts` pose selection read those snapshot-owned fields from snapshot `current`.
- Reason: Mixing snapshot-interpolated placement with live render-frame contact inputs could make placeholder pose labels and renderer presentation diverge between fixed ticks.
- Consequence: Future standalone-player or entity presentation inputs that affect pose should enter the snapshot payload during fixed-step capture instead of being supplied as live renderer-only state.

### 2026-03-08: Standalone-player placeholder pose and nearby-light sampling should resolve from entity render snapshots

- Decision: `src/main.ts` now submits standalone-player entity-pass entries directly from registry `previous/current` render snapshots, `src/gl/renderer.ts` resolves placeholder pose from snapshot `current`, and nearby-light sampling now uses the interpolated render position derived from those snapshots.
- Reason: The entity pass should own the placeholder's render-frame presentation inputs so debug pose labels and nearby-light telemetry stay aligned with the same snapshot-driven draw path that places the quad between fixed ticks.
- Consequence: Future entity presentation and telemetry should prefer snapshot-backed render inputs instead of mixing interpolated draw state with separate live renderer-only pose inputs.

### 2026-03-08: Entity render-position interpolation should clamp render alpha and blend from registry snapshots

- Decision: Shared entity render-position interpolation now lives in `src/world/entityRenderInterpolation.ts`, reads `previous/current` registry snapshots, clamps render alpha into `0..1`, and returns a detached blended world position from snapshot `position.x/y`.
- Reason: Upcoming entity rendering needs one reusable interpolation rule for world-space placement, and allowing ad hoc extrapolation or duplicated blend math across `main.ts` and the renderer would make later pose and telemetry migration easier to drift.
- Consequence: Future interpolated entity drawing should reuse the shared helper for world position and layer any non-position presentation rules on top of that result instead of reimplementing per-call-site snapshot lerp logic.

### 2026-03-08: Standalone-player authority should live in the entity registry before broader entity rendering and gameplay slices land

- Decision: `src/main.ts` now spawns the standalone player into `src/world/entityRegistry.ts` as a `standalone-player` entity, drives fixed-step movement through that entity hook, and reads or replaces the authoritative player state through the registry during spawn refresh, respawn recovery, camera follow, preview rendering, render-frame telemetry, and renderer entity-pass submission.
- Reason: Tasks `17-18` need one ownership path for player simulation and renderer submission before combat, inventory, or networking work expands the entity layer, and keeping a parallel standalone-player variable would make respawn, reset, and render-snapshot behavior drift from the entity layer.
- Consequence: Future player simulation, interpolation, or networking work should treat the standalone player as an entity-registry resident and extend registry-backed selectors or render snapshots instead of reintroducing duplicate standalone state outside the entity layer.

### 2026-03-08: Partial-liquid paired coverage totals should resolve from shared liquid-surface helpers

- Decision: Hovered and pinned inspect telemetry now resolves `liquidCoverageLeftTotalPercentage`, `liquidCoverageRightTotalPercentage`, `liquidCoverageLeftTotalPixelHeight`, and `liquidCoverageRightTotalPixelHeight` through shared helpers in `src/world/liquidSurface.ts` that sum the existing visible and cropped per-side deltas.
- Reason: Combined `visible + cropped = total` inspect readouts need to stay numerically aligned with the exact per-side deltas and current variant frame size without re-summing values in `src/main.ts` or the UI formatters.
- Consequence: Future inspect coverage accounting should extend those shared total helpers rather than recomputing visible-plus-cropped totals in runtime assembly or UI formatting code.

### 2026-03-08: Partial-liquid visible-percentage inspect telemetry should resolve from shared frame-height helpers

- Decision: Hovered and pinned inspect telemetry now resolves `liquidVisibleLeftPercentage` and `liquidVisibleRightPercentage` through a shared helper in `src/world/liquidSurface.ts` that divides the existing visible-frame deltas by the current liquid variant frame height.
- Reason: Visible-coverage percentages need to stay numerically aligned with variant-specific frame heights and the existing visible-height deltas without re-dividing values in `src/main.ts` or inspect UI formatting code.
- Consequence: Future visible or visible-plus-cropped percentage telemetry should extend the shared frame-height percentage helper rather than recomputing visible ratios in runtime assembly or inspect UI formatting.

### 2026-03-08: Partial-liquid cropped-remainder inspect percentages should resolve from shared frame-height helpers

- Decision: Hovered and pinned inspect telemetry now resolves `liquidRemainderLeftPercentage` and `liquidRemainderRightPercentage` through a shared helper in `src/world/liquidSurface.ts` that divides the existing cropped-remainder deltas by the current liquid variant frame height.
- Reason: Cropped-loss percentages need to stay numerically aligned with variant-specific frame heights and the existing remainder deltas without re-dividing values in `src/main.ts` or inspect UI formatting code.
- Consequence: Future visible or combined liquid percentage telemetry should extend the shared frame-height percentage helper rather than recomputing remainder ratios in runtime assembly or inspect UI formatting.

### 2026-03-08: Partial-liquid full-frame-height inspect telemetry should reuse shared frame-bound helpers

- Decision: Hovered and pinned inspect telemetry now resolves `liquidFrameHeightV` and `liquidFramePixelHeight` through shared frame-height helpers in `src/world/liquidSurface.ts`, and the existing visible-height and cropped-remainder helpers there reuse those same frame-height helpers instead of subtracting frame endpoints inline.
- Reason: Direct total-frame-height debug readouts need to stay numerically aligned with the current liquid variant bounds for animated and non-zero-origin frames without duplicating endpoint subtraction in `src/main.ts` or UI formatting code.
- Consequence: Future visible or cropped liquid percentage telemetry should extend the shared frame-height helpers instead of re-deriving frame-height math from `v0`, `v1`, or atlas pixel rows in runtime assembly or UI formatting code.

### 2026-03-08: Partial-liquid cropped-remainder inspect telemetry should resolve from shared frame-bottom helpers

- Decision: Hovered and pinned inspect telemetry now resolves `liquidRemainderLeftV` and `liquidRemainderRightV` from the current liquid variant frame's `v1` plus the shared bottom-edge crop output in `src/world/liquidSurface.ts`, and resolves `liquidRemainderLeftPixelHeight` and `liquidRemainderRightPixelHeight` through the shared atlas-pixel helper there.
- Reason: Cropped-off remainder debug readouts need to stay numerically aligned with the exact frame-bottom bounds and bottom-edge crop values the renderer and inspect telemetry already share, without subtracting endpoint strings in `src/main.ts` or formatter code.
- Consequence: Future cropped-remainder percentages or total-frame-height inspect telemetry should extend those shared remainder helpers instead of re-deriving frame-bottom or crop delta math in runtime assembly or UI formatting code.

### 2026-03-08: Partial-liquid frame-bottom inspect telemetry should reuse shared frame-bound helpers

- Decision: Hovered and pinned inspect telemetry now resolves `liquidFrameBottomV` and `liquidFrameBottomPixelY` through shared frame-bottom helpers in `src/world/liquidSurface.ts`, and the existing visible-height helpers there reuse the same helpers instead of reading `uvRect.v1` inline.
- Reason: Frame-bottom debug readouts need to stay numerically aligned with visible-height deltas and current liquid-frame bounds for animated variants without parsing `liquidUv` or `liquidPx` strings in `src/main.ts` or formatter code.
- Consequence: Future partial-liquid frame-bound or cropped-remainder telemetry should extend those shared frame-bottom helpers instead of re-deriving `v1` or atlas-row math in runtime assembly or UI formatting code.

### 2026-03-08: Partial-liquid frame-top inspect telemetry should reuse shared frame-origin helpers

- Decision: Hovered and pinned inspect telemetry now resolves `liquidFrameTopV` and `liquidFrameTopPixelY` through shared frame-origin helpers in `src/world/liquidSurface.ts`, and the existing visible-height helpers there reuse the same helpers instead of reading `uvRect.v0` inline.
- Reason: Frame-origin debug readouts need to stay numerically aligned with visible-height deltas for both zero-valued water origins and non-zero animated-liquid frame offsets, without parsing `liquidUv` or `liquidPx` strings in `src/main.ts` or formatter code.
- Consequence: Future liquid frame-origin or frame-bound inspect telemetry should extend the shared frame-origin helpers rather than re-deriving `v0` or atlas-row math in runtime assembly or UI formatting.

### 2026-03-08: Partial-liquid visible-height inspect telemetry should resolve from shared frame-origin helpers

- Decision: Hovered and pinned inspect telemetry now resolves `liquidVisibleLeftV` and `liquidVisibleRightV` from the current liquid variant frame's `v0` plus the shared bottom-edge crop output in `src/world/liquidSurface.ts`, and resolves `liquidVisibleLeftPixelHeight` and `liquidVisibleRightPixelHeight` through the shared crop-to-pixel helper there.
- Reason: Visible-height deltas need to stay numerically aligned with the exact frame origin and bottom-edge crop values the renderer and inspect telemetry already share, especially when animated liquid variants move onto non-zero `v0` ranges.
- Consequence: Future partial-liquid inspect deltas or frame-origin telemetry should extend those shared visible-height helpers instead of subtracting `liquidUv` or `liquidPx` strings in `src/main.ts` or UI formatting code.

### 2026-03-08: Partial-liquid bottom-edge atlas-pixel inspect telemetry should reuse the shared crop-to-pixel helper

- Decision: Hovered and pinned inspect telemetry now resolves `liquidBottomLeftPixelY` and `liquidBottomRightPixelY` through `resolveLiquidSurfaceBottomAtlasPixelRows()` in `src/world/liquidSurface.ts`, fed by the same shared bottom-edge `v` crop output that inspect telemetry already exposes as `liquidBottomLeftV` and `liquidBottomRightV`.
- Reason: Atlas-row debug readouts need to stay numerically aligned with the exact normalized crop coordinates the renderer and inspect telemetry already share, without re-deriving pixel math in `src/main.ts`.
- Consequence: Future partial-liquid atlas-pixel or visible-height inspect telemetry should extend the shared crop-to-pixel helper instead of recomputing atlas-row coordinates in runtime assembly or UI formatting code.

### 2026-03-08: Partial-liquid bottom-edge inspect telemetry should reuse the shared crop resolver

- Decision: Hovered and pinned inspect telemetry now resolves `liquidBottomLeftV` and `liquidBottomRightV` through the same shared bottom-edge `v` crop helper in `src/world/liquidSurface.ts` that `src/world/mesher.ts` uses when writing liquid quad UVs.
- Reason: Partial-liquid debug readouts need to reflect the exact UV crop math the renderer bakes into chunk meshes, especially as animated liquid variants swap between different `v0..v1` frame ranges.
- Consequence: Future liquid crop, atlas-pixel-row, or inspect telemetry work should extend the shared crop helper rather than re-deriving bottom-edge `v` math in `src/main.ts` or UI formatters.

### 2026-03-08: Resolved spawn liquid-safety telemetry reuses the shared spawn overlap rule

- Decision: Runtime spawn telemetry now resolves its `safe` or `overlap` liquid-safety status through the shared helper in `src/world/playerSpawn.ts` instead of assuming every resolved spawn is already safe.
- Reason: The debug overlay and compact status strip need to reflect the actual world-backed spawn safety rule so regressions in spawn filtering remain visible without duplicating liquid-overlap math in `src/main.ts`.
- Consequence: Future spawn, checkpoint, or respawn telemetry should query the shared player-spawn liquid-safety helper rather than hardcoding resolved placements as safe.

### 2026-03-08: Standalone-player spawn search rejects liquid-overlapped standing AABBs

- Decision: `src/world/playerSpawn.ts` now skips any grounded spawn candidate whose standing AABB intersects non-zero liquid fill, which currently covers both water and lava tiles.
- Reason: Lava-death respawns and debug-edit embedded recovery should resolve to the latest survivable standing spawn instead of immediately placing the player back into fluid.
- Consequence: Future spawn placement, checkpoint, or teleport-safety work should preserve this liquid-overlap rejection rule rather than treating solid-free headroom alone as a safe spawn.

### 2026-03-08: Standalone-player liquid interaction resolves from overlapped liquid fill area inside the shared player step

- Decision: `src/world/playerState.ts` now samples overlapped water and lava fill area from resident world liquid levels during the shared fixed-step player update, applies water buoyancy and drag there, and advances lava damage through player-owned health plus cooldown state before `src/main.ts` resolves any later death-hold or respawn behavior.
- Reason: Water motion, lava damage timing, and future player-liquid behavior need one deterministic world-backed rule instead of ad hoc checks split between render code, input code, and runtime orchestration.
- Consequence: Future swim controls, liquid immunity, liquid HUD telemetry, or other player-liquid mechanics should extend the shared player-state liquid overlap and damage path instead of bypassing it from `src/main.ts` or renderer-only code.

### 2026-03-08: Partial-liquid UV crops stay anchored to authored liquid surface texels

- Decision: `src/world/mesher.ts` and `src/gl/animatedChunkMesh.ts` now keep liquid quad top-edge vertices on the variant frame's `v0` and crop only the bottom-edge `v` coordinates from resolved `topLeft` and `topRight` fill heights.
- Reason: Partial-liquid quads need to preserve authored surface highlights when fill drops below a full tile; remapping the full `v0..v1` range onto shorter geometry vertically squashes the surface band.
- Consequence: Future liquid meshing or animated-liquid UV work should reuse the shared chunk-mesh UV writer and carry resolved liquid top heights through any frame-patching path instead of stretching full liquid frames onto partial-height geometry.

### 2026-03-08: Liquid-surface branch classification should resolve through a shared helper

- Decision: Hovered and pinned inspect telemetry now resolves liquid-surface `empty`, `north-covered`, and `exposed` branch labels through `src/world/liquidSurface.ts` instead of re-deriving those branches in `src/main.ts` or the UI formatters.
- Reason: The same branch conditions decide whether liquid tops are zero-height, forced full-height, or exposed-slope candidates, so debug inspect telemetry should read from the same rule that already owns liquid-surface resolution.
- Consequence: Future liquid inspect or mesh-debug telemetry should consume the shared liquid-surface branch helper rather than duplicating center-level or north-cover checks.

### 2026-03-08: Exposed liquid surface corners blend halfway toward same-kind side neighbors

- Decision: `src/world/liquidSurface.ts` now resolves normalized `topLeft` and `topRight` fill heights by clamping raw fill levels, returning `0/0` for empty center tiles, forcing `1/1` when same-kind liquid continues above, and otherwise averaging the center fill with the same-kind west or east fill at each exposed shared corner.
- Reason: Future partial-liquid meshing needs one world-owned rule that keeps isolated partial tiles flat, produces smooth exposed slopes between unequal neighboring fill levels, and guarantees both tiles on a shared boundary resolve the same corner height.
- Consequence: Future liquid geometry, debug inspection of resolved liquid surfaces, or other partial-liquid presentation work should consume the shared resolver instead of inventing separate per-side height math.

### 2026-03-07: Loaded-chunk liquid simulation resolves downward transfers before sideways equalization

- Decision: Resident liquid simulation in `src/world/world.ts` stores per-tile `0..8` fill levels, applies downward transfers before sideways equalization, and only crosses into already loaded neighboring chunk cells during fixed updates.
- Reason: Conserved liquid volume and deterministic chunk-boundary behavior need world-owned fill state plus a sideways step that cannot double-spend one source tile into both neighbors in the same tick.
- Consequence: Future liquid rendering, save/load, inspect telemetry, and player-liquid interaction work should consume the shared fill-level state and preserve the loaded-chunk downward-first stepping contract unless the liquid model is deliberately redesigned end-to-end.

### 2026-03-07: Boundary sunlight transport should distinguish sunlight from retained emissive light

- Decision: Boundary-column sunlight transport in `src/world/sunlight.ts` should determine whether neighboring boundary air is sunlight-lit from a geometry-backed sunlight probe instead of treating any retained positive light level in a clean neighboring column as sunlight.
- Reason: When an adjacent chunk streams back in, dirty boundary air can otherwise upgrade clean-column emissive falloff into incorrect `MAX_LIGHT_LEVEL` sunlight during the horizontal-transport pass.
- Consequence: Future lighting-cache or boundary-transport work should preserve the distinction between sunlight connectivity and merged emissive light instead of reusing cached boundary light levels as a proxy for sunlight visibility.

### 2026-03-07: Persisted in-world shell-action keybindings should validate back to one safe default set

- Decision: Boot-time keybindings for the in-world shell actions (`Main Menu`, `Recenter Camera`, `Debug HUD`, `Edit Panel`, `Edit Overlays`, and `Spawn Marker`) should load through one shared `src/input/shellActionKeybindings.ts` helper that normalizes saved single-letter bindings, rejects reserved gameplay or edit letters, and falls duplicate or invalid results back to the default `Q/C/H/G/V/M` set before shortcut resolution or UI labels consume them.
- Reason: Persisted shell-action overrides need a safe load path before the remap UI exists, so malformed or conflicting saved values cannot silently disable shell actions or steal core gameplay and debug-edit keys.
- Consequence: Future shell-action remap, reset, or import/export work should extend the shared keybinding helper and its validation rules instead of reading raw storage or bypassing the default-fallback contract.

### 2026-03-07: Persisted shell-action keybinding load should report when saved bindings default back to the safe set

- Decision: Boot-time shell-action keybinding load should return both the resolved binding state and whether a saved keybinding payload defaulted all the way back to the safe set during validation, and paused-menu summary copy should consume that shared flag instead of reparsing storage.
- Reason: The paused menu needs to distinguish intentional default shell bindings from invalid saved bindings that were rejected during load.
- Consequence: Future shell-action remap, import, export, or summary UI work should extend the shared load-result helper when they need fallback context instead of inspecting raw persisted storage separately.

### 2026-03-07: Standalone-player render-frame compact-strip player-event telemetry should share one visibility selector

- Decision: Compact status-strip standalone-player transition-event payload assembly in `src/main.ts` should route through a shared `selectStandalonePlayerRenderFrameStatusStripPlayerEventTelemetry()` helper that owns the `debugOverlayVisible` null-gating.
- Reason: Those compact-strip event fields all share the same visibility rule, so leaving `renderWorldFrame()` to repeat that gate inline across each event makes later transition telemetry changes easier to drift between hidden-HUD and visible-HUD behavior.
- Consequence: Future compact-strip standalone-player transition-event telemetry changes should extend the shared selector and its runtime regression instead of reintroducing per-event `debugOverlayVisible ? null : ...` branches in `renderWorldFrame()`.

### 2026-03-07: Standalone-player render-frame compact-strip player telemetry should share one visibility selector

- Decision: Compact status-strip standalone-player player and nearby-light payload assembly in `src/main.ts` should route through a shared `selectStandalonePlayerRenderFrameStatusStripPlayerTelemetry()` helper that owns the `debugOverlayVisible` null-gating.
- Reason: Those compact-strip fields all share the same visibility rule, so leaving `renderWorldFrame()` to repeat that gate inline across each field makes later telemetry changes easier to drift between hidden-HUD and visible-HUD behavior.
- Consequence: Future compact-strip standalone-player player or nearby-light telemetry changes should extend the shared selector and its runtime regression instead of reintroducing per-field `debugOverlayVisible ? null : ...` branches in `renderWorldFrame()`.

### 2026-03-07: Standalone-player render-frame nearby-light telemetry should share one snapshot helper

- Decision: Post-render standalone-player nearby-light level, factor, and source payload assembly in `src/main.ts` should route through a shared `createStandalonePlayerRenderFrameNearbyLightTelemetrySnapshot()` helper before the debug overlay and compact status strip consume it.
- Reason: Those renderer telemetry reads describe one nearby-light snapshot for the same render frame, so leaving `renderWorldFrame()` to assemble them inline makes later telemetry changes easier to drift across the two UI surfaces.
- Consequence: Future standalone-player nearby-light telemetry changes should extend the shared snapshot helper and its runtime regression instead of reintroducing separate `renderer.telemetry` reads in `renderWorldFrame()`.

### 2026-03-07: Standalone-player render-frame player telemetry should share one snapshot helper

- Decision: Standalone-player player, contact, input, and camera telemetry assembly in `renderWorldFrame()` should route through a shared `createStandalonePlayerRenderFrameTelemetrySnapshot()` helper before the debug overlay and compact status strip consume it.
- Reason: Those render-frame reads describe one player-facing telemetry snapshot for the current frame, so leaving `renderWorldFrame()` to assemble overlapping overlay and status-strip payloads inline makes later player telemetry changes easier to drift across the two surfaces.
- Consequence: Future standalone-player render-frame player or camera telemetry changes should extend the shared snapshot helper and its runtime regression instead of reintroducing separate overlay and status-strip payload assembly in `src/main.ts`.

### 2026-03-07: Standalone-player fixed-step runtime entry should share one helper

- Decision: Movement-intent read, fixed-step result creation, and post-result apply in `src/main.ts` should route through a shared `updateStandalonePlayerFixedStep()` helper.
- Reason: Those three operations together define one standalone-player fixed-step runtime entry contract, so leaving the fixed-update loop to assemble them inline makes later player-step changes easier to drift from the existing result and apply helpers plus their focused runtime regressions.
- Consequence: Future standalone-player fixed-step runtime changes should extend the shared update helper and its regression instead of reintroducing separate intent reads, result assembly, or apply calls inside the fixed-update loop.

### 2026-03-07: Standalone-player fixed-step apply work should share one helper

- Decision: Post-result standalone-player state assignment, transition commit, and camera follow in `src/main.ts` should route through a shared `applyStandalonePlayerFixedStepResult()` helper.
- Reason: Those three writes together form one fixed-step post-result apply contract for the standalone player, so leaving them inline after the shared result helper makes later follow-camera or transition-commit changes easier to drift from the focused runtime regression coverage.
- Consequence: Future standalone-player fixed-step post-result work should extend the shared apply helper and its runtime regression instead of reintroducing separate state assignment, transition commit, or camera follow calls in `src/main.ts`.

### 2026-03-07: Standalone-player fixed-step result assembly should share one helper

- Decision: Next player state calculation, collision-contact sampling, and transition-resolution assembly in `src/main.ts` should route through a shared `createStandalonePlayerFixedStepResult()` helper before the post-step apply path runs.
- Reason: Those three pieces together form one fixed-step pre-commit result contract for the standalone player, so leaving them partially split across the fixed-update branch makes later changes easier to drift from the existing contact and transition helper chain plus the focused runtime regressions.
- Consequence: Future standalone-player fixed-step pre-commit work should extend the shared result helper and its runtime regression instead of reintroducing separate step, contact-snapshot, or transition-snapshot assembly in `src/main.ts`.

### 2026-03-07: Standalone-player fixed-step contact sampling should share one helper

- Decision: Previous-state and next-state collision-contact queries in `src/main.ts` should route through a shared `createStandalonePlayerFixedStepContactSnapshot()` helper before transition resolution runs.
- Reason: Those two contact reads form one fixed-step collision-contact sampling contract around the standalone-player step, so leaving them inline makes later contact-query changes easier to drift from the shared transition snapshot path and focused runtime regressions.
- Consequence: Future standalone-player fixed-step contact-query changes should extend the shared contact-snapshot helper and its runtime regression instead of reintroducing separate pre-step and post-step `getPlayerCollisionContacts()` calls in `src/main.ts`.

### 2026-03-07: Standalone-player fixed-step transition resolution should share one snapshot helper

- Decision: Grounded, facing, wall-contact, and ceiling-contact transition resolution in `src/main.ts` should route through a shared `createStandalonePlayerFixedStepTransitionSnapshot()` helper before the post-step commit path runs.
- Reason: Those four transition resolvers consume one fixed-step snapshot of previous state, next state, player intent, and contact diffs, so leaving them inline makes later transition changes easier to drift from the shared commit helper and the focused runtime regressions.
- Consequence: Future standalone-player fixed-step transition-resolution changes should extend the shared snapshot helper and its runtime regression instead of reintroducing separate per-transition resolver calls in `src/main.ts`.

### 2026-03-07: Standalone-player fixed-step transition commits should share one helper

- Decision: Grounded, facing, wall-contact, and ceiling-contact transition updates plus ceiling-bonk hold latching in `src/main.ts` should route through a shared `commitStandalonePlayerFixedStepTransitions()` helper after each standalone-player fixed step.
- Reason: Those post-step writes together form one standalone-player transition telemetry contract, so leaving them split across separate inline branches makes later runtime changes easier to drift from the focused regression coverage.
- Consequence: Future standalone-player fixed-step transition or ceiling-bonk presentation work should extend the shared commit helper and its runtime regression instead of reintroducing separate per-event writes in `src/main.ts`.

### 2026-03-07: Standalone-player transition resets should share one helper

- Decision: Bootstrap spawn initialization, embedded-spawn recovery, and fresh-world camera/player reset work in `src/main.ts` should route grounded/facing/respawn/wall/ceiling transition clearing plus ceiling-bonk reset through a shared `resetStandalonePlayerTransitionState()` helper.
- Reason: Those fields together form one standalone-player transition telemetry contract, so leaving bootstrap, respawn recovery, and fresh-world reset to clear them separately makes later runtime changes easier to drift from focused regressions.
- Consequence: Future standalone-player spawn or reset work should extend the shared helper and its runtime regression instead of reintroducing ad hoc grounded, facing, respawn, wall, ceiling, or bonk reset blocks in `src/main.ts`.

### 2026-03-07: Fresh-world camera and player reset should share one helper

- Decision: The fresh-world reset path in `src/main.ts` should route its camera, follow-offset, player-transition, and spawn-refresh work through a shared `resetFreshWorldSessionCameraAndPlayerState()` helper.
- Reason: Those camera and standalone-player steps form one runtime reset contract for abandoning the paused session and booting a fresh world, so leaving them inline inside the broader fresh-world reset makes that state-reset path easier to drift from focused regressions.
- Consequence: Future fresh-world camera or player reset changes should extend the shared helper and its paused-menu `New World` regression instead of reintroducing separate camera reset, transition clearing, or spawn refresh steps in `resetFreshWorldSessionRuntimeState()`.

### 2026-03-07: Fresh-world debug-edit reset should share one helper

- Decision: The fresh-world reset path in `src/main.ts` should route its debug-edit state work through a shared `resetFreshWorldSessionDebugEditState()` helper that replaces history, cancels armed tools, and synchronizes the touch debug controls.
- Reason: Those history and armed-tool steps form one reset contract for the debug-edit subsystem, so leaving them inline inside the broader fresh-world runtime reset makes that smaller state-reset path easier to drift from focused regressions.
- Consequence: Future fresh-world debug-edit reset changes should extend the shared helper and its paused-menu `New World` regression instead of reintroducing separate history replacement, armed-tool cancellation, and touch-control sync steps in `resetFreshWorldSessionRuntimeState()`.

### 2026-03-07: Touch debug control bootstrap should share one helper

- Decision: `TouchDebugEditControls` creation in `src/main.ts` should route through a shared `bootstrapTouchDebugEditControls()` helper that both constructs the controls and immediately runs visibility, history, armed-tool, and persistence sync on the created instance.
- Reason: The constructor call and its immediate follow-up sync steps define one bootstrap contract, so leaving them split across separate statements makes the touch debug control startup path easier to drift from focused regressions.
- Consequence: Future touch debug control startup changes should extend the bootstrap helper and its runtime regression instead of reintroducing ad hoc post-construction sync calls beside the `TouchDebugEditControls` constructor.

### 2026-03-07: Touch debug control constructor wiring should share one builder

- Decision: `TouchDebugEditControls` constructor props in `src/main.ts` should route through a shared `createTouchDebugEditControlConstructorOptions()` helper that combines preference hydration, armed-tool wiring, initial history state, undo or redo callbacks, and reset wiring.
- Reason: Those constructor props all describe one touch debug control bootstrap surface, so leaving preference, armed-tool, history, and reset options split across separate inline blocks makes the initialization path easier to drift from focused regressions.
- Consequence: Future touch debug control constructor changes should extend the combined builder and its runtime regression instead of reintroducing separate inline preference, armed-tool, history, or reset props at the `TouchDebugEditControls` call site.

### 2026-03-07: Touch debug armed-tool constructor wiring should share one builder

- Decision: `TouchDebugEditControls` armed-tool constructor props in `src/main.ts` should route through a shared `createTouchDebugArmedToolConstructorOptions()` helper that combines the initial armed-tool snapshot with the six `onArm*` callbacks.
- Reason: Those props represent one constructor wiring surface for the same armed-tool state, so splitting snapshot seeding and callback creation across separate spreads makes the touch-control boot path easier to drift from focused regressions.
- Consequence: Future touch debug armed-tool constructor changes should extend the combined builder and its runtime regression instead of reintroducing standalone `initialArmed*` or `onArm*` props in the `TouchDebugEditControls` constructor call.

### 2026-03-07: Structured shell action cards should surface labeled metadata rows

- Decision: `AppShellMenuSection` cards may carry concise labeled metadata rows such as `Shortcut`, `Consequence`, or `Readiness`, and relevant shell guidance should prefer those visible rows over tooltip-only context.
- Reason: Main-menu shell actions need their shortcut and effect context to stay readable on touch and narrow layouts where tooltip access is weak or absent.
- Consequence: Future shell-card work should extend the shared metadata-row model when actions need compact context instead of overloading card titles or depending only on button tooltips.

### 2026-03-07: Touch debug armed-tool initial constructor props should share one builder

- Decision: The six `initialArmed*` props passed to `TouchDebugEditControls` in `src/main.ts` should route through a shared `createTouchDebugArmedToolInitialOptions()` helper that maps the current armed-tool snapshot into constructor options.
- Reason: Those constructor props all represent the same boot-time armed-tool state surface, so leaving six inline snapshot-to-prop assignments makes touch-control initialization easier to drift from focused runtime regressions.
- Consequence: Future touch debug armed-tool constructor state wiring should extend the shared initial-option builder and its initialization regressions instead of reintroducing per-tool inline `initialArmed*` assignments in `src/main.ts`.

### 2026-03-07: Row-above boundary air pockets keep same-height horizontal sunlight transport after same-corner reclose

- Decision: A row-above boundary air pocket reopened by a boundary top-corner edit should still regain same-height horizontal boundary sunlight transport, and the adjacent solid-face relighting tied to that air should still restore, even after the same top-corner blocker recloses and the streamed-back row-above chunks recompute.
- Reason: The current sunlight model treats same-height boundary air columns as transport-connected independently from the blocker directly below that row, and forcing reclose to extinguish that row-above air breaks the established boundary transport regressions.
- Consequence: Future row-above top-corner lighting or renderer-invalidation work should preserve that restored row-above boundary lighting behavior unless the horizontal transport model is deliberately redesigned together with the broader lighting regression set.

### 2026-03-07: Touch debug armed-tool toggle callbacks should share one factory

- Decision: The six `onArm*` callbacks passed to `TouchDebugEditControls` in `src/main.ts` should route through a shared `createTouchDebugArmedToolToggleCallback()` helper that delegates into the existing shared armed-tool toggle pipeline.
- Reason: Those touch-panel callbacks all share the same one-argument toggle contract, so leaving six inline `kind => toggle...` wrappers makes the touch debug wiring easier to drift from focused runtime regressions.
- Consequence: Future touch debug armed-tool toggle wiring should extend the shared callback factory and its touch-driven runtime regressions instead of reintroducing per-tool inline `onArm*` lambdas in `src/main.ts`.

### 2026-03-07: Armed-tool toggles should share one helper

- Decision: `toggleArmedDebugFloodFillKind()`, `toggleArmedDebugLineKind()`, `toggleArmedDebugRectKind()`, `toggleArmedDebugRectOutlineKind()`, `toggleArmedDebugEllipseKind()`, and `toggleArmedDebugEllipseOutlineKind()` in `src/main.ts` should route through a shared `toggleMutuallyExclusiveArmedDebugToolKind()` helper that reads the current armed kind from the shared snapshot and delegates through the existing per-tool setters.
- Reason: Those toggles all implement the same current-kind comparison and arm-versus-disarm decision, so leaving six copies of that wrapper logic makes the armed-tool path easier to drift from focused regressions.
- Consequence: Future armed one-shot tool toggles should extend the shared toggle helper and its runtime regressions instead of reintroducing per-tool current-kind comparison branches in `src/main.ts`.

### 2026-03-07: Mutually-exclusive armed-tool writes should share one helper

- Decision: `setArmedDebugFloodFillKind()`, `setArmedDebugLineKind()`, `setArmedDebugRectKind()`, `setArmedDebugRectOutlineKind()`, `setArmedDebugEllipseKind()`, and `setArmedDebugEllipseOutlineKind()` in `src/main.ts` should route through a shared `setMutuallyExclusiveArmedDebugToolKind()` helper backed by one armed-tool snapshot apply path.
- Reason: Those setters all target the same mutually-exclusive one-shot tool state, so repeating six versions of the same sibling-tool clearing contract makes the runtime path easier to drift from focused regressions.
- Consequence: Future armed one-shot tool writes should extend the shared helper and its runtime regressions instead of reintroducing per-tool sibling-clearing branches in `src/main.ts`.

### 2026-03-07: Touch debug armed-tool control updates should share one apply helper

- Decision: `syncArmedDebugToolControls()` in `src/main.ts` should route through a shared `applyTouchDebugArmedToolSnapshot()` helper, and that helper should own pushing flood-fill, line, rectangle, rectangle-outline, ellipse, and ellipse-outline state onto `TouchDebugEditControls`.
- Reason: Once touch debug armed-tool reads already share one snapshot, leaving the control-update side split across six tiny sync helpers still duplicates the same one-shot tool apply contract and makes runtime touch-control sync easier to drift from focused regressions.
- Consequence: Future `src/main.ts` work that needs to push current armed one-shot tool state onto `TouchDebugEditControls` should extend the shared apply helper and its runtime regressions instead of adding another per-tool control-sync fan-out.

### 2026-03-07: Touch debug armed-tool reads should share one snapshot helper

- Decision: Current touch debug armed-tool reads in `src/main.ts` should route through a shared `readTouchDebugArmedToolSnapshot()` helper, and `TouchDebugEditControls` initialization should consume that snapshot instead of reading flood-fill, line, rectangle, rectangle-outline, ellipse, and ellipse-outline kinds separately.
- Reason: Those constructor reads already target one runtime armed-tool state surface, so leaving them split across six direct input-controller queries makes the touch-control boot path easier to drift from focused regressions.
- Consequence: Future `src/main.ts` work that needs the current touch debug armed-tool state should extend the shared snapshot helper and its runtime regressions instead of adding another ad hoc cluster of per-tool reads.

### 2026-03-07: Debug-edit preference reads should share one snapshot helper

- Decision: Current debug-edit preference reads in `src/main.ts` should route through a shared `readDebugEditControlPreferenceSnapshot()` helper, and both persisted writes plus `TouchDebugEditControls` initialization should consume that snapshot instead of reading `touchMode`, `brushTileId`, and `panelCollapsed` separately.
- Reason: Touch-control bootstrapping and persistence already target the same runtime preference trio, so leaving those call sites to assemble that state independently makes the mixed-surface debug-edit preference path easier to drift from focused regressions.
- Consequence: Future `src/main.ts` work that needs the current debug-edit preference trio should extend the shared snapshot helper and its runtime regressions instead of adding another ad hoc read of mode, brush, and collapsed state.

### 2026-03-06: Debug-edit preference restores should share one helper

- Decision: Bootstrap hydration and `Reset Prefs` should route through a shared `restoreDebugEditControlPreferences()` helper in `src/main.ts` instead of each applying touch mode, brush tile, and panel-collapsed state separately.
- Reason: Those restore paths target the same runtime preference trio, so leaving hydration and reset to duplicate that assignment sequence makes the mixed-surface preference flow easier to drift from focused regressions.
- Consequence: Future debug-edit preference restore work should extend the shared helper and its runtime regressions instead of reintroducing separate mode, brush, and collapsed-state restore blocks in `src/main.ts`.

### 2026-03-06: Persisted debug-edit brush-state mutations should share one helper

- Decision: Brush-tile mutations should route through a shared `commitDebugEditBrushTileId()` helper in `src/main.ts`; touch-panel callbacks call it directly, and keyboard brush shortcuts reuse the same persisted update path either through direct fallback mutation or through the panel callback.
- Reason: Those persisted brush updates share the same runtime contract, so leaving touch-panel callbacks and keyboard fallback branches to repeat brush assignment plus persistence separately makes the mixed-surface brush path easier to drift from focused regressions.
- Consequence: Future persisted brush-state mutations should extend the shared helper and its runtime regressions instead of adding more inline brush assignment and persistence branches in `src/main.ts`.

### 2026-03-06: Persisted debug-edit control-state mutations should share one helper

- Decision: Touch-mode and panel-collapsed mutations should route through a shared `commitDebugEditControlStateAction()` helper in `src/main.ts`; touch-panel callbacks call it directly, and keyboard shortcuts reuse the same persisted update path either through direct fallback mutation or through the panel callback.
- Reason: Those persisted control-state updates share the same runtime contract, so leaving touch-panel callbacks and keyboard fallback branches to repeat state assignment plus persistence separately makes the mixed-surface control path easier to drift from focused regressions.
- Consequence: Future persisted debug-edit control-state mutations should extend the shared helper and its runtime regressions instead of adding more inline mode or collapsed-state persistence branches in `src/main.ts`.

### 2026-03-06: Keyboard debug-edit control actions should share one dispatcher

- Decision: Keyboard `toggle-panel-collapsed` and `set-touch-mode` shortcut actions should route through a shared `applyKeyboardDebugEditControlAction()` dispatcher in `src/main.ts` instead of each repeating `preventDefault()` plus its control-state handling inline.
- Reason: Those shortcut branches share the same keyboard-event contract and only differ in which debug-edit control state they mutate, so leaving them inline makes the remaining in-world shortcut path easier to drift from focused runtime regressions.
- Consequence: Future keyboard debug-edit control shortcuts should extend the shared dispatcher and its focused runtime regressions instead of adding more repeated inline `preventDefault()` plus control-state branches in `src/main.ts`.

### 2026-03-06: Keyboard brush actions should share one dispatcher

- Decision: Keyboard `select-brush-slot`, `eyedropper`, and `cycle-brush` shortcut actions should route through a shared `applyKeyboardBrushAction()` dispatcher in `src/main.ts` instead of each repeating `preventDefault()` plus its brush-mutation logic inline.
- Reason: Those shortcut branches all share the same keyboard-event contract and only differ in how they resolve the next brush tile, so leaving them inline makes the in-world shortcut path easier to drift from focused runtime regressions.
- Consequence: Future keyboard brush shortcuts should extend the shared dispatcher and its focused runtime regressions instead of adding more repeated inline `preventDefault()` plus brush-mutation branches in `src/main.ts`.

### 2026-03-06: Keyboard armed-tool actions should share one dispatcher

- Decision: Keyboard `cancel-armed-tools`, flood-fill, line, rectangle, and ellipse shortcut actions should route through a shared `applyKeyboardArmedToolAction()` dispatcher in `src/main.ts` instead of each repeating `preventDefault()` plus its matching toggle or cancel call inline.
- Reason: Those shortcut branches all share the same keyboard-event contract and only differ in which armed-tool mutation they trigger, so leaving them inline makes the in-world shortcut path easier to drift from focused runtime regressions.
- Consequence: Future keyboard armed-tool shortcuts should extend the shared dispatcher and its focused runtime regressions instead of adding more repeated inline `preventDefault()` plus tool-mutation branches in `src/main.ts`.

### 2026-03-06: Debug-history action selection should share one dispatcher

- Decision: `applyKeyboardDebugHistoryAction()` and `applyFixedStepDebugHistoryShortcutAction()` should both route through a shared `applyDebugHistoryAction()` dispatcher in `src/main.ts` instead of each choosing between `undoDebugTileStroke()` and `redoDebugTileStroke()` separately.
- Reason: Once keyboard-side `preventDefault()` handling and fixed-step shortcut consumption already have dedicated helpers, leaving both helpers to repeat the same history-action mapping still duplicates one runtime contract and invites drift between the two input paths.
- Consequence: Future debug-history actions should extend the shared dispatcher and its focused runtime regressions instead of reintroducing per-caller `undo` versus `redo` branching in `src/main.ts`.

### 2026-03-06: Fixed-step debug-history shortcut actions should share one helper

- Decision: Fixed-step debug-history shortcut actions (`undo` and `redo`) consumed from `consumeDebugEditHistoryShortcutActions()` should route through a shared `applyFixedStepDebugHistoryShortcutAction()` helper in `src/main.ts` instead of repeating `undoDebugTileStroke()` or `redoDebugTileStroke()` inside the fixed update loop.
- Reason: Both touch-driven history shortcuts already share the same fixed-step action contract, so leaving those branches inline makes the simulation-side history path easier to drift from focused runtime regressions.
- Consequence: Future fixed-step debug-history shortcut actions should extend the shared helper and its focused runtime regressions instead of adding another inline `undo` or `redo` branch in `src/main.ts`.

### 2026-03-06: Keyboard debug-history actions should share one helper

- Decision: Keyboard-triggered debug-history actions (`undo` and `redo`) should route through a shared `applyKeyboardDebugHistoryAction()` helper in `src/main.ts` instead of repeating `preventDefault()` plus `undoDebugTileStroke()` or `redoDebugTileStroke()` in the `keydown` branch.
- Reason: Both keyboard history actions already share the same shortcut-side event handling contract, so leaving those steps repeated inline makes the runtime history path easier to drift from focused regressions.
- Consequence: Future keyboard-triggered debug-history actions should extend the shared helper and its focused runtime regressions instead of adding another repeated `preventDefault()` plus history-mutation branch in `src/main.ts`.

### 2026-03-06: Keyboard main-menu shell actions should share one helper

- Decision: Keyboard-triggered paused-main-menu shell actions (`resume-paused-world-session` and `start-fresh-world-session`) should route through a shared `applyKeyboardMainMenuShellAction()` helper in `src/main.ts` instead of repeating `preventDefault()` plus `applyMainMenuShellAction()` at the top of the `keydown` branch.
- Reason: Both paused-menu keyboard actions already share the same shortcut-side event handling contract, so leaving those steps repeated inline makes the runtime main-menu shortcut path easier to drift from focused mixed-surface regressions.
- Consequence: Future keyboard-triggered paused-main-menu shell actions should extend the shared keyboard helper and its focused runtime regressions instead of adding another repeated `preventDefault()` plus `applyMainMenuShellAction()` branch in `src/main.ts`.

### 2026-03-06: Keyboard in-world shell actions should share one helper

- Decision: Keyboard-triggered in-world shell actions (`return-to-main-menu`, `recenter-camera`, and the in-world shell toggles) should route through a shared `applyKeyboardInWorldShellAction()` helper in `src/main.ts` instead of repeating `preventDefault()` plus `applyInWorldShellAction()` across the `keydown` branch.
- Reason: All seven keyboard-driven in-world shell actions already share the same shortcut-side event handling contract, so leaving those steps repeated inline makes the runtime shortcut path easier to drift from focused shell regressions.
- Consequence: Future keyboard-triggered in-world shell actions should extend the shared keyboard helper and its focused runtime regressions instead of adding another repeated `preventDefault()` plus `applyInWorldShellAction()` branch in `src/main.ts`.

### 2026-03-06: In-world recenter availability should use a shared helper

- Decision: `recenter-camera` availability should route through a shared `canApplyInWorldRecenterCameraAction()` helper in `src/main.ts`, and `centerCameraOnStandalonePlayer()` should accept a concrete `PlayerState` instead of inspecting nullable standalone-player state itself.
- Reason: The in-world non-toggle dispatcher owns whether recenter can run, so repeating standalone-player null guards inline there and again inside the camera-centering routine makes that small shell path easier to drift from focused runtime regressions.
- Consequence: Future in-world recenter checks should extend the shared availability helper, and camera-centering callers should pass a resolved player state rather than depending on `centerCameraOnStandalonePlayer()` to decide whether a standalone player exists.

### 2026-03-06: In-world shell non-toggle actions should share one helper

- Decision: The in-world shell non-toggle actions (`return-to-main-menu` and `recenter-camera`) should route through a shared `applyInWorldShellNonToggleAction()` helper in `src/main.ts` instead of branching inline inside `applyInWorldShellAction()`.
- Reason: Once in-world shell toggles already use a dedicated pipeline helper, leaving the remaining non-toggle actions inline duplicates the same action-family split inside the central in-world shell dispatcher.
- Consequence: Future in-world shell actions that do not use the toggle pipeline should extend the shared non-toggle helper and its focused runtime regressions instead of adding more inline pre-toggle branches in `applyInWorldShellAction()`.

### 2026-03-06: In-world shell toggles should run through one pipeline helper

- Decision: In-world shell toggle actions should route through a shared `applyInWorldShellToggleAction()` helper in `src/main.ts`, combining the existing toggle-state mutation and finalize steps before `applyInWorldShellAction()` returns.
- Reason: Once both phases already have dedicated helpers, leaving `applyInWorldShellAction()` to sequence them manually still duplicates the central toggle pipeline contract in the in-world shell dispatcher.
- Consequence: Future in-world shell toggle behavior should extend the shared pipeline helper and its focused runtime regressions instead of reintroducing manual multi-step toggle sequencing in `applyInWorldShellAction()`.

### 2026-03-06: In-world shell toggle finalization should share one helper

- Decision: After an in-world shell toggle mutates state, the shared post-toggle sequence should route through `finalizeInWorldShellToggleAction()` in `src/main.ts`, combining the persisted-shell refresh step with any overlay-specific visibility sync while letting `toggle-shortcuts-overlay` finalize as a no-op beyond commit.
- Reason: Once toggle-state mutation and commit already have shared helpers, keeping a separate `toggle-shortcuts-overlay` branch in `applyInWorldShellAction()` still duplicates the toggle-finalization contract in the central in-world shell dispatcher.
- Consequence: Future in-world shell toggles should extend the shared finalize helper and its focused runtime regressions instead of adding more action-specific post-toggle branching in `applyInWorldShellAction()`.

### 2026-03-06: In-world shell toggle commits should share one persisted-shell refresh helper

- Decision: After an in-world shell toggle mutates state, the shared `persistWorldSessionShellState()` plus `syncInWorldShellState()` sequence should run through a dedicated `commitInWorldShellToggleStateAction()` helper in `src/main.ts`.
- Reason: All five in-world shell toggles already share the same persisted preference write and in-world shell-state refresh step before any overlay-specific visibility sync runs, so keeping that two-call commit sequence inline in `applyInWorldShellAction()` repeats the same post-mutation contract in the shell runtime hot path.
- Consequence: Future in-world shell toggle work should reuse the shared commit helper before adding any action-specific follow-up behavior, instead of inlining another persisted-shell refresh sequence in `applyInWorldShellAction()`.

### 2026-03-06: In-world shell toggle state should mutate through one shared helper

- Decision: All five in-world shell toggle actions (`toggle-debug-overlay`, `toggle-debug-edit-controls`, `toggle-debug-edit-overlays`, `toggle-player-spawn-marker`, and `toggle-shortcuts-overlay`) should flip their persisted runtime booleans through a shared `applyInWorldShellToggleStateAction()` helper in `src/main.ts`.
- Reason: Those toggle actions all mutate the same persisted shell state before the shared in-world shell-state refresh and any follow-up overlay visibility sync runs, so keeping the boolean flips inline in `applyInWorldShellAction()` duplicates the toggle-to-state mapping in the hottest shell-action path.
- Consequence: Future in-world shell toggle additions should extend the shared state mutator and its focused runtime regressions instead of adding more inline boolean-flip branches in `applyInWorldShellAction()`.

### 2026-03-06: Overlay-backed in-world shell toggles should share one visibility sync dispatcher

- Decision: The in-world shell toggle actions that directly control live overlay visibility (`toggle-debug-overlay`, `toggle-debug-edit-controls`, `toggle-debug-edit-overlays`, and `toggle-player-spawn-marker`) should route through a shared `syncInWorldShellOverlayVisibility()` helper in `src/main.ts`, while `toggle-shortcuts-overlay` remains shell-state-only.
- Reason: Those four toggle actions all recompute one specific visible overlay surface after the shared persisted shell state and in-world shell state already update, so repeating a second per-action switch inside `applyInWorldShellAction()` makes that runtime path easier to drift from mixed-surface regression coverage.
- Consequence: Future in-world shell toggles that directly control live overlay visibility should extend the shared dispatcher and its focused runtime regressions instead of adding more inline per-action sync branches in `src/main.ts`.

### 2026-03-06: World-screen shell visibility should sync through one shared helper

- Decision: Non-shortcuts shell overlay visibility (`Debug HUD`, `Edit Panel`, `Edit Overlays`, and `Spawn Marker`) should route through a shared `syncWorldScreenShellVisibility()` helper in `src/main.ts` whenever runtime transitions between boot, paused main menu, and in-world screens.
- Reason: Those transitions all need the same visibility recomputation from `currentScreen` plus persisted toggle state, and repeating four overlay-sync calls in each transition path makes the shell wiring easier to drift from regression coverage.
- Consequence: Future world-screen transitions that can affect those four overlays should call the shared visibility helper instead of repeating the individual sync sequence in `src/main.ts`.

### 2026-03-06: Main-menu shell actions should share one runtime dispatcher across input surfaces

- Decision: Main-menu shell actions (`Enter World` / `Resume World`, `New World`, and `Reset Shell Toggles`) should route through a shared `applyMainMenuShellAction()` helper in `src/main.ts`; app-shell callbacks call it directly, and paused-menu keyboard shortcuts reuse the same helper for the actions they expose.
- Reason: Main-menu shell clicks and paused-menu shortcuts target the same runtime transitions, and duplicating screen or session guards across those branches makes the shell wiring easier to drift from runtime test coverage.
- Consequence: Future main-menu shell actions should extend the shared dispatcher and its mixed-surface runtime regressions instead of adding more callback-specific guard branches in `src/main.ts`.

### 2026-03-06: In-world shell actions should share one runtime dispatcher across input surfaces

- Decision: In-world shell actions that do not depend on paused-menu state (`Main Menu`, `Recenter Camera`, and the in-world shell toggles) should route through a shared `applyInWorldShellAction()` helper in `src/main.ts`, regardless of whether the action comes from app-shell clicks or keyboard shortcuts.
- Reason: Click and keyboard control surfaces target the same runtime state transitions, and duplicating those non-toggle actions separately from the shared toggle mutator risks drift between the two in-world input paths.
- Consequence: Future in-world shell actions should extend the shared dispatcher and its mixed-surface runtime regressions instead of adding another input-surface-specific branch in `src/main.ts`.

### 2026-03-06: In-world-only debug-edit keyboard actions should use a shared guard helper

- Decision: Shortcut actions that should stay inert outside active `in-world` runtime (`undo`/`redo`, tool arming, touch-mode changes, brush selection and cycling, panel collapse, eyedropper, and armed-tool cancel) should be identified through a shared `isInWorldOnlyDebugEditShortcutAction()` helper in `src/input/debugEditShortcuts.ts`.
- Reason: Once shortcut resolution already handles screen-aware shell and paused-menu actions, the remaining repeated `currentScreen !== 'in-world'` checks in `src/main.ts` were all classifying the same in-world-only debug-edit action subset by hand.
- Consequence: Future in-world-only debug-edit keyboard actions should extend the shared guard helper and its focused shortcut/runtime regressions instead of adding more per-branch screen checks in `src/main.ts`.

### 2026-03-06: Runtime shortcut-context composition should use a shared helper

- Decision: Runtime callers that need a `resolveDebugEditShortcutAction()` context should use a shared `createDebugEditShortcutContext()` helper in `src/input/debugEditShortcuts.ts` instead of merging paused-main-menu and in-world shortcut helper outputs inline.
- Reason: Once both shortcut families already expose focused availability helpers, inlining their composition in `src/main.ts` duplicates the shell-state-to-shortcut mapping and makes runtime wiring easier to drift from unit coverage.
- Consequence: Future runtime or test callers should reuse the composed shortcut-context helper before adding more direct `DebugEditShortcutContext` object assembly.

### 2026-03-06: In-world shell shortcut availability should use a shared helper

- Decision: Keyboard shortcut availability for in-world shell actions (`Q`, `C`, `H`, `G`, `V`, `M`, `?`) should be derived through a shared helper in `src/input/debugEditShortcuts.ts`, and `src/main.ts` should handle those actions without depending on one blanket `currentScreen !== 'in-world'` early return.
- Reason: Once shortcut resolution is context-aware, runtime regressions can verify that main-menu key presses stay inert because the shortcut layer declines them, instead of because a later catch-all branch discards every non-paused action.
- Consequence: Future in-world shell shortcuts should extend the shared in-world shortcut-context helper and its focused shortcut/runtime regressions rather than depending on broad runtime screen guards in `src/main.ts`.

### 2026-03-06: Paused-main-menu shortcut availability should use a shared helper

- Decision: Keyboard shortcut availability for paused-main-menu `Resume World (Enter)` and `New World (N)` should be derived through a shared helper in `src/input/debugEditShortcuts.ts`, and `src/main.ts` should pass that helper output into `resolveDebugEditShortcutAction()`.
- Reason: Both shortcuts share the same `main-menu` plus resumable-session gate, so duplicating those checks inline in runtime wiring makes the context contract easier to drift from its input-layer tests.
- Consequence: Future paused-main-menu keyboard actions should extend the shared shortcut-context helper and its focused shortcut/runtime regressions instead of adding new inline availability booleans in `src/main.ts`.

### 2026-03-06: Main-menu shell-state selection should use an explicit helper

- Decision: First-launch versus paused-session `main menu` state selection should be handled by a shared helper in `src/ui/appShell.ts`, and `src/main.ts` should call that helper instead of branching inline on `worldSessionStarted`.
- Reason: The shell module already owns the explicit state factories for both menu variants, so keeping the selection logic there avoids scattering shell-state branching across runtime wiring.
- Consequence: Future main-menu state variants or resumable-session rules should extend the shared selector helper and its focused regressions instead of adding more inline `main menu` selection branches in `src/main.ts`.

### 2026-03-06: In-world shell state should use an explicit helper factory

- Decision: Active-session shell chrome state should be created through a named helper in `src/ui/appShell.ts`, and `src/main.ts` should use that helper when synchronizing in-world shell-toggle visibility.
- Reason: The boot and main-menu shell states already use explicit factories, so in-world state now follows the same contract instead of duplicating inline `{ screen: 'in-world', ... }` objects across runtime wiring and tests.
- Consequence: Future in-world shell-toggle additions should update the shared in-world shell-state helper and its focused regressions rather than rebuilding active-session state literals in `src/main.ts` or tests.

### 2026-03-06: Default boot shell state should use an explicit helper factory

- Decision: The normal startup loading overlay should be created through a named helper in `src/ui/appShell.ts`, and `src/main.ts` bootstrap should call that helper instead of constructing inline `{ screen: 'boot', ... }` loading literals.
- Reason: Loading and failure boot overlays now follow one explicit shell-state factory pattern, which keeps shell tests and runtime regressions aligned on the same startup-state contract.
- Consequence: Future default boot-copy changes should update the shared boot helper and its focused regressions rather than embedding startup loading text directly in bootstrap wiring.

### 2026-03-06: Boot-failure shell states should use explicit helper factories

- Decision: WebGL-unavailable and renderer-initialization-failed boot overlays should be created through named helpers in `src/ui/appShell.ts`, and `src/main.ts` bootstrap should call those helpers instead of constructing inline `{ screen: 'boot', ... }` literals for failure states.
- Reason: Startup failure copy now has one explicit state contract that shell tests and runtime regressions can share without duplicating ad hoc boot-state objects.
- Consequence: Future boot-time failure overlays should add or reuse explicit boot-state helpers in the shell module rather than embedding failure copy directly in bootstrap wiring or tests.

### 2026-03-06: Runtime shell entry states should use explicit helper factories

- Decision: Nontrivial shell states such as the first-launch main menu should be created through named helpers in `src/ui/appShell.ts`, and runtime transitions in `src/main.ts` should pass those explicit states instead of minimal `{ screen: ... }` placeholders.
- Reason: Once shell overlays carry structured guidance cards, runtime wiring and regressions need one explicit state shape rather than depending on implicit `resolveAppShellViewModel` fallbacks.
- Consequence: Future shell-state additions with structured defaults should add or reuse explicit helper factories when bootstrapping runtime transitions and tests.

### 2026-03-06: First-launch main-menu guidance should use structured section cards

- Decision: The initial `main menu` now renders its `Enter World` and mixed-device runtime guidance through `menuSections` instead of flat detail bullets.
- Reason: First-launch and paused overlays should share one richer guidance layout before card-level shortcut and readiness metadata lands.
- Consequence: Future first-launch main-menu guidance should extend structured section cards rather than re-expanding the flat detail-line list.

### 2026-03-06: Multi-action shell menus should use structured section cards

- Decision: `AppShellState` can now carry structured `menuSections`, and paused-session menus render action guidance through titled section cards instead of stuffing all consequences into one long status line plus flat detail bullets.
- Reason: The paused-menu copy had become redundant, and richer shell menus need reusable UI slots for grouped action context rather than more line-level copy iteration.
- Consequence: Future multi-action shell menus should prefer concise headlines plus section cards for per-action guidance; status and detail text should stay brief unless a menu truly only needs one undifferentiated note block.

### 2026-03-06: Paused-menu shell reset clears saved toggle visibility back to default-off

- Decision: The paused main menu now includes a `Reset Shell Toggles` action that removes persisted in-world shell-toggle visibility preferences and reapplies the all-off shell layout to the current paused session before it resumes.
- Reason: Shell-toggle visibility behaves like preference state, but players also need a quick way to recover the default uncluttered HUD and overlay layout without discarding the current world session.
- Consequence: Future in-world shell-toggle additions should participate in both the persisted preference shape and the paused-menu reset path so that the default-off recovery action remains comprehensive.

### 2026-03-06: Non-emissive blocker edits dirty immediate neighboring columns

- Decision: Zero-range non-emissive `blocksLight` edits now invalidate the edited column plus its immediate left and right columns, while boundary edits still extend that widening across the loaded neighboring chunk boundary and its interior-adjacent column.
- Reason: One-tile-gap blocker-face sunlight can change in adjacent columns when an edited column stops or starts providing the horizontal sunlit-air neighbor that those adjacent blockers depend on.
- Consequence: Future sunlight invalidation work should preserve immediate-neighbor dirtiness for non-emissive blocker toggles instead of limiting zero-range invalidation to only the edited column except at chunk seams.

### 2026-03-06: Blocker-face sunlight relighting ignores emissive-only cached light

- Decision: The blocker-face sunlight pass now determines whether neighboring air is sunlit from resident tile geometry plus boundary sunlight transport rules instead of reusing the combined cached light field.
- Reason: Clean emissive columns can retain non-sunlight light in cached light levels, and dirty boundary blockers streaming back beside those emitters were being incorrectly promoted to full sunlight.
- Consequence: Future blocker-face or sunlight-transport work should keep "sunlit air" classification distinct from emissive contribution; combined light levels alone are not a safe proxy.

### 2026-03-06: Renderer relight invalidation follows changed light fields, not all dirty columns

- Decision: The renderer now makes draw-range chunks resident before dirty-light recomputation and invalidates cached chunk meshes only for resident chunks whose light arrays actually changed during that relight pass, including adjacent boundary chunks touched by horizontal sunlight transport.
- Reason: Streamed-back visible chunks were building once with zeroed dirty light and rebuilding again after relight, while invalidating every chunk in a recomputed dirty column could keep prefetch columns requeued long after their visible neighbors were already correct.
- Consequence: Future renderer or lighting changes should preserve "resident before relight" for draw-range chunks and should report actual changed-light chunks for mesh invalidation instead of invalidating every chunk that merely participated in dirty-column recomputation.

### 2026-03-05: Entity render snapshots advance on fixed-step boundaries

- Decision: `EntityRegistry` stores `previous` and `current` render snapshots per entity, rotates those snapshots only after each completed fixed update, and resets both snapshots together when an entity spawns or its simulation state is replaced outside the fixed-step path.
- Reason: Upcoming interpolated entity rendering needs stable pre-step and post-step render data, and spawn, teleport, or respawn-style discontinuities should not smear across frames.
- Consequence: Future entity migration and rendering work should capture presentation state through the registry snapshot path and use explicit state replacement when interpolation must reset immediately.

### 2026-03-05: In-world shell toggle preferences persist locally with all-off fallback defaults

- Decision: In-world shell toggle visibility for `Debug HUD`, `Edit Panel`, `Edit Overlays`, `Spawn Marker`, and `Shortcuts` now loads and saves through `localStorage`, and missing, invalid, or unreadable persisted state falls back to all five toggles off.
- Reason: Shell-toggle visibility behaves like user preference, so keeping it across reloads improves continuity while defaulting to an uncluttered first-run presentation.
- Consequence: Future shell-toggle additions should update the persisted shape and validation together, and fresh-world resets should continue reapplying fallback defaults unless product behavior changes intentionally.

### 2026-03-05: Sunlight now lights recessed blocker faces through one-tile vertical air pockets

- Decision: During the blocking-face sunlight pass, a dirty-column blocking tile is also lit when its vertically adjacent non-blocking tile is shadowed but that vertical neighbor has a horizontally adjacent sunlit non-blocking tile.
- Reason: A hovering blocker above a one-tile air gap and lower solid row left the lower middle solid face black even though neighboring lit air made that face expectedly exposed.
- Consequence: Future sunlight changes should preserve this recessed one-tile pocket blocker-face lighting behavior without broadening sunlight into unrestricted horizontal air flood-fill.

### 2026-03-05: Sunlight now lights blocking faces adjacent to sunlit air

- Decision: After sunlight column and boundary transport passes run, resident lighting now also writes full sunlight to blocking tiles in dirty columns when a cardinally adjacent resident tile is non-blocking and already sunlit.
- Reason: Vertical-only blocker lighting left stacked or wall-like solid tiles black except at the top tile, even when those solid faces directly bordered sunlit air.
- Consequence: Future sunlight changes should preserve "adjacent sunlit air lights one blocking face, but blockers still prevent propagation behind themselves" behavior unless a different surface-light model replaces this pass.

### 2026-03-05: Emissive falloff now lights the first blocking tile on each path

- Decision: Resident emissive-light recomputation now writes the falloff value onto the first `blocksLight` tile reached by each propagation path, then stops propagation beyond that tile.
- Reason: Solid faces beside emissive-lit air were rendering black because the emissive pass skipped blocking tiles entirely once chunk shading began using per-tile light levels.
- Consequence: Future emissive-light changes should preserve "first blocker receives emissive light, tiles behind remain shadowed" behavior unless a dedicated solid-surface lighting model replaces it.

### 2026-03-05: Sunlight now lights the first blocking tile in each lit column

- Decision: Sunlight recomputation now writes full sunlight to the first `blocksLight` tile encountered in a lit vertical column, then terminates propagation below that tile.
- Reason: After chunk shading switched to per-tile light modulation, solid terrain tiles became fully black under sunlight because blocking tiles were forced to zero light.
- Consequence: Future sunlight or blocker-lighting changes should preserve "first blocker receives light, tiles below stay shadowed" semantics unless a separate solid-surface shading model replaces it.

### 2026-03-05: Sunlight transport now crosses loaded neighboring chunk boundaries

- Decision: Resident sunlight recomputation includes a horizontal transport pass between adjacent loaded `chunkX` boundary columns on dirty edge columns, and non-emissive edge `blocksLight` edits with no local emissive range now invalidate both boundary columns and their immediate interior neighbors on both sides of that loaded boundary.
- Reason: Vertical-only sunlight recomputation left neighboring chunk-edge columns stale after edge blocker edits once sunlight needed to cross chunk boundaries, and boundary-adjacent solid faces could remain stale when transported boundary air changed.
- Consequence: Future sunlight invalidation updates should keep loaded boundary-edge edits dirty across both boundary columns plus their interior-adjacent columns, and preserve horizontal boundary transport before emissive-light blending.

### 2026-03-05: Nearby-light telemetry includes brightest sampled source tile coordinates

- Decision: Standalone-player nearby-light sampling now exposes both the resolved light level and the sampled world tile coordinates that produced that level, and renderer/debug telemetry surfaces those coordinates beside the existing level and factor values.
- Reason: Light level and factor alone were not enough to validate why placeholder lighting changed near overlapping light fields.
- Consequence: Future nearby-light sampling changes should keep source-tile reporting stable, including deterministic tie behavior (first sampled tile at the max level), so telemetry and tests remain comparable across passes.

### 2026-03-04: Standalone player placeholder lighting uses nearby max-light sampling

- Decision: The temporary standalone player draw pass now samples resolved world light across the player AABB plus a one-tile padding ring, uses the brightest sampled tile as the placeholder light level, and applies that normalized factor in the placeholder fragment shader.
- Reason: The placeholder pass needs to stay visually aligned with terrain lighting without introducing a separate player light-field pipeline or per-pixel world light sampling in the shader.
- Consequence: Future placeholder or temporary entity lighting should continue consuming resolved world light caches through lightweight nearby sampling helpers, and lighting regressions should treat the one-tile padded max-light sample window as the current expected behavior.

### 2026-03-04: Chunk lighting modulation is baked into mesh vertices

- Decision: Chunk meshes now bake per-vertex light levels from resident chunk light caches, and the world shader multiplies atlas color by that normalized vertex light.
- Reason: This keeps lighting on the existing chunk draw path without introducing a second texture-sampling light pipeline, while still letting lighting-only edits refresh rendered terrain.
- Consequence: Future lighting changes should continue driving chunk-light dirtiness so affected meshes can rebuild through the renderer invalidation path, and mesh/animation helpers must preserve the light-inclusive chunk vertex stride.

### 2026-03-04: Non-emissive blocker edits now widen invalidation around reachable resident emitters

- Decision: When a non-emissive tile edit toggles `blocksLight`, `TileWorld` now scans nearby resident tiles for emissive sources that can still reach the edited tile and widens dirty-light local-column invalidation to that local emissive range instead of always invalidating only the edited column.
- Reason: Emissive falloff can become blocked or unblocked by non-emissive edits, and edited-column-only invalidation left stale light values in neighboring columns that shared those propagation paths.
- Consequence: Future lighting invalidation changes should treat non-emissive blocker edits near emitters as multi-column local-light changes; performance optimizations can cache source lookup data but should preserve reachable-source widening semantics.

### 2026-03-04: Dirty resident lighting now layers emissive falloff over sunlight

- Decision: Resident light recomputation now keeps the existing top-down sunlight pass as a base layer and then merges local emissive sources through cardinal falloff (`level - 1` per step) across non-light-blocking tiles, taking the max of sunlight and emissive contribution on rebuilt dirty columns.
- Reason: The first emissive slice needed to reuse the existing resident light cache model and dirty-column rebuild path instead of introducing a second light-field storage or a per-frame global remesh dependency.
- Consequence: Future lighting work should treat resident light values as a composed field (sunlight + local emitters), preserve `blocksLight` as the propagation stop condition for both passes, and keep non-emissive blocker invalidation aligned with nearby reachable emitters.

### 2026-03-04: Edge tile light invalidation stays inside the edited chunk column

- Decision: Tile lighting edits now invalidate sunlight only in the edited `chunkX` column (plus loaded vertical neighbor chunks for top or bottom edge edits), and no longer dirty neighboring `chunkX` columns for left or right edge edits.
- Reason: The current sunlight rebuild path is vertical-only per `chunkX` column, so cross-column invalidation on edge edits forced unnecessary recomputation in columns that cannot yet receive horizontal sunlight.
- Consequence: Until horizontal sunlight transport is added, future sunlight invalidation changes should keep edge-edit dirtiness scoped to the edited world-x column.

### 2026-03-04: Sunlight invalidation now tracks dirty local columns per resident chunk

- Decision: Resident chunks now store a dirty-local-column sunlight bitmask, tile lighting edits invalidate only affected local columns, and sunlight recomputation unions those masks per resident `chunkX` column before rebuilding and clearing only the matching local columns.
- Reason: Isolated tile edits were forcing full `chunkX`-column sunlight rebuilds, which did unnecessary per-frame work across untouched local columns.
- Consequence: Future sunlight invalidation paths should provide precise local-column masks whenever possible and reserve full-chunk-column invalidation for explicit fallback cases.

### 2026-03-04: Sunlight rebuilds now target dirty resident chunk columns only

- Decision: Sunlight recomputation now derives the set of resident `chunkX` columns from dirty-light chunks and rebuilds only those vertical columns instead of scanning every resident column each dirty pass.
- Reason: Light invalidation often touches a small subset of loaded columns, so rebuilding all resident columns did avoidable per-frame work as the loaded world footprint grew.
- Consequence: Future sunlight invalidation refinements should continue feeding this dirty-column rebuild path; any system that dirties light chunks should expect same-column resident chunks to be recomputed together.

### 2026-03-04: Resident sunlight rebuilds run top-down from exposed chunk tops

- Decision: The renderer now resolves dirty resident light caches through a world helper that scans each resident chunk column from the highest loaded chunk downward, applies `MAX_LIGHT_LEVEL` sunlight until a `blocksLight` tile is hit, and then marks rebuilt chunks clean.
- Reason: The first sunlight slice needed a deterministic light-field rebuild path that works with existing dirty-light invalidation without introducing a second vertical dependency tracker yet.
- Consequence: Upcoming emissive and tile-lighting work should treat this exposed-top sunlight field as the base layer and merge additional light sources into that cache model rather than bypassing it.

### 2026-03-04: Chunk light fields are derived resident caches

- Decision: `TileWorld` now keeps per-chunk light arrays plus dirty flags alongside resident chunk tiles, and lighting-relevant tile edits clear and dirty the affected loaded chunk light fields instead of preserving their previous resolved values.
- Reason: Upcoming sunlight and emissive passes need writable light storage in the world layer, but resolved lighting should stay a recomputable cache over tile state rather than becoming new authoritative terrain data.
- Consequence: Future lighting work should recompute dirty resident light chunks from world tiles and treat pruned light fields as disposable caches that can restart from zero when a chunk streams back in.

### 2026-03-03: Runtime static asset URLs resolve through the Vite base path

- Decision: Runtime fetch paths for shipped static assets, including the authored atlas PNG, now resolve through build-time constants derived from the Vite base path instead of hard-coded site-root URLs.
- Reason: GitHub Pages project-site deploys serve the app under `/deep-factory/`, so root-relative runtime asset URLs break even when the entry bundle paths are configured correctly.
- Consequence: Future runtime asset loads should derive from the Vite base path rather than assuming the app is hosted at `/`, and deployment regressions can assert exact joined runtime URLs in emitted bundles.

### 2026-03-03: Liquid animation resolves against the meshed liquid cardinal mask

- Decision: Liquid variant animation now uses per-tile-per-cardinal-mask frame lookups, and chunk meshes record the resolved liquid cardinal mask for each animated liquid quad instead of re-sampling liquid neighbors during rendering.
- Reason: Liquid animation should stay on the same UV-patching path as other animated tiles without adding per-frame neighborhood sampling or tighter renderer-to-world coupling.
- Consequence: Future liquid animation work should key frame resolution by the meshed liquid mask, and liquid connectivity changes still require chunk invalidation or remeshing before the animation source changes.

### 2026-03-03: Liquid render connectivity is separate from terrain autotile grouping

- Decision: Liquid tiles now declare `liquidRender` metadata with their own connectivity groups and per-cardinal-mask variant render entries instead of reusing terrain autotile connectivity or material-tag fallback.
- Reason: Water and lava need adjacency rules that stay independent from solid terrain seams, and later liquid edge, surface, and animation work needs a liquid-owned metadata path.
- Consequence: Future liquid rendering work should use `liquidRender` metadata and liquid connectivity helpers rather than terrain autotile group IDs or terrain material tags.

### 2026-03-02: World runtime starts behind explicit app-shell states

- Decision: Boot now flows through explicit `boot`, `main menu`, and `in-world` shell states, and the fixed-step world loop starts only after the main-menu enter action fires.
- Reason: Upcoming shell and menu work needs a stable state boundary above renderer/input bootstrap instead of auto-starting gameplay directly from `main.ts`.
- Consequence: Future shell, pause, and menu tasks should transition through the app-shell state model rather than assuming world simulation begins as soon as bootstrap finishes.

### 2026-03-02: Returning to the main menu pauses and preserves the current world session

- Decision: Leaving `in-world` through the shell's `Main Menu` action now returns to the main menu without rebuilding renderer, world, player, or debug-edit state; the same session resumes through the menu's primary action.
- Reason: Shell navigation needs a reversible pause boundary before reset or multi-session work lands, and that boundary should preserve the current mixed-device runtime instead of treating menu navigation as a hard restart.
- Consequence: Future main-menu, pause, or shortcut work should treat `main menu` as a resumable paused-shell state once a world session exists, and should introduce explicit reset paths instead of implicitly reinitializing the world on every menu return.

### 2026-03-02: Fresh world resets session runtime without reinitializing renderer or input

- Decision: The paused main menu now exposes an explicit `New World` action that replaces the renderer-owned `TileWorld`, spawned player runtime, camera follow state, undo history, and shell visibility toggles, while keeping the bootstrapped renderer/input stack and persisted debug-edit preferences alive.
- Reason: The project needs a clean session restart path that behaves like first launch without paying the cost or complexity of full renderer/input teardown and re-bootstrap after every reset.
- Consequence: Future fresh-world, reset, or multi-session work should go through the explicit session-reset path instead of partially mutating world/player state or rebuilding the full app bootstrap by default.

### 2026-03-02: Debug HUD visibility is controlled by in-world shell chrome

- Decision: The text debug overlay now defaults hidden and is shown only when the in-world shell toggle enables it.
- Reason: The project needs debug telemetry available on demand without forcing an always-on HUD over normal play and menu flows.
- Consequence: Future debug HUD additions should respect the shell-controlled visibility state instead of assuming the overlay is permanently visible once gameplay starts.

### 2026-03-02: Compact debug-edit overlay visibility is controlled by in-world shell chrome

- Decision: The compact debug-edit status strip, inspect outlines, and one-shot preview overlays are now shown or hidden through a dedicated in-world shell toggle instead of always rendering whenever gameplay is active.
- Reason: Mixed-device play needs a quick way to declutter the screen for normal movement and inspection without disabling edit controls, one-shot tool state, or simulation.
- Consequence: Future compact debug-edit overlay work should respect the shell-controlled visibility state instead of assuming those overlays are always visible during in-world runtime.

### 2026-03-02: Full Debug Edit panel visibility is controlled separately from compact overlays

- Decision: The full `Debug Edit` control panel now has its own in-world shell toggle and visibility state instead of sharing the compact overlay toggle.
- Reason: The compact inspect and preview layer is optional clutter on desktop, but the full touch-first edit control surface has different value and should be independently available or dismissible.
- Consequence: Future debug-edit UI work should explicitly choose whether it belongs to the full panel or the compact overlay layer, and respect the matching shell visibility state.

### 2026-03-02: Standalone player spawn marker visibility is controlled by in-world shell chrome

- Decision: The resolved standalone player spawn marker overlay is now shown or hidden through a dedicated in-world shell toggle instead of always rendering whenever gameplay is active.
- Reason: Spawn validation needs to stay available during world-edit and movement work, but the marker should be dismissible when it becomes visual clutter during normal play.
- Consequence: Future spawn-marker overlay work should respect the shell-controlled visibility state instead of assuming the overlay is always visible during in-world runtime.

### 2026-03-02: Shell camera recenter resets preserved follow offset

- Decision: The in-world shell's `Recenter Camera` action now snaps the camera back to the standalone player's focus point by zeroing the preserved follow offset instead of layering another camera correction on top of it.
- Reason: Manual inspection already accumulates pan and zoom deltas into the follow offset, so recentering should clear that accumulated state directly rather than introducing a second reset path that can drift from the follow model.
- Consequence: Future recenter controls or shortcuts should reuse the follow-offset reset behavior rather than bypassing player follow with ad hoc camera mutations.

### 2026-03-02: Visible authored-atlas pixels must stay inside documented authored regions

- Decision: Non-transparent pixels in the committed atlas PNG must stay inside authored regions touched by shipped metadata or explicitly documented as intentionally unused.
- Reason: Exterior padding and uncovered canvas gaps only work as reliable spill-detection space if visible art cannot drift into them unnoticed.
- Consequence: Future atlas edits should expand authored-region documentation or metadata coverage together with any intentional new visible area; otherwise uncovered canvas should remain fully transparent.

### 2026-03-02: Explicitly unused authored atlas regions must stay fully transparent

- Decision: Any authored atlas region documented in `AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS` must remain fully transparent in the committed PNG.
- Reason: A documented spare slot is only a reliable regression target if stray committed art cannot accumulate inside it unnoticed.
- Consequence: Future atlas edits should either keep unused documented regions blank or remove them from the intentionally-unused table as part of the same change.

### 2026-03-02: Explicitly unused authored atlas regions must stay unreferenced by default metadata

- Decision: Regions documented in `AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS` must not be referenced by shipped `atlasIndex` metadata or overlapped by default direct `render.uvRect` sources.
- Reason: A reserved spare slot only remains a trustworthy blank regression target if metadata cannot silently start sampling it through either authored-region indices or direct UV sub-rects.
- Consequence: Future tile metadata changes should remove a region from the intentionally-unused table before any default atlas-index or direct-UV source is allowed to target it.

### 2026-03-02: Exterior authored-atlas padding strip must stay fully transparent

- Decision: The entire committed PNG strip beyond the right edge of all authored atlas regions must remain fully transparent, not merely partially empty.
- Reason: Atlas spill regressions need one unambiguous blank band where any non-transparent pixel is automatically an authored-content leak.
- Consequence: Future atlas growth should preserve a fully transparent exterior strip or update the authored layout, committed asset, and related regressions together.

### 2026-03-02: Default direct `render.uvRect` sources must stay out of the exterior padding strip

- Decision: Every shipped direct `render.uvRect` source, including animated frames, must stay entirely outside the fully transparent committed atlas strip beyond the authored-region bounds.
- Reason: Direct UV metadata bypasses authored atlas-index ownership, so the exterior blank band only remains a trustworthy spill-detection target if metadata cannot sample it either.
- Consequence: Future direct-UV authoring should stay within the authored-region span or update the authored layout, committed asset, and related regressions together.

### 2026-03-02: Default animated direct `render.uvRect` frames must differ in committed atlas content

- Decision: Consecutive default animation frames that resolve through direct `render.uvRect` metadata must not point at identical committed PNG pixels.
- Reason: Direct-UV animation metadata can otherwise exercise the renderer path while shipping a visually static repeated frame, which hides authored-asset drift until later art work builds on it.
- Consequence: Future direct-UV animation authoring should change committed atlas content from one frame to the next whenever a tile is intended to animate visibly.

### 2026-03-02: Default animated direct `render.uvRect` frames must stay inside authored atlas regions

- Decision: Every default animated frame that resolves through direct `render.uvRect` metadata must stay fully inside the explicit authored atlas region set.
- Reason: Direct-UV animation frames can bypass atlas-index ownership, so uncovered atlas canvas would otherwise remain vulnerable to silent metadata drift even when the committed PNG still looks correct.
- Consequence: Future direct-UV animation authoring should keep each frame within documented authored regions or update the authored layout and related regressions in the same pass.

### 2026-03-02: Default animated atlas-index frames must differ in committed atlas content

- Decision: Consecutive default animation frames that resolve through authored atlas indices must not point at identical committed PNG pixels.
- Reason: Atlas-index animation metadata can otherwise exercise the renderer path while shipping a visually static repeated frame, which hides authored-asset drift until later art work builds on it.
- Consequence: Future atlas-index animation authoring should change committed atlas content from one frame to the next whenever a tile is intended to animate visibly.

### 2026-03-02: Fully transparent RGB drift does not count as authored animation frame change

- Decision: Authored-atlas animation regression comparisons ignore RGB differences on pixels whose alpha is zero in both compared committed PNG frames.
- Reason: PNG tooling can rewrite invisible transparent-pixel RGB without changing shipped visuals, so that drift should not satisfy frame-distinctness regressions for atlas-index or direct-`render.uvRect` animations.
- Consequence: Future authored animation regression work should look for visible committed frame changes instead of treating hidden transparent padding churn as meaningful content.

### 2026-03-02: Default direct `render.uvRect` tiles must point at visible committed atlas content

- Decision: Default tile metadata that uses direct `render.uvRect` mapping must resolve to a committed atlas sub-rect containing at least one non-transparent pixel.
- Reason: Direct UV sources bypass authored atlas-index coverage, so they need their own committed-asset regression guard against silently pointing at blank atlas space.
- Consequence: Future direct-UV tile authoring should ship visible atlas content in the referenced sub-rect or avoid referencing that rect from default metadata.

### 2026-03-02: Static direct `render.uvRect` tiles must stay inside authored atlas regions

- Decision: Every default static direct `render.uvRect` source must stay fully inside the explicit authored atlas region set.
- Reason: Static direct UV metadata bypasses atlas-index ownership just like animated frames, so uncovered atlas canvas would otherwise remain vulnerable to silent metadata drift even when a tile is not animated.
- Consequence: Future direct-UV tile authoring should keep each base static source inside documented authored regions or update the authored layout and related regressions in the same pass.

### 2026-03-02: Committed authored atlas regions must be accounted for explicitly

- Decision: Every region declared in `src/world/authoredAtlasLayout.ts` must either be referenced by default tile metadata or listed in the same module as intentionally unused with a reason.
- Reason: Committed atlas asset regressions need to distinguish deliberate spare or blank slots from accidental content drift between the PNG, the layout table, and tile metadata.
- Consequence: Future atlas edits should update the authored layout's unused-region documentation whenever a committed slot is left blank or reserved instead of referenced immediately.

### 2026-03-01: Chunk streaming prune must not discard edited tile state

- Decision: `TileWorld` now keeps sparse per-chunk edited tile overrides separate from resident chunk instances, reapplies them when pruned chunks stream back in, and drops an override only when a tile is reset to its procedural value.
- Reason: Streaming caches need to stay disposable for memory control, but renderer and gameplay state should not silently lose user edits just because an off-screen chunk was evicted.
- Consequence: Future world streaming, save/load, and networking work should treat resident chunk objects as rebuildable caches over procedural generation plus persisted edits, rather than the only copy of authoritative edited terrain.

### 2026-03-01: Direct `uvRect` tile render sources must resolve to whole atlas pixels at runtime

- Decision: Renderer boot now validates direct static and animated `uvRect` render metadata against the loaded atlas dimensions and warns when any edge resolves between atlas pixels, while atlas-index-backed sources continue to derive from authored pixel regions.
- Reason: Normalized sub-rect metadata is only sampling-safe when it lands on exact texel boundaries for the atlas image that actually loaded at runtime.
- Consequence: Future direct `uvRect` authoring should start from atlas pixel coordinates or move to `atlasIndex`; atlas-size changes that preserve bounds but break whole-pixel mapping are still considered invalid content.

### 2026-03-01: Animated non-terrain tiles advance through renderer-side UV patching

- Decision: Chunk meshes continue to bake static frame-zero UVs, while the renderer retains CPU-side vertex copies only for chunks containing animated non-terrain quads and rewrites those UVs when elapsed time advances to a new metadata frame.
- Reason: This preserves terrain autotile and static-tile mesh resolution, avoids per-frame remeshing, and lets authored animation metadata layer onto the existing chunk format with a narrow renderer-only update path.
- Consequence: Future tile animation work should reuse the compiled animation lookup plus animated-quad patch path; tiles whose animation changes topology or adjacency still need a different pipeline.

### 2026-03-01: Authored atlas layout owns atlas-index resolution

- Decision: `atlasIndex` render metadata, terrain variant maps, and the generated placeholder fallback atlas now resolve through an explicit authored atlas layout definition instead of deriving UVs or fallback paint regions from hard-coded `4x4` slot math.
- Reason: Atlas validation, UV lookup, and fallback preview generation need one content-owned source of truth that can stay aligned with the committed PNG as authored regions evolve, without coupling runtime behavior to placeholder implementation details.
- Consequence: Future atlas edits should update `src/world/authoredAtlasLayout.ts` first, and new atlas-index validation, rendering, or fallback atlas work should consume that layout rather than reintroducing grid-derived assumptions.

### 2026-03-01: Temporary standalone player visualization lives in the WebGL renderer

- Decision: Until the entity layer lands, the spawned standalone player is drawn by a dedicated renderer-side world-space placeholder pass instead of a DOM overlay.
- Reason: World-space rendering keeps camera movement, zoom, and draw ordering aligned with terrain, and avoids maintaining a second client-space projection path for a temporary visual.
- Consequence: Future placeholder-player polish should extend the renderer pass or the later entity layer rather than reintroducing a standalone DOM marker.

### 2026-03-01: Animated tile metadata layers onto a static frame-zero render source

- Decision: Optional tile render animation metadata stays additive to the existing static `atlasIndex` / `uvRect`; when `frames` are present, `frameDurationMs` is required and `frames[0]` must resolve to the same UV rect as the static render source.
- Reason: The current mesher and renderer still consume one static UV rect per non-terrain tile, so animated tiles need a deterministic frame-zero fallback before render-time animation sampling exists.
- Consequence: Future animated tiles should always define a valid static frame-zero source, and later renderer animation work should sample the compiled animation lookup instead of bypassing the existing static UV metadata path.

### 2026-03-01: Manual camera inspection adjusts follow offset instead of disabling player follow

- Decision: Standalone player camera follow now targets the player body center by default, while manual pan and zoom input is preserved by folding camera deltas into a persistent follow offset instead of toggling into a separate free-camera mode.
- Reason: Mixed-device play needs player-centric framing, but debug inspection still needs drag and pinch camera control without fighting a second camera state machine.
- Consequence: Future camera controls should usually modify the follow offset or explicitly introduce a higher-level shell state, rather than bypassing player follow by mutating `Camera2D` indefinitely.

### 2026-03-01: Player input should resolve into movement intent before physics stepping

- Decision: Standalone player walk and jump behavior now enter the simulation as a normalized movement-intent object that the player-state helper resolves into horizontal velocity, jump impulse, gravity, and collision stepping.
- Reason: This keeps device-specific bindings out of the world layer, gives desktop and touch controllers one shared contract to target, and preserves a single fixed-step path for future entity migration.
- Consequence: Future input work should map controls into movement intent and call the shared player-step helper instead of mutating player velocity directly in `src/main.ts` or `src/input`.

### 2026-03-01: Standalone player gravity is applied before collision stepping

- Decision: The spawned standalone player now applies gravity and fall-speed clamping to `velocity.y` before each fixed-step collision move, rather than re-running spawn placement or using a separate gravity path.
- Reason: This makes unsupported players start falling immediately, keeps resting-on-ground behavior stable through the same collision helper, and gives later movement work one fixed-step path to extend.
- Consequence: Future walk, jump, respawn, or entity migration work should layer onto the gravity-step helper instead of introducing parallel gravity integration or bypassing the shared collision sweep order.

### 2026-03-01: Player collision stepping resolves horizontal then vertical sweeps

- Decision: Standalone player collision stepping moves the player through an `x` sweep first, then a `y` sweep, and determines `grounded` from a post-move support probe instead of trusting prior grounded state.
- Reason: This keeps fixed-step movement deterministic, lets wall and ceiling hits zero only the blocked axis, and makes ledge walk-off behavior correct even before gravity and input forces are layered in.
- Consequence: Future standalone-controller or entity migration work should reuse the shared collision-step helper for grounded resolution rather than introducing separate per-system sweep order or support checks.

### 2026-03-01: Player state uses a feet-centered position anchor

- Decision: Standalone player state stores `position` at the player's bottom center and derives the collision AABB from explicit `size`.
- Reason: Spawn search already resolves a standing feet position plus AABB, and sharing that anchor avoids ad hoc transforms between spawn, collision, and future controller code.
- Consequence: Player movement, debug markers, and later entity migration should treat player `position` as bottom-center world space and use the shared AABB helper instead of introducing alternate anchor conventions.

### 2026-02-28: Simulation runs in fixed steps, rendering interpolates

- Decision: Authoritative game state advances in the fixed `60hz` update loop, while rendering receives interpolation alpha and frame timing separately.
- Reason: This keeps simulation hooks deterministic and gives later systems like player movement, entities, lighting, and networking a stable update model.
- Consequence: New gameplay state should update in fixed-step code paths. Render code can smooth presentation, but should not become the source of truth for simulation state.

### 2026-02-28: Tile metadata is the source of truth for tile behavior and rendering

- Decision: Tile render data, terrain connectivity, and gameplay flags live in validated tile metadata and are resolved through the metadata registry instead of scattered hardcoded tile rules.
- Reason: The project already uses tile metadata to drive meshing and gameplay tags, which keeps authored content extensible and avoids duplicating tile semantics across subsystems.
- Consequence: New tile types or tile-specific behavior should usually start with metadata schema and validation updates, then consume that data from helpers instead of adding ad hoc tile ID conditionals.

### 2026-02-28: Metadata compiles into dense hot-path lookup tables

- Decision: After validation, tile metadata is compiled into dense lookup structures such as typed arrays and flattened tables for gameplay and render queries.
- Reason: Meshing already runs in hot loops, and planned systems like collision, liquids, and lighting will need predictable per-tile access without repeated parsing or allocation.
- Consequence: Preserve the compile-once, lookup-many pattern for hot-path tile queries. Avoid re-reading raw metadata or constructing new objects inside per-tile simulation or meshing loops.

### 2026-02-28: Mixed-device editing features share underlying state and actions

- Decision: Desktop and touch debug-edit workflows share the same conceptual state for mode, brush selection, undo history, and armed one-shot tools, even when the interaction surfaces differ.
- Reason: This project targets mixed-device play, and the current tooling already treats desktop shortcuts, touch gestures, and on-screen controls as alternate views over the same editing model.
- Consequence: New edit or inspect features should usually be implemented in shared controller or state layers first, then exposed through device-specific bindings rather than forked behavior.

### 2026-02-28: Chunk rendering stays simple until a stronger need exists

- Decision: World chunks are currently meshed as one quad per non-empty tile and built through a budgeted queue instead of introducing greedy meshing or more complex visibility rules early.
- Reason: The current renderer favors correctness, debuggability, and incremental evolution over early geometric optimization.
- Consequence: Future performance work should first preserve the existing simple chunk pipeline and optimize around lookup tables, queueing, and cache behavior before replacing the mesh model outright.

## Template

### YYYY-MM-DD: Decision title

- Decision: What was chosen.
- Reason: Why this path was taken instead of the main alternative.
- Consequence: What later agents should assume because of this choice.
