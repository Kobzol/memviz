import {
  type DeferredDictVal,
  type DeferredFrozenSetVal,
  type DeferredListVal,
  type DeferredSetVal,
  type DeferredStrVal,
  type DeferredTupleVal,
  type FlatCollectionVal,
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
import type { RichAttribute, RichKeyValuePair, RichValue } from "./type";

function isRawStrVal(v: Value): v is DeferredStrVal {
  return v.kind === ValueKind.STR;
}

function isRawFlatCollectionVal(v: Value): v is FlatCollectionVal {
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

function isRawObjectVal(v: Value): v is ObjectVal {
  return v.kind === ValueKind.OBJECT;
}

export function rawToRichValues(rawValues: Value[]): RichValue[] {
  const richValues = rawValues.map((val) => {
    const existingVal = valueState.value.getValue(val.id);
    if (existingVal) {
      assert(existingVal.kind === val.kind, "Mismatched kinds for value id");
      return existingVal;
    }

    if (isRawStrVal(val)) {
      const richVal = new LazyStrVal(
        val.id,
        val.size,
        val.length,
        val.content,
        val.content_offset,
      );
      valueState.value.addValue(richVal);
      return richVal;
    }

    if (isRawFlatCollectionVal(val)) {
      const richElements = val.elements
        ? rawToRichValues(Object.values(val.elements))
        : null;
      let richFlatCollectionVal: RichValue;
      if (isRawList(val)) {
        richFlatCollectionVal = new LazyListVal(
          val.id,
          val.element_count,
          richElements,
          val.element_offset,
        );
      } else if (isRawTuple(val)) {
        richFlatCollectionVal = new LazyTupleVal(
          val.id,
          val.element_count,
          richElements,
          val.element_offset,
        );
      } else if (isRawSet(val)) {
        richFlatCollectionVal = new LazySetVal(
          val.id,
          val.element_count,
          richElements,
          val.element_offset,
        );
      } else if (isRawFrozenSet(val)) {
        richFlatCollectionVal = new LazyFrozenSetVal(
          val.id,
          val.element_count,
          richElements,
          val.element_offset,
        );
      } else {
        console.error(`Unhandled collection type: ${val.kind}`);
        richFlatCollectionVal = val as RichValue;
      }
      valueState.value.addValue(richFlatCollectionVal);
      return richFlatCollectionVal;
    }
    if (isRawObjectVal(val)) {
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
      const richPairs: RichKeyValuePair[] = [];
      if (val.pairs !== null) {
        for (const [idxStr, pair] of Object.entries(val.pairs)) {
          const idx = Number(idxStr);
          richPairs[idx] = {
            key: rawToRichValues([pair.key])[0],
            value: rawToRichValues([pair.value])[0],
          };
        }
      }
      const richDictVal = new LazyDictVal(val.id, val.pair_count, richPairs);
      valueState.value.addValue(richDictVal);
      return richDictVal;
    }
    const richVal = val as RichValue;
    valueState.value.addValue(richVal);
    return richVal;
  });

  return richValues;
}
