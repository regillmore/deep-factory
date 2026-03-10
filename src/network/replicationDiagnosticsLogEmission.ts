import { formatAuthoritativeClientReplicationDiagnosticsLogPayload } from './replicationDiagnosticsLogFormatter';
import { createAuthoritativeClientReplicationDiagnosticsLogPayload } from './replicationDiagnosticsLogPayload';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import { createAuthoritativeClientReplicationDiagnosticsRegistrySnapshot } from './replicationDiagnosticsRegistrySnapshot';

export interface CreateAuthoritativeClientReplicationDiagnosticsLogEmissionOptions {
  registry: AuthoritativeClientReplicationDiagnosticsRegistry;
  tick: number;
  intervalTicks: number;
}

export interface AuthoritativeClientReplicationDiagnosticsLogEmission {
  nextDueTick: number;
  logText: string;
}

const validateFiniteNumber = (value: number, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const validateNonNegativeInteger = (value: number, label: string): number => {
  const normalizedValue = validateFiniteNumber(value, label);
  if (!Number.isInteger(normalizedValue) || normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return normalizedValue;
};

const validatePositiveInteger = (value: number, label: string): number => {
  const normalizedValue = validateNonNegativeInteger(value, label);
  if (normalizedValue === 0) {
    throw new Error(`${label} must be greater than 0`);
  }

  return normalizedValue;
};

export const createAuthoritativeClientReplicationDiagnosticsLogEmission = ({
  registry,
  tick,
  intervalTicks
}: CreateAuthoritativeClientReplicationDiagnosticsLogEmissionOptions): AuthoritativeClientReplicationDiagnosticsLogEmission => {
  const normalizedTick = validateNonNegativeInteger(tick, 'tick');
  const normalizedIntervalTicks = validatePositiveInteger(intervalTicks, 'intervalTicks');
  const snapshotEntries = createAuthoritativeClientReplicationDiagnosticsRegistrySnapshot(registry);
  const payload = createAuthoritativeClientReplicationDiagnosticsLogPayload(snapshotEntries);

  return {
    nextDueTick: normalizedTick + normalizedIntervalTicks,
    logText: formatAuthoritativeClientReplicationDiagnosticsLogPayload(payload)
  };
};
