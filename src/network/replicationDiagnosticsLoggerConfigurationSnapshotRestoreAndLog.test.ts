import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle';
import {
  restoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreAndLog';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';

const cloneAsUnknown = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe(
  'restoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot',
  () => {
    it('restores one unknown snapshot and forwards the resulting lifecycle emission through an optional mixed logger bundle', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const lifecycleCallOrder: string[] = [];
      const lifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>(
          (lifecycleText) => {
            lifecycleCallOrder.push(`text:${lifecycleText.split('\n', 1)[0]}`);
          }
        );
      const lifecycleLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>(
          (lifecycleLines) => {
            lifecycleCallOrder.push(
              `line:${lifecycleLines.configurationChangeLines[0]}`
            );
          }
        );
      const lifecyclePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>(
          (payload) => {
            lifecycleCallOrder.push(`payload:${payload.changeSummary.changed}`);
          }
        );
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 10,
          lineLogger: runtimeLineLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger: targetPayloadLogger
        });

      const emission =
        restoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              sourceHolder.getConfigurationSnapshot()
            ),
            lineLogger: runtimeLineLogger,
            loggerBundle:
              createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle(
                {
                  textLogger: lifecycleTextLogger,
                  lineLogger: lifecycleLineLogger,
                  payloadLogger: lifecyclePayloadLogger
                }
              )
          }
        );

      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      expect(emission.payload.restoredConfigurationSnapshot).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      expect(lifecycleTextLogger).toHaveBeenCalledWith(emission.lifecycleText);
      expect(lifecycleLineLogger).toHaveBeenCalledWith(emission.lifecycleLines);
      expect(lifecyclePayloadLogger).toHaveBeenCalledWith(emission.payload);
      expect(lifecycleLineLogger.mock.calls[0]![0]).not.toBe(emission.lifecycleLines);
      expect(lifecyclePayloadLogger.mock.calls[0]![0]).not.toBe(emission.payload);
      expect(lifecycleCallOrder).toEqual([
        'text:ConfigurationChange: changed',
        'line:ConfigurationChange: changed',
        'payload:true'
      ]);
    });

    it('restores one unknown snapshot without requiring a restore-lifecycle logger bundle', () => {
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

      const emission =
        restoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              disabledSourceHolder.getConfigurationSnapshot()
            ),
            textLogger: targetTextLogger
          }
        );

      expect(emission.payload.restoredConfigurationSnapshot).toEqual(
        disabledSourceHolder.getConfigurationSnapshot()
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        disabledSourceHolder.getConfigurationSnapshot()
      );
      expect(emission.lifecycleLines).toEqual({
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
      });
    });

    it('does not invoke the optional mixed logger bundle when restore validation fails', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const loggerBundle =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle>();
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
        restoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              sourceHolder.getConfigurationSnapshot()
            ),
            loggerBundle
          }
        )
      ).toThrowError(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );

      expect(loggerBundle).not.toHaveBeenCalled();
      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
      expect(sourceTextLogger).not.toHaveBeenCalled();
      expect(targetPayloadLogger).not.toHaveBeenCalled();
    });
  }
);
