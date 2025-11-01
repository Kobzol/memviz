export interface Value {
  kind: string;
  size: number;
  id: string;
}

export interface NoneVal extends Value {
  kind: "none";
}

export interface BoolVal extends Value {
  kind: "bool";
  value: boolean;
}

export interface IntVal extends Value {
  kind: "int";
  value: number;
}

export interface FloatVal extends Value {
  kind: "float";
  value: number;
}

export interface ComplexVal extends Value {
  kind: "complex";
  real_value: string;
  imaginary_value: string;
}

export interface DeferredStrVal extends Value {
  kind: "defStr";
  length: number;
}

export interface DeferredListVal extends Value {
  kind: "defList";
  element_count: number;
}

export interface DeferredTupleVal extends Value {
  kind: "defTuple";
  element_count: number;
}

export interface DeferredSetVal extends Value {
  kind: "defSet";
  element_count: number;
}

export interface DeferredFrozenSetVal extends Value {
  kind: "defFrozenset";
  element_count: number;
}

export interface DeferredDictVal extends Value {
  kind: "defDict";
  key_value_pair_count: number;
}

export interface KeyValuePair {
  key: Value;
  value: Value;
}

export interface RangeVal extends Value {
  kind: "range";
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
  type_name: string;
}

export interface ObjectVal extends Value {
  kind: "obj";
  attributes: KeyValuePair[];
  methods: string[];
}
