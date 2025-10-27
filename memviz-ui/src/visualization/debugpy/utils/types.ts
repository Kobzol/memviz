import type {
  BoolVal,
  DeferredFrozenSetVal,
  DeferredListVal,
  DeferredSetVal,
  DeferredTupleVal,
  FloatVal,
  IntVal,
  Value,
} from "process-def/debugpy";

export type ScalarVal = BoolVal | IntVal | FloatVal;

export type CollectionVal =
  | DeferredListVal
  | DeferredTupleVal
  | DeferredSetVal
  | DeferredFrozenSetVal;

export function isScalarType(type: Value): type is ScalarVal {
  return type.kind === "bool" || type.kind === "int" || type.kind === "float";
}

export function isCollectionType(type: Value): type is CollectionVal {
  return (
    type.kind === "defList" ||
    type.kind === "defTuple" ||
    type.kind === "defSet" ||
    type.kind === "defFrozenSet"
  );
}
