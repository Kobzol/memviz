import type { Address, Type } from "process-def";
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
