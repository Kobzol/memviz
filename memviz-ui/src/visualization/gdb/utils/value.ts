import type { Address } from "process-def";
import type { Type } from "process-def/gdb";
import type { AddressRegion } from "../pointers/region";

export interface Value<T extends Type> {
  type: T;
  address: Address | null;
}

export function valueToRegion<T extends Type>(value: Value<T>): AddressRegion {
  return {
    address: value.address,
    size: value.type.size,
  };
}
