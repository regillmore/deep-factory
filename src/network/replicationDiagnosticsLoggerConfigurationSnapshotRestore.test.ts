import { describe, expect, it, vi } from 'vitest';

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
  'restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot',
  () => {
    it('decodes one unknown enabled payload and reapplies it onto the target holder', () => {
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
          intervalTicks: 0,
          nextDueTick: -1
        });
      const unknownConfigurationSnapshot = cloneAsUnknown(
        sourceHolder.getConfigurationSnapshot()
      );

      const restoreResult =
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot,
            lineLogger: targetLineLogger
          }
        );

      expect(restoreResult).toEqual({
        configurationSnapshot: sourceHolder.getConfigurationSnapshot()
      });
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );

      targetHolder.poll(9);
      expect(targetLineLogger).not.toHaveBeenCalled();

      targetHolder.poll(10);
      expect(targetLineLogger).toHaveBeenCalledTimes(1);
      expect(sourceLineLogger).not.toHaveBeenCalled();
    });

    it('restores disabled unknown payloads without reattaching supplied callbacks', () => {
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
      const unknownConfigurationSnapshot = cloneAsUnknown(
        disabledSourceHolder.getConfigurationSnapshot()
      );

      targetHolder.poll(3);
      expect(targetTextLogger).toHaveBeenCalledTimes(1);

      const restoreResult =
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot,
            textLogger: targetTextLogger
          }
        );

      expect(restoreResult).toEqual({
        configurationSnapshot: disabledSourceHolder.getConfigurationSnapshot()
      });
      expect(targetHolder.getConfigurationSnapshot()).toEqual({
        schedule: {
          disabled: true,
          intervalTicks: null,
          nextDueTick: null
        },
        callbacks: {
          hasTextLogger: false,
          hasLineLogger: false,
          hasPayloadLogger: false
        }
      });

      targetHolder.poll(100);
      expect(targetTextLogger).toHaveBeenCalledTimes(1);
    });

    it('filters supplied callbacks through the restored snapshot callback-presence flags', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourcePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const targetLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 7,
          nextDueTick: 2,
          payloadLogger: sourcePayloadLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });

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

      targetHolder.poll(2);
      expect(targetLineLogger).not.toHaveBeenCalled();
      expect(targetPayloadLogger).toHaveBeenCalledTimes(1);
      expect(sourcePayloadLogger).not.toHaveBeenCalled();
    });

    it('rejects invalid unknown payloads before mutating the target holder', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger: targetPayloadLogger
        });
      const initialSnapshot = targetHolder.getConfigurationSnapshot();

      expect(() =>
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
          {
            holder: targetHolder,
            registry,
            unknownConfigurationSnapshot: {
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
            }
          }
        )
      ).toThrowError(
        'enabled configuration snapshot requires at least one replication diagnostics logger callback'
      );

      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
    });

    it('rejects missing required callbacks after decode and preserves the target holder state', () => {
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
        restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
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
