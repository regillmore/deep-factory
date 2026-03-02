# deep-factory

A minimal TypeScript + Vite WebGL2 foundation for a mixed-device, chunked tile world. The project is being developed through repeated single-task agent passes, so the docs are split by purpose instead of using the README as a changelog.

## Setup

```bash
npm install
npm run dev
```

Open the local Vite URL in Chrome, Firefox, or Safari.

## Scripts

- `npm run dev` - start local development server
- `npm run build` - type-check and build production bundle
- `npm run preview` - preview production build
- `npm run test` - run Vitest unit tests
- `npm run lint` - run ESLint
- `npm run format` - run Prettier

## Quick Controls

- App shell: wait for boot to finish, choose `Enter World` from the main menu, then use the top-right `Recenter Camera` action or press `C` to reset camera follow framing; the `Debug HUD`, `Edit Overlays`, and `Spawn Marker` toggles show and hide the text telemetry, compact debug-edit overlays, and standalone player spawn marker.
- Desktop: `WASD` or arrow keys move the standalone player, mouse wheel zooms, left-drag places with the active brush, right-drag breaks, and `Shift` + drag pans while painting is available.
- Touch: the shared on-screen debug controls switch between `Pan`, `Place`, and `Break`; one-finger drag pans or paints based on mode, and two-finger pinch zooms.
- Full controls, mixed-device debug tooling, and the current feature inventory live in [docs/CAPABILITIES.md](docs/CAPABILITIES.md).

## Docs

- [docs/CAPABILITIES.md](docs/CAPABILITIES.md): current feature inventory and detailed controls.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): module boundaries, update loop, and render pipeline.
- [docs/NEXT.md](docs/NEXT.md): current actionable roadmap.
- [docs/DECISIONS.md](docs/DECISIONS.md): durable project invariants and tradeoffs.
- [docs/CHANGELOG.md](docs/CHANGELOG.md): completed agent tasks and notable passes.
- [AGENTS.md](AGENTS.md): agent workflow rules for single-task iterative development.
