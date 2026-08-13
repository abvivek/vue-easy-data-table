# API reference — vue-easy-data-table

Grounded in `types/main.d.ts`, `src/propsWithDefault.ts`, and `src/components/DataTable.vue` (plus body-row slots). Prefer this over marketing copy when uncertain.

Component: default + named export **`Vue3EasyDataTable`**. Consumers often register it as **`EasyDataTable`**.

---

## Required props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `headers` | `Header[]` | *(required)* | Column definitions. |
| `items` | `Item[]` | *(required)* | Row data. In server mode this is the **current page** only. |

### `Header`

```ts
type HeaderSortCompare = (a: Item, b: Item) => number

type Header = {
  text: string
  value: string
  sortable?: boolean
  fixed?: boolean
  width?: number
  minWidth?: number
  maxWidth?: number
  align?: TextDirection
  headerAlign?: TextDirection
  className?: string
  hidden?: boolean
  sort?: HeaderSortCompare
  children?: Header[]
}
```

Omitting the new fields keeps the same single-row thead and body columns as before.

| Field | Notes |
| --- | --- |
| `align` | `'left' \| 'center' \| 'right'` on that column’s matching `<td>` (and `<th>` unless `headerAlign` is set). Falls back to `body-text-direction` / `header-text-direction`. |
| `headerAlign` | Header-only align. Falls back to `align`, then `header-text-direction`. Use for a centered title over right-aligned numbers. |
| `minWidth` / `maxWidth` | Column `<col>` min/max width in px. `width` still sets both width and min-width when `minWidth` is omitted. |
| `className` | Extra class on that column’s `<th>` and `<td>`, merged with `header-item-class-name` / `body-item-class-name`. |
| `hidden` | Column is not rendered. Item objects are unchanged (the field is still on the row). |
| `sort` | Client-mode custom compare `(a, b) => number` (negative if `a` precedes `b` when ascending). The table negates for desc. **Ignored in server mode.** |
| `children` | Nested group headers. **Only leaves** (no `children`, or empty `children`) become body columns. Prefer `children` over `#customize-headers` for grouped headers. |

**Grouped + `fixed`:** a group is sticky only when **every** visible leaf has `fixed: true`. Mixing `fixed: true` and unfixed children in one group logs a console warning and treats the whole group as unfixed (avoids a broken sticky layout).

**Fixed column order:** top-level items (a leaf or a whole group) with all-visible-leaves-fixed are moved before unfixed top-level items — the same “fixed columns first” behavior as a flat header list.

### `Item`

```ts
type Item = Record<string, any>
```

---

## Optional props

Defaults from `src/propsWithDefault.ts`.

### Data / identity / selection

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `item-key` | `string` | `''` | Field path for stable row identity (`"id"`, `"meta.uuid"`). When set, select/expand and `v-for` keys use it instead of `JSON.stringify` / page index. Prefer for large data. |
| `items-selected` | `Item[] \| null` | `null` | Selection model. **`null` disables** multi-select UI. Use `v-model:items-selected` with an array (often `[]`) to enable checkboxes. |
| `server-select-all` | `'page' \| 'all'` | `'page'` | Server-mode header select-all scope. `'page'`: merge/remove current page. `'all'`: replace/clear selection and emit `selectAll` for full-result handling. |

### Server mode

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `server-options` | `ServerOptions \| null` | `null` | Non-`null` enables **server mode**. Use `v-model:server-options`. |
| `server-items-length` | `number` | `0` | Total row count across all pages (server). |

```ts
type ServerOptions = {
  page: number
  rowsPerPage: number
  sortBy?: string | string[]
  sortType?: SortType | SortType[]
  [key: string]: any // custom fields round-tripped on update (#388)
}
type SortType = 'asc' | 'desc'
```

### Sorting / search / filter (client unless noted)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `sort-by` | `string \| string[]` | `''` | Initial / controlled sort field(s). |
| `sort-type` | `SortType \| SortType[]` | `'asc'` | Initial / controlled sort direction(s). |
| `multi-sort` | `boolean` | `false` | Allow multiple sort columns. |
| `must-sort` | `boolean` | `false` | When true, sorting cannot return to unsorted (`none`). |
| `search-field` | `string \| string[]` | `''` | Limit client search to field(s). Empty = search all values. **Client mode only.** |
| `search-value` | `string` | `''` | Client search string (case-insensitive; metacharacters escaped). Resets page to 1 in client mode. |
| `filter-options` | `FilterOption[] \| null` | `null` | Client filter rules. Resets page to 1 in client mode. |

