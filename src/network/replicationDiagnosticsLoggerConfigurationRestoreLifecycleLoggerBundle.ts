import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundleOptions {
  textLogger?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger;
  lineLogger?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger;
  payloadLogger?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle =
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle =
  ({
    textLogger,
    lineLogger,
    payloadLogger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundleOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle => {
    const sinks: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback[] =
      [];

    if (textLogger !== undefined) {
      sinks.push(
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger(
          {
            logger: textLogger
          }
        )
      );
    }

    if (lineLogger !== undefined) {
      sinks.push(
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger(
          {
            logger: lineLogger
          }
        )
      );
    }

    if (payloadLogger !== undefined) {
      sinks.push(
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger(
          {
            logger: payloadLogger
          }
        )
      );
    }

    return createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink(
      {
        sinks
      }
    );
  };
