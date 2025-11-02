export interface Value {
  kind: string;
  id: string;
}

export interface NoneVal extends Value {
  kind: "none";
  size: number;
}

export interface BoolVal extends Value {
  kind: "bool";
  size: number;
  value: boolean;
}

export interface IntVal extends Value {
  kind: "int";
  size: number;
  value: number;
}

export interface FloatVal extends Value {
  kind: "float";
  size: number;
  value: number;
}

export interface ComplexVal extends Value {
  kind: "complex";
  size: number;
  real_value: string;
  imaginary_value: string;
}

export interface DeferredStrVal extends Value {
  kind: "defStr";
  size: number;
  length: number;
}

export interface DeferredListVal extends Value {
  kind: "defList";
  size: number;
  element_count: number;
}

export interface DeferredTupleVal extends Value {
  kind: "defTuple";
  size: number;
  element_count: number;
}

export interface DeferredSetVal extends Value {
  kind: "defSet";
  size: number;
  element_count: number;
}

export interface DeferredFrozenSetVal extends Value {
  kind: "defFrozenset";
  size: number;
  element_count: number;
}

export interface DeferredDictVal extends Value {
  kind: "defDict";
  size: number;
  key_value_pair_count: number;
}

export interface KeyValuePair {
  key: Value;
  value: Value;
}

export interface RangeVal extends Value {
  kind: "range";
  size: number;
  start: number | null;
  stop: number | null;
  step: number | null;
}

export interface FunctionVal extends Value {
  kind: "function";
  name: string;
  qualified_name: string;
  module: string | null;
  signature: string | null;
}

export interface DeferredObjectVal extends Value {
  kind: "defObj";
  size: number;
  type_name: string;
}

export interface ObjectVal extends Value {
  kind: "obj";
  size: number;
  type_name: string;
  attributes: { [key: string]: Value };
  methods: { [key: string]: FunctionVal };
}
