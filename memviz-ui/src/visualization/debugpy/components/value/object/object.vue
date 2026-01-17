<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import { processResolver } from "../../../../store";
import { ResolvedObjectVal, ObjectVal } from "process-def/debugpy";
import AttributeName from "./attribute-name.vue";
import MemorySlot from "../../memory-slot.vue";
import { valueState } from "../../../store";

const props = defineProps<{
  value: ObjectVal;
}>();

async function loadData() {
  if (isResolvedObject(props.value)) {
    // already loaded
    return;
  }
  resolver.value.debugpy.getObject(props.value.id).then((loadedObject) => {
    object.value = loadedObject;
    const loadedValues = loadedObject.attributes
      .filter((attr) => attr.value !== null)
      .map((attr) => attr.value!);
    valueState.value.addValues(loadedValues);
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

const resolver = computed(() => processResolver.value);
const object: Ref<ResolvedObjectVal | null> = ref(null);

watch(
  () => props.value,
  () => {
    checkIfAlreadyResolved();
  },
  { immediate: true },
);

function onClick() {
  loadData();
}
</script>

<template>
  <div class="object">
    <div v-if="isResolvedObject(value)" class="resolved-object">
      <table v-if="value.attributes.length > 0">
        <tr>
          <th colspan="2">Attributes</th>
        </tr>
        <tr v-for="attr in value.attributes" :key="attr.name">
          <td v-bind:colspan="attr.value ? 1 : 2">
            <AttributeName :attribute="attr" />
          </td>
          <td v-if="attr.value">
            <MemorySlot :value="attr.value" />
          </td>
        </tr>
      </table>
    </div>
    <div v-else @click="onClick" class="not-resolved">...</div>
  </div>
</template>

<style scoped lang="scss">
.object {
  .not-resolved {
    &:hover {
      cursor: pointer;
    }
  }
}

.resolved-object {
  display: flex;
  justify-content: start;
  flex-direction: column;
}

table {
  border-collapse: collapse;
  border: 3px solid black;

  margin: 5px 5px 0 0;

  th {
    background-color: #bca9e1;
    text-align: left;
    font-weight: normal;
    padding-left: 5px;
  }

  td {
    border-bottom: 1px solid #3f3f3f;
    padding: 2px 5px;
  }
}
</style>
