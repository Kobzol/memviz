import type {
  BoolVal,
  CollectionVal,
  ComplexVal,
  DeferredDictVal,
  DeferredFrozenSetVal,
  DeferredListVal,
  DeferredObjectVal,
  DeferredSetVal,
  DeferredTupleVal,
  FloatVal,
  FunctionVal,
  IntVal,
  ModuleVal,
  NoneVal,
  ObjectVal,
  Place,
  RangeVal,
  ResolvedObjectVal,
  TypeVal,
} from "process-def/debugpy";

export abstract class RichValue {
  abstract readonly kind: string;
  constructor(public readonly id: string) {}
}

export type RichIntVal = IntVal & RichValue;
export type RichFloatVal = FloatVal & RichValue;
export type RichBoolVal = BoolVal & RichValue;
export type RichComplexVal = ComplexVal & RichValue;
export type RichNoneVal = NoneVal & RichValue;
export type RichCollectionVal = CollectionVal & RichValue;
export type RichDeferredListVal = DeferredListVal & RichValue;
export type RichDeferredTupleVal = DeferredTupleVal & RichValue;
export type RichDeferredSetVal = DeferredSetVal & RichValue;
export type RichDeferredFrozenSetVal = DeferredFrozenSetVal & RichValue;
export type RichDeferredDictVal = DeferredDictVal & RichValue;
export type RichDeferredObjectVal = DeferredObjectVal & RichValue;
export type RichRangeVal = RangeVal & RichValue;
export type RichFunctionVal = FunctionVal & RichValue;
export type RichObjectVal = ObjectVal & RichValue;
export type RichResolvedObjectVal = ResolvedObjectVal & RichValue;
export type RichModuleVal = ModuleVal & RichValue;
export type RichTypeVal = TypeVal & RichValue;

export type RichVariables = {
  places: Place[];
  values: RichValue[];
};
