import { describe, expect, it, vi } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import { createAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';
import {
  accumulateAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  accumulateAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
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
        entities: {
          spawned: seed + 14,
          updated: seed + 15,
          removed: seed + 16
        }
      }
    })
  });

const createExpectedText = (seed: number): string =>
  [
    'ReplicationDiagnostics',
    'Aggregate: clients=1',
    `AggregateReplayChunks: dropped=${seed} | trimmed=${seed + 1} | applied=${seed + 2} | skipped=${seed + 3}`,
    `AggregateReplayEntities: dropped=${seed + 4} | trimmed=${seed + 5} | applied=${seed + 6} | skipped=${seed + 7}`,
    `AggregateSendChunks: dropped=${seed + 8} | trimmed=${seed + 9} | forwarded=${seed + 10}`,
    `AggregateSendEntities: dropped=${seed + 11} | trimmed=${seed + 12} | forwarded=${seed + 13}`,
    `AggregateResync: spawned=${seed + 14} | updated=${seed + 15} | removed=${seed + 16}`,
    'Clients:',
    'Client: client-alpha',
    `  ReplayLastProcessed: ${seed}`,
    `  ReplayChunks: dropped=${seed} | trimmed=${seed + 1} | applied=${seed + 2} | skipped=${seed + 3}`,
    `  ReplayEntities: dropped=${seed + 4} | trimmed=${seed + 5} | applied=${seed + 6} | skipped=${seed + 7}`,
    `  SendLastStaged: ${seed + 10}`,
    `  SendChunks: dropped=${seed + 8} | trimmed=${seed + 9} | forwarded=${seed + 10}`,
    `  SendEntities: dropped=${seed + 11} | trimmed=${seed + 12} | forwarded=${seed + 13}`,
    `  ResyncLastAppliedBaseline: tick=${seed + 20} | entityCount=${seed + 21}`,
    `  ResyncTotals: spawned=${seed + 14} | updated=${seed + 15} | removed=${seed + 16}`
  ].join('\n');

describe('AuthoritativeClientReplicationDiagnosticsLoggerStateHolder', () => {
  it('starts disabled and begins polling once reconfigured with active logger callbacks', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: true,
      nextDueTick: null
    });
    expect(() => holder.poll(-1)).not.toThrow();
    expect(textLogger).not.toHaveBeenCalled();

    holder.reconfigure({
      registry,
      intervalTicks: 10,
      nextDueTick: 12,
      textLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 12
    });

    holder.poll(11);
    expect(textLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 12
    });

    holder.poll(12);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(textLogger).toHaveBeenCalledWith(createExpectedText(5));
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 22
    });

    holder.poll(21);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 22
    });

    holder.poll(22);
    expect(textLogger).toHaveBeenCalledTimes(2);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 32
    });
  });

  it('replaces the active poll callback when reconfigured between enabled logger setups', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondLineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 5,
      nextDueTick: 3,
      textLogger: firstTextLogger
    });

    holder.poll(3);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);

    holder.reconfigure({
      registry,
      intervalTicks: 7,
      nextDueTick: 9,
      lineLogger: secondLineLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 9
    });

    holder.poll(8);
    expect(secondLineLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 9
    });

    holder.poll(9);
    expect(secondLineLogger).toHaveBeenCalledTimes(1);
    expect(secondLineLogger.mock.calls[0]![0][0]).toBe('ReplicationDiagnostics');
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 16
    });
  });

  it('clears the active callback when reconfigured back to disabled logging', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(4));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 4,
      nextDueTick: 1,
      textLogger
    });

    holder.poll(1);
    expect(textLogger).toHaveBeenCalledTimes(1);

    holder.reconfigure({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: true,
      nextDueTick: null
    });
    expect(() => holder.poll(-1)).not.toThrow();
    holder.poll(99);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: true,
      nextDueTick: null
    });
  });

  it('surfaces cadence validation errors when reconfiguration enables logging', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(() =>
      holder.reconfigure({
        registry,
        intervalTicks: 0,
        nextDueTick: 12,
        textLogger
      })
    ).toThrowError('intervalTicks must be greater than 0');
  });
});
