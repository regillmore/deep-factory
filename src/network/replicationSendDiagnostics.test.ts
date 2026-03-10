import { describe, expect, it } from 'vitest';

import type { AuthoritativeReplicationBatchFilterSummary } from './replicationBatchFilterSummary';
import {
  accumulateAuthoritativeClientSendDiagnostics,
  createAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';

describe('createAuthoritativeClientSendDiagnostics', () => {
  it('returns zeroed chunk and entity totals before any send summaries were accumulated', () => {
    expect(createAuthoritativeClientSendDiagnostics()).toEqual({
      lastStaged: null,
      totals: {
        chunks: {
          dropped: 0,
          trimmed: 0,
          forwarded: 0
        },
        entities: {
          dropped: 0,
          trimmed: 0,
          forwarded: 0
        }
      }
    });
  });
});

describe('accumulateAuthoritativeClientSendDiagnostics', () => {
  it('seeds running totals from the first staged send summary', () => {
    const diagnostics = accumulateAuthoritativeClientSendDiagnostics({
      batchFilterSummary: {
        staged: {
          tick: 12
        },
        chunks: {
          dropped: 1,
          trimmed: 0,
          forwarded: 2
        },
        entities: {
          dropped: 0,
          trimmed: 3,
          forwarded: 4
        }
      } satisfies AuthoritativeReplicationBatchFilterSummary
    });

    expect(diagnostics).toEqual({
      lastStaged: {
        tick: 12
      },
      totals: {
        chunks: {
          dropped: 1,
          trimmed: 0,
          forwarded: 2
        },
        entities: {
          dropped: 0,
          trimmed: 3,
          forwarded: 4
        }
      }
    });
  });

  it('adds later send summaries onto running totals while replacing only the last staged tick metadata', () => {
    const firstDiagnostics = accumulateAuthoritativeClientSendDiagnostics({
      batchFilterSummary: {
        staged: {
          tick: 5
        },
        chunks: {
          dropped: 1,
          trimmed: 2,
          forwarded: 3
        },
        entities: {
          dropped: 0,
          trimmed: 1,
          forwarded: 1
        }
      } satisfies AuthoritativeReplicationBatchFilterSummary
    });

    const secondDiagnostics = accumulateAuthoritativeClientSendDiagnostics({
      diagnostics: firstDiagnostics,
      batchFilterSummary: {
        staged: {
          tick: 8
        },
        chunks: {
          dropped: 0,
          trimmed: 1,
          forwarded: 2
        },
        entities: {
          dropped: 4,
          trimmed: 0,
          forwarded: 2
        }
      } satisfies AuthoritativeReplicationBatchFilterSummary
    });

    expect(firstDiagnostics).toEqual({
      lastStaged: {
        tick: 5
      },
      totals: {
        chunks: {
          dropped: 1,
          trimmed: 2,
          forwarded: 3
        },
        entities: {
          dropped: 0,
          trimmed: 1,
          forwarded: 1
        }
      }
    });
    expect(secondDiagnostics).toEqual({
      lastStaged: {
        tick: 8
      },
      totals: {
        chunks: {
          dropped: 1,
          trimmed: 3,
          forwarded: 5
        },
        entities: {
          dropped: 4,
          trimmed: 1,
          forwarded: 3
        }
      }
    });
  });

  it('preserves the last staged tick metadata when an empty summary adds no new staged batch', () => {
    const firstDiagnostics = accumulateAuthoritativeClientSendDiagnostics({
      batchFilterSummary: {
        staged: {
          tick: 9
        },
        chunks: {
          dropped: 2,
          trimmed: 0,
          forwarded: 1
        },
        entities: {
          dropped: 1,
          trimmed: 1,
          forwarded: 2
        }
      } satisfies AuthoritativeReplicationBatchFilterSummary
    });

    const secondDiagnostics = accumulateAuthoritativeClientSendDiagnostics({
      diagnostics: firstDiagnostics,
      batchFilterSummary: {
        staged: null,
        chunks: {
          dropped: 0,
          trimmed: 0,
          forwarded: 0
        },
        entities: {
          dropped: 0,
          trimmed: 0,
          forwarded: 0
        }
      } satisfies AuthoritativeReplicationBatchFilterSummary
    });

    expect(secondDiagnostics).toEqual({
      lastStaged: {
        tick: 9
      },
      totals: {
        chunks: {
          dropped: 2,
          trimmed: 0,
          forwarded: 1
        },
        entities: {
          dropped: 1,
          trimmed: 1,
          forwarded: 2
        }
      }
    });
  });
});
