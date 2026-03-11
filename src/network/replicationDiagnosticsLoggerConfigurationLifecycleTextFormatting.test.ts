import { describe, expect, it } from 'vitest';

import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines
} from './replicationDiagnosticsLoggerConfigurationChangeLineFormatting';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText
} from './replicationDiagnosticsLoggerConfigurationLifecycleTextFormatting';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines
} from './replicationDiagnosticsLoggerConfigurationRestoreLineFormatting';

describe(
  'formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText',
  () => {
    it('joins the default configuration-change and restore sections into deterministic multi-line text', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText()
      ).toBe(
        [
          ...formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines(),
          ...formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines()
        ].join('\n')
      );
    });

    it('preserves the provided change and restore line ordering without reformatting either section', () => {
      const configurationChangeLines = [
        'ConfigurationChange: changed',
        'ConfigurationCallbackDiff: hasPayloadLogger',
        'ConfigurationScheduleDiff: nextDueTick'
      ];
      const configurationRestoreLines = [
        'ConfigurationRestore: disabled=false | changed=true',
        'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=true | hasPayloadLogger=true | diff=hasLineLogger, hasPayloadLogger',
        'ConfigurationRestoreSchedule: intervalTicks=12 | nextDueTick=18 | diff=intervalTicks, nextDueTick'
      ];

      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText(
          {
            configurationChangeLines,
            configurationRestoreLines
          }
        )
      ).toBe([...configurationChangeLines, ...configurationRestoreLines].join('\n'));
    });

    it('avoids extra leading or trailing separators when one lifecycle section is empty', () => {
      const configurationRestoreLines = [
        'ConfigurationRestore: disabled=true | changed=false',
        'ConfigurationRestoreSchedule: intervalTicks=n/a | nextDueTick=n/a | diff=none',
        'ConfigurationRestoreCallbacks: hasTextLogger=false | hasLineLogger=false | hasPayloadLogger=false | diff=none'
      ];

      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText(
          {
            configurationChangeLines: [],
            configurationRestoreLines
          }
        )
      ).toBe(configurationRestoreLines.join('\n'));
    });
  }
);
