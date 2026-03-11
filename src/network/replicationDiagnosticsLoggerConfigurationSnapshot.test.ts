import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

describe('AuthoritativeClientReplicationDiagnosticsLoggerStateHolder.getConfigurationSnapshot', () => {
  it('exports a detached disabled configuration snapshot when logging is disabled', () => {
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry: new AuthoritativeClientReplicationDiagnosticsRegistry(),
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(holder.getConfigurationSnapshot()).toEqual({
      schedule: {
        disabled: true,
        intervalTicks: null,
        nextDueTick: null
      },
      callbacks: {
        hasTextLogger: false,
        hasLineLogger: false,
        hasPayloadLogger: false
      }
    });
  });

  it('exports the enabled cadence, current due tick, and callback-presence state without exposing runner internals', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const lineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
    const payloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 6,
      nextDueTick: 4,
      lineLogger,
      payloadLogger
    });

    expect(holder.getConfigurationSnapshot()).toEqual({
      schedule: {
        disabled: false,
        intervalTicks: 6,
        nextDueTick: 4
      },
      callbacks: {
        hasTextLogger: false,
        hasLineLogger: true,
        hasPayloadLogger: true
      }
    });

    holder.poll(4);

    expect(holder.getConfigurationSnapshot()).toEqual({
      schedule: {
        disabled: false,
        intervalTicks: 6,
        nextDueTick: 10
      },
      callbacks: {
        hasTextLogger: false,
        hasLineLogger: true,
        hasPayloadLogger: true
      }
    });
  });

  it('tracks cadence and callback changes across holder refresh and reconfigure transitions', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const payloadLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 8,
      nextDueTick: 5,
      textLogger
    });

    holder.refreshCadenceAndCallbacks({
      intervalTicks: 3,
      textLogger: undefined,
      payloadLogger
    });

    expect(holder.getConfigurationSnapshot()).toEqual({
      schedule: {
        disabled: false,
        intervalTicks: 3,
        nextDueTick: 5
      },
      callbacks: {
        hasTextLogger: false,
        hasLineLogger: false,
        hasPayloadLogger: true
      }
    });

    holder.reconfigure({
      registry,
      intervalTicks: 0,
      nextDueTick: -1
    });

    expect(holder.getConfigurationSnapshot()).toEqual({
      schedule: {
        disabled: true,
        intervalTicks: null,
        nextDueTick: null
      },
      callbacks: {
        hasTextLogger: false,
        hasLineLogger: false,
        hasPayloadLogger: false
      }
    });
  });

  it('returns detached nested objects on every read', () => {
    const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
    const textLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
    const holder = createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
      registry,
      intervalTicks: 9,
      nextDueTick: 7,
      textLogger
    });

    const snapshot = holder.getConfigurationSnapshot();
    snapshot.schedule = {
      disabled: true,
      intervalTicks: null,
      nextDueTick: null
    };
    snapshot.callbacks.hasTextLogger = false;

    expect(holder.getConfigurationSnapshot()).toEqual({
      schedule: {
        disabled: false,
        intervalTicks: 9,
        nextDueTick: 7
      },
      callbacks: {
        hasTextLogger: true,
        hasLineLogger: false,
        hasPayloadLogger: false
      }
    });
  });
});
