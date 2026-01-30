<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import MemorySlot from "../../memory-slot.vue";
import { processResolver } from "../../../../store";
import { LazyFrozenSetVal, LazySetVal } from "../../../type/lazy-value";
import { valueState } from "../../../store";
import { assert } from "../../../../../utils";
import { isFrozenSet, isSet } from "../../../utils/types";
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
    isSet(val) || isFrozenSet(val),
    `Value with id ${props.id} is not a LazySetVal or LazyFrozenSetVal`,
  );
  return val as LazySetVal | LazyFrozenSetVal;
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

watch(() => props.startIndex, fetchElements);

onMounted(fetchElements);
</script>

<template>
  <div class="set">
    <table class="elements-table">
      <tr v-for="(el, index) in visibleElements" :key="index">
        <td>
          <div class="element">
            <div class="value">
              <MemorySlot :id="el.id" />
            </div>
            <div class="index">{{ index + startIndex }}</div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<style scoped lang="scss">
.elements-table {
  border-collapse: collapse;
  width: 100%;
  border: none;
}

td {
  border: 1px solid #3f3f3f;
  border-left: none;
  border-right: none;
}

.set {
  display: flex;
  justify-content: start;
  flex-direction: column;
}

.element {
  display: flex;
  flex-direction: row;
  justify-items: center;

  .value {
    flex: 1;
    padding-left: 5px;
  }

  .index {
    flex: none;
    font-size: 0.9em;
    color: #3f3f3f;
    text-align: right;
    padding-right: 5px;
  }
}
</style>
