import { clonePlayerState, type PlayerCollisionContacts, type PlayerState } from './playerState';

export interface StandalonePlayerRenderPresentationState {
  wallContact: PlayerCollisionContacts['wall'] | null;
  ceilingContact: PlayerCollisionContacts['ceiling'] | null;
  ceilingBonkHoldUntilTimeMs: number | null;
}

export interface StandalonePlayerRenderState
  extends PlayerState,
    StandalonePlayerRenderPresentationState {}

const cloneWallContact = (
  wallContact: PlayerCollisionContacts['wall'] | null
): PlayerCollisionContacts['wall'] | null => (wallContact === null ? null : { ...wallContact });

const cloneCeilingContact = (
  ceilingContact: PlayerCollisionContacts['ceiling'] | null
): PlayerCollisionContacts['ceiling'] | null =>
  ceilingContact === null ? null : { ...ceilingContact };

const normalizeCeilingBonkHoldUntilTimeMs = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const createStandalonePlayerRenderPresentationState = (
  contacts: Pick<PlayerCollisionContacts, 'wall' | 'ceiling'> | null = null,
  ceilingBonkHoldUntilTimeMs: number | null = null
): StandalonePlayerRenderPresentationState => ({
  wallContact: cloneWallContact(contacts?.wall ?? null),
  ceilingContact: cloneCeilingContact(contacts?.ceiling ?? null),
  ceilingBonkHoldUntilTimeMs: normalizeCeilingBonkHoldUntilTimeMs(ceilingBonkHoldUntilTimeMs)
});

export const cloneStandalonePlayerRenderState = (
  state: PlayerState,
  presentationState: StandalonePlayerRenderPresentationState
): StandalonePlayerRenderState => ({
  ...clonePlayerState(state),
  wallContact: cloneWallContact(presentationState.wallContact),
  ceilingContact: cloneCeilingContact(presentationState.ceilingContact),
  ceilingBonkHoldUntilTimeMs: normalizeCeilingBonkHoldUntilTimeMs(
    presentationState.ceilingBonkHoldUntilTimeMs
  )
});

export const isStandalonePlayerRenderStateCeilingBonkActive = (
  state: Pick<StandalonePlayerRenderState, 'ceilingContact' | 'ceilingBonkHoldUntilTimeMs'>,
  timeMs: number
): boolean =>
  state.ceilingContact !== null ||
  (typeof state.ceilingBonkHoldUntilTimeMs === 'number' &&
  Number.isFinite(state.ceilingBonkHoldUntilTimeMs)
    ? timeMs < state.ceilingBonkHoldUntilTimeMs
    : false);
