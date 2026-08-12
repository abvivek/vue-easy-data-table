<template>
  <button
    type="button"
    class="previous-page__click-button"
    :class="{'first-page': isFirstPage}"
    aria-label="Previous page"
    :disabled="isFirstPage"
    @click="emits('clickPrevPage')"
  >
    <span
      class="arrow arrow-right"
      aria-hidden="true"
    ></span>
  </button>
  <slot
    v-if="slots.buttonsPagination"
    name="buttonsPagination"
  />
  <button
    type="button"
    class="next-page__click-button"
    :class="{'last-page': isLastPage}"
    aria-label="Next page"
    :disabled="isLastPage"
    @click="emits('clickNextPage')"
  >
    <span
      class="arrow arrow-left"
      aria-hidden="true"
    ></span>
  </button>
</template>

<script lang="ts" setup>
import { useSlots } from 'vue';

defineProps({
  isFirstPage: { type: Boolean, required: false },
  isLastPage: { type: Boolean, required: false },
});

const emits = defineEmits(['clickPrevPage', 'clickNextPage']);

const slots = useSlots();
</script>
<style lang="scss" scoped>
  .previous-page__click-button, .next-page__click-button {
    margin: 0px 5px;
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    line-height: 1;
    .arrow {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-top: 2px solid #000;
      border-left: 2px solid #000;
      &.arrow-left {
        transform: rotate(135deg);
      }
      &.arrow-right {
        transform: rotate(-45deg);
      }
    }
  }
  .previous-page__click-button.first-page, .next-page__click-button.last-page,
  .previous-page__click-button:disabled, .next-page__click-button:disabled {
    cursor: not-allowed;
    .arrow {
      border-color: #e0e0e0;
    }
  }
</style>
