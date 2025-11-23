<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import ValueComponent from "./value.vue";
import { appState } from "../../../store";
import { ResolvedObjectVal, ObjectVal } from "process-def/debugpy";

const props = defineProps<{
  value: ObjectVal;
}>();

async function loadData() {
  if (isResolvedObject(props.value)) {
    // already loaded
    return;
  }
  resolver.value.getObject(props.value.id).then((loadedObject) => {
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

function onClick() {
  loadData();
}
</script>

<template>
  <div class="object">
    <div v-if="isResolvedObject(value)" class="resolved-object">
      <table>
        <!-- Methods -->
        <tbody v-if="Object.keys(value.methods).length > 0">
          <tr>
            <th colspan="2">Methods</th>
          </tr>
          <tr v-for="(val, key) in value.methods" :key="key">
            <td class="string">{{ key }}</td>
            <td>
              <ValueComponent :value="val" />
            </td>
          </tr>
        </tbody>

        <!-- Attributes -->
        <tbody v-if="Object.keys(value.data_attributes).length > 0">
          <tr>
            <th colspan="2">Data attributes</th>
          </tr>
          <tr v-for="(val, key) in value.data_attributes" :key="key">
            <td class="string">{{ key }}</td>
            <td>
              <ValueComponent :value="val" />
            </td>
          </tr>
        </tbody>

        <!-- Descriptors -->
        <tbody v-if="value.data_descriptors.length > 0">
          <tr>
            <th colspan="2">Data Descriptors</th>
          </tr>
          <tr v-for="key in value.data_descriptors" :key="key">
            <td class="string" colspan="2">{{ key }}</td>
          </tr>
        </tbody>
        <tbody v-if="value.getset_descriptors.length > 0">
          <tr>
            <th colspan="2">Getset Descriptors</th>
          </tr>
          <tr v-for="key in value.getset_descriptors" :key="key">
            <td class="string" colspan="2">{{ key }}</td>
          </tr>
        </tbody>
        <tbody v-if="value.member_descriptors.length > 0">
          <tr colspan="2">
            <th colspan="2">Member Descriptors</th>
          </tr>
          <tr v-for="key in value.member_descriptors" :key="key">
            <td class="string" colspan="2">{{ key }}</td>
          </tr>
        </tbody>
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
