import {
  createDefaultShellActionKeybindingState,
  type ShellActionKeybindingState
} from './input/shellActionKeybindings';
import {
  createDefaultWorldSessionShellState,
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
