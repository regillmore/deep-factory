import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import { validateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks } from './replicationDiagnosticsLoggerConfigurationSnapshotCallbackValidation';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

describe(
  'validateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks',
  () => {
    it('returns only the callback types flagged by the detached snapshot', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const sourcePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const suppliedTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const suppliedLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const suppliedPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          textLogger: sourceTextLogger,
          payloadLogger: sourcePayloadLogger
        });

      expect(
        validateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks(
          {
            configurationSnapshot: holder.getConfigurationSnapshot(),
            textLogger: suppliedTextLogger,
            lineLogger: suppliedLineLogger,
            payloadLogger: suppliedPayloadLogger
          }
        )
      ).toEqual({
        textLogger: suppliedTextLogger,
        lineLogger: undefined,
        payloadLogger: suppliedPayloadLogger
      });
    });

    it('returns no callbacks for a disabled detached snapshot', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const textLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const lineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const payloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });

      expect(
        validateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks(
          {
            configurationSnapshot: holder.getConfigurationSnapshot(),
            textLogger,
            lineLogger,
            payloadLogger
          }
        )
      ).toEqual({
        textLogger: undefined,
        lineLogger: undefined,
        payloadLogger: undefined
      });
    });

    it('rejects missing required text callbacks', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          textLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>()
        });

      expect(() =>
        validateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks(
          {
            configurationSnapshot: holder.getConfigurationSnapshot()
          }
        )
      ).toThrowError(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );
    });

    it('rejects missing required line callbacks', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          lineLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>()
        });

      expect(() =>
        validateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks(
          {
            configurationSnapshot: holder.getConfigurationSnapshot()
          }
        )
      ).toThrowError(
        'configuration snapshot requires a line replication diagnostics logger callback'
      );
    });

    it('rejects missing required payload callbacks', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const holder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });

      expect(() =>
        validateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks(
          {
            configurationSnapshot: holder.getConfigurationSnapshot()
          }
        )
      ).toThrowError(
        'configuration snapshot requires a payload replication diagnostics logger callback'
      );
    });
  }
);
