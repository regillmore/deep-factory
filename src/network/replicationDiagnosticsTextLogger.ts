import type { AuthoritativeClientReplicationDiagnosticsLogSinkCallback } from './replicationDiagnosticsLogSink';

export interface CreateAuthoritativeClientReplicationDiagnosticsTextLoggerOptions {
  logger: AuthoritativeClientReplicationDiagnosticsTextLogger;
}

export type AuthoritativeClientReplicationDiagnosticsTextLogger = (logText: string) => void;

export const createAuthoritativeClientReplicationDiagnosticsTextLogger = ({
  logger
}: CreateAuthoritativeClientReplicationDiagnosticsTextLoggerOptions): AuthoritativeClientReplicationDiagnosticsLogSinkCallback => {
  return (emission) => {
    logger(emission.logText);
  };
};
