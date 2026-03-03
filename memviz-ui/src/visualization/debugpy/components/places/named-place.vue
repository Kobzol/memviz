<script setup lang="ts">
import { Place, PlaceKind, PythonId } from "process-def/debugpy";
import { computed } from "vue";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { DisplayMode } from "../../value-display-settings";
import MemorySlot from "../memory-slot.vue";
import { valueState } from "../../store";
import { RichValue } from "../../type/type";

const props = defineProps<{
  place: Place;
  id: PythonId;
}>();

const tooltip = computed(() => {
  const type = pythonValue.value.kind;
  let title = "";
  if (props.place.kind === PlaceKind.Return) return "Return values dictionary";
  else {
    title += `Place <b>${props.place.name}</b>`;
    if (type) {
      title += ` of type <b>${type}</b>`;
    }
  }
  title += `, id <b>${props.place.id}</b>`;
  return title;
});
const pythonValue = computed<RichValue>(() => {
  return valueState.value.getValueOrThrow(props.id);
});
</script>

<template>
  <div class="place">
    <div class="place-name">
      <code v-if="place.kind === PlaceKind.Return" class="ret"> (return) </code>
      <code
        v-else
        :class="{
          param: place.kind === PlaceKind.Parameter,
        }"
        ><TooltipContributor :tooltip="tooltip">{{
          props.place.name
        }}</TooltipContributor></code
      >
    </div>
    <div class="place-value">
      <MemorySlot :id="props.id" :context="DisplayMode.INLINE" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.place {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;

  box-sizing: border-box;
  border: 0.5px solid #5f5f5f;
  border-top: none;

  display: flex;
  flex-direction: row;

  .place-name {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: flex-start;
    word-break: break-all;
    padding-inline-start: 5px;
    padding-block: 5px;

    code {
      padding: 0.25lh 0.35lh;
      font-size: 1.2em;
      background-color: #a4c5ea;
      border-radius: 50px;
      corner-shape: squircle;
      text-box-trim: trim-both;
      &.ret {
        background-color: #9de19a;
      }

      &.param {
        background-color: #bca9e1;
      }
    }
  }

  .place-value {
    flex: 3;
    min-width: 0;
    word-break: break-all;
    display: grid;
    align-items: center;
  }
}
</style>
