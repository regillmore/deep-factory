import { describe, expect, it } from 'vitest';

import type { AuthoritativeReplicationDispatchSummary } from './replicationDispatchSummary';
import {
  accumulateAuthoritativeClientReplicationDiagnostics,
  createAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';

describe('createAuthoritativeClientReplicationDiagnostics', () => {
  it('returns zeroed chunk and entity totals before any dispatch summaries were accumulated', () => {
    expect(createAuthoritativeClientReplicationDiagnostics()).toEqual({
      lastProcessed: null,
      totals: {
        chunks: {
          dropped: 0,
          trimmed: 0,
          applied: 0,
          skipped: 0
        },
        entities: {
          dropped: 0,
          trimmed: 0,
          applied: 0,
          skipped: 0
        }
      }
    });
  });
});

describe('accumulateAuthoritativeClientReplicationDiagnostics', () => {
  it('seeds running totals from the first processed tick summary', () => {
    const diagnostics = accumulateAuthoritativeClientReplicationDiagnostics({
      tick: 12,
      dispatchSummary: {
        chunks: {
          dropped: 1,
          trimmed: 0,
          applied: 2,
          skipped: 1
        },
        entities: {
          dropped: 0,
          trimmed: 3,
          applied: 1,
          skipped: 0
        }
      } satisfies AuthoritativeReplicationDispatchSummary
    });

    expect(diagnostics).toEqual({
      lastProcessed: {
        tick: 12
      },
      totals: {
        chunks: {
          dropped: 1,
          trimmed: 0,
          applied: 2,
          skipped: 1
        },
        entities: {
          dropped: 0,
          trimmed: 3,
          applied: 1,
          skipped: 0
        }
      }
    });
  });

  it('adds later summaries onto running totals while replacing only the last processed tick metadata', () => {
    const firstDiagnostics = accumulateAuthoritativeClientReplicationDiagnostics({
      tick: 5,
      dispatchSummary: {
        chunks: {
          dropped: 1,
          trimmed: 0,
          applied: 2,
          skipped: 0
        },
        entities: {
          dropped: 0,
          trimmed: 1,
          applied: 1,
          skipped: 1
        }
      } satisfies AuthoritativeReplicationDispatchSummary
    });

    const secondDiagnostics = accumulateAuthoritativeClientReplicationDiagnostics({
      diagnostics: firstDiagnostics,
      tick: 8,
      dispatchSummary: {
        chunks: {
          dropped: 0,
          trimmed: 2,
          applied: 1,
          skipped: 3
        },
        entities: {
          dropped: 4,
          trimmed: 0,
          applied: 2,
          skipped: 0
        }
      } satisfies AuthoritativeReplicationDispatchSummary
    });

    expect(firstDiagnostics).toEqual({
      lastProcessed: {
        tick: 5
      },
      totals: {
        chunks: {
          dropped: 1,
          trimmed: 0,
          applied: 2,
          skipped: 0
        },
        entities: {
          dropped: 0,
          trimmed: 1,
          applied: 1,
          skipped: 1
        }
      }
    });
    expect(secondDiagnostics).toEqual({
      lastProcessed: {
        tick: 8
      },
      totals: {
        chunks: {
          dropped: 1,
          trimmed: 2,
          applied: 3,
          skipped: 3
        },
        entities: {
          dropped: 4,
          trimmed: 1,
          applied: 3,
          skipped: 1
        }
      }
    });
  });
});
