# Changelog

This file records completed agent passes. Keep entries brief and append new work in reverse chronological order. Current behavior belongs in [docs/CAPABILITIES.md](docs/CAPABILITIES.md), not here.

## 2026-03-01

- Task: Show chunk-local tile coordinates alongside world plus chunk coordinates in the compact status strip inspect metadata.
- Changes: Updated [src/main.ts](../src/main.ts) to attach chunk-local inspect coordinates from shared chunk math helpers, updated [src/ui/debugEditStatusHelpers.ts](../src/ui/debugEditStatusHelpers.ts) to render local coordinates for hover, pinned, and shared inspect states, added regression coverage in [src/ui/debugEditStatusHelpers.test.ts](../src/ui/debugEditStatusHelpers.test.ts), advanced [docs/NEXT.md](docs/NEXT.md), and updated [docs/CAPABILITIES.md](docs/CAPABILITIES.md).
- Verification: Ran `npx vitest run src/ui/debugEditStatusHelpers.test.ts` and `npx tsc --noEmit -p tsconfig.app.json`.
- Task: Stabilize compact status strip inspect hover metadata while the mouse is over the `Pin Click` or `Repin Click` action row.
- Changes: Updated [src/input/controller.ts](../src/input/controller.ts) to preserve mouse inspect state when the pointer leaves the canvas into registered retainer UI, updated [src/ui/debugEditStatusStrip.ts](../src/ui/debugEditStatusStrip.ts) plus [src/main.ts](../src/main.ts) to register the compact status strip action row as a retainer, added regression coverage in [src/input/controller.test.ts](../src/input/controller.test.ts), refined [docs/NEXT.md](docs/NEXT.md), and updated [docs/CAPABILITIES.md](docs/CAPABILITIES.md).
- Verification: Ran `npx vitest run src/input/controller.test.ts src/ui/debugEditStatusHelpers.test.ts` and `npx tsc --noEmit -p tsconfig.app.json`.

## 2026-02-28

- Task: Show chunk coordinates alongside tile coordinates in the compact status strip inspect metadata.
- Changes: Updated [src/main.ts](../src/main.ts) to attach chunk coordinates to shared inspect tile state, updated [src/ui/debugEditStatusHelpers.ts](../src/ui/debugEditStatusHelpers.ts) to render chunk coordinates in compact inspect metadata lines, added regression coverage in [src/ui/debugEditStatusHelpers.test.ts](../src/ui/debugEditStatusHelpers.test.ts), advanced [docs/NEXT.md](docs/NEXT.md), and updated [docs/CAPABILITIES.md](docs/CAPABILITIES.md).
- Verification: Ran `npx vitest run src/ui/debugEditStatusHelpers.test.ts` and `npx tsc --noEmit -p tsconfig.app.json`.
- Task: Show the hovered-to-pinned tile offset in the compact status strip when both inspect targets are visible and different.
- Changes: Updated [src/ui/debugEditStatusHelpers.ts](../src/ui/debugEditStatusHelpers.ts) to append a compact `Hover->Pinned` offset line only for split inspect targets, added regression coverage in [src/ui/debugEditStatusHelpers.test.ts](../src/ui/debugEditStatusHelpers.test.ts), and advanced [docs/NEXT.md](docs/NEXT.md) to the next inspect UX follow-up while updating [docs/CAPABILITIES.md](docs/CAPABILITIES.md).
- Verification: Ran `npx vitest run src/ui/debugEditStatusHelpers.test.ts` and `npx tsc --noEmit -p tsconfig.app.json`.
- Task: Label the compact status strip inspect readout as shared when pinned and hovered targets resolve to the same tile.
- Changes: Updated [src/ui/debugEditStatusHelpers.ts](../src/ui/debugEditStatusHelpers.ts) so deduplicated same-tile inspect state renders `Shared` labels in both the summary chip and metadata line, added regression coverage in [src/ui/debugEditStatusHelpers.test.ts](../src/ui/debugEditStatusHelpers.test.ts), and advanced [docs/NEXT.md](docs/NEXT.md) to the next UX cleanup item.
- Verification: Ran `npx vitest run src/ui/debugEditStatusHelpers.test.ts` and `npx tsc --noEmit -p tsconfig.app.json`.
- Task: Show separate hovered and pinned tile metadata lines in the compact status strip when both inspect targets differ.
- Changes: Updated [src/ui/debugEditStatusHelpers.ts](../src/ui/debugEditStatusHelpers.ts) to emit distinct pinned and hover inspect lines when their targets differ, updated [src/ui/debugEditStatusStrip.ts](../src/ui/debugEditStatusStrip.ts) to render newline-separated inspect text, and added focused coverage in [src/ui/debugEditStatusHelpers.test.ts](../src/ui/debugEditStatusHelpers.test.ts).
- Verification: Ran `npx vitest run src/ui/debugEditStatusHelpers.test.ts` and `npx tsc --noEmit -p tsconfig.app.json`.
- Task: Render pinned and hovered inspect outlines simultaneously so desktop inspect-pin workflows can compare a locked tile against the current hover target.
- Changes: Updated [src/ui/hoveredTileCursor.ts](../src/ui/hoveredTileCursor.ts) to manage separate pinned and hovered overlay layers, wired [src/main.ts](../src/main.ts) to pass both inspect targets at render time, and added target-resolution coverage in [src/ui/hoveredTileCursor.test.ts](../src/ui/hoveredTileCursor.test.ts).
- Verification: Ran `npx vitest run src/ui/hoveredTileCursor.test.ts` and `npx tsc --noEmit -p tsconfig.app.json`.
- Task: Reorganized project documentation so `README.md` no longer doubles as both capability inventory and change history.
- Changes: Added [docs/CAPABILITIES.md](docs/CAPABILITIES.md) for current-state features and controls, added [docs/CHANGELOG.md](docs/CHANGELOG.md) for completed task history, trimmed [README.md](../README.md) into a concise project entry point, and updated [AGENTS.md](../AGENTS.md) to direct future agents to the new documentation flow.
- Verification: Reviewed the updated docs for consistency; tests were not run because this was a docs-only change.

## Entry Template

- Task: Short description of the completed roadmap item or documentation pass.
- Changes: The key files or behaviors that changed.
- Verification: Commands run, manual checks performed, or an explicit note that verification was not run.
