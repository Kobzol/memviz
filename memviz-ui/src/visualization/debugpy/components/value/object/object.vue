<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { processResolver } from "../../../../store";
import { PythonId } from "process-def/debugpy";
import AttributeName from "./attribute-name.vue";
import MemorySlot from "../../memory-slot.vue";
import { LazyObjectVal } from "../../../type/lazy-value";
import { assert } from "../../../../../utils";
import {
  componentState,
  objectVisibilityState,
  valueState,
} from "../../../store";
import { isObject } from "../../../utils/types";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isObject(val), `Value with id ${props.id} is not a LazyObjectVal`);
  return val as LazyObjectVal;
});

const isResolved = computed(() => pythonValue.value.isResolved());
const attributes = computed(() => pythonValue.value.getFetchedAttributes());
const isOpen = ref(isResolved.value);

async function loadData() {
  if (isResolved.value) {
    return;
  }

  const resolver = processResolver.value;
  if (!resolver) {
    return;
  }

  await pythonValue.value.getAttributes(resolver.debugpy);
}

function setStateToOpen(value: boolean, persist = false) {
  isOpen.value = value;
  objectVisibilityState.setSourceObjectAsCollapsed(props.id, !value);

  if (persist) {
    componentState.setState(props.id, {
      kind: pythonValue.value.kind,
      isOpen: value,
    });
  }
}

function restoreOpenState() {
  const savedState = componentState.getState(props.id, pythonValue.value.kind);
  setStateToOpen(savedState ? savedState.isOpen : isResolved.value);
}

watch(
  [() => pythonValue.value, () => processResolver.value],
  () => {
    restoreOpenState();
    if (isOpen.value) {
      void loadData();
    }
  },
  { immediate: true },
);

async function onClick() {
  if (!isResolved.value) {
    await loadData();
  }
  setStateToOpen(true, true);
}

function closeView() {
  setStateToOpen(false, true);
}
</script>

<template>
  <div class="object">
    <div v-if="isResolved && isOpen" class="resolved-object">
      <table v-if="attributes && attributes.length > 0" class="object-frame">
        <thead>
          <tr>
            <th colspan="2" class="header-cell">
              <div class="header-content">
                <span>Attributes</span>
                <button class="close-btn" @click.stop="closeView">×</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attr in attributes" :key="attr.name">
            <td v-bind:colspan="attr.value ? 1 : 2" class="attribute-name">
              <AttributeName :attribute="attr" />
            </td>
            <td v-if="attr.value" class="attribute-value">
              <MemorySlot :id="attr.value.id" />
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-object"></div>
    </div>

    <div v-else @click="onClick" class="not-resolved">...</div>
  </div>
</template>

<style scoped lang="scss">
.object {
  display: flex;
  justify-content: start;
  flex-direction: column;
  max-width: 100%;
  min-width: 0;

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
  max-width: 100%;
  min-width: 0;
}

.empty-object {
  color: #666;
  font-style: italic;
  padding: 2px 5px;
}

.object-frame {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  border: 2px solid black;
  margin-block-start: 5px;
  background: white;
  table-layout: fixed;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-left: 5px;
    box-sizing: border-box;
  }

  .header-cell {
    padding: 0;
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
    padding-left: 0;
  }

  td {
    border-bottom: 1px solid #3f3f3f;
    padding: 2px 0px 2px 10px;
    vertical-align: top;
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;

    > * {
      max-width: 100%;
      min-width: 0;
    }
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.attribute-name {
  width: 36%;
}

.attribute-value {
  width: 64%;
}
</style>
