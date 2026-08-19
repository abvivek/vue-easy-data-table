<template>
  <div
    ref="dataTable"
    class="vue3-easy-data-table"
    :class="[tableClassName]"
  >
    <div
      ref="tableBody"
      class="vue3-easy-data-table__main"
      :class="{
        'fixed-header': fixedHeader,
        'fixed-height': tableHeight,
        'show-shadow': showShadow,
        'table-fixed': fixedHeaders.length,
        'hoverable': !noHover,
        'border-cell': borderCell,
      }"
    >
      <table
        :id="tableNodeId"
        :style="fixedTableMinWidthStyle"
        :aria-busy="loading ? 'true' : undefined"
        :aria-rowcount="totalItemsLength || undefined"
      >
        <colgroup>
          <col
            v-for="(header, index) in headersForRender"
            :key="index"
            :style="getColStyle(header)"
          />
        </colgroup>
        <slot
          v-if="slots['customize-headers']"
          name="customize-headers"
          v-bind="{
            headers: headersForRender,
            headerRows,
            updateSortField,
            toggleSelectAll,
            multipleSelectStatus,
            isMultiSorting,
            getMultiSortNumber,
            getHeaderCellFixedStyle,
            getFixedDistance,
            lastFixedColumn,
            fixedHeaders,
          }"
        />
        <thead
          v-else-if="headersForRender.length && !hideHeader"
          class="vue3-easy-data-table__header"
          :class="[headerClassName]"
        >
          <tr
            v-for="(row, rowIndex) in headerRows"
            :key="rowIndex"
          >
            <th
              v-for="(header, index) in row"
              :key="header.value + '-' + index"
              :class="[{
                sortable: !header.isGroup && header.sortable,
                'none': !header.isGroup && header.sortable && header.sortType === 'none',
                'desc': !header.isGroup && header.sortable && header.sortType === 'desc',
                'asc': !header.isGroup && header.sortable && header.sortType === 'asc',
                'shadow': header.isGroup
                  ? (header.lastLeafValue === lastFixedColumn && !!header.fixed)
                  : header.value === lastFixedColumn,
                'fixed-column': header.fixed,
              }, typeof headerItemClassName === 'string' ? headerItemClassName : headerItemClassName(header as Header, index + 1), header.className]"
              :style="getHeaderCellFixedStyle(header)"
              :colspan="header.colspan"
              :rowspan="header.rowspan"
              :data-leaf-column="header.isGroup ? undefined : 'true'"
              :aria-sort="(!header.isGroup && header.sortable) ? ariaSortValue(header.sortType) : undefined"
              :tabindex="(!header.isGroup && header.sortable && header.sortType) ? 0 : undefined"
              :scope="header.text === 'checkbox' ? undefined : 'col'"
              @click.stop="(!header.isGroup && header.sortable && header.sortType) ? updateSortField(header.value, header.sortType) : null"
              @keydown="(!header.isGroup && header.sortable && header.sortType) ? onSortableHeaderKeydown($event, header.value, header.sortType) : null"
            >
              <MultipleSelectCheckBox
                v-if="header.text === 'checkbox'"
                :key="multipleSelectStatus"
                :status="multipleSelectStatus"
                @change="toggleSelectAll"
              />
              <span
                v-else
                class="header"
                :class="`direction-${header.headerAlign || header.align || headerTextDirection}`"
              >
                <slot
                  v-if="slots[`header-${header.value}`]"
                  :name="`header-${header.value}`"
                  v-bind="header"
                />
                <slot
                  v-else-if="slots[`header-${header.value.toLowerCase()}`]"
                  :name="`header-${header.value.toLowerCase()}`"
                  v-bind="header"
                />
                <slot
                  v-else-if="slots['header']"
                  name="header"
                  v-bind="header"
                />
                <span
                  v-else
                  class="header-text"
                >
                  {{ header.text }}
                </span>
                <i
                  v-if="!header.isGroup && header.sortable"
                  :key="header.sortType ? header.sortType : 'none'"
                  class="sortType-icon"
                  :class="{'desc': header.sortType === 'desc'}"
                  aria-hidden="true"
                ></i>
                <span
                  v-if="!header.isGroup && multiSort && isMultiSorting(header.value)"
                  class="multi-sort__number"
                  aria-hidden="true"
                >
                  {{ getMultiSortNumber(header.value) }}
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <slot
          v-if="ifHasBodySlot"
          name="body"
          v-bind="pageItems"
        />
        <tbody
          v-else-if="headerColumns.length"
          class="vue3-easy-data-table__body"
          :class="{'row-alternation': alternating}"
        >
          <slot
            name="body-prepend"
            v-bind="{
              items: pageItems,
              pagination: {
                isFirstPage,
                isLastPage,
                currentPaginationNumber,
                maxPaginationNumber,
                nextPage,
                prevPage
              },
              headers: headersForRender
            }"
          />
          <tr
            v-if="isVirtualActive && virtualOffsetTop > 0"
            class="vue3-easy-data-table__virtual-spacer"
            aria-hidden="true"
          >
            <td
              :colspan="headersForRender.length"
              :style="{
                height: `${virtualOffsetTop}px`,
                padding: 0,
                border: 'none',
                lineHeight: 0,
              }"
            />
          </tr>
          <DataTableBodyRow
            v-for="row in rowsForRender"
            :key="resolveRowKey(row.item, row.index)"
            :item="row.item"
            :index="row.index"
            :header-columns="headerColumns"
            :headers-for-render="headersForRender"
            :headers-for-render-length="headersForRender.length"
            :prev-page-end-index="prevPageEndIndex"
            :last-fixed-column="lastFixedColumn"
            :body-text-direction="bodyTextDirection"
            :body-row-class-name="bodyRowClassName"
            :body-expand-row-class-name="bodyExpandRowClassName"
            :body-item-class-name="bodyItemClassName"
            :if-has-expand-slot="ifHasExpandSlot"
            :click-row-to-expand="clickRowToExpand"
            :row-height="isVirtualActive ? virtualRowHeight ?? undefined : undefined"
            :is-row-expandable="isRowExpandable"
            :is-row-expanding="isRowExpanding"
            :update-expanding-item-index-list="updateExpandingItemIndexList"
            :toggle-select-item="toggleSelectItem"
            :click-row="clickRow"
            :context-menu-row="contextMenuRow"
            :get-fixed-distance="getFixedDistance"
          >
            <template
              v-for="(_, name) in slots"
              :key="name"
              #[name]="slotData"
            >
              <slot
                :name="name"
                v-bind="slotData || {}"
              />
            </template>
          </DataTableBodyRow>
          <tr
            v-if="isVirtualActive && virtualOffsetBottom > 0"
            class="vue3-easy-data-table__virtual-spacer"
            aria-hidden="true"
          >
            <td
              :colspan="headersForRender.length"
              :style="{
                height: `${virtualOffsetBottom}px`,
                padding: 0,
                border: 'none',
                lineHeight: 0,
              }"
            />
          </tr>
          <slot
            name="body-append"
            v-bind="{
              items: pageItems,
              pagination: {
                isFirstPage,
                isLastPage,
                currentPaginationNumber,
                maxPaginationNumber,
                nextPage,
                prevPage,
                updatePage
              },
              headers: headersForRender
            }"
          />
        </tbody>
        <tfoot
          v-if="shouldRenderSummary"
          class="vue3-easy-data-table__summary"
          :class="{ 'fixed-summary': fixedSummary }"
        >
          <tr>
            <template
              v-for="cell in summaryCells"
              :key="cell.column"
            >
              <th
                v-if="cell.isLabel"
                scope="row"
                class="summary-cell summary-label"
                :class="[{
                  'fixed-column': !!getSummaryCellFixedStyle(cell.column),
                  'shadow': cell.column === lastFixedColumn,
                }, `direction-${cell.header.align || bodyTextDirection}`, cell.header.className]"
                :style="getSummaryCellFixedStyle(cell.column)"
              >
                {{ summaryText }}
              </th>
              <td
                v-else
                class="summary-cell"
                :class="[{
                  'fixed-column': !!getSummaryCellFixedStyle(cell.column),
                  'shadow': cell.column === lastFixedColumn,
                }, `direction-${cell.header.align || bodyTextDirection}`, cell.header.className]"
                :style="getSummaryCellFixedStyle(cell.column)"
              >
                <slot
                  v-if="cell.slotName"
                  :name="cell.slotName"
                  v-bind="summarySlotProps(cell)"
                />
                <template v-else-if="cell.value !== null">
                  {{ cell.value }}
                </template>
              </td>
            </template>
          </tr>
        </tfoot>
      </table>
      <div
        v-if="loading"
        class="vue3-easy-data-table__loading"
      >
        <div
          class="vue3-easy-data-table__loading-mask "
        ></div>
        <div class="loading-entity">
          <slot
            v-if="ifHasLoadingSlot"
            name="loading"
          />
          <Loading v-else></Loading>
        </div>
      </div>

      <div
        v-if="!pageItems.length && !loading"
        class="vue3-easy-data-table__message"
      >
        <slot name="empty-message">
          {{ emptyMessage }}
        </slot>
      </div>
    </div>
    <div
      v-if="!hideFooter"
      class="vue3-easy-data-table__footer"
      role="navigation"
      aria-label="Table pagination"
    >
      <div
        v-if="!hideRowsPerPage"
        class="pagination__rows-per-page"
      >
        {{ rowsPerPageMessage }}
        <RowsSelector
          v-model="rowsPerPageRef"
          :rows-items="rowsItemsComputed"
        />
      </div>
      <div
        class="pagination__items-index"
        aria-live="polite"
      >
        {{ `${currentPageFirstIndex}–${currentPageLastIndex}` }}
        {{ rowsOfPageSeparatorMessage }} {{ totalItemsLength }}
      </div>
      <slot
        v-if="ifHasPaginationSlot"
        name="pagination"
        v-bind="{
          isFirstPage,
          isLastPage,
          currentPaginationNumber,
          maxPaginationNumber,
          nextPage,
          prevPage,
        }"
      />
      <PaginationArrows
        v-else
        :is-first-page="isFirstPage"
        :is-last-page="isLastPage"
        @click-next-page="nextPage"
        @click-prev-page="prevPage"
      >
        <template
          v-if="buttonsPagination"
          #buttonsPagination
        >
          <ButtonsPagination
            :current-pagination-number="currentPaginationNumber"
            :max-pagination-number="maxPaginationNumber"
            @update-page="updatePage"
          />
        </template>
      </PaginationArrows>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useSlots, computed, toRefs, toRef, ref, watch, provide, onMounted, onBeforeUnmount, nextTick, PropType,
  type CSSProperties,
} from 'vue';

