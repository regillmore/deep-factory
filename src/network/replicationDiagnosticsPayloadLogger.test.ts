import { describe, expect, it, vi } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { AuthoritativeClientReplicationDiagnosticsLogCadence } from './replicationDiagnosticsLogCadence';
import { createAuthoritativeClientReplicationDiagnosticsLogPayload } from './replicationDiagnosticsLogPayload';
import { AuthoritativeClientReplicationDiagnosticsLogSink } from './replicationDiagnosticsLogSink';
import {
  createAuthoritativeClientReplicationDiagnosticsPayloadLogger,
  type AuthoritativeClientReplicationDiagnosticsPayloadLogger
} from './replicationDiagnosticsPayloadLogger';
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

describe('createAuthoritativeClientReplicationDiagnosticsPayloadLogger', () => {
  it('keeps non-due polls silent without calling the payload logger', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const logger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const logSink = new AuthoritativeClientReplicationDiagnosticsLogSink({
      cadence: new AuthoritativeClientReplicationDiagnosticsLogCadence({
        registry,
        intervalTicks: 10,
        nextDueTick: 12
      }),
      sink: createAuthoritativeClientReplicationDiagnosticsPayloadLogger({
        logger
      })
    });

    expect(logSink.poll({ tick: 11 })).toEqual({
      emitted: false,
      nextDueTick: 12,
      payload: null,
      logLines: null,
      logText: null
    });
    expect(logSink.getNextDueTick()).toBe(12);
    expect(logger).not.toHaveBeenCalled();
  });

  it('logs detached payloads on due ticks while the returned cadence result still exposes text and lines', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const logger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const logSink = new AuthoritativeClientReplicationDiagnosticsLogSink({
      cadence: new AuthoritativeClientReplicationDiagnosticsLogCadence({
        registry,
        intervalTicks: 10,
        nextDueTick: 12
      }),
      sink: createAuthoritativeClientReplicationDiagnosticsPayloadLogger({
        logger
      })
    });
    const expectedLines = [
      'ReplicationDiagnostics',
      'Aggregate: clients=1',
      'AggregateReplayChunks: dropped=5 | trimmed=6 | applied=7 | skipped=8',
      'AggregateReplayEntities: dropped=9 | trimmed=10 | applied=11 | skipped=12',
      'AggregateSendChunks: dropped=13 | trimmed=14 | forwarded=15',
      'AggregateSendEntities: dropped=16 | trimmed=17 | forwarded=18',
      'AggregateResync: replacedTiles=22 | replacedWalls=23 | spawned=19 | updated=20 | removed=21',
      'Clients:',
      'Client: client-alpha',
      '  ReplayLastProcessed: 5',
      '  ReplayChunks: dropped=5 | trimmed=6 | applied=7 | skipped=8',
      '  ReplayEntities: dropped=9 | trimmed=10 | applied=11 | skipped=12',
      '  SendLastStaged: 15',
      '  SendChunks: dropped=13 | trimmed=14 | forwarded=15',
      '  SendEntities: dropped=16 | trimmed=17 | forwarded=18',
      '  ResyncLastAppliedBaseline: tick=25 | entityCount=26 | replacedTiles=22 | replacedWalls=23',
      '  ResyncTotals: replacedTiles=22 | replacedWalls=23 | spawned=19 | updated=20 | removed=21'
    ];
    const expectedPayload = createAuthoritativeClientReplicationDiagnosticsLogPayload([
      {
        clientId: 'client-alpha',
        snapshot: createPopulatedSnapshot(5)
      }
    ]);
    const result = logSink.poll({ tick: 12 });

    expect(result).toEqual({
      emitted: true,
      nextDueTick: 22,
      payload: expectedPayload,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
    expect(logSink.getNextDueTick()).toBe(22);
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith(expectedPayload);
  });

  it('keeps payload-logger mutations detached from the returned cadence result', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(4));
    const logger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>((payload) => {
      payload.aggregate.clientCount = 99;
      payload.clients[0]!.snapshot.replay.totals.chunks.applied = 0;
    });
    const logSink = new AuthoritativeClientReplicationDiagnosticsLogSink({
      cadence: new AuthoritativeClientReplicationDiagnosticsLogCadence({
        registry,
        intervalTicks: 5,
        nextDueTick: 8
      }),
      sink: createAuthoritativeClientReplicationDiagnosticsPayloadLogger({
        logger
      })
    });
    const expectedLines = [
      'ReplicationDiagnostics',
      'Aggregate: clients=1',
      'AggregateReplayChunks: dropped=4 | trimmed=5 | applied=6 | skipped=7',
      'AggregateReplayEntities: dropped=8 | trimmed=9 | applied=10 | skipped=11',
      'AggregateSendChunks: dropped=12 | trimmed=13 | forwarded=14',
      'AggregateSendEntities: dropped=15 | trimmed=16 | forwarded=17',
      'AggregateResync: replacedTiles=21 | replacedWalls=22 | spawned=18 | updated=19 | removed=20',
      'Clients:',
      'Client: client-alpha',
      '  ReplayLastProcessed: 4',
      '  ReplayChunks: dropped=4 | trimmed=5 | applied=6 | skipped=7',
      '  ReplayEntities: dropped=8 | trimmed=9 | applied=10 | skipped=11',
      '  SendLastStaged: 14',
      '  SendChunks: dropped=12 | trimmed=13 | forwarded=14',
      '  SendEntities: dropped=15 | trimmed=16 | forwarded=17',
      '  ResyncLastAppliedBaseline: tick=24 | entityCount=25 | replacedTiles=21 | replacedWalls=22',
      '  ResyncTotals: replacedTiles=21 | replacedWalls=22 | spawned=18 | updated=19 | removed=20'
    ];
    const expectedPayload = createAuthoritativeClientReplicationDiagnosticsLogPayload([
      {
        clientId: 'client-alpha',
        snapshot: createPopulatedSnapshot(4)
      }
    ]);
    const result = logSink.poll({ tick: 8 });

    expect(result).toEqual({
      emitted: true,
      nextDueTick: 13,
      payload: expectedPayload,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
    expect(logger).toHaveBeenCalledTimes(1);
    const loggedPayload = logger.mock.calls[0]![0];
    expect(loggedPayload.aggregate.clientCount).toBe(99);
    expect(loggedPayload.clients[0]!.snapshot.replay.totals.chunks.applied).toBe(0);
  });

  it('reuses cadence rescheduling so late polls still log once and stay quiet until the next due tick', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(7));
    const logger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const logSink = new AuthoritativeClientReplicationDiagnosticsLogSink({
      cadence: new AuthoritativeClientReplicationDiagnosticsLogCadence({
        registry,
        intervalTicks: 6,
        nextDueTick: 10
      }),
      sink: createAuthoritativeClientReplicationDiagnosticsPayloadLogger({
        logger
      })
    });
    const expectedLines = [
      'ReplicationDiagnostics',
      'Aggregate: clients=1',
      'AggregateReplayChunks: dropped=7 | trimmed=8 | applied=9 | skipped=10',
      'AggregateReplayEntities: dropped=11 | trimmed=12 | applied=13 | skipped=14',
      'AggregateSendChunks: dropped=15 | trimmed=16 | forwarded=17',
      'AggregateSendEntities: dropped=18 | trimmed=19 | forwarded=20',
      'AggregateResync: replacedTiles=24 | replacedWalls=25 | spawned=21 | updated=22 | removed=23',
      'Clients:',
      'Client: client-alpha',
      '  ReplayLastProcessed: 7',
      '  ReplayChunks: dropped=7 | trimmed=8 | applied=9 | skipped=10',
      '  ReplayEntities: dropped=11 | trimmed=12 | applied=13 | skipped=14',
      '  SendLastStaged: 17',
      '  SendChunks: dropped=15 | trimmed=16 | forwarded=17',
      '  SendEntities: dropped=18 | trimmed=19 | forwarded=20',
      '  ResyncLastAppliedBaseline: tick=27 | entityCount=28 | replacedTiles=24 | replacedWalls=25',
      '  ResyncTotals: replacedTiles=24 | replacedWalls=25 | spawned=21 | updated=22 | removed=23'
    ];
    const expectedPayload = createAuthoritativeClientReplicationDiagnosticsLogPayload([
      {
        clientId: 'client-alpha',
        snapshot: createPopulatedSnapshot(7)
      }
    ]);

    expect(logSink.poll({ tick: 14 })).toEqual({
      emitted: true,
      nextDueTick: 20,
      payload: expectedPayload,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
    expect(logSink.getNextDueTick()).toBe(20);
    expect(logSink.poll({ tick: 19 })).toEqual({
      emitted: false,
      nextDueTick: 20,
      payload: null,
      logLines: null,
      logText: null
    });
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith(expectedPayload);
  });
});
