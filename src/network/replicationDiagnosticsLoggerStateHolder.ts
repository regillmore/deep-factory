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

export interface RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleOptions {
  nextDueTick: number;
}

export interface RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleAndCallbacksOptions
  extends RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleOptions,
    RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCallbacksOptions {}

export interface RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCadenceAndCallbacksOptions
  extends RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCadenceOptions,
    RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCallbacksOptions {}

export interface RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleAndCadenceOptions
  extends RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleOptions,
    RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCadenceOptions {}

export interface RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleAndCadenceAndCallbacksOptions
  extends RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleOptions,
    RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCadenceOptions,
    RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCallbacksOptions {}

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

export interface AuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot {
  hasTextLogger: boolean;
  hasLineLogger: boolean;
  hasPayloadLogger: boolean;
}

export interface DisabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot {
  disabled: true;
  intervalTicks: null;
  nextDueTick: null;
}

export interface EnabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot {
  disabled: false;
  intervalTicks: number;
  nextDueTick: number;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot =
  | DisabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot
  | EnabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot;

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot {
  schedule: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot;
  callbacks: AuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot;
}

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

const createAuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot = ({
  textLogger,
  lineLogger,
  payloadLogger
}: AuthoritativeClientReplicationDiagnosticsLoggerStateHolderConfiguration): AuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot => ({
  hasTextLogger: textLogger !== undefined,
  hasLineLogger: lineLogger !== undefined,
  hasPayloadLogger: payloadLogger !== undefined
});

const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot = ({
  intervalTicks,
  scheduleSnapshot
}: {
  intervalTicks: number;
  scheduleSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot;
}): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot =>
  scheduleSnapshot.disabled
    ? {
        disabled: true,
        intervalTicks: null,
        nextDueTick: null
      }
    : {
        disabled: false,
        intervalTicks,
        nextDueTick: scheduleSnapshot.nextDueTick
      };

const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot = ({
  intervalTicks,
  scheduleSnapshot,
  callbackPresenceSnapshot
}: {
  intervalTicks: number;
  scheduleSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerScheduleSnapshot;
  callbackPresenceSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot;
}): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot => ({
  schedule:
    createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot({
      intervalTicks,
      scheduleSnapshot
    }),
  callbacks: {
    hasTextLogger: callbackPresenceSnapshot.hasTextLogger,
    hasLineLogger: callbackPresenceSnapshot.hasLineLogger,
    hasPayloadLogger: callbackPresenceSnapshot.hasPayloadLogger
  }
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

  getCallbackPresenceSnapshot(): AuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot {
    return createAuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot(
      this.currentConfiguration
    );
  }

  getConfigurationSnapshot(): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot {
    const scheduleSnapshot = this.getScheduleSnapshot();
    const callbackPresenceSnapshot = this.getCallbackPresenceSnapshot();

    return createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot({
      intervalTicks: this.currentConfiguration.intervalTicks,
      scheduleSnapshot,
      callbackPresenceSnapshot
    });
  }

  refreshSchedule({
    nextDueTick
  }: RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleOptions): void {
    const scheduleSnapshot = this.getScheduleSnapshot();
    if (scheduleSnapshot.disabled) {
      throw new Error(
        'cannot refresh replication diagnostics logger schedule while logging is disabled'
      );
    }

    this.reconfigure({
      ...this.currentConfiguration,
      nextDueTick
    });
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

  refreshScheduleAndCadence({
    nextDueTick,
    intervalTicks
  }: RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleAndCadenceOptions): void {
    const scheduleSnapshot = this.getScheduleSnapshot();
    if (scheduleSnapshot.disabled) {
      throw new Error(
        'cannot refresh replication diagnostics logger schedule and cadence while logging is disabled'
      );
    }

    this.reconfigure({
      ...this.currentConfiguration,
      intervalTicks,
      nextDueTick
    });
  }

  refreshScheduleAndCadenceAndCallbacks({
    nextDueTick,
    intervalTicks,
    textLogger,
    lineLogger,
    payloadLogger
  }: RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleAndCadenceAndCallbacksOptions): void {
    if (
      !hasConfiguredAuthoritativeClientReplicationDiagnosticsLoggerCallback({
        textLogger,
        lineLogger,
        payloadLogger
      })
    ) {
      throw new Error(
        'schedule, cadence, and callback refresh requires at least one replication diagnostics logger callback'
      );
    }

    const scheduleSnapshot = this.getScheduleSnapshot();
    if (scheduleSnapshot.disabled) {
      throw new Error(
        'cannot refresh replication diagnostics logger schedule, cadence, and callbacks while logging is disabled'
      );
    }

    this.reconfigure({
      ...this.currentConfiguration,
      nextDueTick,
      intervalTicks,
      textLogger,
      lineLogger,
      payloadLogger
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

  refreshScheduleAndCallbacks({
    nextDueTick,
    textLogger,
    lineLogger,
    payloadLogger
  }: RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderScheduleAndCallbacksOptions): void {
    if (
      !hasConfiguredAuthoritativeClientReplicationDiagnosticsLoggerCallback({
        textLogger,
        lineLogger,
        payloadLogger
      })
    ) {
      throw new Error(
        'schedule and callback refresh requires at least one replication diagnostics logger callback'
      );
    }

    const scheduleSnapshot = this.getScheduleSnapshot();
    if (scheduleSnapshot.disabled) {
      throw new Error(
        'cannot refresh replication diagnostics logger schedule and callbacks while logging is disabled'
      );
    }

    this.reconfigure({
      ...this.currentConfiguration,
      nextDueTick,
      textLogger,
      lineLogger,
      payloadLogger
    });
  }

  refreshCadenceAndCallbacks({
    intervalTicks,
    textLogger,
    lineLogger,
    payloadLogger
  }: RefreshAuthoritativeClientReplicationDiagnosticsLoggerStateHolderCadenceAndCallbacksOptions): void {
    if (
      !hasConfiguredAuthoritativeClientReplicationDiagnosticsLoggerCallback({
        textLogger,
        lineLogger,
        payloadLogger
      })
    ) {
      throw new Error(
        'cadence and callback refresh requires at least one replication diagnostics logger callback'
      );
    }

    const scheduleSnapshot = this.getScheduleSnapshot();
    if (scheduleSnapshot.disabled) {
      throw new Error(
        'cannot refresh replication diagnostics logger cadence and callbacks while logging is disabled'
      );
    }

    this.reconfigure({
      ...this.currentConfiguration,
      intervalTicks,
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
