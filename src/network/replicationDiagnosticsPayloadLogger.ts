import type { AuthoritativeClientReplicationDiagnosticsLogSinkCallback } from './replicationDiagnosticsLogSink';
import type { AuthoritativeClientReplicationDiagnosticsLogPayload } from './replicationDiagnosticsLogPayload';

export interface CreateAuthoritativeClientReplicationDiagnosticsPayloadLoggerOptions {
  logger: AuthoritativeClientReplicationDiagnosticsPayloadLogger;
}

export type AuthoritativeClientReplicationDiagnosticsPayloadLogger = (
  payload: AuthoritativeClientReplicationDiagnosticsLogPayload
) => void;

export const createAuthoritativeClientReplicationDiagnosticsPayloadLogger = ({
  logger
}: CreateAuthoritativeClientReplicationDiagnosticsPayloadLoggerOptions): AuthoritativeClientReplicationDiagnosticsLogSinkCallback => {
  return (emission) => {
    logger(emission.payload);
  };
};
