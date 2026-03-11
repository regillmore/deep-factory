import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackChangeLabels,
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeLabels
} from './replicationDiagnosticsLoggerConfigurationChangeLineFormatting';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags
} from './replicationDiagnosticsLoggerConfigurationChangeSummary';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot
} from './replicationDiagnosticsLoggerStateHolder';

export interface FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLinesOptions {
  configurationSnapshot?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot;
  changeSummary?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary;
}

const DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_SCHEDULE_CHANGE_FLAGS: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags =
  {
    changed: false,
    disabledChanged: false,
    intervalTicksChanged: false,
    nextDueTickChanged: false
  };

const DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_CALLBACK_PRESENCE_CHANGE_FLAGS: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags =
  {
    changed: false,
    hasTextLoggerChanged: false,
    hasLineLoggerChanged: false,
    hasPayloadLoggerChanged: false
  };

const DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_CHANGE_SUMMARY: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary =
  {
    changed: false,
    schedule:
      DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_SCHEDULE_CHANGE_FLAGS,
    callbacks:
      DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_CALLBACK_PRESENCE_CHANGE_FLAGS
  };

const DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_SNAPSHOT: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot =
  {
    schedule: {
      disabled: true,
      intervalTicks: null,
      nextDueTick: null
    },
    callbacks: {
      hasTextLogger: false,
      hasLineLogger: false,
      hasPayloadLogger: false
    }
  };

const formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreScheduleValue = (
  value: number | null
): string => (value === null ? 'n/a' : `${value}`);

export const formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLines =
  ({
    configurationSnapshot = DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_SNAPSHOT,
    changeSummary = DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_CHANGE_SUMMARY
  }: FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLinesOptions = {}): string[] => [
    `ConfigurationRestore: disabled=${configurationSnapshot.schedule.disabled} | changed=${changeSummary.changed}`,
    `ConfigurationRestoreSchedule: intervalTicks=${formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreScheduleValue(configurationSnapshot.schedule.intervalTicks)} | nextDueTick=${formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreScheduleValue(configurationSnapshot.schedule.nextDueTick)} | diff=${formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeLabels(changeSummary.schedule)}`,
    `ConfigurationRestoreCallbacks: hasTextLogger=${configurationSnapshot.callbacks.hasTextLogger} | hasLineLogger=${configurationSnapshot.callbacks.hasLineLogger} | hasPayloadLogger=${configurationSnapshot.callbacks.hasPayloadLogger} | diff=${formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackChangeLabels(changeSummary.callbacks)}`
  ];
