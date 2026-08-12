<template>
  <div
    class="easy-checkbox"
    role="checkbox"
    :aria-checked="ariaChecked"
    :aria-label="ariaLabel"
    tabindex="0"
    @click.stop.prevent="toggleChecked"
    @keydown.enter.prevent="toggleChecked"
    @keydown.space.prevent="toggleChecked"
  >
    <input
      type="checkbox"
      tabindex="-1"
      aria-hidden="true"
      :checked="isChecked"
      :class="status"
    >
    <label aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { PropType, computed, inject } from 'vue';

const emits = defineEmits(['change']);

const props = defineProps({
  status: { type: String as PropType<'noneSelected' | 'partSelected' | 'allSelected'>, required: true },
  ariaLabel: { type: String, default: 'Select all rows' },
});

const isChecked = computed(() => props.status === 'allSelected');

const ariaChecked = computed((): boolean | 'mixed' => {
  if (props.status === 'allSelected') return true;
  if (props.status === 'partSelected') return 'mixed';
  return false;
});

const toggleChecked = () => {
  emits('change', !isChecked.value);
};

const themeColor = inject('themeColor');
</script>

<style lang="scss" scoped>
@import '../scss/checbox.scss';

$checkbox-checked-color: v-bind(themeColor);

.easy-checkbox {
  input[type="checkbox"] {
    &.allSelected, &.partSelected {
      + label:before{
        background: $checkbox-checked-color;
      }
    }
  }
}
</style>
