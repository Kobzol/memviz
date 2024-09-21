interface TyBase {
  name: string;
  size: number;
}

export interface TyBool extends TyBase {
  kind: "bool";
}

export interface TyInt extends TyBase {
  kind: "int";
  signed: boolean;
}

export interface TyFloat extends TyBase {
  kind: "float";
}

interface TyPtr extends TyBase {
  kind: "ptr";
  target: Type;
}

interface StructField {
  name: string;
  type: Type;
  offset_bits: number;
}

interface TyStruct extends TyBase {
  kind: "struct";
  fields: StructField[];
}

export interface TyArray extends TyBase {
  kind: "array";
  type: Type;
  element_count: number;
}

interface TyUnknown extends TyBase {
  kind: "unknown";
}

interface TyInvalid extends TyBase {
  kind: "invalid";
  error: string;
}

export type Type =
  | TyBool
  | TyInt
  | TyFloat
  | TyPtr
  | TyStruct
  | TyArray
  | TyUnknown
  | TyInvalid;
