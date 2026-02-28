import { ValueKind } from "process-def/debugpy";

export enum DisplayMode {
  INLINE = "inline",
  DETACHED = "detached",
}

export const valueDisplaySettings: Map<string, DisplayMode> = new Map([
  [ValueKind.NONE, DisplayMode.INLINE],
  [ValueKind.BOOL, DisplayMode.INLINE],
  [ValueKind.INT, DisplayMode.INLINE],
  [ValueKind.FLOAT, DisplayMode.INLINE],
  [ValueKind.COMPLEX, DisplayMode.INLINE],
  [ValueKind.STR, DisplayMode.INLINE],
  [ValueKind.LIST, DisplayMode.DETACHED],
  [ValueKind.TUPLE, DisplayMode.DETACHED],
  [ValueKind.SET, DisplayMode.DETACHED],
  [ValueKind.FROZENSET, DisplayMode.DETACHED],
  [ValueKind.DICT, DisplayMode.DETACHED],
  [ValueKind.RANGE, DisplayMode.INLINE],
  [ValueKind.FUNCTION, DisplayMode.INLINE],
  [ValueKind.OBJECT, DisplayMode.DETACHED],
  [ValueKind.MODULE, DisplayMode.INLINE],
  [ValueKind.TYPE, DisplayMode.INLINE],
]);

export const COLLECTION_ITEM_DISPLAY_COUNT_DEFAULT = 5;
export const COLLECTION_ITEM_DISPLAY_COUNT_MIN = 3;
export const COLLECTION_ITEM_DISPLAY_COUNT_MAX = 20;
export const COLLECTION_PREFETCH_BLOCK_COUNT = 2;
export const COLLECTION_BLOCK_SIZE = 20;
export const STRING_BATCH_SIZE_DEFAULT = 100;
export const STRING_BATCH_SIZE_MIN = 10;
export const STRING_BATCH_SIZE_MAX = 200;
export const CACHE_CAPACITY_BLOCKS = 100;
