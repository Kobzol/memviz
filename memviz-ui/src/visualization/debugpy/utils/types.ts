import type {
  BoolVal,
  CollectionVal,
  FloatVal,
  IntVal,
  Value,
} from "process-def/debugpy";

export type ScalarVal = BoolVal | IntVal | FloatVal;

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
