import { describe, expect, it } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import { createAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';
import {
  accumulateAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  accumulateAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';

const createPopulatedSnapshot = () =>
  createAuthoritativeClientReplicationDiagnosticsSnapshot({
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

describe('AuthoritativeClientReplicationDiagnosticsRegistry', () => {
  it('stores detached snapshots by client id and returns detached lookups', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const snapshot = createPopulatedSnapshot();

    registry.setSnapshot('client-alpha', snapshot);

    snapshot.replay.lastProcessed = null;
    snapshot.replay.totals.chunks.applied = 0;
    snapshot.send.lastStaged = null;
    snapshot.send.totals.entities.forwarded = 0;
    snapshot.resync.lastAppliedBaseline = null;
    snapshot.resync.totals.spawned = 0;

    const storedSnapshot = registry.getSnapshot('client-alpha');

    expect(registry.getClientCount()).toBe(1);
    expect(registry.has('client-alpha')).toBe(true);
    expect(registry.getClientIds()).toEqual(['client-alpha']);
    expect(storedSnapshot).toEqual(createPopulatedSnapshot());

    storedSnapshot!.replay.totals.entities.applied = 0;
    storedSnapshot!.send.totals.chunks.forwarded = 0;
    storedSnapshot!.resync.totals.removed = 0;

    expect(registry.getSnapshot('client-alpha')).toEqual(createPopulatedSnapshot());
  });

  it('resets an existing client snapshot while leaving other clients unchanged', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    registry.setSnapshot('client-alpha', createPopulatedSnapshot());
    registry.setSnapshot('client-bravo', createPopulatedSnapshot());

    const resetSnapshot = registry.reset('client-bravo');

    expect(resetSnapshot).toEqual(
      createAuthoritativeClientReplicationDiagnosticsSnapshot()
    );
    expect(registry.getClientCount()).toBe(2);
    expect(registry.getSnapshot('client-alpha')).toEqual(createPopulatedSnapshot());
    expect(registry.getSnapshot('client-bravo')).toEqual(
      createAuthoritativeClientReplicationDiagnosticsSnapshot()
    );
  });

  it('seeds a missing client id with a zeroed snapshot when reset is used for reconnect-style initialization', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    const resetSnapshot = registry.reset('client-charlie');

    expect(resetSnapshot).toEqual(
      createAuthoritativeClientReplicationDiagnosticsSnapshot()
    );
    expect(registry.getClientCount()).toBe(1);
    expect(registry.getClientIds()).toEqual(['client-charlie']);
    expect(registry.getSnapshot('client-charlie')).toEqual(
      createAuthoritativeClientReplicationDiagnosticsSnapshot()
    );
  });

  it('removes stored client snapshots for disconnect flows', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    registry.setSnapshot('client-alpha', createPopulatedSnapshot());

    expect(registry.remove('client-alpha')).toBe(true);
    expect(registry.remove('client-alpha')).toBe(false);
    expect(registry.getClientCount()).toBe(0);
    expect(registry.has('client-alpha')).toBe(false);
    expect(registry.getSnapshot('client-alpha')).toBeNull();
    expect(registry.getClientIds()).toEqual([]);
  });
});
