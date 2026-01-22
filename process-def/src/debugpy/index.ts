import type { AddressStr } from "..";
import type { Value } from "./value";

export type {
  PythonId,
  Value,
  NoneVal,
  BoolVal,
  IntVal,
  FloatVal,
  ComplexVal,
  CollectionVal,
  DeferredStrVal,
  DeferredListVal,
  DeferredTupleVal,
  DeferredSetVal,
  DeferredFrozenSetVal,
  DeferredDictVal,
  RangeVal,
  FunctionVal,
  KeyValuePair,
  ObjectVal,
  ModuleVal,
  TypeVal,
  Attribute,
} from "./value";

export { ValueKind } from "./value";

export enum PlaceKind {
  Variable = "v",
  Parameter = "p",
  Return = "r",
}

export interface Place {
  name: string;
  id: AddressStr;
  kind: PlaceKind;
}

export interface Variables {
  places: Place[];
  values: Value[];
}
