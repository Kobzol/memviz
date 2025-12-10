<script setup lang="ts">
import { appState } from "../store";
import { computed } from "vue";
import AddressSpaceGDB from "../gdb/components/address-space.vue";
import AddressSpaceDebugpy from "../debugpy/components/address-space.vue";
import { SessionType } from "process-def";

const sessionType = computed(() => appState.value.sessionType);
</script>

<template>
  <AddressSpaceGDB v-if="sessionType === SessionType.GDB"></AddressSpaceGDB>
  <AddressSpaceDebugpy
    v-if="sessionType === SessionType.Debugpy"
  ></AddressSpaceDebugpy>
</template>
