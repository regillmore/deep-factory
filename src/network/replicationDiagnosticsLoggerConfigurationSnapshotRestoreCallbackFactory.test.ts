import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOrNull
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackFactory';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

const cloneAsUnknown = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe(
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOrNull',
  () => {
    it('returns null when no restore-lifecycle logger callbacks are configured', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          textLogger: runtimeTextLogger
        });

      expect(
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOrNull(
          {
            holder: targetHolder,
            registry,
            textLogger: runtimeTextLogger
          }
        )
      ).toBeNull();
    });

    it('builds the shared restore-lifecycle bundle plus restore callback when any restore-lifecycle logger is configured', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const lifecycleCallOrder: string[] = [];
      const restoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>(
          (lifecycleText) => {
            lifecycleCallOrder.push(`text:${lifecycleText.split('\n', 1)[0]}`);
          }
        );
      const restoreLifecycleLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>(
          (lifecycleLines) => {
            lifecycleCallOrder.push(
              `line:${lifecycleLines.configurationChangeLines[0]}`
            );
          }
        );
      const restoreLifecyclePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>(
          (payload) => {
            lifecycleCallOrder.push(`payload:${payload.changeSummary.changed}`);
          }
        );
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 10,
          lineLogger: runtimeLineLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger: targetPayloadLogger
        });
      const restoreCallback =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOrNull(
          {
            holder: targetHolder,
            registry,
            lineLogger: runtimeLineLogger,
            restoreLifecycleTextLogger,
            restoreLifecycleLineLogger,
            restoreLifecyclePayloadLogger
          }
        );

      expect(restoreCallback).not.toBeNull();
      if (restoreCallback === null) {
        throw new Error('expected replication diagnostics restore callback');
      }

      const emission = restoreCallback(
        cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
      );

      expect(emission.payload.restoredConfigurationSnapshot).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      expect(lifecycleCallOrder).toEqual([
        'text:ConfigurationChange: changed',
        'line:ConfigurationChange: changed',
        'payload:true'
      ]);

      targetHolder.poll(9);
      expect(runtimeLineLogger).not.toHaveBeenCalled();

      targetHolder.poll(10);
      expect(runtimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('preserves restore validation errors when the built callback is invoked', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const restoreLifecycleLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>();
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
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const initialSnapshot = targetHolder.getConfigurationSnapshot();
      const restoreCallback =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOrNull(
          {
            holder: targetHolder,
            registry,
            restoreLifecycleLineLogger
          }
        );

      expect(restoreCallback).not.toBeNull();
      if (restoreCallback === null) {
        throw new Error('expected replication diagnostics restore callback');
      }

      expect(() =>
        restoreCallback(cloneAsUnknown(sourceHolder.getConfigurationSnapshot()))
      ).toThrowError(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
      expect(restoreLifecycleLineLogger).not.toHaveBeenCalled();
      expect(sourceTextLogger).not.toHaveBeenCalled();
    });
  }
);
