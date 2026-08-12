<template>
  <div
    class="easy-checkbox"
    role="checkbox"
    :aria-checked="checked"
    :aria-label="ariaLabel"
    tabindex="0"
    @click.stop.prevent="emits('change')"
    @keydown.enter.prevent="emits('change')"
    @keydown.space.prevent="emits('change')"
  >
    <input
      type="checkbox"
      tabindex="-1"
      aria-hidden="true"
      :checked="checked"
    >
    <label aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';

const emits = defineEmits(['change']);

defineProps({
  checked: { type: Boolean, required: true },
  ariaLabel: { type: String, default: 'Select row' },
});

const themeColor = inject('themeColor');
</script>

<style lang="scss" scoped>
@import '../scss/checbox.scss';

$checkbox-checked-color: v-bind(themeColor);

.easy-checkbox {
  input[type="checkbox"] {
    &:checked {
      + label:before{
        background: $checkbox-checked-color;
      }
    }
  }
}
</style>
