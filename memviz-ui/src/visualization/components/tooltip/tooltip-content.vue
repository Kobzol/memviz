<script setup lang="ts">
import { computed, Ref, ref, watch } from "vue";
import { useTippy } from "vue-tippy";
import { TooltipEntry } from "../../store";

const props = defineProps<{
  tooltips: TooltipEntry[];
}>();

const content = computed(() => {
  return props.tooltips.map((v) => v.text).join("<br />");
});

interface Tippy {
  destroy: () => void;
}

const tippy: Ref<Tippy | null> = ref(null);
const targetElement = computed(() => {
  if (props.tooltips.length === 0) {
    return null;
  }
  return props.tooltips[props.tooltips.length - 1].element;
});

watch(
  targetElement,
  () => {
    if (tippy.value !== null) {
      tippy.value.destroy();
    }

    // This does not allow updating the contents without changing the element
    const text = content.value;
    if (targetElement.value !== null && text !== "") {
      const { destroy } = useTippy(targetElement.value, {
        content: text,
        showOnCreate: true,
        maxWidth: "none",
        placement: "right-end",
        allowHTML: true,
        offset: [0, 10],
      });
      tippy.value = {
        destroy: () => destroy(),
      };
    }
  },
  { immediate: true }
);
</script>

<template></template>
