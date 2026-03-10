import {
  createAuthoritativeClientReplicationDiagnosticsFanOutSink
} from './replicationDiagnosticsFanOutSink';
import {
  createAuthoritativeClientReplicationDiagnosticsLineLogger,
  type AuthoritativeClientReplicationDiagnosticsLineLogger
} from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsLogSinkCallback } from './replicationDiagnosticsLogSink';
import {
  createAuthoritativeClientReplicationDiagnosticsPayloadLogger,
  type AuthoritativeClientReplicationDiagnosticsPayloadLogger
} from './replicationDiagnosticsPayloadLogger';
import {
  createAuthoritativeClientReplicationDiagnosticsTextLogger,
  type AuthoritativeClientReplicationDiagnosticsTextLogger
} from './replicationDiagnosticsTextLogger';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerBundleOptions {
  textLogger?: AuthoritativeClientReplicationDiagnosticsTextLogger;
  lineLogger?: AuthoritativeClientReplicationDiagnosticsLineLogger;
  payloadLogger?: AuthoritativeClientReplicationDiagnosticsPayloadLogger;
}

export const createAuthoritativeClientReplicationDiagnosticsLoggerBundle = ({
  textLogger,
  lineLogger,
  payloadLogger
}: CreateAuthoritativeClientReplicationDiagnosticsLoggerBundleOptions): AuthoritativeClientReplicationDiagnosticsLogSinkCallback => {
  const sinks: AuthoritativeClientReplicationDiagnosticsLogSinkCallback[] = [];

  if (textLogger !== undefined) {
    sinks.push(
      createAuthoritativeClientReplicationDiagnosticsTextLogger({
        logger: textLogger
      })
    );
  }

  if (lineLogger !== undefined) {
    sinks.push(
      createAuthoritativeClientReplicationDiagnosticsLineLogger({
        logger: lineLogger
      })
    );
  }

  if (payloadLogger !== undefined) {
    sinks.push(
      createAuthoritativeClientReplicationDiagnosticsPayloadLogger({
        logger: payloadLogger
      })
    );
  }

  return createAuthoritativeClientReplicationDiagnosticsFanOutSink({
    sinks
  });
};
