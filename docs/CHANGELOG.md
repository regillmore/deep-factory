# Changelog

This file records completed agent passes. Keep entries brief and append new work in reverse chronological order. Current behavior belongs in [docs/CAPABILITIES.md](docs/CAPABILITIES.md), not here.

## 2026-02-28

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
