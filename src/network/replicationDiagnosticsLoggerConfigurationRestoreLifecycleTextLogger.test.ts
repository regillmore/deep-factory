import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';
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
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger',
  () => {
    it('forwards the emitted lifecycle text through the injected logger', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger(
          {
            logger
          }
        );
      const emission = createRestoreLifecycleEmission();

      sink(emission);

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(emission.lifecycleText);
    });

    it('uses the emission lifecycle text as the text source of truth instead of rebuilding it from the lifecycle line arrays', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger(
          {
            logger
          }
        );
      const emission = createRestoreLifecycleEmission();
      emission.lifecycleText = 'prejoined restore lifecycle text';

      sink(emission);

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith('prejoined restore lifecycle text');
    });

    it('leaves the original payload and lifecycle line arrays intact for sibling sinks after the text logger runs', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger(
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