import MultipleSelectCheckBox from './MultipleSelectCheckBox.vue';
import RowsSelector from './RowsSelector.vue';
import Loading from './Loading.vue';
import ButtonsPagination from './ButtonsPagination.vue';
import PaginationArrows from './PaginationArrows.vue';
import DataTableBodyRow from './DataTableBodyRow.vue';

import useClickRow from '../hooks/useClickRow';
import useExpandableRow from '../hooks/useExpandableRow';
import useFixedColumn from '../hooks/useFixedColumn';
import useHeaders from '../hooks/useHeaders';
import usePageItems from '../hooks/usePageItems';
import usePagination from '../hooks/usePagination';
import useRows from '../hooks/useRows';
import useServerOptions from '../hooks/useServerOptions';
import useTotalItems from '../hooks/useTotalItems';
import useVirtualRows from '../hooks/useVirtualRows';

import type { Header, Item, SortType } from '../types/main';
import type { HeaderForRender } from '../types/internal';

import { getItemIdentity } from '../utils';
import { resolveHeaderSummary } from '../summary';
import {
  DEFAULT_CELL_HORIZONTAL_PADDING_PX,
  FIXED_COLUMN_BODY_Z_INDEX,
  FIXED_COLUMN_HEADER_Z_INDEX,
  FIXED_COLUMN_SUMMARY_Z_INDEX,
  readCellHorizontalPadding,
  readPaintedColumnWidths,
  resolveColumnPaintedWidth,
} from '../stickyColumns';
import propsWithDefault from '../propsWithDefault';

