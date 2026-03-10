import type { AuthoritativeClientReplicationDiagnosticsLogSinkCallback } from './replicationDiagnosticsLogSink';

export interface CreateAuthoritativeClientReplicationDiagnosticsLineLoggerOptions {
  logger: AuthoritativeClientReplicationDiagnosticsLineLogger;
}

export type AuthoritativeClientReplicationDiagnosticsLineLogger = (logLines: string[]) => void;

export const createAuthoritativeClientReplicationDiagnosticsLineLogger = ({
  logger
}: CreateAuthoritativeClientReplicationDiagnosticsLineLoggerOptions): AuthoritativeClientReplicationDiagnosticsLogSinkCallback => {
  return (emission) => {
    logger(emission.logLines);
  };
};
