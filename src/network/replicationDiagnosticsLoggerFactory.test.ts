import { describe, expect, it, vi } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { createAuthoritativeClientReplicationDiagnosticsLogPayload } from './replicationDiagnosticsLogPayload';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull,
  type NullableAuthoritativeClientReplicationDiagnosticsLoggerRunner
} from './replicationDiagnosticsLoggerFactory';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import { createAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';
import {
  accumulateAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  accumulateAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

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

const expectLoggerRunner = (
  loggerRunner: NullableAuthoritativeClientReplicationDiagnosticsLoggerRunner
) => {
  expect(loggerRunner).not.toBeNull();

  if (loggerRunner === null) {
    throw new Error('expected replication diagnostics logger runner');
  }

  return loggerRunner;
};

describe('createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull', () => {
  it('returns null before cadence creation when no logger callbacks are configured', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    expect(
      createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull({
        registry,
        intervalTicks: 0,
        nextDueTick: -1
      })
    ).toBeNull();
  });

  it('builds a ready-to-poll runner when any logger callback is configured', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const callOrder: string[] = [];
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>((logText) => {
      callOrder.push(`text:${logText.split('\n', 1)[0]}`);
    });
    const lineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>((logLines) => {
      callOrder.push(`line:${logLines[0]}`);
    });
    const payloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>((payload) => {
      callOrder.push(`payload:${payload.aggregate.clientCount}`);
    });
    const loggerRunner = expectLoggerRunner(
      createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull({
        registry,
        intervalTicks: 10,
        nextDueTick: 12,
        textLogger,
        lineLogger,
        payloadLogger
      })
    );
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

    expect(loggerRunner.getNextDueTick()).toBe(12);
    expect(loggerRunner.poll({ tick: 11 })).toEqual({
      emitted: false,
      nextDueTick: 12,
      payload: null,
      logLines: null,
      logText: null
    });
    expect(loggerRunner.poll({ tick: 12 })).toEqual({
      emitted: true,
      nextDueTick: 22,
      payload: expectedPayload,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
    expect(loggerRunner.getNextDueTick()).toBe(22);
    expect(textLogger).toHaveBeenCalledWith(expectedLines.join('\n'));
    expect(lineLogger).toHaveBeenCalledWith(expectedLines);
    expect(payloadLogger).toHaveBeenCalledWith(expectedPayload);
    expect(callOrder).toEqual([
      'text:ReplicationDiagnostics',
      'line:ReplicationDiagnostics',
      'payload:1'
    ]);
  });

  it('surfaces cadence validation errors once logging is enabled', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();

    expect(() =>
      createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull({
        registry,
        intervalTicks: 0,
        nextDueTick: 12,
        textLogger
      })
    ).toThrowError('intervalTicks must be greater than 0');
  });
});
