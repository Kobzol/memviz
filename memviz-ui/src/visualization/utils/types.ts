import type { TyBool, TyFloat, TyInt, TyPtr, Type } from "process-def";
import type { TyArray } from "process-def/src";

export type TyScalar = TyBool | TyInt | TyFloat;

export type TyChar = Omit<TyInt, "size"> & {
  size: 1;
};

export type TyStringPtr = Omit<TyPtr, "target"> & { target: TyChar };
export type TyCharArray = Omit<TyArray, "type"> & { type: TyChar };

export function isScalarType(type: Type): type is TyScalar {
  return type.kind === "bool" || type.kind === "int" || type.kind === "float";
}

export function isCharType(type: Type): type is TyChar {
  if (type.name !== "char") return false;
  if (type.kind !== "int") return false;
  if (type.size !== 1) return false;
  return true;
}