### Pagination / footer

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `current-page` | `number` | `1` | Client-mode page. Supports `v-model:current-page`. Ignored as source of truth in server mode (`serverOptions.page` owns page). |
| `rows-per-page` | `number` | `25` | Rows per page. |
| `rows-items` | `number[]` | `[25, 50, 100]` | Rows-per-page selector options. |
| `rows-per-page-message` | `string` | `'rows per page:'` | Footer label before selector. |
| `rows-of-page-separator-message` | `string` | `'of'` | Between range and total (`1–25 of 100`). |
| `buttons-pagination` | `boolean` | `false` | Numbered page buttons instead of arrows only. |
| `hide-footer` | `boolean` | `false` | Hide entire footer. |
| `hide-rows-per-page` | `boolean` | `false` | Hide rows-per-page selector. |

### Expand

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `expandable` | `boolean \| ((item: Item) => boolean)` | `true` | Gate expand affordance when `#expand` is present. `false` = never; function = per-row. |
| `expand-column-width` | `number` | `36` | Expand column width (px). |
| `fixed-expand` | `boolean` | `false` | Sticky expand column. |
| `click-row-to-expand` | `boolean` | `false` | Toggle expand on row click (in addition to expand control). |

### Virtualization (opt-in)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `virtual` | `boolean` | `false` | Window tbody rows over **current page** (`pageItems`). |
| `virtual-row-height` | `number \| undefined` | `undefined` | Fixed row height in px. **Required** (positive) for virtual to activate. |
| `virtual-overscan` | `number` | `5` | Extra rows above/below the visible window. |

**Auto-disable (falls back to full page render):** `#expand` present; `#body-prepend` / `#body-append` present; missing/non-positive `virtual-row-height`. Custom `#body` replaces tbody (virtual N/A). Prefer `item-key` + `table-height`.

### Layout / columns / chrome

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `table-height` | `number \| null` | `null` | Fixed body height (px). Enables `.fixed-height` scroll container. |
| `table-min-height` | `number` | `180` | Min height (px). |
| `fixed-header` | `boolean` | `true` | Sticky header inside scroll body. |
| `show-index` | `boolean` | `false` | Show index column. |
| `show-index-symbol` | `string` | `'#'` | Index header text. |
| `index-column-width` | `number` | `60` | Index column width (px). |
| `fixed-index` | `boolean` | `false` | Sticky index column. |
| `checkbox-column-width` | `number \| null` | `null` | Checkbox column width when selectable. |
| `fixed-checkbox` | `boolean` | `false` | Sticky checkbox column. |
| `hide-header` | `boolean` | `false` | Hide `<thead>`. |
| `alternating` | `boolean` | `false` | Alternating row class (`row-alternation` / even-row styling). |
| `no-hover` | `boolean` | `false` | Disable row hover styles. |
| `border-cell` | `boolean` | `false` | Cell borders. |
| `header-text-direction` | `'center' \| 'left' \| 'right'` | `'left'` | Header text alignment class. |
| `body-text-direction` | `'center' \| 'left' \| 'right'` | `'left'` | Body cell alignment class. |
| `theme-color` | `string` | `'#42b883'` | Accent (provided to children; checkboxes/loading accents). |
| `table-class-name` | `string` | `''` | Extra class on root `.vue3-easy-data-table`. |
| `header-class-name` | `string` | `''` | Extra class on `<thead>`. |
| `header-item-class-name` | `string \| (header, columnNumber) => string` | `''` | Per-`<th>` class. |
| `body-row-class-name` | `string \| (item, rowNumber) => string` | `''` | Per body `<tr>` class. |
| `body-expand-row-class-name` | `string \| (item, rowNumber) => string` | `''` | Per expand `<tr>` class. |
| `body-item-class-name` | `string \| (column, rowNumber) => string` | `''` | Per body `<td>` class. |
| `empty-message` | `string` | `'No Available Data'` | Default empty text (overridable via `#empty-message`). |
| `loading` | `boolean` | `false` | Show loading mask; sets `aria-busy` on `<table>`. |
| `table-node-id` | `string` | `''` | `id` on `<table>`. |
| `click-event-type` | `'single' \| 'double'` | `'single'` | Which click type emits `clickRow`. |
| `prevent-context-menu-row` | `boolean` | `true` | Prevent default browser context menu on row contextmenu when handling `contextmenuRow`. |

