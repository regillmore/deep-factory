import {
  createAuthoritativeClientReplicationDiagnosticsLogEmission
} from './replicationDiagnosticsLogEmission';
import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';

export interface CreateAuthoritativeClientReplicationDiagnosticsLogCadenceOptions {
  registry: AuthoritativeClientReplicationDiagnosticsRegistry;
  intervalTicks: number;
  nextDueTick: number;
}

export interface PollAuthoritativeClientReplicationDiagnosticsLogCadenceOptions {
  tick: number;
}

export interface SilentAuthoritativeClientReplicationDiagnosticsLogCadenceResult {
  emitted: false;
  nextDueTick: number;
  logText: null;
}

export interface EmittedAuthoritativeClientReplicationDiagnosticsLogCadenceResult {
  emitted: true;
  nextDueTick: number;
  logText: string;
}

export type AuthoritativeClientReplicationDiagnosticsLogCadenceResult =
  | SilentAuthoritativeClientReplicationDiagnosticsLogCadenceResult
  | EmittedAuthoritativeClientReplicationDiagnosticsLogCadenceResult;

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

export class AuthoritativeClientReplicationDiagnosticsLogCadence {
  private readonly registry: AuthoritativeClientReplicationDiagnosticsRegistry;
  private readonly intervalTicks: number;
  private nextDueTick: number;

  constructor({
    registry,
    intervalTicks,
    nextDueTick
  }: CreateAuthoritativeClientReplicationDiagnosticsLogCadenceOptions) {
    this.registry = registry;
    this.intervalTicks = validatePositiveInteger(intervalTicks, 'intervalTicks');
    this.nextDueTick = validateNonNegativeInteger(nextDueTick, 'nextDueTick');
  }

  getNextDueTick(): number {
    return this.nextDueTick;
  }

  poll({
    tick
  }: PollAuthoritativeClientReplicationDiagnosticsLogCadenceOptions): AuthoritativeClientReplicationDiagnosticsLogCadenceResult {
    const normalizedTick = validateNonNegativeInteger(tick, 'tick');

    if (normalizedTick < this.nextDueTick) {
      return {
        emitted: false,
        nextDueTick: this.nextDueTick,
        logText: null
      };
    }

    const emission = createAuthoritativeClientReplicationDiagnosticsLogEmission({
      registry: this.registry,
      tick: normalizedTick,
      intervalTicks: this.intervalTicks
    });
    this.nextDueTick = emission.nextDueTick;

    return {
      emitted: true,
      nextDueTick: emission.nextDueTick,
      logText: emission.logText
    };
  }
}
