import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';
import {
  reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackReconfiguration';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

const cloneAsUnknown = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe(
  'reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback',
  () => {
    it('builds one detached presence reconfigure-and-log callback from holder wiring plus the optional restore-wiring logger bundle', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const restoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const presenceCallOrder: string[] = [];
      const presenceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger>(
          (restoreCallbackPresenceChangeText) => {
            presenceCallOrder.push(
              `text:${restoreCallbackPresenceChangeText.split('\n', 1)[0]}`
            );
          }
        );
      const presenceLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger>(
          (restoreCallbackPresenceChangeLines) => {
            presenceCallOrder.push(
              `line:${restoreCallbackPresenceChangeLines[0]}`
            );
          }
        );
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          lineLogger: runtimeLineLogger
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
            registry
          }
        );
      const { reconfigureAndLogCallback } =
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback(
          {
            holder: restoreCallbackHolder,
            loggerBundle:
              createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle(
                {
                  textLogger: presenceTextLogger,
                  lineLogger: presenceLineLogger
                }
              )
          }
        );

      const result = reconfigureAndLogCallback({
        presenceSnapshot: {
          hasRestoreCallback: true
        },
        lineLogger: runtimeLineLogger,
        restoreLifecycleTextLogger
      });

      expect(result).toEqual({
        previousPresenceSnapshot: {
          hasRestoreCallback: false
        },
        nextPresenceSnapshot: {
          hasRestoreCallback: true
        },
        changeSummary: {
          changed: true,
          hasRestoreCallbackChanged: true
        },
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: changed',
          'RestoreCallbackPresenceDiff: hasRestoreCallback'
        ],
        restoreCallbackPresenceChangeText: [
          'RestoreCallbackPresenceChange: changed',
          'RestoreCallbackPresenceDiff: hasRestoreCallback'
        ].join('\n')
      });
      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });
      expect(presenceCallOrder).toEqual([
        'text:RestoreCallbackPresenceChange: changed',
        'line:RestoreCallbackPresenceChange: changed'
      ]);

      const restoreEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
      );

      expect(restoreEmission?.payload.restoredConfigurationSnapshot).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      targetHolder.poll(3);
      expect(runtimeLineLogger).not.toHaveBeenCalled();
      targetHolder.poll(4);
      expect(runtimeLineLogger).toHaveBeenCalledTimes(1);
      expect(restoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
    });

    it('rebuilds fresh detached presence reconfigure-and-log callbacks from updated holder and logger-bundle state', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const firstRuntimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const secondRuntimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const firstRestoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const secondRestoreLifecyclePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>();
      const firstPresenceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger>();
      const secondPresenceLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger>();
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
      const firstRestoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: firstTargetHolder,
            registry
          }
        );
      const secondRestoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: secondTargetHolder,
            registry
          }
        );
      const firstReconfiguration =
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback(
          {
            holder: firstRestoreCallbackHolder,
            loggerBundle:
              createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle(
                {
                  textLogger: firstPresenceTextLogger
                }
              )
          }
        );
      const secondReconfiguration =
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback(
          {
            holder: secondRestoreCallbackHolder,
            loggerBundle:
              createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle(
                {
                  lineLogger: secondPresenceLineLogger
                }
              )
          }
        );

      const firstResult = firstReconfiguration.reconfigureAndLogCallback({
        presenceSnapshot: {
          hasRestoreCallback: true
        },
        textLogger: firstRuntimeTextLogger,
        restoreLifecycleTextLogger: firstRestoreLifecycleTextLogger
      });
      const secondResult = secondReconfiguration.reconfigureAndLogCallback({
        presenceSnapshot: {
          hasRestoreCallback: true
        },
        lineLogger: secondRuntimeLineLogger,
        restoreLifecyclePayloadLogger: secondRestoreLifecyclePayloadLogger
      });

      expect(firstResult.nextPresenceSnapshot).toEqual({
        hasRestoreCallback: true
      });
      expect(secondResult.nextPresenceSnapshot).toEqual({
        hasRestoreCallback: true
      });
      expect(firstPresenceTextLogger).toHaveBeenCalledTimes(1);
      expect(secondPresenceLineLogger).toHaveBeenCalledTimes(1);
      expect(firstPresenceTextLogger.mock.calls[0]![0]).toBe(
        firstResult.restoreCallbackPresenceChangeText
      );
      expect(secondPresenceLineLogger.mock.calls[0]![0]).toEqual(
        secondResult.restoreCallbackPresenceChangeLines
      );

      const firstRestoreEmission =
        firstRestoreCallbackHolder.restoreConfigurationSnapshot(
          cloneAsUnknown(firstSourceHolder.getConfigurationSnapshot())
        );
      const secondRestoreEmission =
        secondRestoreCallbackHolder.restoreConfigurationSnapshot(
          cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
        );

      expect(firstRestoreEmission?.payload.restoredConfigurationSnapshot).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      expect(
        secondRestoreEmission?.payload.restoredConfigurationSnapshot
      ).toEqual(secondSourceHolder.getConfigurationSnapshot());

      firstTargetHolder.poll(4);
      expect(firstRuntimeTextLogger).toHaveBeenCalledTimes(1);
      secondTargetHolder.poll(8);
      expect(secondRuntimeLineLogger).not.toHaveBeenCalled();
      secondTargetHolder.poll(9);
      expect(secondRuntimeLineLogger).toHaveBeenCalledTimes(1);
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      expect(secondRestoreLifecyclePayloadLogger).toHaveBeenCalledTimes(1);
    });

    it('preserves presence reconfigure validation errors when the rebuilt callback is invoked', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const loggerBundle = vi.fn();
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
      const { reconfigureAndLogCallback } =
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback(
          {
            holder: restoreCallbackHolder,
            loggerBundle
          }
        );

      expect(() =>
        reconfigureAndLogCallback({
          presenceSnapshot: {
            hasRestoreCallback: true
          },
          textLogger: runtimeTextLogger
        })
      ).toThrowError(
        'restore callback presence snapshot reconfigure requires at least one restore-lifecycle replication diagnostics logger callback'
      );

      expect(loggerBundle).not.toHaveBeenCalled();
      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: false
      });
      expect(runtimeTextLogger).not.toHaveBeenCalled();
    });
  }
);
