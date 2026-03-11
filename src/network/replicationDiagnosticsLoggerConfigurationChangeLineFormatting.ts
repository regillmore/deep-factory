import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags
} from './replicationDiagnosticsLoggerConfigurationChangeSummary';

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

const formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLabels = (
  labels: string[]
): string => (labels.length === 0 ? 'none' : labels.join(', '));

export const formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeLabels = (
  schedule: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeFlags = DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_SCHEDULE_CHANGE_FLAGS
): string =>
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLabels([
    ...(schedule.disabledChanged ? ['disabled'] : []),
    ...(schedule.intervalTicksChanged ? ['intervalTicks'] : []),
    ...(schedule.nextDueTickChanged ? ['nextDueTick'] : [])
  ]);

export const formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackChangeLabels = (
  callbacks: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackPresenceChangeFlags = DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_CALLBACK_PRESENCE_CHANGE_FLAGS
): string =>
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLabels([
    ...(callbacks.hasTextLoggerChanged ? ['hasTextLogger'] : []),
    ...(callbacks.hasLineLoggerChanged ? ['hasLineLogger'] : []),
    ...(callbacks.hasPayloadLoggerChanged ? ['hasPayloadLogger'] : [])
  ]);

export const formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeLines = (
  summary: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationChangeSummary = DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_CHANGE_SUMMARY
): string[] => [
  `ConfigurationChange: ${summary.changed ? 'changed' : 'unchanged'}`,
  `ConfigurationScheduleDiff: ${formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleChangeLabels(summary.schedule)}`,
  `ConfigurationCallbackDiff: ${formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationCallbackChangeLabels(summary.callbacks)}`
];
