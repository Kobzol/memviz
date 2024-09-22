import type { Address, TyBool, TyFloat, TyInt, Type } from "process-def";
import { assert } from "../utils";

export interface Value<T extends Type> {
  type: T;
  address: Address | null;
}

const FORMATTERS: { [key: string]: (view: DataView) => string } = {
  i1: (view: DataView) => view.getInt8(0).toString(),
  i2: (view: DataView) => view.getInt16(0, true).toString(),
  i4: (view: DataView) => view.getInt32(0, true).toString(),
  i8: (view: DataView) => view.getBigInt64(0, true).toString(),
  u1: (view: DataView) => view.getUint8(0).toString(),
  u2: (view: DataView) => view.getUint16(0, true).toString(),
  u4: (view: DataView) => view.getUint32(0, true).toString(),
  u8: (view: DataView) => view.getBigUint64(0, true).toString(),
  f4: (view: DataView) => toFixedIfNecessary(view.getFloat32(0, true), 4),
  f8: (view: DataView) => toFixedIfNecessary(view.getFloat64(0, true), 4),
};

export type TyScalar = TyBool | TyInt | TyFloat;

export function scalarAsString(buffer: ArrayBuffer, type: TyScalar): string {
  const view = new DataView(buffer);
  if (type.kind === "bool") {
    return view.getUint8(0) === 0 ? "false" : "true";
  }

  let key = "";
  if (type.kind === "int") {
    key += type.signed ? "i" : "u";
  } else if (type.kind === "float") {
    key += "f";
  }
  key += type.size;

  // console.log(`Resolving key ${key} for type`, type);
  return FORMATTERS[key](view);
}

export function formatAddress(address: Address | null): string {
  if (address === null) {
    return "<unknown address>";
  }
  const formatted = address.toString(16).toUpperCase();
  return `0x${formatted.padStart(16, "0")}`;
}

export function formatTypeSize(type: Type): string {
  return `${type.size} byte${type.size === 1 ? "" : "s"}`;
}

export function formatLocation(file: string | null, line: number): string {
  let result = file;
  if (file?.includes("/")) {
    const segments = file.split("/");
    result = segments[segments.length - 1];
  }
  return `${result ?? "<unknown-file>"}:${line}`;
}

export function bufferAsBigInt(buffer: ArrayBuffer, size: number): bigint {
  assert(size === 4 || size === 8, "only 4 and 8 byte pointers are supported");

  const view = new DataView(buffer);
  if (size === 8) {
    return view.getBigUint64(0, true);
  }
  if (size === 4) {
    return BigInt(view.getUint32(0, true));
  }
  return BigInt(0);
}

function toFixedIfNecessary(value: number, decimalPlaces: number): string {
  const formatted = value.toFixed(decimalPlaces);
  const num = Number(formatted);
  return num.toString();
}
