<script setup lang="ts">
import { DeferredListVal, DeferredTupleVal } from "process-def/debugpy";
import ValueWrapper from "../value-wrapper.vue";

const props = defineProps<{
  value: DeferredListVal | DeferredTupleVal;
}>();
</script>

<template>
  <div class="sequence">
    <table class="elements">
      <tr v-for="(el, index) in value.elements" :key="index">
        <td class="index">{{ index }}</td>
        <td class="value">
          <ValueWrapper :value="el" />
        </td>
      </tr>
    </table>
  </div>
</template>

<style scoped lang="scss">
td {
  border: 1px solid #858585;
}
.sequence {
  display: flex;
  justify-content: start;
  flex-direction: column;
}
.elements {
  border-collapse: collapse;
  border: 3px solid black;

  margin: 5px 5px 0 0;

  .index {
    background-color: #dae4ef;
    line-height: 1;
    text-align: center;
    font-size: 1.2em;
    width: 15%;
  }
}

.value {
  margin-left: 5px;
}
</style>
