import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback
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
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger',
  () => {
    it('forwards detached lifecycle lines through the injected logger', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger(
          {
            logger
          }
        );
      const emission = createRestoreLifecycleEmission();

      sink(emission);

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(emission.lifecycleLines);
      expect(logger.mock.calls[0]![0]).not.toBe(emission.lifecycleLines);
      expect(logger.mock.calls[0]![0].configurationChangeLines).not.toBe(
        emission.lifecycleLines.configurationChangeLines
      );
      expect(logger.mock.calls[0]![0].configurationRestoreLines).not.toBe(
        emission.lifecycleLines.configurationRestoreLines
      );
    });

    it('keeps line-logger mutations detached from the original emission so sibling sinks still see the original payload and text', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>(
          (lifecycleLines) => {
            lifecycleLines.configurationChangeLines[0] = 'mutated change line';
            lifecycleLines.configurationRestoreLines.push('mutated restore line');
          }
        );
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger(
          {
            logger
          }
        );
      const siblingSink =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback>();
      const emission = createRestoreLifecycleEmission();

      sink(emission);
      siblingSink(emission);

      expect(logger).toHaveBeenCalledTimes(1);
      expect(siblingSink).toHaveBeenCalledWith(emission);
      expect(emission).toEqual(createRestoreLifecycleEmission());
    });
  }
);
