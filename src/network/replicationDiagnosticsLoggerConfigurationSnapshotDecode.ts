import type {
  AuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot,
  DisabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot,
  EnabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot
} from './replicationDiagnosticsLoggerStateHolder';

type RecordLike = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordLike =>
  typeof value === 'object' && value !== null;

const expectBoolean = (value: unknown, label: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean`);
  }

  return value;
};

const expectFiniteNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectNonNegativeInteger = (value: unknown, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (!Number.isInteger(normalizedValue) || normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return normalizedValue;
};

const expectPositiveInteger = (value: unknown, label: string): number => {
  const normalizedValue = expectNonNegativeInteger(value, label);
  if (normalizedValue === 0) {
    throw new Error(`${label} must be greater than 0`);
  }

  return normalizedValue;
};

const decodeAuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot = (
  value: unknown
): AuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot => {
  if (!isRecord(value)) {
    throw new Error('callbacks must be an object');
  }

  return {
    hasTextLogger: expectBoolean(value.hasTextLogger, 'callbacks.hasTextLogger'),
    hasLineLogger: expectBoolean(value.hasLineLogger, 'callbacks.hasLineLogger'),
    hasPayloadLogger: expectBoolean(
      value.hasPayloadLogger,
      'callbacks.hasPayloadLogger'
    )
  };
};

const hasEnabledAuthoritativeClientReplicationDiagnosticsLoggerCallback = ({
  hasTextLogger,
  hasLineLogger,
  hasPayloadLogger
}: AuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot): boolean =>
  hasTextLogger || hasLineLogger || hasPayloadLogger;

const decodeDisabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot =
  (
    value: RecordLike
  ): DisabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot => {
    if (value.intervalTicks !== null) {
      throw new Error(
        'schedule.intervalTicks must be null when schedule.disabled is true'
      );
    }

    if (value.nextDueTick !== null) {
      throw new Error(
        'schedule.nextDueTick must be null when schedule.disabled is true'
      );
    }

    return {
      disabled: true,
      intervalTicks: null,
      nextDueTick: null
    };
  };

const decodeEnabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot =
  (
    value: RecordLike
  ): EnabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot => ({
    disabled: false,
    intervalTicks: expectPositiveInteger(
      value.intervalTicks,
      'schedule.intervalTicks'
    ),
    nextDueTick: expectNonNegativeInteger(
      value.nextDueTick,
      'schedule.nextDueTick'
    )
  });

export const decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot =
  (
    value: unknown
  ): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot => {
    if (!isRecord(value)) {
      throw new Error(
        'replication diagnostics logger configuration snapshot must be an object'
      );
    }
    if (!isRecord(value.schedule)) {
      throw new Error('schedule must be an object');
    }

    const callbacks =
      decodeAuthoritativeClientReplicationDiagnosticsLoggerCallbackPresenceSnapshot(
        value.callbacks
      );
    const disabled = expectBoolean(value.schedule.disabled, 'schedule.disabled');

    if (disabled) {
      if (
        hasEnabledAuthoritativeClientReplicationDiagnosticsLoggerCallback(callbacks)
      ) {
        throw new Error(
          'disabled configuration snapshot must not flag replication diagnostics logger callbacks'
        );
      }

      return {
        schedule:
          decodeDisabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot(
            value.schedule
          ),
        callbacks
      };
    }

    if (
      !hasEnabledAuthoritativeClientReplicationDiagnosticsLoggerCallback(callbacks)
    ) {
      throw new Error(
        'enabled configuration snapshot requires at least one replication diagnostics logger callback'
      );
    }

    return {
      schedule:
        decodeEnabledAuthoritativeClientReplicationDiagnosticsLoggerConfigurationScheduleSnapshot(
          value.schedule
        ),
      callbacks
    };
  };
