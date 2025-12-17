<script setup lang="ts">
import { computed } from "vue";
import { processResolver, valueState } from "../../../store";
import { DeferredDictVal } from "process-def/debugpy";
import MemorySlot from "../memory-slot.vue";

const props = defineProps<{
  value: DeferredDictVal;
}>();

async function loadData() {
  if (Object.keys(props.value.pairs).length >= props.value.pair_count) {
    // empty or already loaded
    return;
  }
  resolver.value.debugpy
    .getDictEntries(props.value.id, 0, props.value.pair_count)
    .then((pairs) => {
      props.value.pairs = pairs;
      valueState.value.addValues(
        pairs.flatMap((pair) => [pair.key, pair.value])
      );
    });
}

const resolver = computed(() => processResolver.value);

async function onClick() {
  await loadData();
}

function hasResolvedPairs() {
  return Object.keys(props.value.pairs).length > 0;
}
</script>

<template>
  <div v-if="value.pair_count > 0" class="dict">
    <div v-if="hasResolvedPairs()">
      <div class="pairs">
        <table>
          <tr v-for="(pair, index) in value.pairs" :key="index">
            <td class="key-cell">
              <div class="key-container">
                <div class="key">
                  <MemorySlot :value="pair.key" />
                </div>
                <div class="index">{{ index }}</div>
              </div>
            </td>
            <td>
              <div class="value">
                <MemorySlot :value="pair.value" />
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
