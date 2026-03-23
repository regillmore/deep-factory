import { describe, expect, it } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { createAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';
import {
  accumulateAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  accumulateAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';

describe('createAuthoritativeClientReplicationDiagnosticsSnapshot', () => {
  it('returns zeroed replay, send, and resync sections when no diagnostics were provided', () => {
    expect(createAuthoritativeClientReplicationDiagnosticsSnapshot()).toEqual({
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
          replacedTiles: 0,
          replacedWalls: 0,
          spawned: 0,
          updated: 0,
          removed: 0
        }
      }
    });
  });

  it('merges provided replay, send, and resync diagnostics into one detached JSON-safe snapshot', () => {
    const replayDiagnostics = accumulateAuthoritativeClientReplicationDiagnostics({
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
    });

    const sendDiagnostics = accumulateAuthoritativeClientSendDiagnostics({
      batchFilterSummary: {
        staged: {
          tick: 15
        },
        chunks: {
          dropped: 2,
          trimmed: 1,
          forwarded: 3
        },
        entities: {
          dropped: 4,
          trimmed: 5,
          forwarded: 6
        }
      }
    });

    const resyncDiagnostics = accumulateAuthoritativeClientResyncDiagnostics({
      baselineSummary: {
        baseline: {
          tick: 9,
          entityCount: 11
        },
        world: {
          replacedTiles: 6,
          replacedWalls: 7
        },
        entities: {
          spawned: 3,
          updated: 2,
          removed: 1
        }
      }
    });

    const snapshot = createAuthoritativeClientReplicationDiagnosticsSnapshot({
      replayDiagnostics,
      sendDiagnostics,
      resyncDiagnostics
    });

    expect(snapshot).toEqual({
      replay: replayDiagnostics,
      send: sendDiagnostics,
      resync: resyncDiagnostics
    });
    expect(snapshot.replay).not.toBe(replayDiagnostics);
    expect(snapshot.replay.totals).not.toBe(replayDiagnostics.totals);
    expect(snapshot.replay.totals.chunks).not.toBe(replayDiagnostics.totals.chunks);
    expect(snapshot.replay.totals.entities).not.toBe(replayDiagnostics.totals.entities);
    expect(snapshot.send).not.toBe(sendDiagnostics);
    expect(snapshot.send.totals).not.toBe(sendDiagnostics.totals);
    expect(snapshot.send.totals.chunks).not.toBe(sendDiagnostics.totals.chunks);
    expect(snapshot.send.totals.entities).not.toBe(sendDiagnostics.totals.entities);
    expect(snapshot.resync).not.toBe(resyncDiagnostics);
    expect(snapshot.resync.totals).not.toBe(resyncDiagnostics.totals);
  });

  it('fills omitted sections with zeroed defaults without mutating the provided diagnostics', () => {
    const replayDiagnostics = accumulateAuthoritativeClientReplicationDiagnostics({
      tick: 4,
      dispatchSummary: {
        chunks: {
          dropped: 0,
          trimmed: 1,
          applied: 2,
          skipped: 3
        },
        entities: {
          dropped: 4,
          trimmed: 0,
          applied: 5,
          skipped: 6
        }
      }
    });

    const snapshot = createAuthoritativeClientReplicationDiagnosticsSnapshot({
      replayDiagnostics
    });

    expect(snapshot).toEqual({
      replay: replayDiagnostics,
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
          replacedTiles: 0,
          replacedWalls: 0,
          spawned: 0,
          updated: 0,
          removed: 0
        }
      }
    });
    expect(snapshot.replay).not.toBe(replayDiagnostics);
  });
});
