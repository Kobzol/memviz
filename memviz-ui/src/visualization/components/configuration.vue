<script setup lang="ts">
import { ref } from "vue";
import { uiConfiguration } from "../store";

const expanded = ref(false);
</script>

<template>
  <div class="configuration">
    <button @click="expanded = !expanded">Settings</button>
    <div v-if="expanded" class="settings">
      <div class="setting">
        <input
          id="enable-pointers"
          type="checkbox"
          class="input"
          v-model="uiConfiguration.visualizePointers"
        />
        <label for="enable-pointers">Draw pointers as arrows</label>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.configuration {
  margin-bottom: 10px;
}
.settings {
  margin-top: 10px;
}
.setting {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.input {
  margin-right: 5px;
}
</style>
