export type PythonId = string;

export enum ValueKind {
  NONE = "none",
  BOOL = "bool",
  INT = "int",
  FLOAT = "float",
  COMPLEX = "complex",
  STR = "str",
  LIST = "list",
  TUPLE = "tuple",
  SET = "set",
  FROZENSET = "frozenset",
  DICT = "dict",
  RANGE = "range",
  FUNCTION = "function",
  OBJECT = "object",
  MODULE = "module",
  TYPE = "type",
}

export interface Value {
  kind: string;
  id: PythonId;
}

export interface NoneVal extends Value {
  kind: ValueKind.NONE;
  size: number;
}

export interface BoolVal extends Value {
  kind: ValueKind.BOOL;
  size: number;
  value: boolean;
}

export interface IntVal extends Value {
  kind: ValueKind.INT;
  size: number;
  value: number;
}

export interface FloatVal extends Value {
  kind: ValueKind.FLOAT;
  size: number;
  value: number;
}

export interface ComplexVal extends Value {
  kind: ValueKind.COMPLEX;
  size: number;
  real_value: string;
  imaginary_value: string;
}

export interface DeferredStrVal extends Value {
  kind: ValueKind.STR;
  size: number;
  length: number;
  content: { [key: number]: string };
}

export interface CollectionVal extends Value {
  element_count: number;
  elements: { [key: number]: Value };
}

export interface DeferredListVal extends CollectionVal {
  kind: ValueKind.LIST;
  size: number;
}

export interface DeferredTupleVal extends CollectionVal {
  kind: ValueKind.TUPLE;
  size: number;
}

export interface DeferredSetVal extends CollectionVal {
  kind: ValueKind.SET;
  size: number;
}

export interface DeferredFrozenSetVal extends CollectionVal {
  kind: ValueKind.FROZENSET;
  size: number;
}

export interface KeyValuePair {
  key: Value;
  value: Value;
}

export interface DeferredDictVal extends Value {
  kind: ValueKind.DICT;
  size: number;
  pair_count: number;
  pairs: { [key: number]: KeyValuePair };
}

export interface RangeVal extends Value {
  kind: ValueKind.RANGE;
  size: number;
  start: number | null;
  stop: number | null;
  step: number | null;
}

export interface FunctionVal extends Value {
  kind: ValueKind.FUNCTION;
  name: string;
  qualified_name: string;
  module: string | null;
  signature: string | null;
}

export interface ObjectVal extends Value {
  kind: string;
  size: number;
  type_name: string;
  attributes: Attribute[] | null;
}

export interface Attribute {
  name: string;
  value: Value | null;
  is_descriptor: boolean;
}

export interface ModuleVal extends Value {
  kind: ValueKind.MODULE;
  name: string;
}

export interface TypeVal extends Value {
  kind: ValueKind.TYPE;
  name: string;
  module: string;
}
