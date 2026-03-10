import {
  reconfigureAuthoritativeClientReplicationDiagnosticsLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerReconfiguration,
  type ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions
} from './replicationDiagnosticsLoggerReconfiguration';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerStateHolderOptions
  extends ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions {}

export interface ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerStateHolderOptions
  extends ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions {}

export interface DisabledAuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot {
  disabled: true;
  nextDueTick: null;
}

export interface EnabledAuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot {
  disabled: false;
  nextDueTick: number;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot =
  | DisabledAuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot
  | EnabledAuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot;

const createAuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot = (
  reconfiguration: AuthoritativeClientReplicationDiagnosticsLoggerReconfiguration
): AuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot =>
  reconfiguration.loggerRunner === null
    ? {
        disabled: true,
        nextDueTick: null
      }
    : {
        disabled: false,
        nextDueTick: reconfiguration.loggerRunner.getNextDueTick()
      };

export class AuthoritativeClientReplicationDiagnosticsLoggerStateHolder {
  private currentReconfiguration: AuthoritativeClientReplicationDiagnosticsLoggerReconfiguration =
    {
      loggerRunner: null,
      loggerPollCallback: null
    };

  constructor({
    registry,
    intervalTicks,
    nextDueTick,
    textLogger,
    lineLogger,
    payloadLogger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerStateHolderOptions) {
    this.reconfigure({
      registry,
      intervalTicks,
      nextDueTick,
      textLogger,
      lineLogger,
      payloadLogger
    });
  }

  poll(tick: number): void {
    this.currentReconfiguration.loggerPollCallback?.(tick);
  }

  getScheduleSnapshot(): AuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot {
    return createAuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot(
      this.currentReconfiguration
    );
  }

  reconfigure({
    registry,
    intervalTicks,
    nextDueTick,
    textLogger,
    lineLogger,
    payloadLogger
  }: ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerStateHolderOptions): void {
    this.currentReconfiguration =
      reconfigureAuthoritativeClientReplicationDiagnosticsLogger({
        registry,
        intervalTicks,
        nextDueTick,
        textLogger,
        lineLogger,
        payloadLogger
      });
  }
}

export const createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder = ({
  registry,
  intervalTicks,
  nextDueTick,
  textLogger,
  lineLogger,
  payloadLogger
}: CreateAuthoritativeClientReplicationDiagnosticsLoggerStateHolderOptions): AuthoritativeClientReplicationDiagnosticsLoggerStateHolder =>
  new AuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
    registry,
    intervalTicks,
    nextDueTick,
    textLogger,
    lineLogger,
    payloadLogger
  });
