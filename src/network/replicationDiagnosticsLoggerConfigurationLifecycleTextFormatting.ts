import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines
} from './replicationDiagnosticsLoggerConfigurationChangeLineFormatting';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines
} from './replicationDiagnosticsLoggerConfigurationRestoreLineFormatting';

export interface FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextOptions {
  configurationChangeLines?: string[];
  configurationRestoreLines?: string[];
}

export const formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText =
  ({
    configurationChangeLines =
      formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines(),
    configurationRestoreLines =
      formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines()
  }: FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextOptions = {}): string =>
    [...configurationChangeLines, ...configurationRestoreLines].join('\n');