---

## Slots

| Slot | Scope / bind | Description |
| --- | --- | --- |
| `item` | `{ column, item }` | Fallback custom cell for any column without a more specific slot. |
| `item-{value}` | `item` (row fields as slot props) | Column cell by `header.value`. Also tries `item-{value.toLowerCase()}`. |
| `header` | header object | Fallback custom header cell content. |
| `header-{value}` | header object | Header by `header.value` (and lowercase variant). |
| `expand` | `item` | Expanded row content. Presence enables expand column. Disables `virtual`. |
| `body` | `pageItems` (bound as slot props) | Replace entire `<tbody>` content path. Virtual N/A. |
| `body-prepend` | `{ items, pagination, headers }` | Rows/content before data rows. Disables `virtual`. |
| `body-append` | `{ items, pagination, headers }` | After data rows (`pagination` includes `updatePage`). Disables `virtual`. |
| `pagination` | `{ isFirstPage, isLastPage, currentPaginationNumber, maxPaginationNumber, nextPage, prevPage }` | Replace default pagination controls. |
| `loading` | — | Custom loading entity inside the loading mask. |
| `empty-message` | — | Custom empty state (default uses `emptyMessage` prop). |
| `customize-headers` | `{ headers, headerRows, updateSortField, toggleSelectAll, multipleSelectStatus, isMultiSorting, getMultiSortNumber, getHeaderCellFixedStyle, getFixedDistance, lastFixedColumn, fixedHeaders }` | When present, replaces default `<thead>` entirely. Prefer `Header.children` for grouped headers. Slot props let a custom thead keep sort / select-all / **fixed columns** without copying painted-width math. Frozen custom `<th>` must use `:style="getHeaderCellFixedStyle(header)"` plus class `fixed-column` (and `shadow` when it is the last fixed leaf/group). Class `fixed-column` also supplies the opaque header background and stacking so later headers cannot paint through. |

Slot forwarding: `DataTableBodyRow` re-exposes parent slots, so `item-*` / `expand` / `item` work as documented in upstream feature docs.

---

## Emits / v-models

| Event | Payload | Notes |
| --- | --- | --- |
| `update:itemsSelected` | `Item[]` | `v-model:items-selected` |
| `update:serverOptions` | `ServerOptions` | `v-model:server-options`; preserves custom keys |
| `update:currentPage` | `number` | `v-model:current-page` (**client mode only**) |
| `clickRow` | `ClickRowArgument`, `Event` | Respects `click-event-type`. Argument may include `isSelected`, `indexInCurrentPage`. |
| `contextmenuRow` | `Item`, `Event` | Row context menu. |
| `selectRow` | `Item` | Row checked. |
| `deselectRow` | `Item` | Row unchecked. |
| `selectAll` | — | Header select-all checked (server `'all'` / client as implemented). |
| `expandRow` | `expandingItemIndex: number`, `Item` | Fired when a row **opens** (not on collapse). Index is global/page-aware index passed by the table. |
| `updateSort` | `{ sortType, sortBy }` | Header sort change. |
| `updateFilter` | filter options | When `filterOptions` change (watched). |
| `updatePageItems` | current page items | Deep watch on `pageItems`. |
| `updateTotalItems` | filtered/sorted total items (client) | Deep watch on `totalItems`. |

```ts
type ClickRowArgument = Item & {
  isSelected?: boolean
  indexInCurrentPage?: number
}
```

---

## Expose / methods

Via `defineExpose` / template ref:

| Name | Kind | Description |
| --- | --- | --- |
| `currentPageFirstIndex` | computed | 1-based first index on page. |
| `currentPageLastIndex` | computed | 1-based last index on page. |
| `clientItemsLength` | computed | Alias of total items length (filtered client total, or `serverItemsLength` in server mode). |
| `maxPaginationNumber` | computed | Last page number. |
| `currentPaginationNumber` | computed/ref | Current page. |
| `isLastPage` / `isFirstPage` | computed | Page bounds. |
| `nextPage` / `prevPage` | fn | Navigate. |
| `updatePage` | fn | Jump to page number. |
| `rowsPerPageOptions` | computed | Effective rows-per-page options. |
| `rowsPerPageActiveOption` | ref | Active rows-per-page. |
| `updateRowsPerPageActiveOption` | fn | Set rows-per-page. |

