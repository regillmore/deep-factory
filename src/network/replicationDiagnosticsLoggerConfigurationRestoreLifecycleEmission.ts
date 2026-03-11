import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines
} from './replicationDiagnosticsLoggerConfigurationChangeLineFormatting';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags
} from './replicationDiagnosticsLoggerConfigurationChangeSummary';
import {
  summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange
} from './replicationDiagnosticsLoggerConfigurationChangeSummary';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText
} from './replicationDiagnosticsLoggerConfigurationLifecycleTextFormatting';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines
} from './replicationDiagnosticsLoggerConfigurationRestoreLineFormatting';
import {
  restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot,
  type RestoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotOptions
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestore';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot
} from './replicationDiagnosticsLoggerStateHolder';

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload {
  previousConfigurationSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot;
  restoredConfigurationSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot;
  changeSummary: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary;
}

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines {
  configurationChangeLines: string[];
  configurationRestoreLines: string[];
}

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission {
  payload: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload;
  lifecycleLines: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines;
  lifecycleText: string;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback = (
  emission: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission
) => void;

export interface RestoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmissionOptions
  extends RestoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotOptions {}

const cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot = (
  schedule: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot
): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot =>
  schedule.disabled
    ? {
        disabled: true,
        intervalTicks: null,
        nextDueTick: null
      }
    : {
        disabled: false,
        intervalTicks: schedule.intervalTicks,
        nextDueTick: schedule.nextDueTick
      };

const cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot = (
  configurationSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot
): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot => ({
  schedule:
    cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot(
      configurationSnapshot.schedule
    ),
  callbacks: {
    hasTextLogger: configurationSnapshot.callbacks.hasTextLogger,
    hasLineLogger: configurationSnapshot.callbacks.hasLineLogger,
    hasPayloadLogger: configurationSnapshot.callbacks.hasPayloadLogger
  }
});

const cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags =
  (
    schedule: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags
  ): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags => ({
    changed: schedule.changed,
    disabledChanged: schedule.disabledChanged,
    intervalTicksChanged: schedule.intervalTicksChanged,
    nextDueTickChanged: schedule.nextDueTickChanged
  });

const cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags =
  (
    callbacks: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags
  ): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags => ({
    changed: callbacks.changed,
    hasTextLoggerChanged: callbacks.hasTextLoggerChanged,
    hasLineLoggerChanged: callbacks.hasLineLoggerChanged,
    hasPayloadLoggerChanged: callbacks.hasPayloadLoggerChanged
  });

const cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary = (
  changeSummary: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary
): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary => ({
  changed: changeSummary.changed,
  schedule:
    cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags(
      changeSummary.schedule
    ),
  callbacks:
    cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags(
      changeSummary.callbacks
    )
});

export const cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload =
  (
    payload: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload
  ): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload => ({
    previousConfigurationSnapshot:
      cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
        payload.previousConfigurationSnapshot
      ),
    restoredConfigurationSnapshot:
      cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
        payload.restoredConfigurationSnapshot
      ),
    changeSummary:
      cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary(
        payload.changeSummary
      )
  });

export const cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines =
  (
    lifecycleLines: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines
  ): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines => ({
    configurationChangeLines: [...lifecycleLines.configurationChangeLines],
    configurationRestoreLines: [...lifecycleLines.configurationRestoreLines]
  });

export const restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmission =
  ({
    holder,
    registry,
    unknownConfigurationSnapshot,
    textLogger,
    lineLogger,
    payloadLogger
  }: RestoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotWithLifecycleEmissionOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission => {
    const previousConfigurationSnapshot = holder.getConfigurationSnapshot();
    const restoreResult =
      restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot({
        holder,
        registry,
        unknownConfigurationSnapshot,
        textLogger,
        lineLogger,
        payloadLogger
      });
    const changeSummary =
      summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange({
        previousConfigurationSnapshot,
        nextConfigurationSnapshot: restoreResult.configurationSnapshot
      });
    const payload =
      cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload(
        {
          previousConfigurationSnapshot,
          restoredConfigurationSnapshot: restoreResult.configurationSnapshot,
          changeSummary
        }
      );
    const lifecycleLines =
      cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines(
        {
          configurationChangeLines:
            formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines(
              changeSummary
            ),
          configurationRestoreLines:
            formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines(
              {
                configurationSnapshot: restoreResult.configurationSnapshot,
                changeSummary
              }
            )
        }
      );

    return {
      payload,
      lifecycleLines,
      lifecycleText:
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationLifecycleText(
          lifecycleLines
        )
    };
  };
