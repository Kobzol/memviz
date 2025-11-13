<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import ValueComponent from "./value.vue";
import { appState } from "../../../store";
import { ResolvedObjectVal, ObjectVal } from "process-def/debugpy";
import { inject } from "vue";

const props = defineProps<{
  value: ObjectVal;
  level: number;
}>();

const frameIndex = inject<null | number>("frameIndex", null);

async function loadData() {
  if (isResolvedObject(props.value)) {
    // already loaded
    return;
  }
  if (frameIndex === null) {
    console.warn(
      "No frame index provided for collection, cannot load elements"
    );
    return;
  }
  resolver.value.getObject(props.value.id, frameIndex).then((loadedObject) => {
    object.value = loadedObject;
  });
}

function isResolvedObject(value: ObjectVal): value is ResolvedObjectVal {
  return value.kind === "object";
}

function checkIfAlreadyResolved() {
  if (isResolvedObject(props.value)) {
    object.value = props.value;
  }
}

const resolver = computed(() => appState.value.resolver);
const object: Ref<ResolvedObjectVal | null> = ref(null);

watch(
  () => props.value,
  () => {
    checkIfAlreadyResolved();
  },
  { immediate: true }
);
</script>

<template>
  <div class="object">
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
    <div class="data-descriptors" v-if="object">
      <div v-for="key in object.data_descriptors" :key="key">
        <span class="string">{{ key }} </span>
      </div>
    </div>
    <div class="getset-descriptors" v-if="object">
      <div v-for="key in object.getset_descriptors" :key="key">
        <span class="string">{{ key }}</span>
      </div>
    </div>
    <div class="member-descriptors" v-if="object">
      <div v-for="key in object.member_descriptors" :key="key">
        <span class="string">{{ key }}</span>
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
