import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLoggerOptions {
  logger: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger =
  (lifecycleText: string) => void;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger =
  ({
    logger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLoggerOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback => {
    return (emission) => {
      logger(emission.lifecycleText);
    };
  };
