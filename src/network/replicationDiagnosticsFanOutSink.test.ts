import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsFanOutSink
} from './replicationDiagnosticsFanOutSink';
import { AuthoritativeClientReplicationDiagnosticsLogCadence } from './replicationDiagnosticsLogCadence';
import { AuthoritativeClientReplicationDiagnosticsLogSink } from './replicationDiagnosticsLogSink';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import { createAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';
import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import {
  accumulateAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';
import {
  accumulateAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  createAuthoritativeClientReplicationDiagnosticsLineLogger,
  type AuthoritativeClientReplicationDiagnosticsLineLogger
} from './replicationDiagnosticsLineLogger';
import {
  createAuthoritativeClientReplicationDiagnosticsTextLogger,
  type AuthoritativeClientReplicationDiagnosticsTextLogger
} from './replicationDiagnosticsTextLogger';

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

describe('createAuthoritativeClientReplicationDiagnosticsFanOutSink', () => {
  it('keeps non-due polls silent without calling any sink', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const lineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const logSink = new AuthoritativeClientReplicationDiagnosticsLogSink({
      cadence: new AuthoritativeClientReplicationDiagnosticsLogCadence({
        registry,
        intervalTicks: 10,
        nextDueTick: 12
      }),
      sink: createAuthoritativeClientReplicationDiagnosticsFanOutSink({
        sinks: [
          createAuthoritativeClientReplicationDiagnosticsTextLogger({
            logger: textLogger
          }),
          createAuthoritativeClientReplicationDiagnosticsLineLogger({
            logger: lineLogger
          })
        ]
      })
    });

    expect(logSink.poll({ tick: 11 })).toEqual({
      emitted: false,
      nextDueTick: 12,
      logLines: null,
      logText: null
    });
    expect(textLogger).not.toHaveBeenCalled();
    expect(lineLogger).not.toHaveBeenCalled();
  });

  it('forwards one due emission to multiple sinks in declaration order', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const callOrder: string[] = [];
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>((logText) => {
      callOrder.push(`text:${logText.split('\n', 1)[0]}`);
    });
    const lineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>((logLines) => {
      callOrder.push(`lines:${logLines[0]}`);
    });
    const logSink = new AuthoritativeClientReplicationDiagnosticsLogSink({
      cadence: new AuthoritativeClientReplicationDiagnosticsLogCadence({
        registry,
        intervalTicks: 10,
        nextDueTick: 12
      }),
      sink: createAuthoritativeClientReplicationDiagnosticsFanOutSink({
        sinks: [
          createAuthoritativeClientReplicationDiagnosticsTextLogger({
            logger: textLogger
          }),
          createAuthoritativeClientReplicationDiagnosticsLineLogger({
            logger: lineLogger
          })
        ]
      })
    });
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

    expect(logSink.poll({ tick: 12 })).toEqual({
      emitted: true,
      nextDueTick: 22,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
    expect(textLogger).toHaveBeenCalledWith(expectedLines.join('\n'));
    expect(lineLogger).toHaveBeenCalledWith(expectedLines);
    expect(callOrder).toEqual([
      'text:ReplicationDiagnostics',
      'lines:ReplicationDiagnostics'
    ]);
  });

  it('isolates per-sink line mutations while leaving the returned cadence result unchanged', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(4));
    const firstLineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>((logLines) => {
      logLines[0] = 'mutated';
    });
    const secondLineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const logSink = new AuthoritativeClientReplicationDiagnosticsLogSink({
      cadence: new AuthoritativeClientReplicationDiagnosticsLogCadence({
        registry,
        intervalTicks: 5,
        nextDueTick: 8
      }),
      sink: createAuthoritativeClientReplicationDiagnosticsFanOutSink({
        sinks: [
          createAuthoritativeClientReplicationDiagnosticsLineLogger({
            logger: firstLineLogger
          }),
          createAuthoritativeClientReplicationDiagnosticsLineLogger({
            logger: secondLineLogger
          })
        ]
      })
    });
    const expectedLines = [
      'ReplicationDiagnostics',
      'Aggregate: clients=1',
      'AggregateReplayChunks: dropped=4 | trimmed=5 | applied=6 | skipped=7',
      'AggregateReplayEntities: dropped=8 | trimmed=9 | applied=10 | skipped=11',
      'AggregateSendChunks: dropped=12 | trimmed=13 | forwarded=14',
      'AggregateSendEntities: dropped=15 | trimmed=16 | forwarded=17',
      'AggregateResync: spawned=18 | updated=19 | removed=20',
      'Clients:',
      'Client: client-alpha',
      '  ReplayLastProcessed: 4',
      '  ReplayChunks: dropped=4 | trimmed=5 | applied=6 | skipped=7',
      '  ReplayEntities: dropped=8 | trimmed=9 | applied=10 | skipped=11',
      '  SendLastStaged: 14',
      '  SendChunks: dropped=12 | trimmed=13 | forwarded=14',
      '  SendEntities: dropped=15 | trimmed=16 | forwarded=17',
      '  ResyncLastAppliedBaseline: tick=24 | entityCount=25',
      '  ResyncTotals: spawned=18 | updated=19 | removed=20'
    ];
    const result = logSink.poll({ tick: 8 });

    expect(result).toEqual({
      emitted: true,
      nextDueTick: 13,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
    expect(firstLineLogger).toHaveBeenCalledWith(['mutated', ...expectedLines.slice(1)]);
    expect(secondLineLogger).toHaveBeenCalledWith(expectedLines);
  });

  it('reuses cadence rescheduling so late polls still fan out once and stay quiet until the next due tick', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(7));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const lineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const logSink = new AuthoritativeClientReplicationDiagnosticsLogSink({
      cadence: new AuthoritativeClientReplicationDiagnosticsLogCadence({
        registry,
        intervalTicks: 6,
        nextDueTick: 10
      }),
      sink: createAuthoritativeClientReplicationDiagnosticsFanOutSink({
        sinks: [
          createAuthoritativeClientReplicationDiagnosticsTextLogger({
            logger: textLogger
          }),
          createAuthoritativeClientReplicationDiagnosticsLineLogger({
            logger: lineLogger
          })
        ]
      })
    });
    const expectedLines = [
      'ReplicationDiagnostics',
      'Aggregate: clients=1',
      'AggregateReplayChunks: dropped=7 | trimmed=8 | applied=9 | skipped=10',
      'AggregateReplayEntities: dropped=11 | trimmed=12 | applied=13 | skipped=14',
      'AggregateSendChunks: dropped=15 | trimmed=16 | forwarded=17',
      'AggregateSendEntities: dropped=18 | trimmed=19 | forwarded=20',
      'AggregateResync: spawned=21 | updated=22 | removed=23',
      'Clients:',
      'Client: client-alpha',
      '  ReplayLastProcessed: 7',
      '  ReplayChunks: dropped=7 | trimmed=8 | applied=9 | skipped=10',
      '  ReplayEntities: dropped=11 | trimmed=12 | applied=13 | skipped=14',
      '  SendLastStaged: 17',
      '  SendChunks: dropped=15 | trimmed=16 | forwarded=17',
      '  SendEntities: dropped=18 | trimmed=19 | forwarded=20',
      '  ResyncLastAppliedBaseline: tick=27 | entityCount=28',
      '  ResyncTotals: spawned=21 | updated=22 | removed=23'
    ];

    expect(logSink.poll({ tick: 14 })).toEqual({
      emitted: true,
      nextDueTick: 20,
      logLines: expectedLines,
      logText: expectedLines.join('\n')
    });
    expect(logSink.poll({ tick: 19 })).toEqual({
      emitted: false,
      nextDueTick: 20,
      logLines: null,
      logText: null
    });
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(textLogger).toHaveBeenCalledWith(expectedLines.join('\n'));
    expect(lineLogger).toHaveBeenCalledTimes(1);
    expect(lineLogger).toHaveBeenCalledWith(expectedLines);
  });
});