const props = defineProps({
  ...propsWithDefault,
  items: {
    type: Array as PropType<Item[]>,
    required: true,
  },
  headers: {
    type: Array as PropType<Header[]>,
    required: true,
  },
});

const {
  tableNodeId,
  clickEventType,
  bodyTextDirection,
  checkboxColumnWidth,
  currentPage,
  expandable,
  expandColumnWidth,
  filterOptions,
  fixedCheckbox,
  fixedExpand,
  fixedHeader,
  fixedIndex,
  headers,
  headerTextDirection,
  indexColumnWidth,
  itemKey,
  items,
  itemsSelected,
  loading,
  mustSort,
  multiSort,
  rowsItems,
  rowsPerPage,
  searchField,
  searchValue,
  serverItemsLength,
  serverOptions,
  serverSelectAll,
  showIndex,
  showSummary,
  sortBy,
  sortType,
  summaryScope,
  summaryRow,
  summaryText,
  fixedSummary,
  tableHeight,
  tableMinHeight,
  themeColor,
  rowsOfPageSeparatorMessage,
  showIndexSymbol,
  preventContextMenuRow,
  virtual,
  virtualOverscan,
} = toRefs(props);

// Prefer toRef so optional virtual row height stays a defined Ref for hooks.
const virtualRowHeight = toRef(props, 'virtualRowHeight');

