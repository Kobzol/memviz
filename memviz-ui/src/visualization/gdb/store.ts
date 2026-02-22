import { type ShallowRef, shallowRef } from "vue";
import { AllocationTracker } from "./allocation-tracker";
import { ComponentMap as GDBComponentMap } from "./pointers/component-map";
import { PointerMap } from "./pointers/pointer-map";

export const gdbComponentMap: ShallowRef<GDBComponentMap> = shallowRef(
  new GDBComponentMap(),
);

export const pointerMap: ShallowRef<PointerMap> = shallowRef(new PointerMap());

export const allocationState: ShallowRef<AllocationTracker> = shallowRef(
  new AllocationTracker(),
);
