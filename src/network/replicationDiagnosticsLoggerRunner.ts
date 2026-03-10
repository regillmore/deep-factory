import {
  AuthoritativeClientReplicationDiagnosticsLogCadence,
  type AuthoritativeClientReplicationDiagnosticsLogCadenceResult
} from './replicationDiagnosticsLogCadence';
import {
  AuthoritativeClientReplicationDiagnosticsLogSink,
  type PollAuthoritativeClientReplicationDiagnosticsLogSinkOptions
} from './replicationDiagnosticsLogSink';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerBundle
} from './replicationDiagnosticsLoggerBundle';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerRunnerOptions {
  cadence: AuthoritativeClientReplicationDiagnosticsLogCadence;
  loggerBundle: AuthoritativeClientReplicationDiagnosticsLoggerBundle;
}

export type PollAuthoritativeClientReplicationDiagnosticsLoggerRunnerOptions =
  PollAuthoritativeClientReplicationDiagnosticsLogSinkOptions;

export class AuthoritativeClientReplicationDiagnosticsLoggerRunner {
  private readonly logSink: AuthoritativeClientReplicationDiagnosticsLogSink;

  constructor({
    cadence,
    loggerBundle
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerRunnerOptions) {
    this.logSink = new AuthoritativeClientReplicationDiagnosticsLogSink({
      cadence,
      sink: loggerBundle
    });
  }

  getNextDueTick(): number {
    return this.logSink.getNextDueTick();
  }

  poll({
    tick
  }: PollAuthoritativeClientReplicationDiagnosticsLoggerRunnerOptions): AuthoritativeClientReplicationDiagnosticsLogCadenceResult {
    return this.logSink.poll({ tick });
  }
}

export const createAuthoritativeClientReplicationDiagnosticsLoggerRunner = ({
  cadence,
  loggerBundle
}: CreateAuthoritativeClientReplicationDiagnosticsLoggerRunnerOptions): AuthoritativeClientReplicationDiagnosticsLoggerRunner =>
  new AuthoritativeClientReplicationDiagnosticsLoggerRunner({
    cadence,
    loggerBundle
  });
