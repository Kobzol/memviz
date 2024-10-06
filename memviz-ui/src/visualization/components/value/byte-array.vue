<script setup lang="ts">
import { computed } from "vue";
import { bufferToByteArray } from "../../../utils";
import { AddressRegion } from "../../pointers/region";
import { Path } from "../../pointers/path";
import PtrTarget from "../ptr-target.vue";

const props = defineProps<{
  buffer: ArrayBuffer;
  region: AddressRegion;
  path: Path;
}>();

function getRegion(index: number): AddressRegion {
  let address = null;
  if (props.region.address !== null) {
    address = props.region.address + BigInt(index);
  }
  return {
    address,
    size: 1,
  };
}
function getPath(index: number): Path {
  return props.path.makeByteElement(index);
}

const array = computed(() => bufferToByteArray(props.buffer));
</script>

<template>
  <div class="byte-array">
    <div class="byte" v-for="(value, index) in array">
      <PtrTarget :path="getPath(index)" :region="getRegion(index)">
        <code>{{ value }}</code>
      </PtrTarget>
    </div>
  </div>
</template>

<style scoped lang="scss">
.byte-array {
  display: flex;
  flex-direction: row;
}

.byte {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 35px;
  border: 1px solid #000000;
}
</style>
