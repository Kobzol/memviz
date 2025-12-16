<script setup lang="ts">
import { DeferredSetVal, DeferredFrozenSetVal } from "process-def/debugpy";
import MemorySlot from "../../memory-slot.vue";

const props = defineProps<{
  value: DeferredSetVal | DeferredFrozenSetVal;
}>();
</script>

<template>
  <div class="set">
    <table class="elements">
      <tr v-for="(el, index) in value.elements" :key="index">
        <td>
          <div class="element">
            <div class="value">
              <MemorySlot :value="el" />
            </div>
            <div class="index">{{ index }}</div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<style scoped lang="scss">
table {
  border-collapse: collapse;
  border: 3px solid black;
}

td {
  border: 1px solid #3f3f3f;
}

.set {
  display: flex;
  justify-content: start;
  flex-direction: column;
}

.elements {
  margin: 5px 5px 0 0;

  .element {
    display: flex;
    flex-direction: row;
    justify-items: center;

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
