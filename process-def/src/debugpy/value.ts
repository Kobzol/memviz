export interface PythonVal {
  kind: string;
  size: number;
}

interface DeferredVal extends PythonVal {
  reference: string;
}

export interface NoneVal extends PythonVal {
  kind: "none";
}

export interface BoolVal extends PythonVal {
  kind: "bool";
  value: boolean;
}

export interface IntVal extends PythonVal {
  kind: "int";
  value: number;
}

export interface FloatVal extends PythonVal {
  kind: "float";
  value: number;
}

export interface ComplexVal extends PythonVal {
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
  key: PythonVal;
  value: PythonVal;
}

export interface RangeVal extends PythonVal {
  kind: "range";
  start: number | null;
  stop: number | null;
  step: number | null;
}

export interface FunctionVal extends PythonVal {
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

export interface ObjectVal extends PythonVal {
  kind: "obj";
  attributes: KeyValuePair[];
  methods: string[];
}
