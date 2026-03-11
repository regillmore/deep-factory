import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle';
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
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback',
  () => {
    it('captures one holder plus optional restore-wiring logger bundle into a reusable detached presence reconfigure-and-log callback', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const firstRuntimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const secondRuntimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const firstRestoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const secondRestoreLifecyclePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>();
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
      const firstSourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          lineLogger: firstRuntimeLineLogger
        });
      const secondSourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 7,
          nextDueTick: 9,
          textLogger: secondRuntimeTextLogger
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
      const reconfigureCallback =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback(
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

      const firstResult = reconfigureCallback({
        presenceSnapshot: {
          hasRestoreCallback: true
        },
        lineLogger: firstRuntimeLineLogger,
        restoreLifecycleTextLogger: firstRestoreLifecycleTextLogger
      });

      expect(firstResult).toEqual({
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

      const firstEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(firstSourceHolder.getConfigurationSnapshot())
      );

      expect(firstEmission?.payload.restoredConfigurationSnapshot).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      targetHolder.poll(3);
      expect(firstRuntimeLineLogger).not.toHaveBeenCalled();
      targetHolder.poll(4);
      expect(firstRuntimeLineLogger).toHaveBeenCalledTimes(1);

      const secondResult = reconfigureCallback({
        presenceSnapshot: {
          hasRestoreCallback: true
        },
        textLogger: secondRuntimeTextLogger,
        restoreLifecyclePayloadLogger: secondRestoreLifecyclePayloadLogger
      });

      expect(secondResult).toEqual({
        previousPresenceSnapshot: {
          hasRestoreCallback: true
        },
        nextPresenceSnapshot: {
          hasRestoreCallback: true
        },
        changeSummary: {
          changed: false,
          hasRestoreCallbackChanged: false
        },
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: unchanged',
          'RestoreCallbackPresenceDiff: none'
        ],
        restoreCallbackPresenceChangeText: [
          'RestoreCallbackPresenceChange: unchanged',
          'RestoreCallbackPresenceDiff: none'
        ].join('\n')
      });
      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });
      expect(presenceCallOrder).toEqual([
        'text:RestoreCallbackPresenceChange: changed',
        'line:RestoreCallbackPresenceChange: changed',
        'text:RestoreCallbackPresenceChange: unchanged',
        'line:RestoreCallbackPresenceChange: unchanged'
      ]);

      const secondEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
      );

      expect(secondEmission?.payload.restoredConfigurationSnapshot).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      expect(secondRestoreLifecyclePayloadLogger).toHaveBeenCalledTimes(1);
      targetHolder.poll(8);
      expect(secondRuntimeTextLogger).not.toHaveBeenCalled();
      targetHolder.poll(9);
      expect(secondRuntimeTextLogger).toHaveBeenCalledTimes(1);
    });

    it('reconfigures presence wiring without requiring a restore-wiring logger bundle', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const restoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
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
      const reconfigureCallback =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback(
          {
            holder: restoreCallbackHolder
          }
        );

      const result = reconfigureCallback({
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
    });

    it('keeps logger-bundle mutations detached from the returned presence-change output', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const restoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
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
      const loggerBundle =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle>(
          (loggerBundleOptions = {}) => {
            const { restoreCallbackPresenceChangeLines = [] } =
              loggerBundleOptions;

            restoreCallbackPresenceChangeLines[0] = 'mutated change line';
            restoreCallbackPresenceChangeLines.push('mutated diff line');
          }
        );
      const reconfigureCallback =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback(
          {
            holder: restoreCallbackHolder,
            loggerBundle
          }
        );

      const result = reconfigureCallback({
        presenceSnapshot: {
          hasRestoreCallback: true
        },
        lineLogger: runtimeLineLogger,
        restoreLifecycleTextLogger
      });

      expect(loggerBundle).toHaveBeenCalledTimes(1);
      expect(loggerBundle.mock.calls[0]![0]).toEqual({
        restoreCallbackPresenceChangeLines: [
          'mutated change line',
          'RestoreCallbackPresenceDiff: hasRestoreCallback',
          'mutated diff line'
        ]
      });
      expect(result.restoreCallbackPresenceChangeLines).toEqual([
        'RestoreCallbackPresenceChange: changed',
        'RestoreCallbackPresenceDiff: hasRestoreCallback'
      ]);
      expect(result.restoreCallbackPresenceChangeText).toBe(
        [
          'RestoreCallbackPresenceChange: changed',
          'RestoreCallbackPresenceDiff: hasRestoreCallback'
        ].join('\n')
      );
    });

    it('preserves the holder state and skips the optional bundle when presence reconfigure validation fails', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const loggerBundle =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle>();
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
      const reconfigureCallback =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback(
          {
            holder: restoreCallbackHolder,
            loggerBundle
          }
        );

      expect(() =>
        reconfigureCallback({
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
