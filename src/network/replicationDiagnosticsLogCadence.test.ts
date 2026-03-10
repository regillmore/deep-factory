import { describe, expect, it } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { AuthoritativeClientReplicationDiagnosticsLogCadence } from './replicationDiagnosticsLogCadence';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
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

describe('AuthoritativeClientReplicationDiagnosticsLogCadence', () => {
  it('returns a silent non-due result and preserves the current due tick', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const cadence = new AuthoritativeClientReplicationDiagnosticsLogCadence({
      registry,
      intervalTicks: 10,
      nextDueTick: 12
    });

    expect(cadence.poll({ tick: 11 })).toEqual({
      emitted: false,
      nextDueTick: 12,
      logText: null
    });
    expect(cadence.getNextDueTick()).toBe(12);
  });

  it('emits formatted diagnostics once the fixed-step tick reaches the due boundary', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const cadence = new AuthoritativeClientReplicationDiagnosticsLogCadence({
      registry,
      intervalTicks: 10,
      nextDueTick: 12
    });

    expect(cadence.poll({ tick: 12 })).toEqual({
      emitted: true,
      nextDueTick: 22,
      logText: [
        'ReplicationDiagnostics',
        'Aggregate: clients=1',
        'AggregateReplayChunks: dropped=5 | trimmed=6 | applied=7 | skipped=8',
        'AggregateReplayEntities: dropped=9 | trimmed=10 | applied=11 | skipped=12',
        'AggregateSendChunks: dropped=13 | trimmed=14 | forwarded=15',
        'AggregateSendEntities: dropped=16 | trimmed=17 | forwarded=18',
        'AggregateResync: spawned=19 | updated=20 | removed=21',
        'Clients:',
        'Client: client-alpha',
        '  ReplayLastProcessed: 5',
        '  ReplayChunks: dropped=5 | trimmed=6 | applied=7 | skipped=8',
        '  ReplayEntities: dropped=9 | trimmed=10 | applied=11 | skipped=12',
        '  SendLastStaged: 15',
        '  SendChunks: dropped=13 | trimmed=14 | forwarded=15',
        '  SendEntities: dropped=16 | trimmed=17 | forwarded=18',
        '  ResyncLastAppliedBaseline: tick=25 | entityCount=26',
        '  ResyncTotals: spawned=19 | updated=20 | removed=21'
      ].join('\n')
    });
    expect(cadence.getNextDueTick()).toBe(22);
  });

  it('reschedules from the emitted tick after schedule slippage instead of replaying missed intervals', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(7));
    const cadence = new AuthoritativeClientReplicationDiagnosticsLogCadence({
      registry,
      intervalTicks: 6,
      nextDueTick: 10
    });

    const lateEmission = cadence.poll({ tick: 14 });

    expect(lateEmission.emitted).toBe(true);
    expect(lateEmission.nextDueTick).toBe(20);
    expect(cadence.getNextDueTick()).toBe(20);
    expect(cadence.poll({ tick: 19 })).toEqual({
      emitted: false,
      nextDueTick: 20,
      logText: null
    });
  });

  it('rejects invalid constructor and poll tick inputs', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    expect(
      () =>
        new AuthoritativeClientReplicationDiagnosticsLogCadence({
          registry,
          intervalTicks: 0,
          nextDueTick: 1
        })
    ).toThrowError('intervalTicks must be greater than 0');

    expect(
      () =>
        new AuthoritativeClientReplicationDiagnosticsLogCadence({
          registry,
          intervalTicks: 2,
          nextDueTick: -1
        })
    ).toThrowError('nextDueTick must be a non-negative integer');

    expect(
      () =>
        new AuthoritativeClientReplicationDiagnosticsLogCadence({
          registry,
          intervalTicks: 2,
          nextDueTick: 1.5
        })
    ).toThrowError('nextDueTick must be a non-negative integer');

    const cadence = new AuthoritativeClientReplicationDiagnosticsLogCadence({
      registry,
      intervalTicks: 2,
      nextDueTick: 0
    });

    expect(() => cadence.poll({ tick: -1 })).toThrowError(
      'tick must be a non-negative integer'
    );
    expect(() => cadence.poll({ tick: 1.5 })).toThrowError(
      'tick must be a non-negative integer'
    );
  });
});
