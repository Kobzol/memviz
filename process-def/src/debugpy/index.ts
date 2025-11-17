import type { AddressStr } from "..";
import type { Value } from "./value";

export type {
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
  DeferredObjectVal,
  RangeVal,
  FunctionVal,
  KeyValuePair,
  ObjectVal,
  ResolvedObjectVal,
  ModuleVal,
  TypeVal,
} from "./value";

export interface Place {
  name: string;
  id: AddressStr;
  is_return_value: boolean;
}

export interface Variables {
  places: Place[];
  values: Value[];
}
