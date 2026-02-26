import type { TouchDebugEditMode } from './controller';

export interface DebugEditControlState {
  touchMode: TouchDebugEditMode;
  brushTileId: number;
  panelCollapsed: boolean;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

const STORAGE_KEY = 'deep-factory.debugEditControlState.v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isTouchDebugEditMode = (value: unknown): value is TouchDebugEditMode =>
  value === 'pan' || value === 'place' || value === 'break';

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isValidBrushTileId = (value: unknown, validBrushTileIds: ReadonlySet<number>): value is number =>
  typeof value === 'number' && Number.isInteger(value) && validBrushTileIds.has(value);

export const loadDebugEditControlState = (
  storage: StorageLike | null | undefined,
  validBrushTileIds: readonly number[],
  fallbackState: DebugEditControlState
): DebugEditControlState => {
  if (!storage) return fallbackState;

  let rawState: string | null;
  try {
    rawState = storage.getItem(STORAGE_KEY);
  } catch {
    return fallbackState;
  }

  if (!rawState) return fallbackState;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawState);
  } catch {
    return fallbackState;
  }

  if (!isRecord(parsed)) return fallbackState;

  const validBrushTileIdSet = new Set(validBrushTileIds);
  const touchMode = isTouchDebugEditMode(parsed.touchMode)
    ? parsed.touchMode
    : fallbackState.touchMode;
  const brushTileId = isValidBrushTileId(parsed.brushTileId, validBrushTileIdSet)
    ? parsed.brushTileId
    : fallbackState.brushTileId;
  const panelCollapsed = isBoolean(parsed.panelCollapsed)
    ? parsed.panelCollapsed
    : fallbackState.panelCollapsed;

  return {
    touchMode,
    brushTileId,
    panelCollapsed
  };
};

export const saveDebugEditControlState = (
  storage: StorageLike | null | undefined,
  state: DebugEditControlState
): boolean => {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const clearDebugEditControlState = (storage: StorageLike | null | undefined): boolean => {
  if (!storage || typeof storage.removeItem !== 'function') return false;
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

export const DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY = STORAGE_KEY;
