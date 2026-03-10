import {
  AuthoritativeClientReplicationDiagnosticsLogCadence,
  type CreateAuthoritativeClientReplicationDiagnosticsLogCadenceOptions
} from './replicationDiagnosticsLogCadence';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerBundle,
  type CreateAuthoritativeClientReplicationDiagnosticsLoggerBundleOptions
} from './replicationDiagnosticsLoggerBundle';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerRunner,
  type AuthoritativeClientReplicationDiagnosticsLoggerRunner
} from './replicationDiagnosticsLoggerRunner';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerOptions
  extends CreateAuthoritativeClientReplicationDiagnosticsLogCadenceOptions,
    CreateAuthoritativeClientReplicationDiagnosticsLoggerBundleOptions {}

export type NullableAuthoritativeClientReplicationDiagnosticsLoggerRunner =
  AuthoritativeClientReplicationDiagnosticsLoggerRunner | null;

const hasConfiguredLogger = ({
  textLogger,
  lineLogger,
  payloadLogger
}: CreateAuthoritativeClientReplicationDiagnosticsLoggerBundleOptions): boolean =>
  textLogger !== undefined || lineLogger !== undefined || payloadLogger !== undefined;

export const createAuthoritativeClientReplicationDiagnosticsLoggerRunnerOrNull = ({
  registry,
  intervalTicks,
  nextDueTick,
  textLogger,
  lineLogger,
  payloadLogger
}: CreateAuthoritativeClientReplicationDiagnosticsLoggerOptions): NullableAuthoritativeClientReplicationDiagnosticsLoggerRunner => {
  if (!hasConfiguredLogger({ textLogger, lineLogger, payloadLogger })) {
    return null;
  }

  return createAuthoritativeClientReplicationDiagnosticsLoggerRunner({
    cadence: new AuthoritativeClientReplicationDiagnosticsLogCadence({
      registry,
      intervalTicks,
      nextDueTick
    }),
    loggerBundle: createAuthoritativeClientReplicationDiagnosticsLoggerBundle({
      textLogger,
      lineLogger,
      payloadLogger
    })
  });
};
