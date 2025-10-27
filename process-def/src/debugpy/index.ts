import type { AddressStr } from "..";
import type { Value } from "./value";

export type { Value, KeyValuePair, ObjectVal } from "./value";

export interface Place {
  name: string;
  id: AddressStr;
}

export interface Variables {
  places: Place[];
  values: { [key: AddressStr]: Value };
}