// style related computed variables
const tableHeightPx = computed(() => (tableHeight.value ? `${tableHeight.value}px` : null));
const tableMinHeightPx = computed(() => `${tableMinHeight.value}px`);

// global style related variable
provide('themeColor', themeColor.value);

// slot
const slots = useSlots();
const ifHasPaginationSlot = computed(() => !!slots.pagination);
const ifHasLoadingSlot = computed(() => !!slots.loading);
const ifHasExpandSlot = computed(() => !!slots.expand);

const isRowExpandable = (item: Item): boolean => {
  const rule = expandable.value;
  if (typeof rule === 'function') return !!rule(item);
  return rule !== false;
};
const ifHasBodySlot = computed(() => !!slots.body);

// global dataTable $ref
const dataTable = ref();
const tableBody = ref();
provide('dataTable', dataTable);

// fixed-columns shadow + painted-width observer
const showShadow = ref(false);
const measuredColumnWidths = ref<number[]>([]);
const cellHorizontalPadding = ref(DEFAULT_CELL_HORIZONTAL_PADDING_PX);
let columnWidthObserver: ResizeObserver | null = null;

const measurePaintedColumnWidths = () => {
  const root = tableBody.value as HTMLElement | undefined;
  if (!root) {
    if (measuredColumnWidths.value.length) measuredColumnWidths.value = [];
    return;
  }
  const next = readPaintedColumnWidths(root);
  const prev = measuredColumnWidths.value;
  if (prev.length === next.length && prev.every((width, index) => width === next[index])) {
    return;
  }
  measuredColumnWidths.value = next;
};

onMounted(() => {
  const tableRoot = dataTable.value as HTMLElement | undefined;
  if (tableRoot) {
    cellHorizontalPadding.value = readCellHorizontalPadding(
      tableRoot,
      '--easy-table-body-item-padding',
    );
  }

  tableBody.value?.addEventListener('scroll', () => {
    showShadow.value = tableBody.value.scrollLeft > 0;
  });
});

onBeforeUnmount(() => {
  columnWidthObserver?.disconnect();
  columnWidthObserver = null;
});

const emits = defineEmits([
  'clickRow',
  'contextmenuRow',
  'selectRow',
  'deselectRow',
  'expandRow',
  'updateSort',
  'updateFilter',
  'update:itemsSelected',
  'update:serverOptions',
  'update:currentPage',
  'updatePageItems',
  'updateTotalItems',
  'selectAll'
]);

const isMultipleSelectable = computed((): boolean => itemsSelected.value !== null);
const isServerSideMode = computed((): boolean => serverOptions.value !== null);

const {
  serverOptionsComputed,
  updateServerOptionsPage,
  updateServerOptionsSort,
  updateServerOptionsRowsPerPage,
} = useServerOptions(
  serverOptions,
  multiSort,
  emits,
);

