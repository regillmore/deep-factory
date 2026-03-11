import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle';
import {
  reconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLog';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

const cloneAsUnknown = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe(
  'reconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot',
  () => {
    it('enables restore wiring, returns detached presence-change output, and forwards it through the optional mixed logger bundle', () => {
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

      const result =
        reconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
          {
            holder: restoreCallbackHolder,
            presenceSnapshot: {
              hasRestoreCallback: true
            },
            lineLogger: runtimeLineLogger,
            restoreLifecycleTextLogger,
            loggerBundle:
              createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle(
                {
                  textLogger: presenceTextLogger,
                  lineLogger: presenceLineLogger
                }
              )
          }
        );

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
      expect(presenceTextLogger).toHaveBeenCalledWith(
        result.restoreCallbackPresenceChangeText
      );
      expect(presenceLineLogger).toHaveBeenCalledWith(
        result.restoreCallbackPresenceChangeLines
      );
      expect(presenceLineLogger.mock.calls[0]![0]).not.toBe(
        result.restoreCallbackPresenceChangeLines
      );
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

    it('disables restore wiring without requiring a presence-change logger bundle and ignores extra restore-lifecycle loggers', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const restoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          textLogger: runtimeTextLogger
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
            textLogger: runtimeTextLogger,
            restoreLifecycleTextLogger
          }
        );
      const initialTargetSnapshot = targetHolder.getConfigurationSnapshot();

      const result =
        reconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
          {
            holder: restoreCallbackHolder,
            presenceSnapshot: {
              hasRestoreCallback: false
            },
            textLogger: runtimeTextLogger,
            restoreLifecycleTextLogger
          }
        );

      expect(result).toEqual({
        previousPresenceSnapshot: {
          hasRestoreCallback: true
        },
        nextPresenceSnapshot: {
          hasRestoreCallback: false
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
        hasRestoreCallback: false
      });
      expect(
        restoreCallbackHolder.restoreConfigurationSnapshot(
          cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
        )
      ).toBeNull();
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        initialTargetSnapshot
      );
      expect(restoreLifecycleTextLogger).not.toHaveBeenCalled();
      expect(runtimeTextLogger).not.toHaveBeenCalled();
    });

    it('summarizes enabled-to-enabled logger refreshes as unchanged and keeps logger-bundle mutations detached from the returned lines', () => {
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
            textLogger: firstRuntimeTextLogger,
            restoreLifecycleTextLogger: firstRestoreLifecycleTextLogger
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

      const firstEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(firstSourceHolder.getConfigurationSnapshot())
      );

      expect(firstEmission?.payload.restoredConfigurationSnapshot).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);

      const result =
        reconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
          {
            holder: restoreCallbackHolder,
            presenceSnapshot: {
              hasRestoreCallback: true
            },
            lineLogger: secondRuntimeLineLogger,
            restoreLifecyclePayloadLogger: secondRestoreLifecyclePayloadLogger,
            loggerBundle
          }
        );

      expect(result).toEqual({
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
      expect(loggerBundle).toHaveBeenCalledTimes(1);
      expect(loggerBundle.mock.calls[0]![0]).toEqual({
        restoreCallbackPresenceChangeLines: [
          'mutated change line',
          'RestoreCallbackPresenceDiff: none',
          'mutated diff line'
        ]
      });

      const secondEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
      );

      expect(secondEmission?.payload.restoredConfigurationSnapshot).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(secondRestoreLifecyclePayloadLogger).toHaveBeenCalledTimes(1);
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      targetHolder.poll(8);
      expect(secondRuntimeLineLogger).not.toHaveBeenCalled();
      targetHolder.poll(9);
      expect(firstRuntimeTextLogger).not.toHaveBeenCalled();
      expect(secondRuntimeLineLogger).toHaveBeenCalledTimes(1);
      expect(result.restoreCallbackPresenceChangeLines).toEqual([
        'RestoreCallbackPresenceChange: unchanged',
        'RestoreCallbackPresenceDiff: none'
      ]);
    });

    it('does not invoke the optional logger bundle when presence reconfigure validation fails', () => {
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

      expect(() =>
        reconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
          {
            holder: restoreCallbackHolder,
            presenceSnapshot: {
              hasRestoreCallback: true
            },
            textLogger: runtimeTextLogger,
            loggerBundle
          }
        )
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
