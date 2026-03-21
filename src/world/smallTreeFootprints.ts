import type { SmallTreeTileIds } from './smallTreeTiles';

export interface SmallTreeLocalOffset {
  localX: number;
  localY: number;
}

export type SmallTreeFootprintTileKind = keyof SmallTreeTileIds;

export interface SmallTreeFootprintCell extends SmallTreeLocalOffset {
  tileKind: SmallTreeFootprintTileKind;
}

const createLocalOffsetKey = (localX: number, localY: number): string => `${localX},${localY}`;

const freezeFootprintCells = (
  cells: readonly SmallTreeFootprintCell[]
): readonly Readonly<SmallTreeFootprintCell>[] =>
  Object.freeze(cells.map((cell) => Object.freeze({ ...cell })));

const freezeLocalOffsets = (
  offsets: readonly SmallTreeLocalOffset[]
): readonly Readonly<SmallTreeLocalOffset>[] =>
  Object.freeze(
    offsets.map((offset) => Object.freeze({ localX: offset.localX, localY: offset.localY }))
  );

const createOccupiedLocalOffsetSet = (
  offsets: readonly SmallTreeLocalOffset[]
): ReadonlySet<string> =>
  new Set(offsets.map((offset) => createLocalOffsetKey(offset.localX, offset.localY)));

export const PLANTED_SMALL_TREE_FOOTPRINT_CELLS = freezeFootprintCells([
  { localX: 0, localY: -1, tileKind: 'sapling' }
]);

export const PLANTED_SMALL_TREE_LOCAL_OFFSETS = freezeLocalOffsets(PLANTED_SMALL_TREE_FOOTPRINT_CELLS);

// The placeholder grown tree stays anchored at the planted support cell and expands upward into
// a simple trunk-plus-canopy silhouette that future growth and chopping passes can share.
export const GROWN_SMALL_TREE_FOOTPRINT_CELLS = freezeFootprintCells([
  { localX: 0, localY: -1, tileKind: 'trunk' },
  { localX: 0, localY: -2, tileKind: 'trunk' },
  { localX: -1, localY: -3, tileKind: 'leaf' },
  { localX: 0, localY: -3, tileKind: 'leaf' },
  { localX: 1, localY: -3, tileKind: 'leaf' }
]);

export const GROWN_SMALL_TREE_LOCAL_OFFSETS = freezeLocalOffsets(GROWN_SMALL_TREE_FOOTPRINT_CELLS);

const PLANTED_SMALL_TREE_OCCUPIED_LOCAL_OFFSET_KEYS = createOccupiedLocalOffsetSet(
  PLANTED_SMALL_TREE_LOCAL_OFFSETS
);
const GROWN_SMALL_TREE_OCCUPIED_LOCAL_OFFSET_KEYS = createOccupiedLocalOffsetSet(
  GROWN_SMALL_TREE_LOCAL_OFFSETS
);

export const isPlantedSmallTreeOccupiedLocalOffset = (
  localX: number,
  localY: number
): boolean => PLANTED_SMALL_TREE_OCCUPIED_LOCAL_OFFSET_KEYS.has(createLocalOffsetKey(localX, localY));

export const isGrownSmallTreeOccupiedLocalOffset = (
  localX: number,
  localY: number
): boolean => GROWN_SMALL_TREE_OCCUPIED_LOCAL_OFFSET_KEYS.has(createLocalOffsetKey(localX, localY));
