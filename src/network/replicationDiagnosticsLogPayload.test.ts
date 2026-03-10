import { describe, expect, it } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { createAuthoritativeClientReplicationDiagnosticsLogPayload } from './replicationDiagnosticsLogPayload';
import { createAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';
import {
  accumulateAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  accumulateAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';

const createPopulatedSnapshot = (seed: number) =>
  createAuthoritativeClientReplicationDiagnosticsSnapshot({
    replayDiagnostics: accumulateAuthoritativeClientReplicationDiagnostics({
      tick: seed,
      dispatchSummary: {
        chunks: {
          dropped: seed,
          trimmed: seed + 1,
          applied: seed + 2,
          skipped: seed + 3
        },
        entities: {
          dropped: seed + 4,
          trimmed: seed + 5,
          applied: seed + 6,
          skipped: seed + 7
        }
      }
    }),
    sendDiagnostics: accumulateAuthoritativeClientSendDiagnostics({
      batchFilterSummary: {
        staged: {
          tick: seed + 10
        },
        chunks: {
          dropped: seed + 8,
          trimmed: seed + 9,
          forwarded: seed + 10
        },
        entities: {
          dropped: seed + 11,
          trimmed: seed + 12,
          forwarded: seed + 13
        }
      }
    }),
    resyncDiagnostics: accumulateAuthoritativeClientResyncDiagnostics({
      baselineSummary: {
        baseline: {
          tick: seed + 20,
          entityCount: seed + 21
        },
        entities: {
          spawned: seed + 14,
          updated: seed + 15,
          removed: seed + 16
        }
      }
    })
  });

describe('createAuthoritativeClientReplicationDiagnosticsLogPayload', () => {
  it('returns zeroed aggregate totals plus an empty ordered client list when no snapshots were provided', () => {
    expect(createAuthoritativeClientReplicationDiagnosticsLogPayload()).toEqual({
      aggregate: {
        clientCount: 0,
        replay: {
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
        },
        send: {
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
        },
        resync: {
          spawned: 0,
          updated: 0,
          removed: 0
        }
      },
      clients: []
    });
  });

  it('preserves ordered client snapshots while combining them with aggregate totals', () => {
    expect(
      createAuthoritativeClientReplicationDiagnosticsLogPayload([
        {
          clientId: 'client-alpha',
          snapshot: createPopulatedSnapshot(10)
        },
        {
          clientId: 'client-bravo',
          snapshot: createAuthoritativeClientReplicationDiagnosticsSnapshot()
        },
        {
          clientId: 'client-charlie',
          snapshot: createPopulatedSnapshot(30)
        }
      ])
    ).toEqual({
      aggregate: {
        clientCount: 3,
        replay: {
          chunks: {
            dropped: 40,
            trimmed: 42,
            applied: 44,
            skipped: 46
          },
          entities: {
            dropped: 48,
            trimmed: 50,
            applied: 52,
            skipped: 54
          }
        },
        send: {
          chunks: {
            dropped: 56,
            trimmed: 58,
            forwarded: 60
          },
          entities: {
            dropped: 62,
            trimmed: 64,
            forwarded: 66
          }
        },
        resync: {
          spawned: 68,
          updated: 70,
          removed: 72
        }
      },
      clients: [
        {
          clientId: 'client-alpha',
          snapshot: createPopulatedSnapshot(10)
        },
        {
          clientId: 'client-bravo',
          snapshot: createAuthoritativeClientReplicationDiagnosticsSnapshot()
        },
        {
          clientId: 'client-charlie',
          snapshot: createPopulatedSnapshot(30)
        }
      ]
    });
  });

  it('returns detached aggregate and client snapshots without reusing the provided nested objects', () => {
    const snapshotEntries = [
      {
        clientId: 'client-alpha',
        snapshot: createPopulatedSnapshot(5)
      }
    ];

    const payload = createAuthoritativeClientReplicationDiagnosticsLogPayload(snapshotEntries);

    expect(payload.clients).not.toBe(snapshotEntries);
    expect(payload.clients[0]).not.toBe(snapshotEntries[0]);
    expect(payload.clients[0]!.snapshot).not.toBe(snapshotEntries[0]!.snapshot);

    snapshotEntries[0]!.snapshot.replay.totals.chunks.applied = 0;
    snapshotEntries[0]!.snapshot.send.totals.entities.forwarded = 0;
    snapshotEntries[0]!.snapshot.resync.totals.spawned = 0;

    expect(payload).toEqual({
      aggregate: {
        clientCount: 1,
        replay: {
          chunks: {
            dropped: 5,
            trimmed: 6,
            applied: 7,
            skipped: 8
          },
          entities: {
            dropped: 9,
            trimmed: 10,
            applied: 11,
            skipped: 12
          }
        },
        send: {
          chunks: {
            dropped: 13,
            trimmed: 14,
            forwarded: 15
          },
          entities: {
            dropped: 16,
            trimmed: 17,
            forwarded: 18
          }
        },
        resync: {
          spawned: 19,
          updated: 20,
          removed: 21
        }
      },
      clients: [
        {
          clientId: 'client-alpha',
          snapshot: createPopulatedSnapshot(5)
        }
      ]
    });
  });
});
