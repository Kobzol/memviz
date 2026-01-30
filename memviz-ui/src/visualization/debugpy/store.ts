import { type ShallowRef, shallowRef } from "vue";
import { ValueTracker } from "./value-tracker";

export const valueState: ShallowRef<ValueTracker> = shallowRef(
  new ValueTracker(),
);
