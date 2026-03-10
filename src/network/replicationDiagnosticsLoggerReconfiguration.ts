import {
  createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull,
  type CreateAuthoritativeClientReplicationDiagnosticsLoggerOptions,
  type NullableAuthoritativeClientReplicationDiagnosticsLoggerRunner
} from './replicationDiagnosticsLoggerFactory';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerPollCallback,
  type NullableAuthoritativeClientReplicationDiagnosticsLoggerPollCallback
} from './replicationDiagnosticsLoggerPoll';

export interface ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions
  extends CreateAuthoritativeClientReplicationDiagnosticsLoggerOptions {}

export interface AuthoritativeClientReplicationDiagnosticsLoggerReconfiguration {
  loggerRunner: NullableAuthoritativeClientReplicationDiagnosticsLoggerRunner;
  loggerPollCallback: NullableAuthoritativeClientReplicationDiagnosticsLoggerPollCallback;
}

export const reconfigureAuthoritativeClientReplicationDiagnosticsLogger = ({
  registry,
  intervalTicks,
  nextDueTick,
  textLogger,
  lineLogger,
  payloadLogger
}: ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions): AuthoritativeClientReplicationDiagnosticsLoggerReconfiguration => {
  const loggerRunner = createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull({
    registry,
    intervalTicks,
    nextDueTick,
    textLogger,
    lineLogger,
    payloadLogger
  });

  return {
    loggerRunner,
    loggerPollCallback:
      loggerRunner === null
        ? null
        : createAuthoritativeClientReplicationDiagnosticsLoggerPollCallback({
            loggerRunner
          })
  };
};
