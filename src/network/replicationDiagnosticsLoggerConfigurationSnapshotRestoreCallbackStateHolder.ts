import {
  reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration,
  type ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderOptions
  extends ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions {}

export interface ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderOptions
  extends ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions {}

export class AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder {
  private currentReconfiguration: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration =
    {
      restoreCallback: null,
      restoreCallbackInvoker: () => null
    };

  constructor({
    holder,
    registry,
    textLogger,
    lineLogger,
    payloadLogger,
    restoreLifecycleTextLogger,
    restoreLifecycleLineLogger,
    restoreLifecyclePayloadLogger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderOptions) {
    this.reconfigure({
      holder,
      registry,
      textLogger,
      lineLogger,
      payloadLogger,
      restoreLifecycleTextLogger,
      restoreLifecycleLineLogger,
      restoreLifecyclePayloadLogger
    });
  }

  restoreConfigurationSnapshot(
    unknownConfigurationSnapshot: unknown
  ): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission | null {
    return this.currentReconfiguration.restoreCallbackInvoker(
      unknownConfigurationSnapshot
    );
  }

  reconfigure({
    holder,
    registry,
    textLogger,
    lineLogger,
    payloadLogger,
    restoreLifecycleTextLogger,
    restoreLifecycleLineLogger,
    restoreLifecyclePayloadLogger
  }: ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderOptions): void {
    this.currentReconfiguration =
      reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback(
        {
          holder,
          registry,
          textLogger,
          lineLogger,
          payloadLogger,
          restoreLifecycleTextLogger,
          restoreLifecycleLineLogger,
          restoreLifecyclePayloadLogger
        }
      );
  }
}

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder =
  ({
    holder,
    registry,
    textLogger,
    lineLogger,
    payloadLogger,
    restoreLifecycleTextLogger,
    restoreLifecycleLineLogger,
    restoreLifecyclePayloadLogger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder =>
    new AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
      {
        holder,
        registry,
        textLogger,
        lineLogger,
        payloadLogger,
        restoreLifecycleTextLogger,
        restoreLifecycleLineLogger,
        restoreLifecyclePayloadLogger
      }
    );
