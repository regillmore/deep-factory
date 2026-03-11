import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackChangeLabels,
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines,
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeLabels
} from './replicationDiagnosticsLoggerConfigurationChangeLineFormatting';
import {
  summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange
} from './replicationDiagnosticsLoggerConfigurationChangeSummary';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';

describe(
  'formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeLabels',
  () => {
    it('renders none when no schedule fields changed', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeLabels()
      ).toBe('none');
    });

    it('renders changed schedule field labels in deterministic order', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeLabels(
          {
            changed: true,
            disabledChanged: true,
            intervalTicksChanged: false,
            nextDueTickChanged: true
          }
        )
      ).toBe('disabled, nextDueTick');
    });
  }
);

describe(
  'formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackChangeLabels',
  () => {
    it('renders changed callback labels in deterministic order', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackChangeLabels(
          {
            changed: true,
            hasTextLoggerChanged: true,
            hasLineLoggerChanged: false,
            hasPayloadLoggerChanged: true
          }
        )
      ).toBe('hasTextLogger, hasPayloadLogger');
    });
  }
);

describe(
  'formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines',
  () => {
    it('renders unchanged summary lines with explicit none placeholders by default', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines()
      ).toEqual([
        'ConfigurationChange: unchanged',
        'ConfigurationScheduleDiff: none',
        'ConfigurationCallbackDiff: none'
      ]);
    });

    it('renders schedule and callback diff labels from one detached configuration summary', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const lineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const payloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const previousHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 0,
          nextDueTick: -1
        });
      const nextHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          lineLogger,
          payloadLogger
        });

      const summary =
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange(
          {
            previousConfigurationSnapshot:
              previousHolder.getConfigurationSnapshot(),
            nextConfigurationSnapshot: nextHolder.getConfigurationSnapshot()
          }
        );

      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines(
          summary
        )
      ).toEqual([
        'ConfigurationChange: changed',
        'ConfigurationScheduleDiff: disabled, intervalTicks, nextDueTick',
        'ConfigurationCallbackDiff: hasLineLogger, hasPayloadLogger'
      ]);
    });
  }
);
