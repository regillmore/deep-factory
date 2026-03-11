import {
  cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLoggerOptions {
  logger: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger =
  (
    payload: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload
  ) => void;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger =
  ({
    logger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLoggerOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback => {
    return (emission) => {
      logger(
        cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload(
          emission.payload
        )
      );
    };
  };
