import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle';
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
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback',
  () => {
    it('captures one holder, registry, runtime logger set, and optional restore-lifecycle bundle into a reusable restore callback', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const lifecycleCallOrder: string[] = [];
      const lifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>(
          (lifecycleText) => {
            lifecycleCallOrder.push(`text:${lifecycleText.split('\n', 1)[0]}`);
          }
        );
      const lifecycleLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>(
          (lifecycleLines) => {
            lifecycleCallOrder.push(
              `line:${lifecycleLines.configurationChangeLines[0]}`
            );
          }
        );
      const lifecyclePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>(
          (payload) => {
            lifecycleCallOrder.push(`payload:${payload.changeSummary.changed}`);
          }
        );
      const enabledSourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 10,
          lineLogger: runtimeLineLogger
        });
      const disabledSourceHolder =
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
          payloadLogger: targetPayloadLogger
        });
      const restoreCallback =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
          {
            holder: targetHolder,
            registry,
            lineLogger: runtimeLineLogger,
            loggerBundle:
              createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle(
                {
                  textLogger: lifecycleTextLogger,
                  lineLogger: lifecycleLineLogger,
                  payloadLogger: lifecyclePayloadLogger
                }
              )
          }
        );

      const firstEmission = restoreCallback(
        cloneAsUnknown(enabledSourceHolder.getConfigurationSnapshot())
      );

      expect(firstEmission.payload.restoredConfigurationSnapshot).toEqual(
        enabledSourceHolder.getConfigurationSnapshot()
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        enabledSourceHolder.getConfigurationSnapshot()
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
      const snapshotBeforeSecondRestore = targetHolder.getConfigurationSnapshot();

      const secondEmission = restoreCallback(
        cloneAsUnknown(disabledSourceHolder.getConfigurationSnapshot())
      );

      expect(secondEmission.payload.previousConfigurationSnapshot).toEqual(
        snapshotBeforeSecondRestore
      );
      expect(secondEmission.payload.restoredConfigurationSnapshot).toEqual(
        disabledSourceHolder.getConfigurationSnapshot()
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        disabledSourceHolder.getConfigurationSnapshot()
      );
      expect(lifecycleCallOrder).toEqual([
        'text:ConfigurationChange: changed',
        'line:ConfigurationChange: changed',
        'payload:true',
        'text:ConfigurationChange: changed',
        'line:ConfigurationChange: changed',
        'payload:true'
      ]);
    });

    it('restores one unknown snapshot without requiring a restore-lifecycle bundle', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const disabledSourceHolder =
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
          textLogger: runtimeTextLogger
        });
      const restoreCallback =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
          {
            holder: targetHolder,
            registry,
            textLogger: runtimeTextLogger
          }
        );

      const emission = restoreCallback(
        cloneAsUnknown(disabledSourceHolder.getConfigurationSnapshot())
      );

      expect(emission.payload.restoredConfigurationSnapshot).toEqual(
        disabledSourceHolder.getConfigurationSnapshot()
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        disabledSourceHolder.getConfigurationSnapshot()
      );

      targetHolder.poll(100);
      expect(runtimeTextLogger).not.toHaveBeenCalled();
    });

    it('preserves the target holder state and skips the optional bundle when restore validation fails', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const loggerBundle =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle>();
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
      const initialSnapshot = targetHolder.getConfigurationSnapshot();
      const restoreCallback =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
          {
            holder: targetHolder,
            registry,
            loggerBundle
          }
        );

      expect(() =>
        restoreCallback(cloneAsUnknown(sourceHolder.getConfigurationSnapshot()))
      ).toThrowError(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );

      expect(loggerBundle).not.toHaveBeenCalled();
      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
      expect(sourceTextLogger).not.toHaveBeenCalled();
      expect(targetPayloadLogger).not.toHaveBeenCalled();
    });
  }
);
