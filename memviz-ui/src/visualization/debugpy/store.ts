import { type ShallowRef, shallowRef } from "vue";
import { ComponentMap as DebugpyComponentMap } from "./component-map";
import { ObjectVisibilityState } from "./frame-visibility";
import { ValueTracker } from "./value-tracker";

export const valueState: ShallowRef<ValueTracker> = shallowRef(
  new ValueTracker(),
);

export const debugpyComponentMap: ShallowRef<DebugpyComponentMap> = shallowRef(
  new DebugpyComponentMap(),
);

export const objectVisibilityState = new ObjectVisibilityState();
