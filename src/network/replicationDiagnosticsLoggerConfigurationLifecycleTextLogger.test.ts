import { describe, expect, it, vi } from 'vitest';

import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText
} from './replicationDiagnosticsLoggerConfigurationLifecycleTextFormatting';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextSinkCallback
} from './replicationDiagnosticsLoggerConfigurationLifecycleTextLogger';

describe(
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger',
  () => {
    it('formats provided lifecycle line arrays into deterministic joined text before forwarding them to the logger', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger(
          {
            logger
          }
        );
      const lifecycleLines = {
        configurationChangeLines: [
          'ConfigurationChange: changed',
          'ConfigurationScheduleDiff: intervalTicks'
        ],
        configurationRestoreLines: [
          'ConfigurationRestore: disabled=false | changed=true',
          'ConfigurationRestoreSchedule: intervalTicks=8 | nextDueTick=16 | diff=intervalTicks'
        ]
      };

      sink(lifecycleLines);

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText(
          lifecycleLines
        )
      );
    });

    it('reuses the lifecycle formatter defaults when no explicit line arrays were supplied', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger(
          {
            logger
          }
        );

      sink();

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText()
      );
    });

    it('leaves the provided lifecycle line arrays intact for sibling sinks after the text logger runs', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger(
          {
            logger
          }
        );
      const siblingSink =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextSinkCallback>();
      const lifecycleLines = {
        configurationChangeLines: [
          'ConfigurationChange: unchanged',
          'ConfigurationScheduleDiff: none'
        ],
        configurationRestoreLines: [
          'ConfigurationRestore: disabled=true | changed=false',
          'ConfigurationRestoreSchedule: intervalTicks=n/a | nextDueTick=n/a | diff=none'
        ]
      };

      sink(lifecycleLines);
      siblingSink(lifecycleLines);

      expect(siblingSink).toHaveBeenCalledWith(lifecycleLines);
      expect(lifecycleLines).toEqual({
        configurationChangeLines: [
          'ConfigurationChange: unchanged',
          'ConfigurationScheduleDiff: none'
        ],
        configurationRestoreLines: [
          'ConfigurationRestore: disabled=true | changed=false',
          'ConfigurationRestoreSchedule: intervalTicks=n/a | nextDueTick=n/a | diff=none'
        ]
      });
    });
  }
);
