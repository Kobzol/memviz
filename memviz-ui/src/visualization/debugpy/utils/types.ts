import type {
  BoolVal,
  CollectionVal,
  ComplexVal,
  DeferredDictVal,
  DeferredObjectVal,
  DeferredStrVal,
  FloatVal,
  FunctionVal,
  IntVal,
  ModuleVal,
  NoneVal,
  RangeVal,
  TypeVal,
  Value,
} from "process-def/debugpy";

export type ScalarVal = BoolVal | IntVal | FloatVal;

export function isNone(value: Value): value is NoneVal {
  return value.kind === "none";
}

export function isComplex(value: Value): value is ComplexVal {
  return value.kind === "complex";
}

export function isStr(value: Value): value is DeferredStrVal {
  return value.kind === "str";
}

export function isDict(value: Value): value is DeferredDictVal {
  return value.kind === "dict";
}

export function isRange(value: Value): value is RangeVal {
  return value.kind === "range";
}

export function isFunction(value: Value): value is FunctionVal {
  return value.kind === "function";
}

export function isObject(value: Value): value is DeferredObjectVal {
  return value.kind === "object" || value.kind === "deferred_object";
}

export function isModule(value: Value): value is ModuleVal {
  return value.kind === "module";
}

export function isType(value: Value): value is TypeVal {
  return value.kind === "type";
}

export function isScalar(type: Value): type is ScalarVal {
  return type.kind === "bool" || type.kind === "int" || type.kind === "float";
}

export function isCollection(type: Value): type is CollectionVal {
  return (
    type.kind === "list" ||
    type.kind === "tuple" ||
    type.kind === "set" ||
    type.kind === "frozenset"
  );
}
