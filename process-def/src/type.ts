interface TyBase {
  name: string;
}

interface TyBool extends TyBase {
  kind: "bool";
  size: number;
}

interface TyInt extends TyBase {
  kind: "int";
  size: number;
  signed: boolean;
}

interface TyFloat extends TyBase {
  kind: "float";
  size: number;
}

interface TyPtr extends TyBase {
  kind: "ptr";
  target: Type;
  size: number;
}

interface StructField {
  name: string;
  type: Type;
  offset_bits: number;
}

interface TyStruct extends TyBase {
  kind: "struct";
  fields: StructField[];
  size: number;
}

interface TyArray extends TyBase {
  kind: "array";
  type: Type;
  element_count: number;
}

interface TyUnknown extends TyBase {
  kind: "unknown";
  size: number;
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
