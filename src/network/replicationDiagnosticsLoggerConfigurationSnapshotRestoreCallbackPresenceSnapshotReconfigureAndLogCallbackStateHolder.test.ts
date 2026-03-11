import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackStateHolder
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackStateHolder';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';
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
  'AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackStateHolder',
  () => {
    it('owns one detached presence reconfigure-and-log seam for one restore callback holder plus the optional restore-wiring logger bundle', () => {
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
      const callbackStateHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackStateHolder(
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
      const detachedCallback =
        callbackStateHolder.reconfigureAndLogFromPresenceSnapshot;

      const result = detachedCallback({
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

      const emission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
      );

      expect(emission?.payload.restoredConfigurationSnapshot).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      expect(restoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      targetHolder.poll(3);
      expect(runtimeLineLogger).not.toHaveBeenCalled();
      targetHolder.poll(4);
      expect(runtimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('keeps the holder-owned detached callback stable while reconfiguring to updated restore-callback holders and logger bundles', () => {
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
      const callbackStateHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackStateHolder(
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
      const detachedCallback =
        callbackStateHolder.reconfigureAndLogFromPresenceSnapshot;

      const firstResult = detachedCallback({
        presenceSnapshot: {
          hasRestoreCallback: true
        },
        textLogger: firstRuntimeTextLogger,
        restoreLifecycleTextLogger: firstRestoreLifecycleTextLogger
      });

      callbackStateHolder.reconfigure({
        holder: secondRestoreCallbackHolder,
        loggerBundle:
          createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle(
            {
              lineLogger: secondPresenceLineLogger
            }
          )
      });

      expect(callbackStateHolder.reconfigureAndLogFromPresenceSnapshot).toBe(
        detachedCallback
      );

      const secondResult = detachedCallback({
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

      const firstEmission = firstRestoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(firstSourceHolder.getConfigurationSnapshot())
      );
      const secondEmission =
        secondRestoreCallbackHolder.restoreConfigurationSnapshot(
          cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
        );

      expect(firstEmission?.payload.restoredConfigurationSnapshot).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      expect(secondEmission?.payload.restoredConfigurationSnapshot).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      expect(secondRestoreLifecyclePayloadLogger).toHaveBeenCalledTimes(1);

      firstTargetHolder.poll(4);
      expect(firstRuntimeTextLogger).toHaveBeenCalledTimes(1);
      secondTargetHolder.poll(8);
      expect(secondRuntimeLineLogger).not.toHaveBeenCalled();
      secondTargetHolder.poll(9);
      expect(secondRuntimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('preserves presence reconfigure validation errors while keeping the holder-owned detached callback seam active', () => {
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
      const callbackStateHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackStateHolder(
          {
            holder: restoreCallbackHolder,
            loggerBundle
          }
        );
      const detachedCallback =
        callbackStateHolder.reconfigureAndLogFromPresenceSnapshot;

      expect(() =>
        detachedCallback({
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
