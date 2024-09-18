<script setup lang="ts">
import { ref } from "vue";

const greeting = ref("Hello World!");
</script>

<template>
  <p class="greeting">{{ greeting }}</p>
</template>

<style scoped lang="scss">
.greeting {
  font-weight: bold;
  color: red;
}
</style>
