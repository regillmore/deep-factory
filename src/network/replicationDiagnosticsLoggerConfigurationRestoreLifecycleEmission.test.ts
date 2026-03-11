import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmission
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

const cloneAsUnknown = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe(
  'restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmission',
  () => {
    it('restores an enabled payload and returns detached payload, lines, and text for caller-owned logging', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const targetLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 10,
          lineLogger: targetLineLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger: targetPayloadLogger
        });
      const initialTargetSnapshot = targetHolder.getConfigurationSnapshot();
      const expectedLifecycleText =
        [
          'ConfigurationChange: changed',
          'ConfigurationScheduleDiff: intervalTicks, nextDueTick',
          'ConfigurationCallbackDiff: hasLineLogger, hasPayloadLogger',
          'ConfigurationRestore: disabled=false | changed=true',
          'ConfigurationRestoreSchedule: intervalTicks=6 | nextDueTick=10 | diff=intervalTicks, nextDueTick',
          'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=false | diff=hasLineLogger, hasPayloadLogger'
        ].join('\n');

      const emission =
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmission(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              sourceHolder.getConfigurationSnapshot()
            ),
            lineLogger: targetLineLogger
          }
        );

      expect(emission).toEqual({
        payload: {
          previousConfigurationSnapshot: initialTargetSnapshot,
          restoredConfigurationSnapshot: sourceHolder.getConfigurationSnapshot(),
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
        lifecycleText: expectedLifecycleText
      });
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );

      emission.lifecycleLines.configurationChangeLines[0] = 'mutated';
      emission.lifecycleLines.configurationRestoreLines[0] = 'mutated';

      expect(emission.lifecycleText).toBe(expectedLifecycleText);

      targetHolder.reconfigure({
        registry,
        intervalTicks: 4,
        nextDueTick: 12,
        payloadLogger: targetPayloadLogger
      });

      expect(emission.payload).toEqual({
        previousConfigurationSnapshot: initialTargetSnapshot,
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
      });
    });

    it('formats disabled restore lifecycle output with n/a schedule values after turning logging off', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const targetTextLogger =
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
          textLogger: targetTextLogger
        });
      const initialTargetSnapshot = targetHolder.getConfigurationSnapshot();

      const emission =
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmission(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              disabledSourceHolder.getConfigurationSnapshot()
            ),
            textLogger: targetTextLogger
          }
        );

      expect(emission).toEqual({
        payload: {
          previousConfigurationSnapshot: initialTargetSnapshot,
          restoredConfigurationSnapshot:
            disabledSourceHolder.getConfigurationSnapshot(),
          changeSummary: {
            changed: true,
            schedule: {
              changed: true,
              disabledChanged: true,
              intervalTicksChanged: true,
              nextDueTickChanged: true
            },
            callbacks: {
              changed: true,
              hasTextLoggerChanged: true,
              hasLineLoggerChanged: false,
              hasPayloadLoggerChanged: false
            }
          }
        },
        lifecycleLines: {
          configurationChangeLines: [
            'ConfigurationChange: changed',
            'ConfigurationScheduleDiff: disabled, intervalTicks, nextDueTick',
            'ConfigurationCallbackDiff: hasTextLogger'
          ],
          configurationRestoreLines: [
            'ConfigurationRestore: disabled=true | changed=true',
            'ConfigurationRestoreSchedule: intervalTicks=n/a | nextDueTick=n/a | diff=disabled, intervalTicks, nextDueTick',
            'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=false | hasPayloadLogger=false | diff=hasTextLogger'
          ]
        },
        lifecycleText: [
          'ConfigurationChange: changed',
          'ConfigurationScheduleDiff: disabled, intervalTicks, nextDueTick',
          'ConfigurationCallbackDiff: hasTextLogger',
          'ConfigurationRestore: disabled=true | changed=true',
          'ConfigurationRestoreSchedule: intervalTicks=n/a | nextDueTick=n/a | diff=disabled, intervalTicks, nextDueTick',
          'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=false | hasPayloadLogger=false | diff=hasTextLogger'
        ].join('\n')
      });
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        disabledSourceHolder.getConfigurationSnapshot()
      );
    });

    it('reports unchanged lifecycle diffs when the restored snapshot matches the current holder configuration', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const lineLogger = vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 8,
          nextDueTick: 11,
          lineLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 8,
          nextDueTick: 11,
          lineLogger
        });

      const emission =
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmission(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              sourceHolder.getConfigurationSnapshot()
            ),
            lineLogger
          }
        );

      expect(emission.lifecycleLines).toEqual({
        configurationChangeLines: [
          'ConfigurationChange: unchanged',
          'ConfigurationScheduleDiff: none',
          'ConfigurationCallbackDiff: none'
        ],
        configurationRestoreLines: [
          'ConfigurationRestore: disabled=false | changed=false',
          'ConfigurationRestoreSchedule: intervalTicks=8 | nextDueTick=11 | diff=none',
          'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=false | diff=none'
        ]
      });
      expect(emission.lifecycleText).toBe(
        [
          'ConfigurationChange: unchanged',
          'ConfigurationScheduleDiff: none',
          'ConfigurationCallbackDiff: none',
          'ConfigurationRestore: disabled=false | changed=false',
          'ConfigurationRestoreSchedule: intervalTicks=8 | nextDueTick=11 | diff=none',
          'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=false | diff=none'
        ].join('\n')
      );
    });

    it('preserves the target holder state when restore validation fails after decode', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
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

      expect(() =>
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmission(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              sourceHolder.getConfigurationSnapshot()
            )
          }
        )
      ).toThrowError(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );

      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
      expect(sourceTextLogger).not.toHaveBeenCalled();
      expect(targetPayloadLogger).not.toHaveBeenCalled();
    });
  }
);
