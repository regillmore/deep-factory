export type EntityId = number;

export interface EntityRenderStateSnapshot<TRenderState> {
  previous: TRenderState;
  current: TRenderState;
}

export interface EntityRenderStateSnapshotEntry<TRenderState = unknown>
  extends EntityRenderStateSnapshot<TRenderState> {
  id: EntityId;
  kind: string;
}

export interface SpawnEntityOptions<TState, TRenderState> {
  kind: string;
  initialState: TState;
  captureRenderState: (state: TState) => TRenderState;
  fixedUpdate?: (state: TState, fixedDtSeconds: number) => TState;
}

export interface SetEntityStateOptions {
  resetRenderStateSnapshots?: boolean;
}

interface EntityRecord {
  id: EntityId;
  kind: string;
  state: unknown;
  captureRenderState: (state: unknown) => unknown;
  fixedUpdate: ((state: unknown, fixedDtSeconds: number) => unknown) | null;
  renderState: EntityRenderStateSnapshot<unknown>;
}

const createSynchronizedRenderState = (record: EntityRecord): EntityRenderStateSnapshot<unknown> => {
  const renderState = record.captureRenderState(record.state);
  return {
    previous: renderState,
    current: renderState
  };
};

export class EntityRegistry {
  private nextEntityId = 1;
  private entities = new Map<EntityId, EntityRecord>();

  spawn<TState, TRenderState>(options: SpawnEntityOptions<TState, TRenderState>): EntityId {
    const entityId = this.nextEntityId;
    this.nextEntityId += 1;

    const record: EntityRecord = {
      id: entityId,
      kind: options.kind,
      state: options.initialState,
      captureRenderState: (state) => options.captureRenderState(state as TState),
      fixedUpdate: options.fixedUpdate
        ? (state, fixedDtSeconds) => options.fixedUpdate!(state as TState, fixedDtSeconds)
        : null,
      renderState: {
        previous: null,
        current: null
      }
    };
    record.renderState = createSynchronizedRenderState(record);
    this.entities.set(entityId, record);
    return entityId;
  }

  despawn(entityId: EntityId): boolean {
    return this.entities.delete(entityId);
  }

  has(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  getEntityState<TState>(entityId: EntityId): TState | null {
    const record = this.entities.get(entityId);
    return record ? (record.state as TState) : null;
  }

  setEntityState<TState>(
    entityId: EntityId,
    nextState: TState,
    options: SetEntityStateOptions = {}
  ): void {
    const record = this.getRequiredEntityRecord(entityId);
    record.state = nextState;
    if (options.resetRenderStateSnapshots ?? true) {
      record.renderState = createSynchronizedRenderState(record);
    }
  }

  fixedUpdateAll(fixedDtSeconds: number): void {
    const fixedStepEntityIds = Array.from(this.entities.keys());
    for (const entityId of fixedStepEntityIds) {
      const record = this.entities.get(entityId);
      if (!record || !record.fixedUpdate) {
        continue;
      }
      record.state = record.fixedUpdate(record.state, fixedDtSeconds);
    }

    for (const record of this.entities.values()) {
      const nextRenderState = record.captureRenderState(record.state);
      record.renderState = {
        previous: record.renderState.current,
        current: nextRenderState
      };
    }
  }

  getRenderStateSnapshot<TRenderState>(
    entityId: EntityId
  ): EntityRenderStateSnapshot<TRenderState> | null {
    const record = this.entities.get(entityId);
    if (!record) {
      return null;
    }

    return {
      previous: record.renderState.previous as TRenderState,
      current: record.renderState.current as TRenderState
    };
  }

  getRenderStateSnapshots<TRenderState = unknown>(): EntityRenderStateSnapshotEntry<TRenderState>[] {
    const snapshots: EntityRenderStateSnapshotEntry<TRenderState>[] = [];
    for (const record of this.entities.values()) {
      snapshots.push({
        id: record.id,
        kind: record.kind,
        previous: record.renderState.previous as TRenderState,
        current: record.renderState.current as TRenderState
      });
    }
    return snapshots;
  }

  private getRequiredEntityRecord(entityId: EntityId): EntityRecord {
    const record = this.entities.get(entityId);
    if (!record) {
      throw new Error(`Unknown entity id ${entityId}`);
    }
    return record;
  }
}