const {
  clientSortOptions,
  headerColumns,
  headersForRender,
  headerRows,
  syntheticHeaders,
  updateSortField,
  isMultiSorting,
  getMultiSortNumber,
} = useHeaders(
  showIndexSymbol,
  checkboxColumnWidth,
  expandColumnWidth,
  fixedCheckbox,
  fixedExpand,
  fixedIndex,
  headers,
  ifHasExpandSlot,
  indexColumnWidth,
  isMultipleSelectable,
  isServerSideMode,
  mustSort,
  serverOptionsComputed,
  showIndex,
  sortBy,
  sortType,
  multiSort,
  updateServerOptionsSort,
  emits,
);

const {
  rowsItemsComputed,
  rowsPerPageRef,
  updateRowsPerPage,
} = useRows(
  isServerSideMode,
  rowsItems,
  serverOptions,
  rowsPerPage,
);

const {
  totalItems,
  selectItemsComputed,
  totalItemsLength,
  toggleSelectAll,
  toggleSelectItem,
} = useTotalItems(
  clientSortOptions,
  filterOptions,
  isServerSideMode,
  items,
  itemsSelected,
  searchField,
  searchValue,
  serverItemsLength,
  multiSort,
  itemKey,
  serverSelectAll,
  headers,
  emits,
);

const {
  currentPaginationNumber,
  maxPaginationNumber,
  isLastPage,
  isFirstPage,
  nextPage,
  prevPage,
  updatePage,
  updateCurrentPaginationNumber,
} = usePagination(
  currentPage,
  isServerSideMode,
  loading,
  totalItemsLength,
  rowsPerPageRef,
  serverOptions,
  updateServerOptionsPage,
);

const {
  currentPageFirstIndex,
  currentPageLastIndex,
  multipleSelectStatus,
  pageItems,
} = usePageItems(
  currentPaginationNumber,
  isMultipleSelectable,
  isServerSideMode,
  items,
  rowsPerPageRef,
  selectItemsComputed,
  showIndex,
  totalItems,
  totalItemsLength,
  itemKey,
);

const prevPageEndIndex = computed(() => {
  if (currentPaginationNumber.value === 0) return 0;
  return (currentPaginationNumber.value - 1) * rowsPerPageRef.value;
});

const {
  isRowExpanding,
  updateExpandingItemIndexList,
  clearExpandingItemIndexList,
} = useExpandableRow(
  itemKey,
  emits,
);

/** Stable `v-for` key when `item-key` is set; otherwise page-local index (legacy). */
const resolveRowKey = (item: Item, index: number): string | number => {
  if (itemKey.value) {
    const id = getItemIdentity(item, itemKey.value);
    if (id !== undefined) return id;
  }
  return index;
};

/**
 * Virtualization is opt-in and falls back to full page render when unsafe:
 * expand slot (variable height), body-prepend/append (unknown offset),
 * or missing/invalid virtualRowHeight. Custom `#body` already replaces tbody.
 */
const ifHasBodyPrependSlot = computed(() => !!slots['body-prepend']);
const ifHasBodyAppendSlot = computed(() => !!slots['body-append']);

const virtualFallbackReason = computed((): string | null => {
  if (!virtual.value) return null;
  if (ifHasBodySlot.value) return 'body-slot';
  if (ifHasExpandSlot.value) return 'expand-slot';
  if (ifHasBodyPrependSlot.value || ifHasBodyAppendSlot.value) {
    return 'body-prepend-or-append-slot';
  }
  if (virtualRowHeight.value == null || virtualRowHeight.value <= 0) {
    return 'missing-virtual-row-height';
  }
  return null;
});

const isVirtualActive = computed(
  () => virtual.value && virtualFallbackReason.value === null,
);

let virtualFallbackWarned = false;
watch(virtualFallbackReason, (reason) => {
  if (reason && reason !== 'body-slot' && !virtualFallbackWarned) {
    virtualFallbackWarned = true;
    console.warn(
      `[vue-easy-data-table] virtualization disabled (${reason}). `
      + 'Falling back to full page render. See MIGRATION.md.',
    );
  }
}, { immediate: true });

