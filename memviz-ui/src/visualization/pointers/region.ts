import type { Address } from "process-def";

export interface AddressRegion {
  address: Address | null;
  size: number;
}

export const EMPTY_REGION: AddressRegion = {
  address: null,
  size: 0,
};
