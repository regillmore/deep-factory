import { describe, expect, it, vi } from 'vitest';

import { decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot } from './replicationDiagnosticsLoggerConfigurationSnapshotDecode';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

describe(
  'decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot',
  () => {
    it('decodes an enabled detached snapshot exported by the holder', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const textLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 9,
          nextDueTick: 6,
          textLogger
        });
      const snapshot = holder.getConfigurationSnapshot();

      expect(
        decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          snapshot
        )
      ).toEqual(snapshot);
    });

    it('decodes a disabled detached snapshot exported by the holder', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });
      const snapshot = holder.getConfigurationSnapshot();

      expect(
        decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          snapshot
        )
      ).toEqual(snapshot);
    });

    it('rejects enabled snapshots that do not flag any logger callbacks', () => {
      expect(() =>
        decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot({
          schedule: {
            disabled: false,
            intervalTicks: 5,
            nextDueTick: 12
          },
          callbacks: {
            hasTextLogger: false,
            hasLineLogger: false,
            hasPayloadLogger: false
          }
        })
      ).toThrowError(
        'enabled configuration snapshot requires at least one replication diagnostics logger callback'
      );
    });

    it('rejects disabled snapshots that retain enabled callback flags', () => {
      expect(() =>
        decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot({
          schedule: {
            disabled: true,
            intervalTicks: null,
            nextDueTick: null
          },
          callbacks: {
            hasTextLogger: false,
            hasLineLogger: false,
            hasPayloadLogger: true
          }
        })
      ).toThrowError(
        'disabled configuration snapshot must not flag replication diagnostics logger callbacks'
      );
    });

    it('rejects disabled snapshots that retain cadence state', () => {
      expect(() =>
        decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot({
          schedule: {
            disabled: true,
            intervalTicks: 4,
            nextDueTick: null
          },
          callbacks: {
            hasTextLogger: false,
            hasLineLogger: false,
            hasPayloadLogger: false
          }
        })
      ).toThrowError(
        'schedule.intervalTicks must be null when schedule.disabled is true'
      );
    });

    it('rejects enabled snapshots with invalid cadence values', () => {
      expect(() =>
        decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot({
          schedule: {
            disabled: false,
            intervalTicks: 0,
            nextDueTick: -1
          },
          callbacks: {
            hasTextLogger: true,
            hasLineLogger: false,
            hasPayloadLogger: false
          }
        })
      ).toThrowError('schedule.intervalTicks must be greater than 0');
    });
  }
);
