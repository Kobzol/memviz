import { ValueKind } from "process-def/debugpy";
import type {
  LazyDictVal,
  LazyFlatCollectionVal,
  LazyFrozenSetVal,
  LazyListVal,
  LazyObjectVal,
  LazySetVal,
  LazyStrVal,
  LazyTupleVal,
} from "../type/lazy-value";
import type {
  RichBoolVal,
  RichComplexVal,
  RichFloatVal,
  RichFunctionVal,
  RichIntVal,
  RichModuleVal,
  RichNoneVal,
  RichRangeVal,
  RichTypeVal,
  RichValue,
} from "../type/type";

export type RichScalarVal = RichBoolVal | RichIntVal | RichFloatVal;

export function isScalar(type: RichValue): type is RichScalarVal {
  return (
    type.kind === ValueKind.BOOL ||
    type.kind === ValueKind.INT ||
    type.kind === ValueKind.FLOAT
  );
}

export function isFlatCollection(
  type: RichValue,
): type is LazyFlatCollectionVal {
  return (
    type.kind === ValueKind.LIST ||
    type.kind === ValueKind.TUPLE ||
    type.kind === ValueKind.SET ||
    type.kind === ValueKind.FROZENSET
  );
}

export function isNone(value: RichValue): value is RichNoneVal {
  return value.kind === ValueKind.NONE;
}

export function isComplex(value: RichValue): value is RichComplexVal {
  return value.kind === ValueKind.COMPLEX;
}

export function isStr(value: RichValue): value is LazyStrVal {
  return value.kind === ValueKind.STR;
}

export function isDict(value: RichValue): value is LazyDictVal {
  return value.kind === ValueKind.DICT;
}

export function isRange(value: RichValue): value is RichRangeVal {
  return value.kind === ValueKind.RANGE;
}

export function isFunction(value: RichValue): value is RichFunctionVal {
  return value.kind === ValueKind.FUNCTION;
}

export function isObject(value: RichValue): value is LazyObjectVal {
  return value.kind === ValueKind.OBJECT;
}

export function isModule(value: RichValue): value is RichModuleVal {
  return value.kind === ValueKind.MODULE;
}

export function isType(value: RichValue): value is RichTypeVal {
  return value.kind === ValueKind.TYPE;
}

export function isList(value: RichValue): value is LazyListVal {
  return value.kind === ValueKind.LIST;
}

export function isTuple(value: RichValue): value is LazyTupleVal {
  return value.kind === ValueKind.TUPLE;
}

export function isSet(value: RichValue): value is LazySetVal {
  return value.kind === ValueKind.SET;
}

export function isFrozenSet(value: RichValue): value is LazyFrozenSetVal {
  return value.kind === ValueKind.FROZENSET;
}
