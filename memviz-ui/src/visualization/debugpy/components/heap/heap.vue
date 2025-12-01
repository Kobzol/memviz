<script setup lang="ts">
import { computed } from "vue";
import { valueState } from "../../../store";
import ValueComponent from "../value/value.vue";

const values = computed(() => valueState.value.getValues());
</script>

<template>
  <div class="heap" v-if="values.length > 0">
    <div class="header">Heap</div>
    <ValueComponent
      v-for="value in values"
      class="value"
      :key="value.id"
      :value="value"
    />
  </div>
</template>

<style lang="scss" scoped>
.heap {
  min-width: 300px;
  max-width: 500px;
}

.header {
  padding: 4px 0;
  text-align: center;
  font-weight: bold;
  border-radius: 10px 10px 0 0;
  border: 1px solid black;
  background-color: #8ccdff;
}

.value {
  flex: 3;
  min-width: 0;
  word-break: break-all;
  background: #ffffff;
  border-top: solid 1px #000000;
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
