import { describe, expect, it } from 'vitest';

import { EntityRegistry } from './entityRegistry';

describe('EntityRegistry', () => {
  it('captures synchronized render snapshots when an entity spawns', () => {
    const registry = new EntityRegistry();

    const entityId = registry.spawn({
      kind: 'test',
      initialState: { x: 12, y: -6 },
      captureRenderState: (state) => ({ x: state.x, y: state.y })
    });

    expect(entityId).toBe(1);
    expect(registry.getEntityCount()).toBe(1);
    expect(registry.has(entityId)).toBe(true);
    expect(registry.getEntityState<{ x: number; y: number }>(entityId)).toEqual({ x: 12, y: -6 });
    expect(registry.getRenderStateSnapshot<{ x: number; y: number }>(entityId)).toEqual({
      previous: { x: 12, y: -6 },
      current: { x: 12, y: -6 }
    });
  });

  it('runs fixed-step hooks in spawn order and rotates render snapshots after each step', () => {
    const registry = new EntityRegistry();
    const updateOrder: string[] = [];

    const alphaId = registry.spawn({
      kind: 'alpha',
      initialState: { value: 0 },
      fixedUpdate: (state) => {
        updateOrder.push('alpha');
        return { value: state.value + 1 };
      },
      captureRenderState: (state) => state.value
    });
    const betaId = registry.spawn({
      kind: 'beta',
      initialState: { value: 10 },
      fixedUpdate: (state) => {
        updateOrder.push('beta');
        return { value: state.value + 2 };
      },
      captureRenderState: (state) => state.value
    });

    registry.fixedUpdateAll(1 / 60);

    expect(updateOrder).toEqual(['alpha', 'beta']);
    expect(registry.getRenderStateSnapshots<number>()).toEqual([
      {
        id: alphaId,
        kind: 'alpha',
        previous: 0,
        current: 1
      },
      {
        id: betaId,
        kind: 'beta',
        previous: 10,
        current: 12
      }
    ]);

    registry.fixedUpdateAll(1 / 60);

    expect(registry.getRenderStateSnapshot<number>(alphaId)).toEqual({
      previous: 1,
      current: 2
    });
    expect(registry.getRenderStateSnapshot<number>(betaId)).toEqual({
      previous: 12,
      current: 14
    });
  });

  it('skips same-tick updates for entities spawned during another entity fixed step', () => {
    const registry = new EntityRegistry();
    let childEntityId: number | null = null;

    registry.spawn({
      kind: 'spawner',
      initialState: 0,
      fixedUpdate: (state) => {
        if (childEntityId === null) {
          childEntityId = registry.spawn({
            kind: 'child',
            initialState: 5,
            fixedUpdate: (childState) => childState + 1,
            captureRenderState: (childState) => childState
          });
        }
        return state + 1;
      },
      captureRenderState: (state) => state
    });

    registry.fixedUpdateAll(1 / 60);

    expect(childEntityId).not.toBeNull();
    expect(registry.getEntityState<number>(childEntityId!)).toBe(5);
    expect(registry.getRenderStateSnapshot<number>(childEntityId!)).toEqual({
      previous: 5,
      current: 5
    });

    registry.fixedUpdateAll(1 / 60);

    expect(registry.getEntityState<number>(childEntityId!)).toBe(6);
    expect(registry.getRenderStateSnapshot<number>(childEntityId!)).toEqual({
      previous: 5,
      current: 6
    });
  });

  it('resets render snapshots when external state replacement teleports an entity', () => {
    const registry = new EntityRegistry();
    const entityId = registry.spawn({
      kind: 'teleportable',
      initialState: { x: 0 },
      fixedUpdate: (state) => ({ x: state.x + 4 }),
      captureRenderState: (state) => ({ x: state.x })
    });

    registry.fixedUpdateAll(1 / 60);
    registry.setEntityState(entityId, { x: 128 });

    expect(registry.getEntityState<{ x: number }>(entityId)).toEqual({ x: 128 });
    expect(registry.getRenderStateSnapshot<{ x: number }>(entityId)).toEqual({
      previous: { x: 128 },
      current: { x: 128 }
    });
  });

  it('removes entities from state and snapshot queries when they are despawned', () => {
    const registry = new EntityRegistry();
    const entityId = registry.spawn({
      kind: 'ephemeral',
      initialState: 9,
      captureRenderState: (state) => state
    });

    expect(registry.despawn(entityId)).toBe(true);
    expect(registry.despawn(entityId)).toBe(false);
    expect(registry.getEntityCount()).toBe(0);
    expect(registry.has(entityId)).toBe(false);
    expect(registry.getEntityState<number>(entityId)).toBeNull();
    expect(registry.getRenderStateSnapshot<number>(entityId)).toBeNull();
    expect(registry.getRenderStateSnapshots()).toEqual([]);
  });
});
