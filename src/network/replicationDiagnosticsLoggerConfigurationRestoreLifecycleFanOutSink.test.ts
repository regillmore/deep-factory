import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink';
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
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink',
  () => {
    it('forwards one restore-lifecycle emission to multiple sinks in declaration order', () => {
      const callOrder: string[] = [];
      const firstSink =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback>(
          (emission) => {
            callOrder.push(`first:${emission.lifecycleLines.configurationChangeLines[0]}`);
          }
        );
      const secondSink =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback>(
          (emission) => {
            callOrder.push(
              `second:${emission.lifecycleLines.configurationRestoreLines[0]}`
            );
          }
        );
      const thirdSink =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback>(
          (emission) => {
            callOrder.push(`third:${emission.lifecycleText.split('\n', 1)[0]}`);
          }
        );
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink(
          {
            sinks: [firstSink, secondSink, thirdSink]
          }
        );
      const emission = createRestoreLifecycleEmission();

      sink(emission);

      expect(callOrder).toEqual([
        'first:ConfigurationChange: changed',
        'second:ConfigurationRestore: disabled=false | changed=true',
        'third:ConfigurationChange: changed'
      ]);

      const firstEmission = firstSink.mock.calls[0]![0];
      const secondEmission = secondSink.mock.calls[0]![0];
      const thirdEmission = thirdSink.mock.calls[0]![0];

      expect(firstEmission).toEqual(emission);
      expect(secondEmission).toEqual(emission);
      expect(thirdEmission).toEqual(emission);
      expect(firstEmission).not.toBe(emission);
      expect(secondEmission).not.toBe(emission);
      expect(thirdEmission).not.toBe(emission);
      expect(firstEmission).not.toBe(secondEmission);
      expect(secondEmission).not.toBe(thirdEmission);
      expect(firstEmission.payload).not.toBe(emission.payload);
      expect(firstEmission.lifecycleLines).not.toBe(emission.lifecycleLines);
      expect(firstEmission.lifecycleLines.configurationChangeLines).not.toBe(
        emission.lifecycleLines.configurationChangeLines
      );
      expect(firstEmission.lifecycleLines.configurationRestoreLines).not.toBe(
        emission.lifecycleLines.configurationRestoreLines
      );
      expect(firstEmission.lifecycleText).toBe(emission.lifecycleText);
    });

    it('isolates per-sink payload and lifecycle-line mutations while leaving the source emission unchanged', () => {
      const firstSink =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback>(
          (emission) => {
            emission.payload.previousConfigurationSnapshot.schedule = {
              disabled: true,
              intervalTicks: null,
              nextDueTick: null
            };
            emission.payload.restoredConfigurationSnapshot.callbacks.hasLineLogger = false;
            emission.lifecycleLines.configurationChangeLines[0] = 'mutated change line';
            emission.lifecycleLines.configurationRestoreLines.push(
              'mutated restore line'
            );
          }
        );
      const secondSink =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink(
          {
            sinks: [firstSink, secondSink]
          }
        );
      const emission = createRestoreLifecycleEmission();

      sink(emission);

      expect(firstSink).toHaveBeenCalledTimes(1);
      expect(secondSink).toHaveBeenCalledTimes(1);
      expect(secondSink).toHaveBeenCalledWith(createRestoreLifecycleEmission());

      const secondEmission = secondSink.mock.calls[0]![0];
      expect(secondEmission.payload.previousConfigurationSnapshot.schedule).toEqual({
        disabled: false,
        intervalTicks: 5,
        nextDueTick: 3
      });
      expect(secondEmission.payload.restoredConfigurationSnapshot.callbacks).toEqual({
        hasTextLogger: false,
        hasLineLogger: true,
        hasPayloadLogger: false
      });
      expect(secondEmission.lifecycleLines.configurationChangeLines).toEqual([
        'ConfigurationChange: changed',
        'ConfigurationScheduleDiff: intervalTicks, nextDueTick',
        'ConfigurationCallbackDiff: hasLineLogger, hasPayloadLogger'
      ]);
      expect(secondEmission.lifecycleLines.configurationRestoreLines).toEqual([
        'ConfigurationRestore: disabled=false | changed=true',
        'ConfigurationRestoreSchedule: intervalTicks=6 | nextDueTick=10 | diff=intervalTicks, nextDueTick',
        'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=false | diff=hasLineLogger, hasPayloadLogger'
      ]);
      expect(secondEmission.lifecycleText).toBe(createRestoreLifecycleEmission().lifecycleText);
      expect(emission).toEqual(createRestoreLifecycleEmission());
    });

    it('acts as a silent no-op sink when no sinks are configured', () => {
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink(
          {
            sinks: []
          }
        );
      const emission = createRestoreLifecycleEmission();

      expect(() => sink(emission)).not.toThrow();
      expect(emission).toEqual(createRestoreLifecycleEmission());
    });
  }
);
