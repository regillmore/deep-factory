# Agent Workflow

This repository is developed through repeated agent passes. Each pass should complete one focused roadmap task, keep the docs current, and leave the repo in a state that the next agent can extend safely.

## Read Order

1. Read this file first.
2. Read [docs/NEXT.md](docs/NEXT.md) to choose the next task.
3. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing module boundaries, runtime flow, or data ownership.
4. Read [docs/DECISIONS.md](docs/DECISIONS.md) when the task touches a prior design decision or introduces a new one.

## Iteration Contract

1. Choose exactly one task from [docs/NEXT.md](docs/NEXT.md).
2. If the task is too large for one focused implementation pass, split it in [docs/NEXT.md](docs/NEXT.md) first, then implement only one resulting child task.
3. Do not combine multiple roadmap tasks in one pass unless one is a trivial prerequisite required to finish the chosen task safely.
4. Keep the implementation narrow. Avoid opportunistic refactors unless they are necessary to complete the chosen task or prevent a clear correctness problem.
5. Before finishing, update [docs/NEXT.md](docs/NEXT.md): remove the completed task or replace it with more specific follow-up tasks, then add exactly one new replacement task that keeps the backlog length stable.

## Task Selection Rules

- Prefer the highest-leverage task that is already unblocked by the current codebase.
- Prefer tasks that fit in one implementation session plus relevant tests.
- Prefer vertical slices that produce a working behavior over broad scaffolding with no validation path.
- Do not pick a task whose dependencies are not represented in the code or roadmap; add or refine prerequisite tasks first.

## Definition Of Done

A task is done only when all of the following are true:

1. The targeted behavior or capability is implemented.
2. Relevant tests are added or updated for the changed logic.
3. The build, typecheck, or targeted test command has been run when practical in the current environment.
4. [docs/NEXT.md](docs/NEXT.md) reflects the new state of the roadmap.
5. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) is updated if the change modifies module boundaries, core data flow, simulation order, or rendering architecture.
6. [docs/DECISIONS.md](docs/DECISIONS.md) is updated if the pass introduces a durable design rule, tradeoff, or invariant that later agents should not need to rediscover.

If a useful verification step could not be run, state that explicitly in the final handoff.

## Roadmap Mutation Rules

- Replacement tasks must be specific, testable, and small enough for one agent pass.
- Replacement tasks should describe one concrete behavior, one subsystem slice, or one integration step.
- Prefer wording that makes dependencies obvious.
- Avoid vague backlog items such as `improve networking`, `polish UI`, or `refactor input`.
- When splitting a task, preserve the parent intent but rewrite the children so each one has a clear finish line.

## Architecture Guardrails

- Keep the fixed-step simulation separate from render interpolation.
- Preserve mixed-device support. Desktop and touch should stay aligned unless the roadmap item explicitly says otherwise.
- Maintain module boundaries:
  - `src/core`: simulation loop and camera fundamentals.
  - `src/input`: device input, gestures, and intent extraction.
  - `src/world`: world state, tile metadata, chunk math, simulation-facing data queries.
  - `src/gl`: WebGL resources and rendering orchestration.
  - `src/ui`: DOM overlays and debug or shell UI.
- Keep `src/main.ts` as composition and orchestration code. Do not turn it into the default home for new subsystem logic.
- Prefer adding narrow helpers in the owning subsystem over reaching across layers.

## Testing Rules

- New logic should ship with focused tests near the affected subsystem when practical.
- Bug fixes should add a regression test when the failure mode can be isolated.
- For rendering-heavy work, test the deterministic parts first: metadata resolution, mask calculation, geometry generation, queue behavior, and state transitions.
- If full end-to-end validation is not practical, leave a concise note describing what was verified and what remains manual.

## Documentation Rules

- Keep [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) short and structural. Do not turn it into a changelog.
- Keep [docs/DECISIONS.md](docs/DECISIONS.md) short and durable. Record only decisions that affect future implementation choices.
- Use [docs/NEXT.md](docs/NEXT.md) for actionable work items, not for design rationale.

## Blockers

If the chosen task cannot be completed safely:

1. Do not leave the roadmap untouched.
2. Replace the blocked task with one or more concrete unblocker tasks.
3. Record the blocking constraint in the final handoff.
4. If the blocker changes a durable project assumption, note it in [docs/DECISIONS.md](docs/DECISIONS.md).

## Handoff Expectations

In the final response:

1. State what task was completed.
2. State what verification was performed and what was not performed.
3. Point to any roadmap, architecture, or decision-log updates.
4. Mention any remaining risk that the next agent should understand in one or two sentences.
