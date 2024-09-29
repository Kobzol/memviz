<script setup lang="ts">
import { computed } from "vue";
import { useTippy } from "vue-tippy";

const props = defineProps<{
  tooltips: string[];
}>();

const { x, y } = useMousePosition();

const { tippy } = useTippy(() => document.body, {
  content: computed(() => `(${x.value},${y.value})`),
  showOnCreate: true,
  trigger: "manual",
  // sticky: true,// slow
  placement: "top",
  hideOnClick: false,
  arrow: `<svg style="color: black;width:20px;height:20px" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"></path></svg>`,
  getReferenceClientRect: function () {
    return {
      width: 0,
      height: 0,
      top: y.value,
      right: x.value,
      bottom: y.value,
      left: x.value,
    };
  },
});
</script>

<template>
  <div>
    <div v-for="tooltip in tooltips">
      {{ tooltip }}
    </div>
  </div>
</template>
