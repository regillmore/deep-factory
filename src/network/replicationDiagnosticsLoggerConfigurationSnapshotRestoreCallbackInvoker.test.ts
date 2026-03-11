import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';

const createRestoreLifecycleEmission =
  (): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission => ({
    payload: {
      previousConfigurationSnapshot: {
        schedule: {
          disabled: false,
          intervalTicks: 5,
          nextDueTick: 3
        },
        callbacks: {
          hasTextLogger: false,
          hasLineLogger: false,
          hasPayloadLogger: true
        }
      },
      restoredConfigurationSnapshot: {
        schedule: {
          disabled: false,
          intervalTicks: 6,
          nextDueTick: 10
        },
        callbacks: {
          hasTextLogger: false,
          hasLineLogger: true,
          hasPayloadLogger: false
        }
      },
      changeSummary: {
        changed: true,
        schedule: {
          changed: true,
          disabledChanged: false,
          intervalTicksChanged: true,
          nextDueTickChanged: true
        },
        callbacks: {
          changed: true,
          hasTextLoggerChanged: false,
          hasLineLoggerChanged: true,
          hasPayloadLoggerChanged: true
        }
      }
    },
    lifecycleLines: {
      configurationChangeLines: [
        'ConfigurationChange: changed',
        'ConfigurationScheduleDiff: intervalTicks, nextDueTick',
        'ConfigurationCallbackDiff: hasLineLogger, hasPayloadLogger'
      ],
      configurationRestoreLines: [
        'ConfigurationRestore: disabled=false | changed=true',
        'ConfigurationRestoreSchedule: intervalTicks=6 | nextDueTick=10 | diff=intervalTicks, nextDueTick',
        'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=false | diff=hasLineLogger, hasPayloadLogger'
      ]
    },
    lifecycleText: [
      'ConfigurationChange: changed',
      'ConfigurationScheduleDiff: intervalTicks, nextDueTick',
      'ConfigurationCallbackDiff: hasLineLogger, hasPayloadLogger',
      'ConfigurationRestore: disabled=false | changed=true',
      'ConfigurationRestoreSchedule: intervalTicks=6 | nextDueTick=10 | diff=intervalTicks, nextDueTick',
      'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=false | diff=hasLineLogger, hasPayloadLogger'
    ].join('\n')
  });

describe(
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker',
  () => {
    it('returns a no-op-safe restore invoker when the restore callback is null', () => {
      const restoreInvoker =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker(
          {
            restoreCallback: null
          }
        );

      expect(restoreInvoker({ disabled: true })).toBeNull();
      expect(restoreInvoker(Number.NaN)).toBeNull();
    });

    it('forwards one unknown snapshot through the configured restore callback and returns its emission', () => {
      const restoreEmission = createRestoreLifecycleEmission();
      const restoreCallback =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback>(
          () => restoreEmission
        );
      const restoreInvoker =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker(
          {
            restoreCallback
          }
        );
      const unknownConfigurationSnapshot = {
        schedule: {
          disabled: false,
          intervalTicks: 6,
          nextDueTick: 10
        },
        callbacks: {
          hasTextLogger: false,
          hasLineLogger: true,
          hasPayloadLogger: false
        }
      };

      expect(restoreInvoker(unknownConfigurationSnapshot)).toBe(restoreEmission);
      expect(restoreCallback).toHaveBeenCalledTimes(1);
      expect(restoreCallback).toHaveBeenCalledWith(unknownConfigurationSnapshot);
    });

    it('preserves active restore callback errors instead of swallowing them', () => {
      const restoreCallback =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback>(
          () => {
            throw new Error('invalid restore payload');
          }
        );
      const restoreInvoker =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker(
          {
            restoreCallback
          }
        );

      expect(() => restoreInvoker({ callbacks: null })).toThrowError(
        'invalid restore payload'
      );
      expect(restoreCallback).toHaveBeenCalledTimes(1);
      expect(restoreCallback).toHaveBeenCalledWith({ callbacks: null });
    });
  }
);
