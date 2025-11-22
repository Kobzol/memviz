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
  content: { [key: number]: string };
}

export interface CollectionVal extends Value {
  element_count: number;
  elements: { [key: number]: Value };
}

export interface DeferredListVal extends CollectionVal {
  kind: "defList";
  size: number;
}

export interface DeferredTupleVal extends CollectionVal {
  kind: "defTuple";
  size: number;
}

export interface DeferredSetVal extends CollectionVal {
  kind: "defSet";
  size: number;
}

export interface DeferredFrozenSetVal extends CollectionVal {
  kind: "defFrozenset";
  size: number;
}

export interface KeyValuePair {
  key: Value;
  value: Value;
}

export interface DeferredDictVal extends Value {
  kind: "defDict";
  size: number;
  pair_count: number;
  pairs: { [key: number]: KeyValuePair };
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

export interface ObjectVal extends Value {
  kind: string;
  size: number;
  type_name: string;
}

export interface DeferredObjectVal extends ObjectVal {
  kind: "deferred_object";
}

export interface ResolvedObjectVal extends ObjectVal {
  kind: "object";
  data_attributes: { [key: string]: Value };
  methods: { [key: string]: FunctionVal };
  data_descriptors: string[];
  getset_descriptors: string[];
  member_descriptors: string[];
}

export interface ModuleVal extends Value {
  kind: "module";
  name: string;
}

export interface TypeVal extends Value {
  kind: "type";
  name: string;
  module: string;
}
