import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText,
  type FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextOptions
} from './replicationDiagnosticsLoggerConfigurationLifecycleTextFormatting';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLoggerOptions {
  logger: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger = (
  lifecycleText: string
) => void;

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextSinkCallback = (
  lifecycleLines?: FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextOptions
) => void;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLogger =
  ({
    logger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextLoggerOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleTextSinkCallback => {
    return (lifecycleLines = {}) => {
      logger(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText(
          lifecycleLines
        )
      );
    };
  };