const {
  virtualRows,
  offsetTop: virtualOffsetTop,
  offsetBottom: virtualOffsetBottom,
} = useVirtualRows(
  isVirtualActive,
  pageItems,
  virtualRowHeight,
  virtualOverscan,
  tableBody,
  tableHeight,
);

/** Shared row list: windowed when virtual is active, else full `pageItems`. */
const rowsForRender = computed(() => {
  if (isVirtualActive.value) return virtualRows.value;
  return pageItems.value.map((item, index) => ({ item, index }));
});

const {
  fixedHeaders,
  lastFixedColumn,
  fixedColumnsInfos,
} = useFixedColumn(
  headersForRender,
  measuredColumnWidths,
  cellHorizontalPadding,
);

const setupColumnWidthObserver = () => {
  columnWidthObserver?.disconnect();
  columnWidthObserver = null;
  if (!fixedHeaders.value.length) {
    if (measuredColumnWidths.value.length) measuredColumnWidths.value = [];
    return;
  }
  const observeTarget = tableBody.value as HTMLElement | undefined;
  if (observeTarget && typeof ResizeObserver !== 'undefined') {
    columnWidthObserver = new ResizeObserver(() => {
      measurePaintedColumnWidths();
    });
    columnWidthObserver.observe(observeTarget);
  }
  measurePaintedColumnWidths();
};

onMounted(() => {
  nextTick(setupColumnWidthObserver);
});

watch(headersForRender, () => {
  nextTick(setupColumnWidthObserver);
});

const {
  clickRow,
} = useClickRow(
  clickEventType,
  isMultipleSelectable,
  showIndex,
  emits,
);

const contextMenuRow = (item: Item, $event: MouseEvent) => {
  if (preventContextMenuRow.value) $event.preventDefault();
  emits('contextmenuRow', item, $event);
};

/** Map internal sortType to WAI-ARIA aria-sort values. */
const ariaSortValue = (
  sortType: SortType | 'none' | undefined,
): 'none' | 'ascending' | 'descending' => {
  if (sortType === 'asc') return 'ascending';
  if (sortType === 'desc') return 'descending';
  return 'none';
};

const onSortableHeaderKeydown = (
  event: KeyboardEvent,
  column: string,
  sortType: SortType | 'none',
) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  updateSortField(column, sortType);
};

// template style generation function
const getColStyle = (header: HeaderForRender): string | undefined => {
  const width = header.width ?? (fixedHeaders.value.length ? 100 : null);
  const minWidth = header.minWidth ?? width;
  const { maxWidth } = header;
  const parts: string[] = [];
  if (width) parts.push(`width: ${width}px`);
  if (minWidth) parts.push(`min-width: ${minWidth}px`);
  if (maxWidth) parts.push(`max-width: ${maxWidth}px`);
  return parts.length ? `${parts.join('; ')};` : undefined;
};

const fixedTableMinWidthStyle = computed(() => {
  if (!fixedHeaders.value.length) return undefined;
  const padding = cellHorizontalPadding.value;
  const minWidth = headersForRender.value.reduce((sum, header) => (
    sum + resolveColumnPaintedWidth({
      configuredWidth: header.width ?? 100,
      horizontalPadding: padding,
    })
  ), 0);
  return { minWidth: `${minWidth}px` };
});

const getFixedDistance = (column: string, type: 'td' | 'th' = 'th'): CSSProperties | undefined => {
  if (!fixedHeaders.value.length) return undefined;
  const columInfo = fixedColumnsInfos.value.find((info) => info.value === column);
  if (!columInfo) return undefined;
  return {
    left: `${columInfo.distance}px`,
    position: 'sticky',
    zIndex: type === 'th' ? FIXED_COLUMN_HEADER_Z_INDEX : FIXED_COLUMN_BODY_Z_INDEX,
  };
};

const getHeaderCellFixedStyle = (header: HeaderForRender): CSSProperties | undefined => {
  if (header.isGroup) {
    if (!header.fixed || !header.firstLeafValue) return undefined;
    return getFixedDistance(header.firstLeafValue);
  }
  return getFixedDistance(header.value);
};