---

## CSS variables / classes

Root defaults live in `DataTable.vue` `<style>` (`:root`). Stylesheets: `src/scss/vue3-easy-data-table.scss` (built to `dist/style.css`).

### Important CSS variables

| Variable | Role |
| --- | --- |
| `--easy-table-border` / `--easy-table-row-border` | Table / row borders |
| `--easy-table-header-*` | Header font, height, colors, item padding |
| `--easy-table-body-row-*` | Body row height, font, colors, hover, even-row |
| `--easy-table-body-item-padding` | Cell padding |
| `--easy-table-footer-*` | Footer chrome |
| `--easy-table-message-*` | Empty message |
| `--easy-table-loading-mask-*` | Loading overlay |
| `--easy-table-scrollbar-*` | Scrollbar colors |
| `--easy-table-buttons-pagination-border` | Numbered pagination |

### Important classes (stable hooks)

| Class | Where |
| --- | --- |
| `vue3-easy-data-table` | Root |
| `vue3-easy-data-table__main` | Scroll/body wrapper (`fixed-header`, `fixed-height`, `hoverable`, `border-cell`, …) |
| `vue3-easy-data-table__header` / `__body` / `__footer` | Sections |
| `sortable` / `asc` / `desc` / `none` | Sortable `<th>` |
| `fixed-column` | Frozen `<th>` / `<td>` (`position: sticky` + painted `left`). Custom `#customize-headers` cells must add this class (also supplies the opaque header background so later headers cannot paint through). |
| `shadow` | Last frozen cell (inset shadow when the table is scrolled horizontally). |
| `expand-icon` / `expanding` | Expand control |
| `easy-checkbox` | Checkbox UI (see checkbox SCSS) |
| `previous-page__click-button` / `next-page__click-button` | Pagination arrows |
| `buttons-pagination` | Numbered pages |
| `vue3-easy-data-table__virtual-spacer` | Virtual top/bottom spacers |

Do not rename these lightly — consumers and a11y tests rely on them.

---

## Behavior notes

### Client pipeline

When `server-options` is `null`:

1. **Search** (`searchValue` / `searchField`) →  
2. **Filter** (`filterOptions`) →  
3. **Sort** (header / `sortBy`+`sortType` / multi-sort / per-column `Header.sort`) →  
4. **Paginate** (`currentPage`, `rowsPerPage`) → `pageItems`.

- Changing `searchValue` or `filterOptions` resets to page **1**.
- Replacing `items` **clamps** page if out of range (does not force page 1 if still valid).
- `v-model:current-page` stays in sync via `update:currentPage`.

### Server mode

When `server-options` is non-`null`:

- Table does **not** client-search/filter/sort the full dataset; `items` is treated as the current page.
- Page / rowsPerPage / sort changes emit `update:serverOptions` (custom keys preserved).
- Footer page tracks `serverOptions.page`.
- Parent should: watch `serverOptions` (deep) → set `loading` → fetch → set `items` + `serverItemsLength` → clear `loading`.

### Selection

- Enabled only when `items-selected !== null`.
- With `item-key`: identity via key/`Set`. Without: deep/`JSON.stringify`-style matching (legacy).
- Server `'page'` vs `'all'`: see `server-select-all` and [MIGRATION.md](../MIGRATION.md).

### Accessibility (1.6.0+)

Additive attributes/keyboard only — class names unchanged. Sortable headers: `aria-sort`, focusable, Enter/Space. Checkboxes/pagination/expand: accessible names and ARIA. Loading: `aria-busy` on table. Custom slots that replace controls should keep their own accessible names.

### Grouped headers (1.6.0+)

`Header.children` builds multi-row `<thead>` (group parents + leaf columns). `#header-{value}`, lowercase, and `#header` slots apply to group parent cells as well as leaves. Sort UI stays on sortable **leaves** only. `#customize-headers` still replaces the entire thead when you need markup the tree cannot express. For frozen columns in that slot, apply `getHeaderCellFixedStyle(header)` and class `fixed-column` (see recipes).
