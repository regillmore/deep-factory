import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import { summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange } from './replicationDiagnosticsLoggerConfigurationChangeSummary';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

describe(
  'summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange',
  () => {
    it('reports no change flags for equal detached configuration snapshots', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const textLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 9,
          nextDueTick: 7,
          textLogger
        });
      const configurationSnapshot = holder.getConfigurationSnapshot();

      expect(
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange(
          {
            previousConfigurationSnapshot: configurationSnapshot,
            nextConfigurationSnapshot: configurationSnapshot
          }
        )
      ).toEqual({
        changed: false,
        schedule: {
          changed: false,
          disabledChanged: false,
          intervalTicksChanged: false,
          nextDueTickChanged: false
        },
        callbacks: {
          changed: false,
          hasTextLoggerChanged: false,
          hasLineLoggerChanged: false,
          hasPayloadLoggerChanged: false
        }
      });
    });

    it('flags enablement and callback-presence transitions between detached snapshots', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const lineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const payloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const disabledHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });
      const enabledHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          lineLogger,
          payloadLogger
        });

      expect(
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange(
          {
            previousConfigurationSnapshot:
              disabledHolder.getConfigurationSnapshot(),
            nextConfigurationSnapshot: enabledHolder.getConfigurationSnapshot()
          }
        )
      ).toEqual({
        changed: true,
        schedule: {
          changed: true,
          disabledChanged: true,
          intervalTicksChanged: true,
          nextDueTickChanged: true
        },
        callbacks: {
          changed: true,
          hasTextLoggerChanged: false,
          hasLineLoggerChanged: true,
          hasPayloadLoggerChanged: true
        }
      });
    });

    it('isolates enabled schedule changes from unchanged callback-presence flags', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const textLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 8,
          nextDueTick: 3,
          textLogger
        });
      const previousConfigurationSnapshot = holder.getConfigurationSnapshot();

      holder.refreshScheduleAndCadence({
        intervalTicks: 5,
        nextDueTick: 11
      });

      expect(
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange(
          {
            previousConfigurationSnapshot,
            nextConfigurationSnapshot: holder.getConfigurationSnapshot()
          }
        )
      ).toEqual({
        changed: true,
        schedule: {
          changed: true,
          disabledChanged: false,
          intervalTicksChanged: true,
          nextDueTickChanged: true
        },
        callbacks: {
          changed: false,
          hasTextLoggerChanged: false,
          hasLineLoggerChanged: false,
          hasPayloadLoggerChanged: false
        }
      });
    });

    it('isolates callback-presence changes from an unchanged enabled schedule', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const textLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const payloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 10,
          nextDueTick: 8,
          textLogger
        });
      const previousConfigurationSnapshot = holder.getConfigurationSnapshot();

      holder.refreshCallbacks({
        textLogger: undefined,
        payloadLogger
      });

      expect(
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange(
          {
            previousConfigurationSnapshot,
            nextConfigurationSnapshot: holder.getConfigurationSnapshot()
          }
        )
      ).toEqual({
        changed: true,
        schedule: {
          changed: false,
          disabledChanged: false,
          intervalTicksChanged: false,
          nextDueTickChanged: false
        },
        callbacks: {
          changed: true,
          hasTextLoggerChanged: true,
          hasLineLoggerChanged: false,
          hasPayloadLoggerChanged: true
        }
      });
    });
  }
);
