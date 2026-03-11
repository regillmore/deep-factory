import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';
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
  'AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder',
  () => {
    it('returns null through the holder-owned restore seam when no restore-lifecycle loggers are configured', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: targetHolder,
            registry
          }
        );
      const initialSnapshot = targetHolder.getConfigurationSnapshot();

      expect(
        restoreCallbackHolder.restoreConfigurationSnapshot({ disabled: true })
      ).toBeNull();
      expect(
        restoreCallbackHolder.restoreConfigurationSnapshot(Number.NaN)
      ).toBeNull();
      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
    });

    it('restores one unknown snapshot through the holder-owned seam when restore wiring is configured', () => {
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
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: targetHolder,
            registry,
            lineLogger: runtimeLineLogger,
            restoreLifecycleTextLogger,
            restoreLifecycleLineLogger,
            restoreLifecyclePayloadLogger
          }
        );

      const emission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
      );

      expect(emission).not.toBeNull();
      expect(emission?.payload.restoredConfigurationSnapshot).toEqual(
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

    it('rebuilds fresh restore callback state across holder reconfiguration while keeping the holder-owned restore seam stable', () => {
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
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: firstTargetHolder,
            registry,
            textLogger: firstRuntimeTextLogger,
            restoreLifecycleTextLogger: firstRestoreLifecycleTextLogger
          }
        );

      const firstEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(firstSourceHolder.getConfigurationSnapshot())
      );
      const secondTargetInitialSnapshot =
        secondTargetHolder.getConfigurationSnapshot();

      restoreCallbackHolder.reconfigure({
        holder: secondTargetHolder,
        registry
      });

      expect(
        restoreCallbackHolder.restoreConfigurationSnapshot(
          cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
        )
      ).toBeNull();
      expect(secondTargetHolder.getConfigurationSnapshot()).toEqual(
        secondTargetInitialSnapshot
      );

      restoreCallbackHolder.reconfigure({
        holder: secondTargetHolder,
        registry,
        lineLogger: secondRuntimeLineLogger,
        restoreLifecyclePayloadLogger: secondRestoreLifecyclePayloadLogger
      });

      const secondEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
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
      expect(
        secondRestoreLifecyclePayloadLogger.mock.calls[0]![0].changeSummary.changed
      ).toBe(true);

      firstTargetHolder.poll(4);
      expect(firstRuntimeTextLogger).toHaveBeenCalledTimes(1);
      secondTargetHolder.poll(8);
      expect(secondRuntimeLineLogger).not.toHaveBeenCalled();
      secondTargetHolder.poll(9);
      expect(secondRuntimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('preserves restore validation errors when the holder-owned restore seam is active', () => {
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
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: targetHolder,
            registry,
            restoreLifecycleLineLogger
          }
        );
      const initialSnapshot = targetHolder.getConfigurationSnapshot();

      expect(() =>
        restoreCallbackHolder.restoreConfigurationSnapshot(
          cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
        )
      ).toThrowError(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
      expect(restoreLifecycleLineLogger).not.toHaveBeenCalled();
      expect(sourceTextLogger).not.toHaveBeenCalled();
    });
  }
);
