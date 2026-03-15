import { describe, expect, it } from 'vitest';

import { createPlayerInventoryState } from './playerInventory';
import { createPlayerState } from './playerState';
import {
  canDroppedItemStacksMerge,
  createDroppedItemState,
  createDroppedItemStateFromWorldTile,
  createDroppedItemStateFromPlayerDrop,
  isDroppedItemInPickupRange,
  resolveDroppedItemPickup,
  resolveDroppedItemStackMerge,
  resolveDroppedItemStackMergeCascade
} from './droppedItem';

describe('droppedItem', () => {
  it('spawns a player-dropped stack in front of the player and outside immediate pickup range', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      facing: 'right'
    });

    const droppedItemState = createDroppedItemStateFromPlayerDrop(playerState, 'torch', 20);

    expect(droppedItemState).toEqual({
      position: {
        x: 28,
        y: -14
      },
      itemId: 'torch',
      amount: 20
    });
    expect(isDroppedItemInPickupRange(droppedItemState, playerState)).toBe(false);
  });

  it('spawns a tile-refund stack at the center of the removed world tile', () => {
    expect(createDroppedItemStateFromWorldTile(3, -10, 'torch', 1)).toEqual({
      position: {
        x: 56,
        y: -152
      },
      itemId: 'torch',
      amount: 1
    });
  });

  it('treats overlapping same-item world stacks as merge candidates', () => {
    expect(
      canDroppedItemStacksMerge(
        createDroppedItemState({
          position: { x: 28, y: -14 },
          itemId: 'dirt-block',
          amount: 12
        }),
        createDroppedItemState({
          position: { x: 32, y: -14 },
          itemId: 'dirt-block',
          amount: 8
        })
      )
    ).toBe(true);

    expect(
      canDroppedItemStacksMerge(
        createDroppedItemState({
          position: { x: 28, y: -14 },
          itemId: 'dirt-block',
          amount: 12
        }),
        createDroppedItemState({
          position: { x: 48, y: -14 },
          itemId: 'dirt-block',
          amount: 8
        })
      )
    ).toBe(false);

    expect(
      canDroppedItemStacksMerge(
        createDroppedItemState({
          position: { x: 28, y: -14 },
          itemId: 'dirt-block',
          amount: 12
        }),
        createDroppedItemState({
          position: { x: 32, y: -14 },
          itemId: 'torch',
          amount: 8
        })
      )
    ).toBe(false);
  });

  it('merges a matching dropped stack into one world pickup when space remains', () => {
    const mergeResult = resolveDroppedItemStackMerge(
      createDroppedItemState({
        position: { x: 28, y: -14 },
        itemId: 'torch',
        amount: 20
      }),
      createDroppedItemState({
        position: { x: 32, y: -14 },
        itemId: 'torch',
        amount: 5
      })
    );

    expect(mergeResult).toEqual({
      nextTargetDroppedItemState: {
        position: { x: 28, y: -14 },
        itemId: 'torch',
        amount: 25
      },
      nextSourceDroppedItemState: null,
      mergedAmount: 5
    });
  });

  it('leaves a remainder when a matching world pickup reaches its max stack size', () => {
    const mergeResult = resolveDroppedItemStackMerge(
      createDroppedItemState({
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 995
      }),
      createDroppedItemState({
        position: { x: 32, y: -14 },
        itemId: 'dirt-block',
        amount: 10
      })
    );

    expect(mergeResult).toEqual({
      nextTargetDroppedItemState: {
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 999
      },
      nextSourceDroppedItemState: {
        position: { x: 32, y: -14 },
        itemId: 'dirt-block',
        amount: 6
      },
      mergedAmount: 4
    });
  });

  it('cascades one dropped stack through multiple nearby matching pickups before leaving a remainder', () => {
    const cascadeResult = resolveDroppedItemStackMergeCascade(
      [
        createDroppedItemState({
          position: { x: 28, y: -14 },
          itemId: 'dirt-block',
          amount: 998
        }),
        createDroppedItemState({
          position: { x: 32, y: -14 },
          itemId: 'dirt-block',
          amount: 997
        })
      ],
      createDroppedItemState({
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 5
      })
    );

    expect(cascadeResult).toEqual({
      targetResults: [
        {
          targetIndex: 0,
          nextTargetDroppedItemState: {
            position: { x: 28, y: -14 },
            itemId: 'dirt-block',
            amount: 999
          },
          mergedAmount: 1
        },
        {
          targetIndex: 1,
          nextTargetDroppedItemState: {
            position: { x: 32, y: -14 },
            itemId: 'dirt-block',
            amount: 999
          },
          mergedAmount: 2
        }
      ],
      nextSourceDroppedItemState: {
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 2
      },
      totalMergedAmount: 3
    });
  });

  it('uses nearest-first order and preserves caller order for equal-distance cascade ties', () => {
    const cascadeResult = resolveDroppedItemStackMergeCascade(
      [
        createDroppedItemState({
          position: { x: 32, y: -14 },
          itemId: 'torch',
          amount: 998
        }),
        createDroppedItemState({
          position: { x: 24, y: -14 },
          itemId: 'torch',
          amount: 997
        }),
        createDroppedItemState({
          position: { x: 28, y: -14 },
          itemId: 'torch',
          amount: 995
        })
      ],
      createDroppedItemState({
        position: { x: 28, y: -14 },
        itemId: 'torch',
        amount: 4
      })
    );

    expect(cascadeResult).toEqual({
      targetResults: [
        {
          targetIndex: 2,
          nextTargetDroppedItemState: {
            position: { x: 28, y: -14 },
            itemId: 'torch',
            amount: 999
          },
          mergedAmount: 4
        }
      ],
      nextSourceDroppedItemState: null,
      totalMergedAmount: 4
    });

    const tiedCascadeResult = resolveDroppedItemStackMergeCascade(
      [
        createDroppedItemState({
          position: { x: 32, y: -14 },
          itemId: 'torch',
          amount: 998
        }),
        createDroppedItemState({
          position: { x: 24, y: -14 },
          itemId: 'torch',
          amount: 997
        })
      ],
      createDroppedItemState({
        position: { x: 28, y: -14 },
        itemId: 'torch',
        amount: 3
      })
    );

    expect(tiedCascadeResult).toEqual({
      targetResults: [
        {
          targetIndex: 0,
          nextTargetDroppedItemState: {
            position: { x: 32, y: -14 },
            itemId: 'torch',
            amount: 999
          },
          mergedAmount: 1
        },
        {
          targetIndex: 1,
          nextTargetDroppedItemState: {
            position: { x: 24, y: -14 },
            itemId: 'torch',
            amount: 999
          },
          mergedAmount: 2
        }
      ],
      nextSourceDroppedItemState: null,
      totalMergedAmount: 3
    });
  });

  it('does not pick up an out-of-range dropped stack', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    const inventoryState = createPlayerInventoryState({
      hotbar: [null, null, null, null, null, null, null, null, null, null]
    });
    const droppedItemState = createDroppedItemState({
      position: { x: 64, y: -14 },
      itemId: 'rope',
      amount: 3
    });

    const pickupResult = resolveDroppedItemPickup(droppedItemState, playerState, inventoryState);

    expect(pickupResult.pickedUpAmount).toBe(0);
    expect(pickupResult.nextDroppedItemState).toEqual(droppedItemState);
    expect(pickupResult.nextInventoryState).toEqual(inventoryState);
  });

  it('merges a picked-up stack into a matching hotbar slot before using empty slots', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'torch', amount: 20 },
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ]
    });
    const droppedItemState = createDroppedItemState({
      position: { x: 8, y: -14 },
      itemId: 'torch',
      amount: 5
    });

    const pickupResult = resolveDroppedItemPickup(droppedItemState, playerState, inventoryState);

    expect(pickupResult.pickedUpAmount).toBe(5);
    expect(pickupResult.nextDroppedItemState).toBeNull();
    expect(pickupResult.nextInventoryState.hotbar[0]).toEqual({
      itemId: 'torch',
      amount: 25
    });
    expect(pickupResult.nextInventoryState.hotbar[1]).toBeNull();
  });

  it('spills overflow from a matching slot into an empty hotbar slot', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'dirt-block', amount: 998 },
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ]
    });
    const droppedItemState = createDroppedItemState({
      position: { x: 8, y: -14 },
      itemId: 'dirt-block',
      amount: 4
    });

    const pickupResult = resolveDroppedItemPickup(droppedItemState, playerState, inventoryState);

    expect(pickupResult.pickedUpAmount).toBe(4);
    expect(pickupResult.nextDroppedItemState).toBeNull();
    expect(pickupResult.nextInventoryState.hotbar[0]).toEqual({
      itemId: 'dirt-block',
      amount: 999
    });
    expect(pickupResult.nextInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-block',
      amount: 3
    });
  });

  it('leaves the remaining amount in the world when the hotbar cannot hold the full stack', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'torch', amount: 995 },
        { itemId: 'dirt-block', amount: 999 },
        { itemId: 'dirt-block', amount: 999 },
        { itemId: 'dirt-block', amount: 999 },
        { itemId: 'dirt-block', amount: 999 },
        { itemId: 'dirt-block', amount: 999 },
        { itemId: 'dirt-block', amount: 999 },
        { itemId: 'dirt-block', amount: 999 },
        { itemId: 'dirt-block', amount: 999 },
        { itemId: 'dirt-block', amount: 999 }
      ]
    });
    const droppedItemState = createDroppedItemState({
      position: { x: 8, y: -14 },
      itemId: 'torch',
      amount: 10
    });

    const pickupResult = resolveDroppedItemPickup(droppedItemState, playerState, inventoryState);

    expect(pickupResult.pickedUpAmount).toBe(4);
    expect(pickupResult.nextDroppedItemState).toEqual({
      position: droppedItemState.position,
      itemId: 'torch',
      amount: 6
    });
    expect(pickupResult.nextInventoryState.hotbar[0]).toEqual({
      itemId: 'torch',
      amount: 999
    });
  });
});
