<template>
  <tr
    :class="[{ 'even-row': (index + 1) % 2 === 0 },
             typeof bodyRowClassName === 'string' ? bodyRowClassName : bodyRowClassName(item, index + 1)]"
    :style="rowStyle"
    @click="onClick"
    @dblclick="($event) => { clickRow(item, 'double', $event) }"
    @contextmenu="($event) => { contextMenuRow(item, $event) }"
  >
    <td
      v-for="(column, i) in headerColumns"
      :key="i"
      :style="getFixedDistance(column, 'td')"
      :class="[{
        'shadow': column === lastFixedColumn,
        'fixed-column': Boolean(getFixedDistance(column, 'td')),
        'can-expand': column === 'expand' && isRowExpandable(item),
      // eslint-disable-next-line max-len
      }, typeof bodyItemClassName === 'string' ? bodyItemClassName : bodyItemClassName(column, index + 1), `direction-${bodyTextDirection}`]"
      @click="(column === 'expand' && isRowExpandable(item)) ? updateExpandingItemIndexList(index + prevPageEndIndex, item, $event) : null"
    >
      <slot
        v-if="slots[`item-${column}`]"
        :name="`item-${column}`"
        v-bind="item"
      />
      <slot
        v-else-if="slots[`item-${column.toLowerCase()}`]"
        :name="`item-${column.toLowerCase()}`"
        v-bind="item"
      />
      <template v-else-if="column === 'expand'">
        <button
          v-if="isRowExpandable(item)"
          type="button"
          class="expand-icon"
          :class="{ 'expanding': isRowExpanding(prevPageEndIndex + index, item) }"
          :aria-expanded="isRowExpanding(prevPageEndIndex + index, item) ? 'true' : 'false'"
          :aria-label="isRowExpanding(prevPageEndIndex + index, item) ? 'Collapse row' : 'Expand row'"
          @click.stop="updateExpandingItemIndexList(index + prevPageEndIndex, item, $event)"
        ></button>
      </template>
      <template v-else-if="column === 'checkbox'">
        <SingleSelectCheckBox
          :checked="item[column]"
          :aria-label="`Select row ${index + 1}`"
          @change="toggleSelectItem(item)"
        />
      </template>
      <slot
        v-else-if="slots['item']"
        name="item"
        v-bind="{ column, item }"
      />
      <template v-else>
        {{ generateColumnContent(column, item) }}
      </template>
    </td>
  </tr>
  <tr
    v-if="ifHasExpandSlot && isRowExpanding(index + prevPageEndIndex, item)"
    :class="[{ 'even-row': (index + 1) % 2 === 0 },
             typeof bodyExpandRowClassName === 'string' ? bodyExpandRowClassName : bodyExpandRowClassName(item, index + 1)]"
  >
    <td
      :colspan="headersForRenderLength"
      class="expand"
    >
      <LoadingLine
        v-if="item.expandLoading"
        class="expand-loading"
      />
      <slot
        name="expand"
        v-bind="item"
      />
    </td>
  </tr>
</template>

<script setup lang="ts">
import { useSlots, computed, type PropType, type CSSProperties } from 'vue';
import SingleSelectCheckBox from './SingleSelectCheckBox.vue';
import LoadingLine from './LoadingLine.vue';
import type { Item, BodyItemClassNameFunction, BodyRowClassNameFunction, TextDirection } from '../types/main';
import type { ClickEventType } from '../types/internal';
import { generateColumnContent } from '../utils';

const props = defineProps({
  item: {
    type: Object as PropType<Item>,
    required: true,
  },
  /** Index within the current page (`pageItems`). */
  index: {
    type: Number,
    required: true,
  },
  headerColumns: {
    type: Array as PropType<string[]>,
    required: true,
  },
  headersForRenderLength: {
    type: Number,
    required: true,
  },
  prevPageEndIndex: {
    type: Number,
    required: true,
  },
  lastFixedColumn: {
    type: String,
    default: '',
  },
  bodyTextDirection: {
    type: String as PropType<TextDirection>,
    default: 'left',
  },
  bodyRowClassName: {
    type: [Function, String] as PropType<BodyRowClassNameFunction | string>,
    default: '',
  },
  bodyExpandRowClassName: {
    type: [Function, String] as PropType<BodyRowClassNameFunction | string>,
    default: '',
  },
  bodyItemClassName: {
    type: [Function, String] as PropType<BodyItemClassNameFunction | string>,
    default: '',
  },
  ifHasExpandSlot: {
    type: Boolean,
    default: false,
  },
  clickRowToExpand: {
    type: Boolean,
    default: false,
  },
  /** Fixed height for virtual rows; omit for default path. */
  rowHeight: {
    type: Number,
    default: undefined,
  },
  isRowExpandable: {
    type: Function as PropType<(item: Item) => boolean>,
    required: true,
  },
  isRowExpanding: {
    type: Function as PropType<(index: number, item: Item) => boolean>,
    required: true,
  },
  updateExpandingItemIndexList: {
    type: Function as PropType<(index: number, item: Item, event: Event) => void>,
    required: true,
  },
  toggleSelectItem: {
    type: Function as PropType<(item: Item) => void>,
    required: true,
  },
  clickRow: {
    type: Function as PropType<(item: Item, clickType: ClickEventType, event: MouseEvent) => void>,
    required: true,
  },
  contextMenuRow: {
    type: Function as PropType<(item: Item, event: MouseEvent) => void>,
    required: true,
  },
  getFixedDistance: {
    type: Function as PropType<(column: string, type?: 'td' | 'th') => CSSProperties | undefined>,
    required: true,
  },
});

const slots = useSlots();

const rowStyle = computed(() => {
  if (props.rowHeight == null || props.rowHeight <= 0) return undefined;
  return { height: `${props.rowHeight}px` };
});

const onClick = ($event: MouseEvent) => {
  props.clickRow(props.item, 'single', $event);
  if (props.clickRowToExpand && props.isRowExpandable(props.item)) {
    props.updateExpandingItemIndexList(
      props.index + props.prevPageEndIndex,
      props.item,
      $event,
    );
  }
};
</script>
