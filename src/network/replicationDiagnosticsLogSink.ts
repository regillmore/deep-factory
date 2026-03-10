import {
  AuthoritativeClientReplicationDiagnosticsLogCadence,
  type AuthoritativeClientReplicationDiagnosticsLogCadenceResult
} from './replicationDiagnosticsLogCadence';
import type { AuthoritativeClientReplicationDiagnosticsLogEmission } from './replicationDiagnosticsLogEmission';

export interface CreateAuthoritativeClientReplicationDiagnosticsLogSinkOptions {
  cadence: AuthoritativeClientReplicationDiagnosticsLogCadence;
  sink: AuthoritativeClientReplicationDiagnosticsLogSinkCallback;
}

export interface PollAuthoritativeClientReplicationDiagnosticsLogSinkOptions {
  tick: number;
}

export type AuthoritativeClientReplicationDiagnosticsLogSinkCallback = (
  emission: AuthoritativeClientReplicationDiagnosticsLogEmission
) => void;

const cloneEmissionForSink = (
  emission: AuthoritativeClientReplicationDiagnosticsLogEmission
): AuthoritativeClientReplicationDiagnosticsLogEmission => ({
  nextDueTick: emission.nextDueTick,
  logLines: [...emission.logLines],
  logText: emission.logText
});

export class AuthoritativeClientReplicationDiagnosticsLogSink {
  private readonly cadence: AuthoritativeClientReplicationDiagnosticsLogCadence;
  private readonly sink: AuthoritativeClientReplicationDiagnosticsLogSinkCallback;

  constructor({
    cadence,
    sink
  }: CreateAuthoritativeClientReplicationDiagnosticsLogSinkOptions) {
    this.cadence = cadence;
    this.sink = sink;
  }

  getNextDueTick(): number {
    return this.cadence.getNextDueTick();
  }

  poll({
    tick
  }: PollAuthoritativeClientReplicationDiagnosticsLogSinkOptions): AuthoritativeClientReplicationDiagnosticsLogCadenceResult {
    const result = this.cadence.poll({ tick });

    if (result.emitted) {
      this.sink(cloneEmissionForSink(result));
    }

    return result;
  }
}
