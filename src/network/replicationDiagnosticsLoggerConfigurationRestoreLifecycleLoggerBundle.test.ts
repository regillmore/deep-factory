import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';

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
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle',
  () => {
    it('wires configured text, line, and payload loggers through one ordered sink', () => {
      const callOrder: string[] = [];
      const textLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>(
          (lifecycleText) => {
            callOrder.push(`text:${lifecycleText.split('\n', 1)[0]}`);
          }
        );
      const lineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>(
          (lifecycleLines) => {
            callOrder.push(`line:${lifecycleLines.configurationChangeLines[0]}`);
          }
        );
      const payloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>(
          (payload) => {
            callOrder.push(`payload:${payload.changeSummary.changed}`);
          }
        );
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle(
          {
            textLogger,
            lineLogger,
            payloadLogger
          }
        );
      const emission = createRestoreLifecycleEmission();

      sink(emission);

      expect(textLogger).toHaveBeenCalledWith(emission.lifecycleText);
      expect(lineLogger).toHaveBeenCalledWith(emission.lifecycleLines);
      expect(payloadLogger).toHaveBeenCalledWith(emission.payload);
      expect(lineLogger.mock.calls[0]![0]).not.toBe(emission.lifecycleLines);
      expect(payloadLogger.mock.calls[0]![0]).not.toBe(emission.payload);
      expect(callOrder).toEqual([
        'text:ConfigurationChange: changed',
        'line:ConfigurationChange: changed',
        'payload:true'
      ]);
    });

    it('skips omitted logger adapters while keeping payload and lifecycle-line mutations detached from the source emission', () => {
      const lineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>(
          (lifecycleLines) => {
            lifecycleLines.configurationChangeLines[0] = 'mutated change line';
          }
        );
      const payloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>(
          (payload) => {
            payload.changeSummary.changed = false;
            payload.restoredConfigurationSnapshot.callbacks.hasPayloadLogger = true;
          }
        );
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle(
          {
            lineLogger,
            payloadLogger
          }
        );
      const emission = createRestoreLifecycleEmission();

      sink(emission);

      expect(lineLogger).toHaveBeenCalledWith({
        configurationChangeLines: [
          'mutated change line',
          'ConfigurationScheduleDiff: intervalTicks, nextDueTick',
          'ConfigurationCallbackDiff: hasLineLogger, hasPayloadLogger'
        ],
        configurationRestoreLines: [
          'ConfigurationRestore: disabled=false | changed=true',
          'ConfigurationRestoreSchedule: intervalTicks=6 | nextDueTick=10 | diff=intervalTicks, nextDueTick',
          'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=false | diff=hasLineLogger, hasPayloadLogger'
        ]
      });
      expect(payloadLogger).toHaveBeenCalledTimes(1);
      const loggedPayload = payloadLogger.mock.calls[0]![0];
      expect(loggedPayload.changeSummary.changed).toBe(false);
      expect(loggedPayload.restoredConfigurationSnapshot.callbacks.hasPayloadLogger).toBe(
        true
      );
      expect(emission).toEqual(createRestoreLifecycleEmission());
    });

    it('acts as a silent no-op sink when no loggers are configured', () => {
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle(
          {}
        );
      const emission = createRestoreLifecycleEmission();

      expect(() => sink(emission)).not.toThrow();
      expect(emission).toEqual(createRestoreLifecycleEmission());
    });
  }
);
