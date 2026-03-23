import { describe, expect, it, vi } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull
} from './replicationDiagnosticsLoggerFactory';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerPollCallback
} from './replicationDiagnosticsLoggerPoll';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import { createAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';
import {
  accumulateAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  accumulateAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';
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

describe('createAuthoritativeClientReplicationDiagnosticsLoggerPollCallback', () => {
  it('returns a no-op callback when the logger runner is null', () => {
    const loggerPoll = createAuthoritativeClientReplicationDiagnosticsLoggerPollCallback({
      loggerRunner: null
    });

    expect(() => loggerPoll(-1)).not.toThrow();
    expect(() => loggerPoll(Number.NaN)).not.toThrow();
  });

  it('polls the provided runner once fixed-step ticks reach the due boundary', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const loggerRunner = createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull({
      registry,
      intervalTicks: 10,
      nextDueTick: 12,
      textLogger
    });

    expect(loggerRunner).not.toBeNull();
    if (loggerRunner === null) {
      throw new Error('expected replication diagnostics logger runner');
    }

    const loggerPoll = createAuthoritativeClientReplicationDiagnosticsLoggerPollCallback({
      loggerRunner
    });
    const expectedText = [
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
    ].join('\n');

    loggerPoll(11);
    expect(textLogger).not.toHaveBeenCalled();
    expect(loggerRunner.getNextDueTick()).toBe(12);

    loggerPoll(12);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(textLogger).toHaveBeenCalledWith(expectedText);
    expect(loggerRunner.getNextDueTick()).toBe(22);
  });

  it('preserves active-runner tick validation instead of swallowing polling errors', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const loggerRunner = createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull({
      registry,
      intervalTicks: 4,
      nextDueTick: 1,
      textLogger
    });

    expect(loggerRunner).not.toBeNull();
    if (loggerRunner === null) {
      throw new Error('expected replication diagnostics logger runner');
    }

    const loggerPoll = createAuthoritativeClientReplicationDiagnosticsLoggerPollCallback({
      loggerRunner
    });

    expect(() => loggerPoll(-1)).toThrowError('tick must be a non-negative integer');
  });
});
