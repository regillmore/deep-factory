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

export interface RefreshAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderLoggersOptions {
  textLogger?:
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions['textLogger'];
  lineLogger?:
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions['lineLogger'];
  payloadLogger?:
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions['payloadLogger'];
  restoreLifecycleTextLogger?:
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions['restoreLifecycleTextLogger'];
  restoreLifecycleLineLogger?:
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions['restoreLifecycleLineLogger'];
  restoreLifecyclePayloadLogger?:
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions['restoreLifecyclePayloadLogger'];
}

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot {
  hasRestoreCallback: boolean;
}

export interface ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderFromPresenceSnapshotOptions
  extends RefreshAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderLoggersOptions {
  presenceSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot;
}

type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderConfiguration =
  ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderOptions;

const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot = ({
  restoreCallback
}: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot => ({
  hasRestoreCallback: restoreCallback !== null
});

const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderConfiguration = ({
  holder,
  registry,
  textLogger,
  lineLogger,
  payloadLogger,
  restoreLifecycleTextLogger,
  restoreLifecycleLineLogger,
  restoreLifecyclePayloadLogger
}: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderConfiguration): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderConfiguration => ({
  holder,
  registry,
  textLogger,
  lineLogger,
  payloadLogger,
  restoreLifecycleTextLogger,
  restoreLifecycleLineLogger,
  restoreLifecyclePayloadLogger
});

const hasConfiguredAuthoritativeClientReplicationDiagnosticsRestoreLifecycleLogger = ({
  restoreLifecycleTextLogger,
  restoreLifecycleLineLogger,
  restoreLifecyclePayloadLogger
}: RefreshAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderLoggersOptions): boolean =>
  restoreLifecycleTextLogger !== undefined ||
  restoreLifecycleLineLogger !== undefined ||
  restoreLifecyclePayloadLogger !== undefined;

export class AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder {
  private currentConfiguration!: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderConfiguration;
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

  getPresenceSnapshot(): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot {
    return createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
      this.currentReconfiguration
    );
  }

  reconfigureFromPresenceSnapshot({
    presenceSnapshot,
    textLogger,
    lineLogger,
    payloadLogger,
    restoreLifecycleTextLogger,
    restoreLifecycleLineLogger,
    restoreLifecyclePayloadLogger
  }: ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderFromPresenceSnapshotOptions): void {
    if (presenceSnapshot.hasRestoreCallback) {
      if (
        !hasConfiguredAuthoritativeClientReplicationDiagnosticsRestoreLifecycleLogger(
          {
            restoreLifecycleTextLogger,
            restoreLifecycleLineLogger,
            restoreLifecyclePayloadLogger
          }
        )
      ) {
        throw new Error(
          'restore callback presence snapshot reconfigure requires at least one restore-lifecycle replication diagnostics logger callback'
        );
      }

      if (this.getPresenceSnapshot().hasRestoreCallback) {
        this.refreshLoggers({
          textLogger,
          lineLogger,
          payloadLogger,
          restoreLifecycleTextLogger,
          restoreLifecycleLineLogger,
          restoreLifecyclePayloadLogger
        });
        return;
      }

      this.reconfigure({
        ...this.currentConfiguration,
        textLogger,
        lineLogger,
        payloadLogger,
        restoreLifecycleTextLogger,
        restoreLifecycleLineLogger,
        restoreLifecyclePayloadLogger
      });
      return;
    }

    this.reconfigure({
      ...this.currentConfiguration,
      textLogger,
      lineLogger,
      payloadLogger,
      restoreLifecycleTextLogger: undefined,
      restoreLifecycleLineLogger: undefined,
      restoreLifecyclePayloadLogger: undefined
    });
  }

  refreshLoggers({
    textLogger,
    lineLogger,
    payloadLogger,
    restoreLifecycleTextLogger,
    restoreLifecycleLineLogger,
    restoreLifecyclePayloadLogger
  }: RefreshAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderLoggersOptions): void {
    if (
      !hasConfiguredAuthoritativeClientReplicationDiagnosticsRestoreLifecycleLogger(
        {
          restoreLifecycleTextLogger,
          restoreLifecycleLineLogger,
          restoreLifecyclePayloadLogger
        }
      )
    ) {
      throw new Error(
        'restore callback logger refresh requires at least one restore-lifecycle replication diagnostics logger callback'
      );
    }

    if (!this.getPresenceSnapshot().hasRestoreCallback) {
      throw new Error(
        'cannot refresh replication diagnostics logger configuration snapshot restore callback loggers while restore callback wiring is disabled'
      );
    }

    this.reconfigure({
      ...this.currentConfiguration,
      textLogger,
      lineLogger,
      payloadLogger,
      restoreLifecycleTextLogger,
      restoreLifecycleLineLogger,
      restoreLifecyclePayloadLogger
    });
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
    const nextConfiguration =
      createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderConfiguration(
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
    const nextReconfiguration =
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

    this.currentConfiguration = nextConfiguration;
    this.currentReconfiguration = nextReconfiguration;
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
