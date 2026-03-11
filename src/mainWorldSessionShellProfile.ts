import {
  createDefaultShellActionKeybindingState,
  decodeShellActionKeybindingState,
  type ShellActionKeybindingState
} from './input/shellActionKeybindings';
import {
  createDefaultWorldSessionShellState,
  decodeWorldSessionShellState,
  type WorldSessionShellState
} from './mainWorldSessionShellState';

export const WORLD_SESSION_SHELL_PROFILE_KIND = 'deep-factory.shell-profile';
export const WORLD_SESSION_SHELL_PROFILE_VERSION = 1;

export interface WorldSessionShellProfileEnvelope {
  kind: typeof WORLD_SESSION_SHELL_PROFILE_KIND;
  version: typeof WORLD_SESSION_SHELL_PROFILE_VERSION;
  shellState: WorldSessionShellState;
  shellActionKeybindings: ShellActionKeybindingState;
}

export interface CreateWorldSessionShellProfileEnvelopeOptions {
  shellState?: WorldSessionShellState;
  shellActionKeybindings?: ShellActionKeybindingState;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const createWorldSessionShellProfileEnvelope = ({
  shellState = createDefaultWorldSessionShellState(),
  shellActionKeybindings = createDefaultShellActionKeybindingState()
}: CreateWorldSessionShellProfileEnvelopeOptions = {}): WorldSessionShellProfileEnvelope => ({
  kind: WORLD_SESSION_SHELL_PROFILE_KIND,
  version: WORLD_SESSION_SHELL_PROFILE_VERSION,
  shellState: {
    ...shellState
  },
  shellActionKeybindings: {
    ...shellActionKeybindings
  }
});

export const decodeWorldSessionShellProfileEnvelope = (
  value: unknown
): WorldSessionShellProfileEnvelope => {
  if (!isRecord(value)) {
    throw new Error('shell profile envelope must be an object');
  }
  if (value.kind !== WORLD_SESSION_SHELL_PROFILE_KIND) {
    throw new Error(
      `shell profile envelope kind must be "${WORLD_SESSION_SHELL_PROFILE_KIND}"`
    );
  }
  if (value.version !== WORLD_SESSION_SHELL_PROFILE_VERSION) {
    throw new Error(
      `shell profile envelope version must be ${WORLD_SESSION_SHELL_PROFILE_VERSION}`
    );
  }

  return {
    kind: WORLD_SESSION_SHELL_PROFILE_KIND,
    version: WORLD_SESSION_SHELL_PROFILE_VERSION,
    shellState: decodeWorldSessionShellState(value.shellState),
    shellActionKeybindings: decodeShellActionKeybindingState(value.shellActionKeybindings)
  };
};
