import { describe, expect, it, vi } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  reconfigureAuthoritativeClientReplicationDiagnosticsLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerReconfiguration
} from './replicationDiagnosticsLoggerReconfiguration';
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

const expectActiveReconfiguration = ({
  loggerRunner,
  loggerPollCallback
}: AuthoritativeClientReplicationDiagnosticsLoggerReconfiguration) => {
  expect(loggerRunner).not.toBeNull();
  expect(loggerPollCallback).not.toBeNull();

  if (loggerRunner === null || loggerPollCallback === null) {
    throw new Error('expected active replication diagnostics logger reconfiguration');
  }

  return {
    loggerRunner,
    loggerPollCallback
  };
};

describe('reconfigureAuthoritativeClientReplicationDiagnosticsLogger', () => {
  it('returns a disabled runner and poll callback pair when no logger callbacks are configured', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();

    expect(
      reconfigureAuthoritativeClientReplicationDiagnosticsLogger({
        registry,
        intervalTicks: 0,
        nextDueTick: -1
      })
    ).toEqual({
      loggerRunner: null,
      loggerPollCallback: null
    });
  });

  it('builds an active runner and fixed-step poll callback from enabled logger settings', () => {
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
    const { loggerRunner, loggerPollCallback } = expectActiveReconfiguration(
      reconfigureAuthoritativeClientReplicationDiagnosticsLogger({
        registry,
        intervalTicks: 10,
        nextDueTick: 12,
        textLogger,
        lineLogger,
        payloadLogger
      })
    );
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
      '  ResyncLastAppliedBaseline: tick=25 | entityCount=26',
      '  ResyncTotals: replacedTiles=22 | replacedWalls=23 | spawned=19 | updated=20 | removed=21'
    ].join('\n');

    loggerPollCallback(11);
    expect(textLogger).not.toHaveBeenCalled();
    expect(lineLogger).not.toHaveBeenCalled();
    expect(payloadLogger).not.toHaveBeenCalled();
    expect(loggerRunner.getNextDueTick()).toBe(12);

    loggerPollCallback(12);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(textLogger).toHaveBeenCalledWith(expectedText);
    expect(lineLogger).toHaveBeenCalledTimes(1);
    expect(lineLogger.mock.calls[0]![0][0]).toBe('ReplicationDiagnostics');
    expect(payloadLogger).toHaveBeenCalledTimes(1);
    expect(payloadLogger.mock.calls[0]![0].aggregate.clientCount).toBe(1);
    expect(payloadLogger.mock.calls[0]![0].clients[0]!.clientId).toBe('client-alpha');
    expect(loggerRunner.getNextDueTick()).toBe(22);
    expect(callOrder).toEqual([
      'text:ReplicationDiagnostics',
      'line:ReplicationDiagnostics',
      'payload:1'
    ]);
  });

  it('rebuilds fresh runner and poll callback state from updated logger callbacks and cadence settings', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondLineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const firstReconfiguration = expectActiveReconfiguration(
      reconfigureAuthoritativeClientReplicationDiagnosticsLogger({
        registry,
        intervalTicks: 5,
        nextDueTick: 3,
        textLogger: firstTextLogger
      })
    );
    const secondReconfiguration = expectActiveReconfiguration(
      reconfigureAuthoritativeClientReplicationDiagnosticsLogger({
        registry,
        intervalTicks: 7,
        nextDueTick: 9,
        lineLogger: secondLineLogger
      })
    );

    firstReconfiguration.loggerPollCallback(3);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(firstReconfiguration.loggerRunner.getNextDueTick()).toBe(8);

    secondReconfiguration.loggerPollCallback(8);
    expect(secondLineLogger).not.toHaveBeenCalled();
    expect(secondReconfiguration.loggerRunner.getNextDueTick()).toBe(9);

    secondReconfiguration.loggerPollCallback(9);
    expect(secondLineLogger).toHaveBeenCalledTimes(1);
    expect(secondLineLogger.mock.calls[0]![0][0]).toBe('ReplicationDiagnostics');
    expect(secondReconfiguration.loggerRunner.getNextDueTick()).toBe(16);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
  });

  it('surfaces cadence validation errors when reconfiguration enables logging', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();

    expect(() =>
      reconfigureAuthoritativeClientReplicationDiagnosticsLogger({
        registry,
        intervalTicks: 0,
        nextDueTick: 12,
        textLogger
      })
    ).toThrowError('intervalTicks must be greater than 0');
  });
});
