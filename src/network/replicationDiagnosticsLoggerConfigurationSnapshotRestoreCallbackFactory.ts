import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback,
  type CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackFactoryOptions
  extends Omit<
    CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions,
    'loggerBundle'
  > {
  restoreLifecycleTextLogger?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger;
  restoreLifecycleLineLogger?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger;
  restoreLifecyclePayloadLogger?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger;
}

export type NullableAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback =
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback | null;

const hasConfiguredRestoreLifecycleLogger = ({
  restoreLifecycleTextLogger,
  restoreLifecycleLineLogger,
  restoreLifecyclePayloadLogger
}: Pick<
  CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackFactoryOptions,
  | 'restoreLifecycleTextLogger'
  | 'restoreLifecycleLineLogger'
  | 'restoreLifecyclePayloadLogger'
>): boolean =>
  restoreLifecycleTextLogger !== undefined ||
  restoreLifecycleLineLogger !== undefined ||
  restoreLifecyclePayloadLogger !== undefined;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOrNull =
  ({
    holder,
    registry,
    textLogger,
    lineLogger,
    payloadLogger,
    restoreLifecycleTextLogger,
    restoreLifecycleLineLogger,
    restoreLifecyclePayloadLogger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackFactoryOptions): NullableAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback => {
    if (
      !hasConfiguredRestoreLifecycleLogger({
        restoreLifecycleTextLogger,
        restoreLifecycleLineLogger,
        restoreLifecyclePayloadLogger
      })
    ) {
      return null;
    }

    return createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
      {
        holder,
        registry,
        textLogger,
        lineLogger,
        payloadLogger,
        loggerBundle:
          createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle(
            {
              textLogger: restoreLifecycleTextLogger,
              lineLogger: restoreLifecycleLineLogger,
              payloadLogger: restoreLifecyclePayloadLogger
            }
          )
      }
    );
  };
