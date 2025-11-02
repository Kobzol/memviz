<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import ValueComponent from "./value.vue";
import { appState } from "../../../store";
import { DeferredObjectVal, ObjectVal, Value } from "process-def/debugpy";
import { inject } from "vue";

const props = defineProps<{
  value: DeferredObjectVal;
  level: number;
}>();

async function loadData() {
  if (props.level > 1) {
    console.warn("Max level reached, not loading object data");
    return;
  }
  const frameIndex = inject<null | number>("frameIndex", null);
  if (frameIndex === null) {
    console.warn(
      "No frame index provided for collection, cannot load elements"
    );
    return;
  }
  resolver.value.getObject(props.value.id, frameIndex).then((loadedObject) => {
    console.log("Loaded object:", loadedObject);
    object.value = loadedObject;
  });
}

const resolver = computed(() => appState.value.resolver);
const object: Ref<ObjectVal | null> = ref(null);

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <div class="object">
    obj test
    <div class="methods" v-if="object">
      <div v-for="(value, key) in object.methods" :key="key">
        <span class="string">{{ object.type_name }}."{{ key }}": </span>
        <ValueComponent :value="value" :level="props.level + 1" />
      </div>
    </div>
    <div class="attributes" v-if="object">
      <div v-for="(value, key) in object.attributes" :key="key">
        <span class="string">{{ key }}: </span>
        <ValueComponent :value="value" :level="props.level + 1" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.object {
  display: flex;
  justify-content: end;
  padding: 0px 5px;
  flex-direction: column;

  &:hover {
    cursor: pointer;
  }
}

.value {
  margin-left: 5px;
}

.string {
  padding: 1px 0;
}

.methods {
  background-color: bisque;
}
</style>