/**
 * Totals (summary) row.
 *
 * Rendered as `<tfoot>` so it lives outside `tbody`: virtual spacer math and
 * the sticky `thead` offset are untouched, unlike a `#body-append` row.
 */

/** Injected checkbox / index / expand columns only — not consumer leaves with those `value`s. */
const isSyntheticSummaryColumn = (header: HeaderForRender): boolean => (
  syntheticHeaders.value.includes(header)
);

type SummaryCell = {
  column: string
  header: HeaderForRender
  value: string | number | null
  isLabel: boolean
  slotName: string | null
};

const summarySlotName = (column: string): string | null => {
  if (slots[`summary-${column}`]) return `summary-${column}`;
  const lowercased = column.toLowerCase();
  if (slots[`summary-${lowercased}`]) return `summary-${lowercased}`;
  if (slots.summary) return 'summary';
  return null;
};

const ifHasSummarySlot = computed(() => Object.keys(slots).some(
  (name) => name === 'summary' || name.startsWith('summary-'),
));

const summaryHeaders = computed((): HeaderForRender[] => headersForRender.value.filter(
  (header) => !isSyntheticSummaryColumn(header) && header.summary != null,
));

const shouldRenderSummary = computed((): boolean => showSummary.value
  || summaryRow.value !== null
  || summaryHeaders.value.length > 0
  || ifHasSummarySlot.value);

/** Rows fed to aggregations: the filtered + sorted set, or just this page. */
const summaryItems = computed((): Item[] => {
  if (isServerSideMode.value) return [];
  return summaryScope.value === 'page' ? pageItems.value : totalItems.value;
});

const summaryCells = computed((): SummaryCell[] => {
  if (!shouldRenderSummary.value) return [];
  const overrides = summaryRow.value;
  const scope = summaryScope.value;
  const items = summaryItems.value;
  let labelPlaced = !summaryText.value;

  return headersForRender.value.map((header): SummaryCell => {
    const skipped = isSyntheticSummaryColumn(header);
    const slotName = skipped ? null : summarySlotName(header.value);
    let value: string | number | null = null;

    if (!skipped) {
      if (overrides && Object.prototype.hasOwnProperty.call(overrides, header.value)) {
        value = overrides[header.value] ?? null;
      } else if (!isServerSideMode.value) {
        // Server mode never aggregates a partial page: a wrong grand total is
        // worse than an empty cell.
        value = resolveHeaderSummary(header.summary, {
          items,
          header: header as Header,
          scope,
        });
      }
    }

    const isLabel = !labelPlaced && !skipped && value === null && !slotName;
    if (isLabel) labelPlaced = true;

    return {
      column: header.value, header, value, isLabel, slotName,
    };
  });
});

/**
 * Loosely typed on purpose: a dynamic `<slot :name>` would otherwise widen the
 * component's whole slot map to these props and break `#item-*` inference.
 */
const summarySlotProps = (cell: SummaryCell): Record<string, any> => ({
  header: cell.header,
  value: cell.value,
  items: summaryItems.value,
  scope: summaryScope.value,
});

let serverSummaryWarned = false;
watch(() => isServerSideMode.value && summaryRow.value === null && summaryHeaders.value.length > 0,
  (conflict) => {
    if (!conflict || serverSummaryWarned) return;
    serverSummaryWarned = true;
    console.warn(
      '[vue-easy-data-table] Header.summary is ignored in server mode because only the '
      + 'current page is loaded. Pass precomputed totals via `summary-row`. See MIGRATION.md.',
    );
  }, { immediate: true });

/** Frozen totals cells reuse header geometry so the row cannot drift sideways. */
const getSummaryCellFixedStyle = (column: string): CSSProperties | undefined => {
  const style = getFixedDistance(column, 'th');
  if (!style) return undefined;
  return { ...style, zIndex: FIXED_COLUMN_SUMMARY_Z_INDEX };
};

watch(loading, (newVal, oldVal) => {
  if (serverOptionsComputed.value) {
    // Belt-and-suspenders: also sync page when the fetch finishes.
    // Primary sync is the serverOptions.page watch in usePagination.
    if (newVal === false && oldVal === true) {
      updateCurrentPaginationNumber(serverOptionsComputed.value.page);
      clearExpandingItemIndexList();
    }
  }
});

