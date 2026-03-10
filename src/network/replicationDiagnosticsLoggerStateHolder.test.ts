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

  it('refreshes callbacks before the due tick without resetting the holder schedule', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondLineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 10,
      nextDueTick: 12,
      textLogger: firstTextLogger
    });

    holder.refreshCallbacks({
      lineLogger: secondLineLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 12
    });

    holder.poll(11);
    expect(firstTextLogger).not.toHaveBeenCalled();
    expect(secondLineLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 12
    });

    holder.poll(12);
    expect(firstTextLogger).not.toHaveBeenCalled();
    expect(secondLineLogger).toHaveBeenCalledTimes(1);
    expect(secondLineLogger.mock.calls[0]![0][0]).toBe('ReplicationDiagnostics');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 22
    });
  });

  it('refreshes callbacks after an emission while preserving the next due tick', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondPayloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 5,
      nextDueTick: 3,
      textLogger: firstTextLogger
    });

    holder.poll(3);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.refreshCallbacks({
      payloadLogger: secondPayloadLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.poll(7);
    expect(secondPayloadLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.poll(8);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(secondPayloadLogger).toHaveBeenCalledTimes(1);
    expect(secondPayloadLogger.mock.calls[0]![0].aggregate.clientCount).toBe(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 13
    });
  });

  it('refreshes schedule before the due tick while preserving cadence and callbacks', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 10,
      nextDueTick: 12,
      textLogger
    });

    holder.refreshSchedule({
      nextDueTick: 6
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 6
    });

    holder.poll(5);
    expect(textLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 6
    });

    holder.poll(6);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(textLogger).toHaveBeenCalledWith(createExpectedText(5));
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 16
    });
  });

  it('refreshes schedule after an emission while preserving cadence and callbacks', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 5,
      nextDueTick: 3,
      textLogger
    });

    holder.poll(3);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.refreshSchedule({
      nextDueTick: 11
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 11
    });

    holder.poll(10);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 11
    });

    holder.poll(11);
    expect(textLogger).toHaveBeenCalledTimes(2);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 16
    });
  });

  it('refreshes schedule and callbacks before the due tick while preserving cadence', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondLineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 10,
      nextDueTick: 12,
      textLogger: firstTextLogger
    });

    holder.refreshScheduleAndCallbacks({
      nextDueTick: 6,
      textLogger: undefined,
      lineLogger: secondLineLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 6
    });

    holder.poll(5);
    expect(firstTextLogger).not.toHaveBeenCalled();
    expect(secondLineLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 6
    });

    holder.poll(6);
    expect(firstTextLogger).not.toHaveBeenCalled();
    expect(secondLineLogger).toHaveBeenCalledTimes(1);
    expect(secondLineLogger.mock.calls[0]![0][0]).toBe('ReplicationDiagnostics');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 16
    });
  });

  it('refreshes schedule and callbacks after an emission while preserving cadence', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondPayloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 5,
      nextDueTick: 3,
      textLogger: firstTextLogger
    });

    holder.poll(3);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.refreshScheduleAndCallbacks({
      nextDueTick: 11,
      textLogger: undefined,
      payloadLogger: secondPayloadLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 11
    });

    holder.poll(10);
    expect(secondPayloadLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 11
    });

    holder.poll(11);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(secondPayloadLogger).toHaveBeenCalledTimes(1);
    expect(secondPayloadLogger.mock.calls[0]![0].aggregate.clientCount).toBe(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 16
    });
  });

  it('refreshes cadence and callbacks before the due tick without resetting the holder schedule', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondLineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 10,
      nextDueTick: 12,
      textLogger: firstTextLogger
    });

    holder.refreshCadenceAndCallbacks({
      intervalTicks: 4,
      textLogger: undefined,
      lineLogger: secondLineLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 12
    });

    holder.poll(11);
    expect(firstTextLogger).not.toHaveBeenCalled();
    expect(secondLineLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 12
    });

    holder.poll(12);
    expect(firstTextLogger).not.toHaveBeenCalled();
    expect(secondLineLogger).toHaveBeenCalledTimes(1);
    expect(secondLineLogger.mock.calls[0]![0][0]).toBe('ReplicationDiagnostics');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 16
    });
  });

  it('refreshes cadence and callbacks after an emission while preserving the next due tick', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondPayloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 5,
      nextDueTick: 3,
      textLogger: firstTextLogger
    });

    holder.poll(3);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.refreshCadenceAndCallbacks({
      intervalTicks: 9,
      textLogger: undefined,
      payloadLogger: secondPayloadLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.poll(7);
    expect(secondPayloadLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.poll(8);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(secondPayloadLogger).toHaveBeenCalledTimes(1);
    expect(secondPayloadLogger.mock.calls[0]![0].aggregate.clientCount).toBe(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 17
    });
  });

  it('refreshes cadence before the due tick without resetting the holder schedule', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 10,
      nextDueTick: 12,
      textLogger
    });

    holder.refreshCadence({
      intervalTicks: 4
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
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 16
    });
  });

  it('refreshes cadence after an emission while preserving the next due tick', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 5,
      nextDueTick: 3,
      textLogger
    });

    holder.poll(3);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.refreshCadence({
      intervalTicks: 9
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.poll(7);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.poll(8);
    expect(textLogger).toHaveBeenCalledTimes(2);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 17
    });
  });

  it('refreshes schedule and cadence before the due tick while preserving callbacks', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 10,
      nextDueTick: 12,
      textLogger
    });

    holder.refreshScheduleAndCadence({
      nextDueTick: 6,
      intervalTicks: 4
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 6
    });

    holder.poll(5);
    expect(textLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 6
    });

    holder.poll(6);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(textLogger).toHaveBeenCalledWith(createExpectedText(5));
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 10
    });
  });

  it('refreshes schedule and cadence after an emission while preserving callbacks', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 5,
      nextDueTick: 3,
      textLogger
    });

    holder.poll(3);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.refreshScheduleAndCadence({
      nextDueTick: 11,
      intervalTicks: 9
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 11
    });

    holder.poll(10);
    expect(textLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 11
    });

    holder.poll(11);
    expect(textLogger).toHaveBeenCalledTimes(2);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 20
    });
  });

  it('refreshes schedule, cadence, and callbacks before the due tick', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(5));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondLineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 10,
      nextDueTick: 12,
      textLogger: firstTextLogger
    });

    holder.refreshScheduleAndCadenceAndCallbacks({
      nextDueTick: 6,
      intervalTicks: 4,
      textLogger: undefined,
      lineLogger: secondLineLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 6
    });

    holder.poll(5);
    expect(firstTextLogger).not.toHaveBeenCalled();
    expect(secondLineLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 6
    });

    holder.poll(6);
    expect(firstTextLogger).not.toHaveBeenCalled();
    expect(secondLineLogger).toHaveBeenCalledTimes(1);
    expect(secondLineLogger.mock.calls[0]![0][0]).toBe('ReplicationDiagnostics');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 10
    });
  });

  it('refreshes schedule, cadence, and callbacks after an emission', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    registry.setSnapshot('client-alpha', createPopulatedSnapshot(3));
    const firstTextLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const secondPayloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 5,
      nextDueTick: 3,
      textLogger: firstTextLogger
    });

    holder.poll(3);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 8
    });

    holder.refreshScheduleAndCadenceAndCallbacks({
      nextDueTick: 11,
      intervalTicks: 9,
      textLogger: undefined,
      payloadLogger: secondPayloadLogger
    });

    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 11
    });

    holder.poll(10);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(secondPayloadLogger).not.toHaveBeenCalled();
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 11
    });

    holder.poll(11);
    expect(firstTextLogger).toHaveBeenCalledTimes(1);
    expect(secondPayloadLogger).toHaveBeenCalledTimes(1);
    expect(secondPayloadLogger.mock.calls[0]![0].aggregate.clientCount).toBe(1);
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 20
    });
  });

  it('rejects cadence refresh while disabled and preserves the current schedule when cadence validation fails', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(() =>
      holder.refreshCadence({
        intervalTicks: 5
      })
    ).toThrowError(
      'cannot refresh replication diagnostics logger cadence while logging is disabled'
    );

    holder.reconfigure({
      registry,
      intervalTicks: 6,
      nextDueTick: 4,
      textLogger
    });

    expect(() =>
      holder.refreshCadence({
        intervalTicks: 0
      })
    ).toThrowError('intervalTicks must be greater than 0');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });
  });

  it('rejects schedule-and-cadence refresh while disabled and preserves the current schedule when schedule or cadence validation fails', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(() =>
      holder.refreshScheduleAndCadence({
        nextDueTick: 5,
        intervalTicks: 5
      })
    ).toThrowError(
      'cannot refresh replication diagnostics logger schedule and cadence while logging is disabled'
    );

    holder.reconfigure({
      registry,
      intervalTicks: 6,
      nextDueTick: 4,
      textLogger
    });

    expect(() =>
      holder.refreshScheduleAndCadence({
        nextDueTick: 4,
        intervalTicks: 0
      })
    ).toThrowError('intervalTicks must be greater than 0');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });

    expect(() =>
      holder.refreshScheduleAndCadence({
        nextDueTick: -1,
        intervalTicks: 7
      })
    ).toThrowError('nextDueTick must be a non-negative integer');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });
  });

  it('rejects schedule-cadence-and-callback refresh when the holder is disabled, no new callbacks were configured, or validation fails', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const payloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(() =>
      holder.refreshScheduleAndCadenceAndCallbacks({
        nextDueTick: 5,
        intervalTicks: 5,
        textLogger
      })
    ).toThrowError(
      'cannot refresh replication diagnostics logger schedule, cadence, and callbacks while logging is disabled'
    );

    holder.reconfigure({
      registry,
      intervalTicks: 6,
      nextDueTick: 4,
      textLogger
    });

    expect(() =>
      holder.refreshScheduleAndCadenceAndCallbacks({
        nextDueTick: 3,
        intervalTicks: 3
      })
    ).toThrowError(
      'schedule, cadence, and callback refresh requires at least one replication diagnostics logger callback'
    );
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });

    expect(() =>
      holder.refreshScheduleAndCadenceAndCallbacks({
        nextDueTick: 3,
        intervalTicks: 0,
        payloadLogger
      })
    ).toThrowError('intervalTicks must be greater than 0');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });

    expect(() =>
      holder.refreshScheduleAndCadenceAndCallbacks({
        nextDueTick: -1,
        intervalTicks: 3,
        payloadLogger
      })
    ).toThrowError('nextDueTick must be a non-negative integer');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });
  });

  it('rejects schedule refresh while disabled and preserves the current schedule when schedule validation fails', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(() =>
      holder.refreshSchedule({
        nextDueTick: 5
      })
    ).toThrowError(
      'cannot refresh replication diagnostics logger schedule while logging is disabled'
    );

    holder.reconfigure({
      registry,
      intervalTicks: 6,
      nextDueTick: 4,
      textLogger
    });

    expect(() =>
      holder.refreshSchedule({
        nextDueTick: -1
      })
    ).toThrowError('nextDueTick must be a non-negative integer');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });
  });

  it('rejects schedule-and-callback refresh when the holder is disabled, no new callbacks were configured, or schedule validation fails', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const payloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(() =>
      holder.refreshScheduleAndCallbacks({
        nextDueTick: 5,
        textLogger
      })
    ).toThrowError(
      'cannot refresh replication diagnostics logger schedule and callbacks while logging is disabled'
    );

    holder.reconfigure({
      registry,
      intervalTicks: 6,
      nextDueTick: 4,
      textLogger
    });

    expect(() =>
      holder.refreshScheduleAndCallbacks({
        nextDueTick: 3
      })
    ).toThrowError(
      'schedule and callback refresh requires at least one replication diagnostics logger callback'
    );
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });

    expect(() =>
      holder.refreshScheduleAndCallbacks({
        nextDueTick: -1,
        payloadLogger
      })
    ).toThrowError('nextDueTick must be a non-negative integer');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });
  });

  it('rejects cadence-and-callback refresh when the holder is disabled, no new callbacks were configured, or cadence validation fails', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const payloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(() =>
      holder.refreshCadenceAndCallbacks({
        intervalTicks: 5,
        textLogger
      })
    ).toThrowError(
      'cannot refresh replication diagnostics logger cadence and callbacks while logging is disabled'
    );

    holder.reconfigure({
      registry,
      intervalTicks: 6,
      nextDueTick: 4,
      textLogger
    });

    expect(() =>
      holder.refreshCadenceAndCallbacks({
        intervalTicks: 3
      })
    ).toThrowError(
      'cadence and callback refresh requires at least one replication diagnostics logger callback'
    );
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });

    expect(() =>
      holder.refreshCadenceAndCallbacks({
        intervalTicks: 0,
        payloadLogger
      })
    ).toThrowError('intervalTicks must be greater than 0');
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });
  });

  it('rejects callback refresh when the holder is disabled or no new callbacks were configured', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(() =>
      holder.refreshCallbacks({
        textLogger
      })
    ).toThrowError(
      'cannot refresh replication diagnostics logger callbacks while logging is disabled'
    );

    holder.reconfigure({
      registry,
      intervalTicks: 6,
      nextDueTick: 4,
      textLogger
    });

    expect(() =>
      holder.refreshCallbacks({})
    ).toThrowError(
      'callback refresh requires at least one replication diagnostics logger callback'
    );
    expect(holder.getScheduleSnapshot()).toEqual({
      disabled: false,
      nextDueTick: 4
    });
  });
});
