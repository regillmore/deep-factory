import {
  restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmission,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission,
  type RestoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmissionOptions
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle';

export interface RestoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotOptions
  extends RestoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmissionOptions {
  loggerBundle?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLoggerBundle;
}

export const restoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot =
  ({
    loggerBundle,
    ...restoreOptions
  }: RestoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission => {
    const emission =
      restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmission(
        restoreOptions
      );

    loggerBundle?.(emission);

    return emission;
  };
