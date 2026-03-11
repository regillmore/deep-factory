import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import {
  reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

const cloneAsUnknown = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const expectActiveReconfiguration = ({
  restoreCallback,
  restoreCallbackInvoker
}: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration) => {
  expect(restoreCallback).not.toBeNull();

  if (restoreCallback === null) {
    throw new Error(
      'expected active replication diagnostics restore callback reconfiguration'
    );
  }

  return {
    restoreCallback,
    restoreCallbackInvoker
  };
};

describe(
  'reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback',
  () => {
    it('returns a disabled restore callback and a no-op-safe restore invoker when no restore-lifecycle loggers are configured', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const initialSnapshot = targetHolder.getConfigurationSnapshot();

      const reconfiguration =
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
          {
            holder: targetHolder,
            registry
          }
        );

      expect(reconfiguration.restoreCallback).toBeNull();
      expect(reconfiguration.restoreCallbackInvoker({ disabled: true })).toBeNull();
      expect(reconfiguration.restoreCallbackInvoker(Number.NaN)).toBeNull();
      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
    });

    it('builds an active restore callback and invoker from updated runtime callbacks plus restore-lifecycle loggers', () => {
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
      const { restoreCallback, restoreCallbackInvoker } =
        expectActiveReconfiguration(
          reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
            {
              holder: targetHolder,
              registry,
              lineLogger: runtimeLineLogger,
              restoreLifecycleTextLogger,
              restoreLifecycleLineLogger,
              restoreLifecyclePayloadLogger
            }
          )
        );

      const unknownConfigurationSnapshot = cloneAsUnknown(
        sourceHolder.getConfigurationSnapshot()
      );

      const emission = restoreCallbackInvoker(unknownConfigurationSnapshot);

      expect(emission).not.toBeNull();
      expect(restoreCallback).not.toBeNull();
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

    it('rebuilds fresh restore callback and invoker state from updated runtime and restore-lifecycle logger settings', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const firstRuntimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const secondRuntimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const firstRestoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const secondRestoreLifecyclePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>();
      const firstSourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          textLogger: firstRuntimeTextLogger
        });
      const secondSourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 7,
          nextDueTick: 9,
          lineLogger: secondRuntimeLineLogger
        });
      const firstTargetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const secondTargetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const firstReconfiguration = expectActiveReconfiguration(
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
          {
            holder: firstTargetHolder,
            registry,
            textLogger: firstRuntimeTextLogger,
            restoreLifecycleTextLogger: firstRestoreLifecycleTextLogger
          }
        )
      );
      const secondReconfiguration = expectActiveReconfiguration(
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
          {
            holder: secondTargetHolder,
            registry,
            lineLogger: secondRuntimeLineLogger,
            restoreLifecyclePayloadLogger: secondRestoreLifecyclePayloadLogger
          }
        )
      );

      const firstEmission = firstReconfiguration.restoreCallbackInvoker(
        cloneAsUnknown(firstSourceHolder.getConfigurationSnapshot())
      );
      const secondEmission = secondReconfiguration.restoreCallbackInvoker(
        cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
      );

      expect(firstEmission?.payload.restoredConfigurationSnapshot).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      expect(secondEmission?.payload.restoredConfigurationSnapshot).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(firstTargetHolder.getConfigurationSnapshot()).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      expect(secondTargetHolder.getConfigurationSnapshot()).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      expect(secondRestoreLifecyclePayloadLogger).toHaveBeenCalledTimes(1);
      expect(secondRestoreLifecyclePayloadLogger.mock.calls[0]![0].changeSummary.changed).toBe(
        true
      );

      firstTargetHolder.poll(4);
      expect(firstRuntimeTextLogger).toHaveBeenCalledTimes(1);
      secondTargetHolder.poll(8);
      expect(secondRuntimeLineLogger).not.toHaveBeenCalled();
      secondTargetHolder.poll(9);
      expect(secondRuntimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('preserves restore validation errors when active reconfiguration is invoked', () => {
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
      const { restoreCallbackInvoker } = expectActiveReconfiguration(
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
          {
            holder: targetHolder,
            registry,
            restoreLifecycleLineLogger
          }
        )
      );

      expect(() =>
        restoreCallbackInvoker(cloneAsUnknown(sourceHolder.getConfigurationSnapshot()))
      ).toThrowError(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
      expect(restoreLifecycleLineLogger).not.toHaveBeenCalled();
      expect(sourceTextLogger).not.toHaveBeenCalled();
    });
  }
);
