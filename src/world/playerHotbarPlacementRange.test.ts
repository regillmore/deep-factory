import { describe, expect, it } from 'vitest';

import { TILE_SIZE } from './constants';
import { createPlayerState } from './playerState';
import {
  DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE,
  DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE_TILES,
  evaluatePlayerHotbarTilePlacementRange
} from './playerHotbarPlacementRange';

describe('evaluatePlayerHotbarTilePlacementRange', () => {
  it('exports a five-tile default range in world units', () => {
    expect(DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE_TILES).toBe(5);
    expect(DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE).toBe(5 * TILE_SIZE);
  });

  it('allows placements whose target tile stays within the default horizontal reach from the player body', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      grounded: true
    });

    expect(evaluatePlayerHotbarTilePlacementRange(playerState, 5, -1)).toMatchObject({
      horizontalGap: 66,
      verticalGap: 0,
      withinRange: true
    });
  });

  it('rejects placements whose target tile exceeds the default horizontal reach', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      grounded: true
    });

    expect(evaluatePlayerHotbarTilePlacementRange(playerState, 6, -1)).toMatchObject({
      horizontalGap: 82,
      verticalGap: 0,
      withinRange: false
    });
  });

  it('uses combined horizontal and vertical gaps when a far diagonal tile is targeted', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      grounded: true
    });

    expect(evaluatePlayerHotbarTilePlacementRange(playerState, 5, -7)).toMatchObject({
      horizontalGap: 66,
      verticalGap: 68,
      withinRange: false
    });
  });
});
