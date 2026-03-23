import { describe, expect, it } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import { createAuthoritativeClientReplicationDiagnosticsRegistrySnapshot } from './replicationDiagnosticsRegistrySnapshot';
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
        world: {
          replacedTiles: seed + 17,
          replacedWalls: seed + 18
        },
        entities: {
          spawned: seed + 14,
          updated: seed + 15,
          removed: seed + 16
        }
      }
    })
  });

describe('createAuthoritativeClientReplicationDiagnosticsRegistrySnapshot', () => {
  it('returns an empty ordered snapshot when the registry has no clients', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    expect(createAuthoritativeClientReplicationDiagnosticsRegistrySnapshot(registry)).toEqual([]);
  });

  it('returns detached client snapshots in ascending client-id order regardless of insertion order', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    registry.setSnapshot('client-zulu', createPopulatedSnapshot(30));
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(10));
    registry.reset('client-bravo');

    expect(createAuthoritativeClientReplicationDiagnosticsRegistrySnapshot(registry)).toEqual([
      {
        clientId: 'client-alpha',
        snapshot: createPopulatedSnapshot(10)
      },
      {
        clientId: 'client-bravo',
        snapshot: createAuthoritativeClientReplicationDiagnosticsSnapshot()
      },
      {
        clientId: 'client-zulu',
        snapshot: createPopulatedSnapshot(30)
      }
    ]);
  });

  it('omits removed clients and keeps returned entries detached from registry storage', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    registry.setSnapshot('client-charlie', createPopulatedSnapshot(20));
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    registry.remove('client-charlie');

    const snapshotEntries = createAuthoritativeClientReplicationDiagnosticsRegistrySnapshot(registry);

    expect(snapshotEntries).toEqual([
      {
        clientId: 'client-alpha',
        snapshot: createPopulatedSnapshot(5)
      }
    ]);

    snapshotEntries[0]!.snapshot.replay.totals.chunks.applied = 0;
    snapshotEntries[0]!.snapshot.send.totals.entities.forwarded = 0;
    snapshotEntries[0]!.snapshot.resync.totals.spawned = 0;

    expect(createAuthoritativeClientReplicationDiagnosticsRegistrySnapshot(registry)).toEqual([
      {
        clientId: 'client-alpha',
        snapshot: createPopulatedSnapshot(5)
      }
    ]);
  });
});
