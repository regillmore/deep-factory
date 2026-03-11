import { describe, expect, it, vi } from 'vitest';

import {
  summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange
} from './replicationDiagnosticsLoggerConfigurationChangeSummary';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines
} from './replicationDiagnosticsLoggerConfigurationRestoreLineFormatting';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestore';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

const cloneAsUnknown = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe(
  'formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines',
  () => {
    it('renders a disabled unchanged restore snapshot with explicit n/a and none placeholders by default', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines()
      ).toEqual([
        'ConfigurationRestore: disabled=true | changed=false',
        'ConfigurationRestoreSchedule: intervalTicks=n/a | nextDueTick=n/a | diff=none',
        'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=false | hasPayloadLogger=false | diff=none'
      ]);
    });

    it('renders an unchanged enabled restore snapshot with explicit none diff labels', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const targetLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 10,
          lineLogger: sourceLineLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 10,
          lineLogger: targetLineLogger
        });
      const previousConfigurationSnapshot = targetHolder.getConfigurationSnapshot();
      const restoreResult =
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              sourceHolder.getConfigurationSnapshot()
            ),
            lineLogger: targetLineLogger
          }
        );

      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines(
          {
            configurationSnapshot: restoreResult.configurationSnapshot,
            changeSummary:
              summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange(
                {
                  previousConfigurationSnapshot,
                  nextConfigurationSnapshot: restoreResult.configurationSnapshot
                }
              )
          }
        )
      ).toEqual([
        'ConfigurationRestore: disabled=false | changed=false',
        'ConfigurationRestoreSchedule: intervalTicks=6 | nextDueTick=10 | diff=none',
        'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=false | diff=none'
      ]);
    });

    it('renders an enabled restored snapshot together with deterministic schedule and callback diff labels', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const targetLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 7,
          nextDueTick: 2,
          lineLogger: sourceLineLogger,
          payloadLogger: targetPayloadLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });
      const previousConfigurationSnapshot = targetHolder.getConfigurationSnapshot();
      const restoreResult =
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              sourceHolder.getConfigurationSnapshot()
            ),
            lineLogger: targetLineLogger,
            payloadLogger: targetPayloadLogger
          }
        );

      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines(
          {
            configurationSnapshot: restoreResult.configurationSnapshot,
            changeSummary:
              summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange(
                {
                  previousConfigurationSnapshot,
                  nextConfigurationSnapshot: restoreResult.configurationSnapshot
                }
              )
          }
        )
      ).toEqual([
        'ConfigurationRestore: disabled=false | changed=true',
        'ConfigurationRestoreSchedule: intervalTicks=7 | nextDueTick=2 | diff=disabled, intervalTicks, nextDueTick',
        'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=true | diff=hasLineLogger, hasPayloadLogger'
      ]);
    });

    it('renders a disabled restored snapshot with n/a schedule values and changed callback labels', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });
      const targetTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          textLogger: targetTextLogger
        });
      const previousConfigurationSnapshot = targetHolder.getConfigurationSnapshot();
      const restoreResult =
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: cloneAsUnknown(
              sourceHolder.getConfigurationSnapshot()
            ),
            textLogger: targetTextLogger
          }
        );

      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines(
          {
            configurationSnapshot: restoreResult.configurationSnapshot,
            changeSummary:
              summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange(
                {
                  previousConfigurationSnapshot,
                  nextConfigurationSnapshot: restoreResult.configurationSnapshot
                }
              )
          }
        )
      ).toEqual([
        'ConfigurationRestore: disabled=true | changed=true',
        'ConfigurationRestoreSchedule: intervalTicks=n/a | nextDueTick=n/a | diff=disabled, intervalTicks, nextDueTick',
        'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=false | hasPayloadLogger=false | diff=hasTextLogger'
      ]);
    });
  }
);
