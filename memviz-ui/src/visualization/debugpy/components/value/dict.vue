<script setup lang="ts">
import { computed, ref } from "vue";
import { processResolver } from "../../../store";
import { PythonId } from "process-def/debugpy";
import MemorySlot from "../memory-slot.vue";
import { valueState } from "../../store";
import { LazyDictVal } from "../../type/lazy-value";
import { isDict } from "../../utils/types";
import { assert } from "../../../../utils";
import { RichKeyValuePair } from "../../type/type";

const props = defineProps<{
  id: PythonId;
}>();

const isLoaded = ref(false);
const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isDict(val), `Value with id ${props.id} is not a LazyDictVal`);
  return val as LazyDictVal;
});

const visiblePairs = ref<RichKeyValuePair[]>([]);

async function loadData() {
  if (visiblePairs.value.length > 0) return;

  const resolver = processResolver.value;
  if (!resolver) return;

  visiblePairs.value = await pythonValue.value.getElements(
    resolver.debugpy,
    0,
    pythonValue.value.pair_count,
  );
}

async function onClick() {
  await loadData();
  isLoaded.value = true;
}
</script>

<template>
  <div v-if="pythonValue.pair_count > 0" class="dict">
    <div v-if="isLoaded">
      <div class="pairs">
        <table>
          <tr v-for="(pair, index) in visiblePairs" :key="index">
            <td class="key-cell">
              <div class="key-container">
                <div class="key">
                  <MemorySlot :id="pair.key.id" />
                </div>
                <div class="index">{{ index }}</div>
              </div>
            </td>
            <td>
              <div class="value">
                <MemorySlot :id="pair.value.id" />
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div v-else @click="onClick" class="not-resolved">...</div>
  </div>
</template>

<style scoped lang="scss">
table {
  border-collapse: collapse;
  border: 3px solid black;
  margin: 5px 5px 0 0;

  td {
    border: 1px solid #858585;
  }
}

.dict {
  .not-resolved {
    &:hover {
      cursor: pointer;
    }
  }
}
.pairs {
  display: flex;
  justify-content: start;
  flex-direction: column;

  .value {
    padding-left: 5px;
  }

  .key-cell {
    background-color: #dae4ef;
  }

  .key-container {
    display: flex;
    flex-direction: row;
    padding-left: 5px;

    .key {
      flex: 1;
    }

    .index {
      flex: none;
      font-size: 0.9em;
      color: #3f3f3f;
      text-align: right;
      justify-content: flex-end;
    }
  }
}
</style>
