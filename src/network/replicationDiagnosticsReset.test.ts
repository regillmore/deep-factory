import { describe, expect, it } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { resetAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsReset';
import { createAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';
import {
  accumulateAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  accumulateAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';

describe('resetAuthoritativeClientReplicationDiagnosticsSnapshot', () => {
  it('returns a zeroed combined snapshot when no prior diagnostics were provided', () => {
    expect(resetAuthoritativeClientReplicationDiagnosticsSnapshot()).toEqual({
      replay: {
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
      },
      send: {
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
      },
      resync: {
        lastAppliedBaseline: null,
        totals: {
          spawned: 0,
          updated: 0,
          removed: 0
        }
      }
    });
  });

  it('clears replay, send, and resync totals plus metadata without mutating the provided snapshot', () => {
    const snapshot = createAuthoritativeClientReplicationDiagnosticsSnapshot({
      replayDiagnostics: accumulateAuthoritativeClientReplicationDiagnostics({
        tick: 12,
        dispatchSummary: {
          chunks: {
            dropped: 1,
            trimmed: 2,
            applied: 3,
            skipped: 4
          },
          entities: {
            dropped: 5,
            trimmed: 6,
            applied: 7,
            skipped: 8
          }
        }
      }),
      sendDiagnostics: accumulateAuthoritativeClientSendDiagnostics({
        batchFilterSummary: {
          staged: {
            tick: 15
          },
          chunks: {
            dropped: 2,
            trimmed: 3,
            forwarded: 4
          },
          entities: {
            dropped: 5,
            trimmed: 6,
            forwarded: 7
          }
        }
      }),
      resyncDiagnostics: accumulateAuthoritativeClientResyncDiagnostics({
        baselineSummary: {
          baseline: {
            tick: 18,
            entityCount: 9
          },
          entities: {
            spawned: 4,
            updated: 3,
            removed: 2
          }
        }
      })
    });

    const resetSnapshot = resetAuthoritativeClientReplicationDiagnosticsSnapshot(snapshot);

    expect(snapshot).toEqual({
      replay: {
        lastProcessed: {
          tick: 12
        },
        totals: {
          chunks: {
            dropped: 1,
            trimmed: 2,
            applied: 3,
            skipped: 4
          },
          entities: {
            dropped: 5,
            trimmed: 6,
            applied: 7,
            skipped: 8
          }
        }
      },
      send: {
        lastStaged: {
          tick: 15
        },
        totals: {
          chunks: {
            dropped: 2,
            trimmed: 3,
            forwarded: 4
          },
          entities: {
            dropped: 5,
            trimmed: 6,
            forwarded: 7
          }
        }
      },
      resync: {
        lastAppliedBaseline: {
          tick: 18,
          entityCount: 9
        },
        totals: {
          spawned: 4,
          updated: 3,
          removed: 2
        }
      }
    });
    expect(resetSnapshot).toEqual({
      replay: {
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
      },
      send: {
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
      },
      resync: {
        lastAppliedBaseline: null,
        totals: {
          spawned: 0,
          updated: 0,
          removed: 0
        }
      }
    });
    expect(resetSnapshot).not.toBe(snapshot);
    expect(resetSnapshot.replay).not.toBe(snapshot.replay);
    expect(resetSnapshot.replay.totals).not.toBe(snapshot.replay.totals);
    expect(resetSnapshot.replay.totals.chunks).not.toBe(snapshot.replay.totals.chunks);
    expect(resetSnapshot.replay.totals.entities).not.toBe(snapshot.replay.totals.entities);
    expect(resetSnapshot.send).not.toBe(snapshot.send);
    expect(resetSnapshot.send.totals).not.toBe(snapshot.send.totals);
    expect(resetSnapshot.send.totals.chunks).not.toBe(snapshot.send.totals.chunks);
    expect(resetSnapshot.send.totals.entities).not.toBe(snapshot.send.totals.entities);
    expect(resetSnapshot.resync).not.toBe(snapshot.resync);
    expect(resetSnapshot.resync.totals).not.toBe(snapshot.resync.totals);
  });
});
