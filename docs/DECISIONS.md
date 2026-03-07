# Decisions

Record only durable design decisions here. Keep each entry short: date, decision, reason, and consequence.

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

### 2026-03-02: Authored atlas keeps a spare unused region plus exterior padding

- Decision: The committed authored atlas now expands to `96x64`, preserves the original `4x4` used region block, reserves authored region `16` as intentionally unused, and leaves exterior transparent padding beyond the authored-region bounds.
- Reason: Upcoming committed-asset regressions for unused-region transparency and content spill need real empty atlas space instead of a fully packed image.
- Consequence: Future atlas edits should preserve equivalent documented spare space or deliberately update the related asset-regression coverage and docs at the same time.

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
