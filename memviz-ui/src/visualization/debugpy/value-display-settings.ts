export enum DisplayMode {
  INLINE = "inline",
  DETACHED = "detached",
}

export const valueDisplaySettings: Map<string, DisplayMode> = new Map([
  ["none", DisplayMode.INLINE],
  ["bool", DisplayMode.INLINE],
  ["int", DisplayMode.DETACHED],
  ["float", DisplayMode.INLINE],
  ["complex", DisplayMode.INLINE],
  ["str", DisplayMode.INLINE],
  ["list", DisplayMode.DETACHED],
  ["tuple", DisplayMode.DETACHED],
  ["set", DisplayMode.DETACHED],
  ["frozenset", DisplayMode.DETACHED],
  ["dict", DisplayMode.DETACHED],
  ["deferred_object", DisplayMode.DETACHED],
  ["range", DisplayMode.INLINE],
  ["function", DisplayMode.INLINE],
  ["keyValuePair", DisplayMode.INLINE],
  ["object", DisplayMode.DETACHED],
  ["resolvedObject", DisplayMode.DETACHED],
  ["module", DisplayMode.INLINE],
  ["type", DisplayMode.INLINE],
]);