watch(rowsPerPageRef, (value) => {
  if (!isServerSideMode.value) {
    updatePage(1);
  } else {
    updateServerOptionsRowsPerPage(value);
  }
});

watch([searchValue, filterOptions], () => {
  if (!isServerSideMode.value) {
    updatePage(1);
  }
});

// Keep v-model:current-page parents in sync (client mode only).
watch(currentPaginationNumber, (page) => {
  if (!isServerSideMode.value) {
    emits('update:currentPage', page);
  }
});

watch([currentPaginationNumber, clientSortOptions, searchField, searchValue, filterOptions], () => {
  clearExpandingItemIndexList();
}, { deep: true });

watch(pageItems, (value) => {
  emits('updatePageItems', value);
}, { deep: true });

watch(totalItems, (value) => {
  emits('updateTotalItems', value);
}, { deep: true });


defineExpose({
  currentPageFirstIndex,
  currentPageLastIndex,
  clientItemsLength: totalItemsLength,
  maxPaginationNumber,
  currentPaginationNumber,
  isLastPage,
  isFirstPage,
  nextPage,
  prevPage,
  updatePage,
  rowsPerPageOptions: rowsItemsComputed,
  rowsPerPageActiveOption: rowsPerPageRef,
  updateRowsPerPageActiveOption: updateRowsPerPage,
});

</script>

<style>
  :root {
    /*table*/
    --easy-table-border: 1px solid #e0e0e0;
    --easy-table-row-border: 1px solid #e0e0e0;
    /*header-row*/
    --easy-table-header-font-size: 12px;
    --easy-table-header-height: 36px;
    --easy-table-header-font-color: #373737;
    --easy-table-header-background-color: #fff;
    /*header-item*/
    --easy-table-header-item-padding: 0px 10px;
    /*body-row*/
    --easy-table-body-row-height: 36px;
    --easy-table-body-row-font-size: 12px;

    --easy-table-body-row-font-color: #212121;
    --easy-table-body-row-background-color: #fff;

    --easy-table-body-row-hover-font-color: #212121;
    --easy-table-body-row-hover-background-color: #eee;

    --easy-table-body-even-row-font-color: #212121;
    --easy-table-body-even-row-background-color: #fafafa;
    /*body-item*/
    --easy-table-body-item-padding: 0px 10px;
    /*summary-row*/
    --easy-table-summary-background-color: #fff;
    --easy-table-summary-font-color: #212121;
    --easy-table-summary-font-size: 12px;
    --easy-table-summary-font-weight: 600;
    --easy-table-summary-item-padding: 0px 10px;
    /*footer*/
    --easy-table-footer-background-color: #fff;
    --easy-table-footer-font-color: #212121;
    --easy-table-footer-font-size: 12px;
    --easy-table-footer-padding: 0px 5px;
    --easy-table-footer-height: 36px;
    /**footer-rowsPerPage**/
    --easy-table-rows-per-page-selector-width: auto;
    --easy-table-rows-per-page-selector-option-padding: 5px;
    --easy-table-rows-per-page-selector-z-index: auto;
    /*message*/
    --easy-table-message-font-color: #212121;
    --easy-table-message-font-size: 12px;
    --easy-table-message-padding: 20px;
    /*loading-mask*/
    --easy-table-loading-mask-background-color: #fff;
    --easy-table-loading-mask-opacity: 0.5;
    /*scroll-bar*/
    --easy-table-scrollbar-track-color: #fff;
    --easy-table-scrollbar-color: #fff;
    --easy-table-scrollbar-thumb-color: #c1c1c1;
    --easy-table-scrollbar-corner-color: #fff;
    /*buttons-pagination*/
    --easy-table-buttons-pagination-border: 1px solid #e0e0e0;
  }
</style>

<style lang="scss" scoped>
@import '../scss/vue3-easy-data-table.scss';

.vue3-easy-data-table__main {
  min-height: v-bind(tableMinHeightPx);
}
.vue3-easy-data-table__main.fixed-height {
  height: v-bind(tableHeightPx);
}
</style>
