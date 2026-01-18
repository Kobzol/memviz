import {
  type CollectionVal,
  type DeferredDictVal,
  type DeferredFrozenSetVal,
  type DeferredListVal,
  type DeferredSetVal,
  type DeferredStrVal,
  type DeferredTupleVal,
  type ObjectVal,
  type Value,
  ValueKind,
} from "process-def/debugpy";
import { assert } from "../../../utils";
import { valueState } from "../store";
import {
  LazyDictVal,
  LazyFrozenSetVal,
  LazyListVal,
  LazyObjectVal,
  LazySetVal,
  LazyStrVal,
  LazyTupleVal,
} from "./lazy-value";
import type { RichAttribute, RichValue } from "./type";

function isRawStrVal(v: Value): v is DeferredStrVal {
  return v.kind === ValueKind.STR;
}

function isRawFlatCollectionVal(v: Value): v is CollectionVal {
  return (
    v.kind === ValueKind.LIST ||
    v.kind === ValueKind.TUPLE ||
    v.kind === ValueKind.SET ||
    v.kind === ValueKind.FROZENSET
  );
}

function isRawList(v: Value): v is DeferredListVal {
  return v.kind === ValueKind.LIST;
}

function isRawTuple(v: Value): v is DeferredTupleVal {
  return v.kind === ValueKind.TUPLE;
}

function isRawSet(v: Value): v is DeferredSetVal {
  return v.kind === ValueKind.SET;
}

function isRawFrozenSet(v: Value): v is DeferredFrozenSetVal {
  return v.kind === ValueKind.FROZENSET;
}

function isRawDictVal(v: Value): v is DeferredDictVal {
  return v.kind === ValueKind.DICT;
}

function isObjectVal(v: Value): v is ObjectVal {
  return v.kind === ValueKind.OBJECT;
}

export function rawToRichValues(rawValues: Value[]): RichValue[] {
  const richValues = rawValues.map((val) => {
    const existingVal = valueState.value.getValueById(val.id);
    if (existingVal) {
      assert(existingVal.kind === val.kind, "Mismatched kinds for value id");
      return existingVal;
    }

    if (isRawStrVal(val)) {
      const strVal = val as DeferredStrVal;
      const richVal = new LazyStrVal(
        strVal.id,
        strVal.size,
        strVal.length,
        strVal.content,
      );
      valueState.value.addValue(richVal);
      return richVal;
    }

    if (isRawFlatCollectionVal(val)) {
      const richElements = rawToRichValues(
        Object.values((val as any).elements),
      );
      const richElementMap: { [key: number]: RichValue } = {};
      richElements.forEach((element, index) => {
        richElementMap[index] = element;
      });
      let richFlatCollectionVal: RichValue;
      if (isRawList(val)) {
        const listVal = val as DeferredListVal;
        richFlatCollectionVal = new LazyListVal(
          listVal.id,
          listVal.element_count,
          richElementMap,
        );
      } else if (isRawTuple(val)) {
        const tupleVal = val as DeferredTupleVal;
        richFlatCollectionVal = new LazyTupleVal(
          tupleVal.id,
          tupleVal.element_count,
          richElementMap,
        );
      } else if (isRawSet(val)) {
        const setVal = val as DeferredSetVal;
        richFlatCollectionVal = new LazySetVal(
          setVal.id,
          setVal.element_count,
          richElementMap,
        );
      } else if (isRawFrozenSet(val)) {
        const frozenSetVal = val as DeferredFrozenSetVal;
        richFlatCollectionVal = new LazyFrozenSetVal(
          frozenSetVal.id,
          frozenSetVal.element_count,
          richElementMap,
        );
      } else {
        console.error(`Unhandled collection type: ${val.kind}`);
        richFlatCollectionVal = val as RichValue;
      }
      valueState.value.addValue(richFlatCollectionVal);
      return richFlatCollectionVal;
    }
    if (isObjectVal(val)) {
      let attributes: RichAttribute[] | null = null;
      if (val.attributes !== null) {
        attributes = val.attributes.map((attr) => {
          return {
            name: attr.name,
            value: attr.value ? rawToRichValues([attr.value])[0] : null,
            is_descriptor: attr.is_descriptor,
          };
        });
      }
      const richObjectVal = new LazyObjectVal(
        val.id,
        val.size,
        val.type_name,
        attributes,
      );
      valueState.value.addValue(richObjectVal);
      return richObjectVal;
    }
    if (isRawDictVal(val)) {
      const dictVal = val as DeferredDictVal;
      const richPairs: { [key: number]: { key: RichValue; value: RichValue } } =
        {};
      for (const [idxStr, pair] of Object.entries(dictVal.pairs)) {
        const idx = Number(idxStr);
        richPairs[idx] = {
          key: rawToRichValues([pair.key])[0],
          value: rawToRichValues([pair.value])[0],
        };
      }
      const richDictVal = new LazyDictVal(
        dictVal.id,
        dictVal.pair_count,
        richPairs,
      );
      valueState.value.addValue(richDictVal);
      return richDictVal;
    }
    const richVal = val as RichValue;
    valueState.value.addValue(richVal);
    return richVal;
  });

  return richValues;
}
