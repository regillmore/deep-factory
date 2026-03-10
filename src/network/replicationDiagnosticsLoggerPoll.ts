import type { NullableAuthoritativeClientReplicationDiagnosticsLoggerRunner } from './replicationDiagnosticsLoggerFactory';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerPollCallbackOptions {
  loggerRunner: NullableAuthoritativeClientReplicationDiagnosticsLoggerRunner;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerPollCallback = (
  tick: number
) => void;

export const createAuthoritativeClientReplicationDiagnosticsLoggerPollCallback = ({
  loggerRunner
}: CreateAuthoritativeClientReplicationDiagnosticsLoggerPollCallbackOptions): AuthoritativeClientReplicationDiagnosticsLoggerPollCallback => {
  if (loggerRunner === null) {
    return () => {};
  }

  return (tick) => {
    loggerRunner.poll({ tick });
  };
};
