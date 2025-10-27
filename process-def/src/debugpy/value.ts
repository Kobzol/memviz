export interface Value {
  kind: string;
  size: number;
}

interface DeferredVal extends Value {
  reference: string;
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

export interface DeferredStrVal extends DeferredVal {
  kind: "defStr";
  length: number;
}

export interface DeferredListVal extends DeferredVal {
  kind: "defList";
  element_count: number;
}

export interface DeferredTupleVal extends DeferredVal {
  kind: "defTuple";
  element_count: number;
}

export interface DeferredSetVal extends DeferredVal {
  kind: "defSet";
  element_count: number;
}

export interface DeferredFrozenSetVal extends DeferredVal {
  kind: "defFrozenset";
  element_count: number;
}

export interface DeferredDictVal extends DeferredVal {
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

export interface DeferredObjectVal extends DeferredVal {
  kind: "defObj";
  type_name: string;
}

export interface ObjectVal extends Value {
  kind: "obj";
  attributes: KeyValuePair[];
  methods: string[];
}
