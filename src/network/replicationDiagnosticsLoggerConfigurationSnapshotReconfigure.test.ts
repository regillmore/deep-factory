import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

describe(
  'AuthoritativeClientReplicationDiagnosticsLoggerStateHolder.reconfigureFromConfigurationSnapshot',
  () => {
    it('reapplies an enabled configuration snapshot onto another holder', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const targetTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 10,
          textLogger: sourceTextLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });

      const configurationSnapshot = sourceHolder.getConfigurationSnapshot();

      targetHolder.reconfigureFromConfigurationSnapshot({
        registry,
        configurationSnapshot,
        textLogger: targetTextLogger
      });

      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        configurationSnapshot
      );

      targetHolder.poll(9);
      expect(targetTextLogger).not.toHaveBeenCalled();

      targetHolder.poll(10);
      expect(targetTextLogger).toHaveBeenCalledTimes(1);
      expect(targetHolder.getConfigurationSnapshot()).toEqual({
        schedule: {
          disabled: false,
          intervalTicks: 6,
          nextDueTick: 16
        },
        callbacks: {
          hasTextLogger: true,
          hasLineLogger: false,
          hasPayloadLogger: false
        }
      });
      expect(sourceTextLogger).not.toHaveBeenCalled();
    });

    it('preserves disabled semantics when the detached snapshot is disabled', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const textLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const disabledSnapshotHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          textLogger
        });

      targetHolder.poll(3);
      expect(textLogger).toHaveBeenCalledTimes(1);

      targetHolder.reconfigureFromConfigurationSnapshot({
        registry,
        configurationSnapshot:
          disabledSnapshotHolder.getConfigurationSnapshot(),
        textLogger
      });

      expect(targetHolder.getConfigurationSnapshot()).toEqual({
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

      targetHolder.poll(100);
      expect(textLogger).toHaveBeenCalledTimes(1);
    });

    it('uses snapshot callback-presence flags to ignore extra supplied callbacks', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourcePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const targetLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 7,
          nextDueTick: 2,
          payloadLogger: sourcePayloadLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });

      const configurationSnapshot = sourceHolder.getConfigurationSnapshot();

      targetHolder.reconfigureFromConfigurationSnapshot({
        registry,
        configurationSnapshot,
        lineLogger: targetLineLogger,
        payloadLogger: targetPayloadLogger
      });

      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        configurationSnapshot
      );

      targetHolder.poll(2);
      expect(targetLineLogger).not.toHaveBeenCalled();
      expect(targetPayloadLogger).toHaveBeenCalledTimes(1);
      expect(sourcePayloadLogger).not.toHaveBeenCalled();
    });

    it('rejects missing required callbacks and preserves the holder state', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          textLogger: sourceTextLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger: targetPayloadLogger
        });
      const initialTargetSnapshot = targetHolder.getConfigurationSnapshot();

      expect(() =>
        targetHolder.reconfigureFromConfigurationSnapshot({
          registry,
          configurationSnapshot: sourceHolder.getConfigurationSnapshot()
        })
      ).toThrowError(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );

      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        initialTargetSnapshot
      );
    });
  }
);
