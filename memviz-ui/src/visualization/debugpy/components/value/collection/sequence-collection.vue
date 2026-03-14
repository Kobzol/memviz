<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import MemorySlot from "../../memory-slot.vue";
import { LazyListVal, LazyTupleVal } from "../../../type/lazy-value";
import { processResolver } from "../../../../store";
import { valueState } from "../../../store";
import { assert } from "../../../../../utils";
import { isList, isTuple } from "../../../utils/types";
import { PythonId } from "process-def/debugpy";
import { RichValue } from "../../../type/type";

const props = defineProps<{
  id: PythonId;
  startIndex: number;
  visibleElementCount: number;
}>();

const visibleElements = ref<RichValue[]>([]);
const pythonValue = computed(() => {
  let val = valueState.value.getValueOrThrow(props.id);
  assert(
    isList(val) || isTuple(val),
    `Value with id ${props.id} is not a LazyListVal or LazyTupleVal`,
  );
  return val as LazyListVal | LazyTupleVal;
});

async function fetchElements() {
  const resolver = processResolver.value;
  if (!resolver) return;

  const count = Math.min(
    props.visibleElementCount,
    pythonValue.value.element_count - props.startIndex,
  );
  visibleElements.value = await pythonValue.value.getElements(
    resolver.debugpy,
    props.startIndex,
    count,
  );
}

watch(() => [props.startIndex, props.visibleElementCount], fetchElements);

onMounted(fetchElements);
</script>

<template>
  <table class="elements-table">
    <tr v-for="(el, index) in visibleElements" :key="index">
      <td class="index">{{ index + startIndex }}</td>
      <td class="value">
        <MemorySlot :id="el.id" />
      </td>
    </tr>
  </table>
</template>

<style scoped lang="scss">
.elements-table {
  width: 100%;
  border-collapse: collapse;
  border: none;
}

td {
  border: 1px solid #858585;
  padding: 0;

  &:first-child {
    border-left: none;
  }

  &:last-child {
    border-right: none;
  }
}

.index {
  background-color: #dae4ef;
  line-height: 1;
  text-align: center;
  font-size: 1.2em;
  width: 15%;
}

.value {
  padding-left: 5px;
}
</style>
