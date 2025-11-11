import type { AddressStr } from "..";
import type { Value } from "./value";

export type {
  Value,
  NoneVal,
  BoolVal,
  IntVal,
  FloatVal,
  ComplexVal,
  DeferredStrVal,
  DeferredListVal,
  DeferredTupleVal,
  DeferredSetVal,
  DeferredFrozenSetVal,
  DeferredDictVal,
  DeferredObjectVal,
  RangeVal,
  FunctionVal,
  KeyValuePair,
  ObjectVal,
  ModuleVal,
  TypeVal,
} from "./value";

export interface Place {
  name: string;
  id: AddressStr;
}

export interface Variables {
  places: Place[];
  values: Value[];
}
