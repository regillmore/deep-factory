import { describe, expect, it } from 'vitest';

import type { AuthoritativeReplicationBaselineApplySummary } from './replicationBaselineSummary';
import {
  accumulateAuthoritativeClientResyncDiagnostics,
  createAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';

describe('createAuthoritativeClientResyncDiagnostics', () => {
  it('returns zeroed totals before any baseline summaries were accumulated', () => {
    expect(createAuthoritativeClientResyncDiagnostics()).toEqual({
      lastAppliedBaseline: null,
      totals: {
        replacedTiles: 0,
        replacedWalls: 0,
        spawned: 0,
        updated: 0,
        removed: 0
      }
    });
  });
});

describe('accumulateAuthoritativeClientResyncDiagnostics', () => {
  it('seeds running totals from the first applied baseline summary', () => {
    const diagnostics = accumulateAuthoritativeClientResyncDiagnostics({
      baselineSummary: {
        baseline: {
          tick: 12,
          entityCount: 4
        },
        world: {
          replacedTiles: 6,
          replacedWalls: 5
        },
        entities: {
          spawned: 2,
          updated: 1,
          removed: 3
        }
      } satisfies AuthoritativeReplicationBaselineApplySummary
    });

    expect(diagnostics).toEqual({
      lastAppliedBaseline: {
        tick: 12,
        entityCount: 4
      },
      totals: {
        replacedTiles: 6,
        replacedWalls: 5,
        spawned: 2,
        updated: 1,
        removed: 3
      }
    });
  });

  it('adds later baseline summaries onto running totals while replacing only the last applied baseline metadata', () => {
    const firstDiagnostics = accumulateAuthoritativeClientResyncDiagnostics({
      baselineSummary: {
        baseline: {
          tick: 5,
          entityCount: 3
        },
        world: {
          replacedTiles: 8,
          replacedWalls: 4
        },
        entities: {
          spawned: 1,
          updated: 2,
          removed: 0
        }
      } satisfies AuthoritativeReplicationBaselineApplySummary
    });

    const secondDiagnostics = accumulateAuthoritativeClientResyncDiagnostics({
      diagnostics: firstDiagnostics,
      baselineSummary: {
        baseline: {
          tick: 8,
          entityCount: 1
        },
        world: {
          replacedTiles: 3,
          replacedWalls: 7
        },
        entities: {
          spawned: 0,
          updated: 1,
          removed: 4
        }
      } satisfies AuthoritativeReplicationBaselineApplySummary
    });

    expect(firstDiagnostics).toEqual({
      lastAppliedBaseline: {
        tick: 5,
        entityCount: 3
      },
      totals: {
        replacedTiles: 8,
        replacedWalls: 4,
        spawned: 1,
        updated: 2,
        removed: 0
      }
    });
    expect(secondDiagnostics).toEqual({
      lastAppliedBaseline: {
        tick: 8,
        entityCount: 1
      },
      totals: {
        replacedTiles: 11,
        replacedWalls: 11,
        spawned: 1,
        updated: 3,
        removed: 4
      }
    });
  });
});
