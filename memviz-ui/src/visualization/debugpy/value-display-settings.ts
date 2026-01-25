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

export const SEQUENCE_ITEM_DISPLAY_COUNT = 5;
export const SEQUENCE_PRELOAD_BUFFER_SIZE = 5;
export const SEQUENCE_BATCH_SIZE = 10;
export const STRING_BATCH_SIZE = 100;
