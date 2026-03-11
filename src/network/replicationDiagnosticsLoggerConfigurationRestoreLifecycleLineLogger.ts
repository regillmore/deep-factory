import {
  cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLoggerOptions {
  logger: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger =
  (
    lifecycleLines: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines
  ) => void;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger =
  ({
    logger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLoggerOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback => {
    return (emission) => {
      logger(
        cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines(
          emission.lifecycleLines
        )
      );
    };
  };
