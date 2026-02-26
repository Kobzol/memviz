<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { processResolver } from "../../../../store";
import AttributeName from "./attribute-name.vue";
import MemorySlot from "../../memory-slot.vue";
import { LazyObjectVal } from "../../../type/lazy-value";
import { assert } from "../../../../../utils";
import { valueState } from "../../../store";
import { isObject } from "../../../utils/types";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isObject(val), `Value with id ${props.id} is not a LazyObjectVal`);
  return val as LazyObjectVal;
});
const isResolved = computed(() => pythonValue.value.isResolved());
const attributes = computed(() => {
  return pythonValue.value.getFetchedAttributes();
});
const isOpen = ref(isResolved.value);

async function loadData() {
  if (isResolved.value) return;

  const resolver = processResolver.value;
  if (!resolver) return;

  await pythonValue.value.getAttributes(resolver.debugpy);
}

async function onClick() {
  if (!isResolved.value) {
    await loadData();
  }
  isOpen.value = true;
}

function closeView() {
  isOpen.value = false;
}

watch(
  () => props.id,
  () => {
    isOpen.value = isResolved.value;
  },
);
</script>

<template>
  <div class="object">
    <div v-if="isResolved && isOpen" class="resolved-object">
      <table v-if="attributes && attributes.length > 0">
        <tr>
          <th colspan="2" class="header-cell">
            <div class="header-content">
              <span>Attributes</span>
              <button class="close-btn" @click.stop="closeView">×</button>
            </div>
          </th>
        </tr>
        <tr v-for="attr in attributes" :key="attr.name">
          <td v-bind:colspan="attr.value ? 1 : 2">
            <AttributeName :attribute="attr" />
          </td>
          <td v-if="attr.value">
            <MemorySlot :id="attr.value.id" />
          </td>
        </tr>
      </table>
      <div v-else class="empty-object"></div>
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

.empty-object {
  color: #666;
  font-style: italic;
  padding: 2px 5px;
}

table {
  border-collapse: collapse;
  border: 3px solid black;
  margin: 5px 5px 0 0;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .close-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1.1em;

    &:hover {
      opacity: 0.8;
    }
  }

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
