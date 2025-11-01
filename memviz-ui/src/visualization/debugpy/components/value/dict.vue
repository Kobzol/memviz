<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import ValueComponent from "./value.vue";
import { appState } from "../../../store";
import { DeferredDictVal, KeyValuePair, Value } from "process-def/debugpy";
import { inject } from "vue";

const props = defineProps<{
  value: DeferredDictVal;
  level: number;
}>();

async function loadData() {
  const frameIndex = inject<null | number>("frameIndex", null);
  if (frameIndex === null) {
    console.warn("No frame index provided for dict, cannot load elements");
    return;
  }
  resolver.value
    .getDictEntries(
      props.value.id,
      frameIndex,
      0,
      props.value.key_value_pair_count
    )
    .then((pairs) => {
      keyValuePairs.value = pairs;
    });
}

const resolver = computed(() => appState.value.resolver);
const keyValuePairs: Ref<KeyValuePair[] | null> = ref(null);

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <div class="dict">
    <div v-for="(pair, index) in keyValuePairs" :key="index" class="kv-pair">
      <ValueComponent class="key" :value="pair.key" :level="props.level + 1" />
      :
      <ValueComponent
        class="value"
        :value="pair.value"
        :level="props.level + 1"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.dict {
  display: flex;
  justify-content: end;
  padding: 0px 5px;
  flex-direction: column;

  &:hover {
    cursor: pointer;
  }
}

.kv-pair {
  margin: 2px 0 5px;
  display: flex;
  flex-direction: row;
}

.string {
  padding: 1px 0;
}
</style>
