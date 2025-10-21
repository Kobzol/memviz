import type { AddressStr } from "..";
import type { Type } from "./type";

export type {
  Type,
  TyArray,
  TyBool,
  TyFloat,
  TyInt,
  TyPtr,
  TyEnum,
  TyStruct,
} from "./type";

export enum PlaceKind {
  Variable = "variable",
  ShadowedVariable = "shadowed",
  Parameter = "parameter",
  GlobalVariable = "global",
}

export interface Place {
  kind: PlaceKind;
  name: string;
  address: AddressStr | null;
  type: Type;
  initialized: boolean;
  line: number;
}
