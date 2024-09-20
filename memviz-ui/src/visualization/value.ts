import type { Address, Type } from "process-def";

export interface Value {
  type: Type;
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

export function scalarAsString(buffer: ArrayBuffer, type: Type): string {
  const view = new DataView(buffer);
  if (type.kind === "bool") {
    return view.getUint8(0) === 0 ? "false" : "true";
  }

  let key = "";
  if (type.kind === "int") {
    key += type.signed ? "i" : "u";
  } else if (type.kind === "float") {
    key += "f";
  } else {
    throw new Error(`Invalid type ${type.kind} passed to scalarAsString`);
  }
  key += type.size;

  // console.log(`Resolving key ${key} for type`, type);
  return FORMATTERS[key](view);
}

function toFixedIfNecessary(value: number, decimalPlaces: number): string {
  const formatted = value.toFixed(decimalPlaces);
  const num = Number(formatted);
  return num.toString();
}
