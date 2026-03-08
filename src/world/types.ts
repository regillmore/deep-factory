export type TileId = number;

export interface ChunkCoord {
  x: number;
  y: number;
}

export interface Chunk {
  coord: ChunkCoord;
  tiles: Uint8Array;
  liquidLevels: Uint8Array;
  lightLevels: Uint8Array;
  lightDirty: boolean;
  lightDirtyColumnMask: number;
}
