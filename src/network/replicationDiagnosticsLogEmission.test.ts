import { describe, expect, it } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { createAuthoritativeClientReplicationDiagnosticsLogEmission } from './replicationDiagnosticsLogEmission';
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

describe('createAuthoritativeClientReplicationDiagnosticsLogEmission', () => {
  it('returns zeroed formatted log text for an empty registry and schedules the next emission from the provided tick', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const expectedLines = [
      'ReplicationDiagnostics',
      'Aggregate: clients=0',
      'AggregateReplayChunks: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      'AggregateReplayEntities: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      'AggregateSendChunks: dropped=0 | trimmed=0 | forwarded=0',
      'AggregateSendEntities: dropped=0 | trimmed=0 | forwarded=0',
      'AggregateResync: spawned=0 | updated=0 | removed=0',
      'Clients: none'
    ];

    expect(
      createAuthoritativeClientReplicationDiagnosticsLogEmission({
        registry,
        tick: 12,
        intervalTicks: 30
      })
    ).toEqual({
      nextDueTick: 42,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
  });

  it('snapshots the registry in deterministic client-id order and formats one integrated periodic emission', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    registry.setSnapshot('client-zulu', createPopulatedSnapshot(30));
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(10));
    registry.reset('client-bravo');
    const expectedLines = [
      'ReplicationDiagnostics',
      'Aggregate: clients=3',
      'AggregateReplayChunks: dropped=40 | trimmed=42 | applied=44 | skipped=46',
      'AggregateReplayEntities: dropped=48 | trimmed=50 | applied=52 | skipped=54',
      'AggregateSendChunks: dropped=56 | trimmed=58 | forwarded=60',
      'AggregateSendEntities: dropped=62 | trimmed=64 | forwarded=66',
      'AggregateResync: spawned=68 | updated=70 | removed=72',
      'Clients:',
      'Client: client-alpha',
      '  ReplayLastProcessed: 10',
      '  ReplayChunks: dropped=10 | trimmed=11 | applied=12 | skipped=13',
      '  ReplayEntities: dropped=14 | trimmed=15 | applied=16 | skipped=17',
      '  SendLastStaged: 20',
      '  SendChunks: dropped=18 | trimmed=19 | forwarded=20',
      '  SendEntities: dropped=21 | trimmed=22 | forwarded=23',
      '  ResyncLastAppliedBaseline: tick=30 | entityCount=31',
      '  ResyncTotals: spawned=24 | updated=25 | removed=26',
      'Client: client-bravo',
      '  ReplayLastProcessed: n/a',
      '  ReplayChunks: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      '  ReplayEntities: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      '  SendLastStaged: n/a',
      '  SendChunks: dropped=0 | trimmed=0 | forwarded=0',
      '  SendEntities: dropped=0 | trimmed=0 | forwarded=0',
      '  ResyncLastAppliedBaseline: n/a',
      '  ResyncTotals: spawned=0 | updated=0 | removed=0',
      'Client: client-zulu',
      '  ReplayLastProcessed: 30',
      '  ReplayChunks: dropped=30 | trimmed=31 | applied=32 | skipped=33',
      '  ReplayEntities: dropped=34 | trimmed=35 | applied=36 | skipped=37',
      '  SendLastStaged: 40',
      '  SendChunks: dropped=38 | trimmed=39 | forwarded=40',
      '  SendEntities: dropped=41 | trimmed=42 | forwarded=43',
      '  ResyncLastAppliedBaseline: tick=50 | entityCount=51',
      '  ResyncTotals: spawned=44 | updated=45 | removed=46'
    ];

    expect(
      createAuthoritativeClientReplicationDiagnosticsLogEmission({
        registry,
        tick: 75,
        intervalTicks: 15
      })
    ).toEqual({
      nextDueTick: 90,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
  });

  it('returns emitted text and lines detached from later registry mutations', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const expectedLines = [
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
    ];

    const emission = createAuthoritativeClientReplicationDiagnosticsLogEmission({
      registry,
      tick: 9,
      intervalTicks: 4
    });

    registry.reset('client-alpha');

    expect(emission).toEqual({
      nextDueTick: 13,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
  });

  it('returns detached line arrays so caller mutation does not affect joined text or later emissions', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const expectedLines = [
      'ReplicationDiagnostics',
      'Aggregate: clients=1',
      'AggregateReplayChunks: dropped=3 | trimmed=4 | applied=5 | skipped=6',
      'AggregateReplayEntities: dropped=7 | trimmed=8 | applied=9 | skipped=10',
      'AggregateSendChunks: dropped=11 | trimmed=12 | forwarded=13',
      'AggregateSendEntities: dropped=14 | trimmed=15 | forwarded=16',
      'AggregateResync: spawned=17 | updated=18 | removed=19',
      'Clients:',
      'Client: client-alpha',
      '  ReplayLastProcessed: 3',
      '  ReplayChunks: dropped=3 | trimmed=4 | applied=5 | skipped=6',
      '  ReplayEntities: dropped=7 | trimmed=8 | applied=9 | skipped=10',
      '  SendLastStaged: 13',
      '  SendChunks: dropped=11 | trimmed=12 | forwarded=13',
      '  SendEntities: dropped=14 | trimmed=15 | forwarded=16',
      '  ResyncLastAppliedBaseline: tick=23 | entityCount=24',
      '  ResyncTotals: spawned=17 | updated=18 | removed=19'
    ];

    const emission = createAuthoritativeClientReplicationDiagnosticsLogEmission({
      registry,
      tick: 4,
      intervalTicks: 6
    });

    emission.logLines[0] = 'mutated';

    expect(emission.logText).toBe(expectedLines.join('\n'));

    const laterEmission = createAuthoritativeClientReplicationDiagnosticsLogEmission({
      registry,
      tick: 4,
      intervalTicks: 6
    });

    expect(laterEmission.logLines).toEqual(expectedLines);
    expect(laterEmission.logLines).not.toBe(emission.logLines);
  });

  it('rejects invalid tick and interval inputs', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    expect(() =>
      createAuthoritativeClientReplicationDiagnosticsLogEmission({
        registry,
        tick: -1,
        intervalTicks: 10
      })
    ).toThrowError('tick must be a non-negative integer');

    expect(() =>
      createAuthoritativeClientReplicationDiagnosticsLogEmission({
        registry,
        tick: 1.5,
        intervalTicks: 10
      })
    ).toThrowError('tick must be a non-negative integer');

    expect(() =>
      createAuthoritativeClientReplicationDiagnosticsLogEmission({
        registry,
        tick: 1,
        intervalTicks: 0
      })
    ).toThrowError('intervalTicks must be greater than 0');

    expect(() =>
      createAuthoritativeClientReplicationDiagnosticsLogEmission({
        registry,
        tick: 1,
        intervalTicks: 2.5
      })
    ).toThrowError('intervalTicks must be a non-negative integer');
  });
});
