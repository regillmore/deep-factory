import {
  reconfigureAuthoritativeClientReplicationDiagnosticsLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerReconfiguration,
  type ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions
} from './replicationDiagnosticsLoggerReconfiguration';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerStateHolderOptions
  extends ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions {}

export interface ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerStateHolderOptions
  extends ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions {}

export interface RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCallbacksOptions {
  textLogger?:
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions['textLogger'];
  lineLogger?:
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions['lineLogger'];
  payloadLogger?:
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerOptions['payloadLogger'];
}

export interface RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCadenceOptions {
  intervalTicks: number;
}

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

type AuthoritativeClientReplicationDiagnosticsLoggerStateHolderConfiguration = Omit<
  ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerStateHolderOptions,
  'nextDueTick'
>;

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

const createAuthoritativeClientReplicationDiagnosticsLoggerStateHolderConfiguration = ({
  registry,
  intervalTicks,
  textLogger,
  lineLogger,
  payloadLogger
}: AuthoritativeClientReplicationDiagnosticsLoggerStateHolderConfiguration): AuthoritativeClientReplicationDiagnosticsLoggerStateHolderConfiguration => ({
  registry,
  intervalTicks,
  textLogger,
  lineLogger,
  payloadLogger
});

const hasConfiguredAuthoritativeClientReplicationDiagnosticsLoggerCallback = ({
  textLogger,
  lineLogger,
  payloadLogger
}: RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCallbacksOptions): boolean =>
  textLogger !== undefined || lineLogger !== undefined || payloadLogger !== undefined;

export class AuthoritativeClientReplicationDiagnosticsLoggerStateHolder {
  private currentConfiguration!: AuthoritativeClientReplicationDiagnosticsLoggerStateHolderConfiguration;
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

  refreshCadence({
    intervalTicks
  }: RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCadenceOptions): void {
    const scheduleSnapshot = this.getScheduleSnapshot();
    if (scheduleSnapshot.disabled) {
      throw new Error(
        'cannot refresh replication diagnostics logger cadence while logging is disabled'
      );
    }

    this.reconfigure({
      ...this.currentConfiguration,
      intervalTicks,
      nextDueTick: scheduleSnapshot.nextDueTick
    });
  }

  refreshCallbacks({
    textLogger,
    lineLogger,
    payloadLogger
  }: RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCallbacksOptions): void {
    if (
      !hasConfiguredAuthoritativeClientReplicationDiagnosticsLoggerCallback({
        textLogger,
        lineLogger,
        payloadLogger
      })
    ) {
      throw new Error(
        'callback refresh requires at least one replication diagnostics logger callback'
      );
    }

    const scheduleSnapshot = this.getScheduleSnapshot();
    if (scheduleSnapshot.disabled) {
      throw new Error(
        'cannot refresh replication diagnostics logger callbacks while logging is disabled'
      );
    }

    this.reconfigure({
      ...this.currentConfiguration,
      nextDueTick: scheduleSnapshot.nextDueTick,
      textLogger,
      lineLogger,
      payloadLogger
    });
  }

  reconfigure({
    registry,
    intervalTicks,
    nextDueTick,
    textLogger,
    lineLogger,
    payloadLogger
  }: ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerStateHolderOptions): void {
    const nextConfiguration =
      createAuthoritativeClientReplicationDiagnosticsLoggerStateHolderConfiguration({
        registry,
        intervalTicks,
        textLogger,
        lineLogger,
        payloadLogger
      });
    const nextReconfiguration =
      reconfigureAuthoritativeClientReplicationDiagnosticsLogger({
        registry,
        intervalTicks,
        nextDueTick,
        textLogger,
        lineLogger,
        payloadLogger
      });

    this.currentConfiguration = nextConfiguration;
    this.currentReconfiguration = nextReconfiguration;
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
