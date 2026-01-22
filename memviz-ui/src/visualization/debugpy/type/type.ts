import type { Place, PythonId, ValueKind } from "process-def/debugpy";

export abstract class RichValue {
  abstract readonly kind: string;
  constructor(public readonly id: PythonId) {}
}

export interface RichNoneVal extends RichValue {
  readonly kind: ValueKind.NONE;
  readonly size: number;
}

export interface RichBoolVal extends RichValue {
  readonly kind: ValueKind.BOOL;
  readonly size: number;
  readonly value: boolean;
}

export interface RichIntVal extends RichValue {
  readonly kind: ValueKind.INT;
  readonly size: number;
  readonly value: number;
}

export interface RichFloatVal extends RichValue {
  readonly kind: ValueKind.FLOAT;
  readonly size: number;
  readonly value: number;
}

export interface RichComplexVal extends RichValue {
  readonly kind: ValueKind.COMPLEX;
  readonly size: number;
  readonly real_value: string;
  readonly imaginary_value: string;
}

export interface RichKeyValuePair {
  readonly key: RichValue;
  readonly value: RichValue;
}

export interface RichRangeVal extends RichValue {
  readonly kind: ValueKind.RANGE;
  readonly size: number;
  readonly start: number | null;
  readonly stop: number | null;
  readonly step: number | null;
}

export interface RichFunctionVal extends RichValue {
  readonly kind: ValueKind.FUNCTION;
  readonly name: string;
  readonly qualified_name: string;
  readonly module: string | null;
  readonly signature: string | null;
}

export interface RichAttribute {
  readonly name: string;
  readonly value: RichValue | null;
  readonly is_descriptor: boolean;
}

export interface RichModuleVal extends RichValue {
  readonly kind: ValueKind.MODULE;
  readonly name: string;
}

export interface RichTypeVal extends RichValue {
  readonly kind: ValueKind.TYPE;
  readonly name: string;
  readonly module: string;
}

export type RichVariables = {
  places: Place[];
  values: RichValue[];
};
