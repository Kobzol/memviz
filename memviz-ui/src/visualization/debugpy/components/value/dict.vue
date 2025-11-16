<script setup lang="ts">
import { computed } from "vue";
import ValueComponent from "./value.vue";
import { appState } from "../../../store";
import { DeferredDictVal } from "process-def/debugpy";
import { inject } from "vue";

const props = defineProps<{
  value: DeferredDictVal;
}>();

const frameIndex = inject<null | number>("frameIndex", null);

async function loadData() {
  if (Object.keys(props.value.pairs).length >= props.value.pair_count) {
    // empty or already loaded
    return;
  }
  if (frameIndex === null) {
    console.warn("No frame index provided for dict, cannot load elements");
    return;
  }
  resolver.value
    .getDictEntries(props.value.id, frameIndex, 0, props.value.pair_count)
    .then((pairs) => {
      props.value.pairs = pairs;
    });
}

const resolver = computed(() => appState.value.resolver);

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
            <td class="key">
              <ValueComponent :value="pair.key" />
            </td>
            <td>
              <div class="value-container">
                <div class="value">
                  <ValueComponent :value="pair.value" />
                </div>
                <div class="index">{{ index }}</div>
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

  .key {
    background-color: #dae4ef;
    padding-left: 5px;
    vertical-align: top;
  }

  .value-container {
    display: flex;
    flex-direction: row;
    justify-items: center;
    padding-left: 5px;

    .value {
      flex: 1;
    }

    .index {
      flex: none;
      font-size: 0.9em;
      color: #3f3f3f;
      text-align: right;
    }
  }
}
</style>
