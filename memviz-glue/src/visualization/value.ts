import type { Address, Type } from "process-def";

export interface Value {
  type: Type;
  address: Address | null;
}

const ACCESSORS: { [key: string]: (view: DataView) => number | bigint } = {
  i1: (view: DataView) => view.getInt8(0),
  i2: (view: DataView) => view.getInt16(0, true),
  i4: (view: DataView) => view.getInt32(0, true),
  i8: (view: DataView) => view.getBigInt64(0, true),
  u1: (view: DataView) => view.getUint8(0),
  u2: (view: DataView) => view.getUint16(0, true),
  u4: (view: DataView) => view.getUint32(0, true),
  u8: (view: DataView) => view.getBigUint64(0, true),
  f4: (view: DataView) => view.getFloat32(0, true),
  f8: (view: DataView) => view.getFloat64(0, true),
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
  return ACCESSORS[key](view).toString();
}
