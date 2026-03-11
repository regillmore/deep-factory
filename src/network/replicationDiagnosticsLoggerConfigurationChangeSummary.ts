import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot } from './replicationDiagnosticsLoggerStateHolder';

export interface SummarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeOptions {
  previousConfigurationSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot;
  nextConfigurationSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot;
}

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags {
  changed: boolean;
  disabledChanged: boolean;
  intervalTicksChanged: boolean;
  nextDueTickChanged: boolean;
}

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags {
  changed: boolean;
  hasTextLoggerChanged: boolean;
  hasLineLoggerChanged: boolean;
  hasPayloadLoggerChanged: boolean;
}

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary {
  changed: boolean;
  schedule: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags;
  callbacks: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags;
}

export const summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChange = ({
  previousConfigurationSnapshot,
  nextConfigurationSnapshot
}: SummarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary => {
  const schedule: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags =
    {
      disabledChanged:
        previousConfigurationSnapshot.schedule.disabled !==
        nextConfigurationSnapshot.schedule.disabled,
      intervalTicksChanged:
        previousConfigurationSnapshot.schedule.intervalTicks !==
        nextConfigurationSnapshot.schedule.intervalTicks,
      nextDueTickChanged:
        previousConfigurationSnapshot.schedule.nextDueTick !==
        nextConfigurationSnapshot.schedule.nextDueTick,
      changed: false
    };
  schedule.changed =
    schedule.disabledChanged ||
    schedule.intervalTicksChanged ||
    schedule.nextDueTickChanged;

  const callbacks: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags =
    {
      hasTextLoggerChanged:
        previousConfigurationSnapshot.callbacks.hasTextLogger !==
        nextConfigurationSnapshot.callbacks.hasTextLogger,
      hasLineLoggerChanged:
        previousConfigurationSnapshot.callbacks.hasLineLogger !==
        nextConfigurationSnapshot.callbacks.hasLineLogger,
      hasPayloadLoggerChanged:
        previousConfigurationSnapshot.callbacks.hasPayloadLogger !==
        nextConfigurationSnapshot.callbacks.hasPayloadLogger,
      changed: false
    };
  callbacks.changed =
    callbacks.hasTextLoggerChanged ||
    callbacks.hasLineLoggerChanged ||
    callbacks.hasPayloadLoggerChanged;

  return {
    changed: schedule.changed || callbacks.changed,
    schedule,
    callbacks
  };
};
