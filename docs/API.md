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
  summary?: SummaryAggregation | SummaryFn
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
| `summary` | Totals-row cell for this column: a built-in aggregation name (`'sum' \| 'avg' \| 'min' \| 'max' \| 'count'`) or a `SummaryFn`. Declaring it on any visible leaf renders the totals `<tfoot>`. **Client mode only** — in server mode use the `summary-row` prop. Set it on **leaves**, not group parents (parents are not body columns). See [Summary (totals) row](#summary-totals-row). |
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
| `hide-footer` | `boolean` | `false` | Hide pagination footer. Does **not** hide the totals `<tfoot>`. |
| `hide-rows-per-page` | `boolean` | `false` | Hide rows-per-page selector. |

### Expand

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `expandable` | `boolean \| ((item: Item) => boolean)` | `true` | Gate expand affordance when `#expand` is present. `false` = never; function = per-row. |
| `expand-column-width` | `number` | `36` | Expand column width (px). |
| `fixed-expand` | `boolean` | `false` | Sticky expand column. |
| `click-row-to-expand` | `boolean` | `false` | Toggle expand on row click (in addition to expand control). |

### Summary (totals) row

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `show-summary` | `boolean` | `false` | Force the totals `<tfoot>` even when no column declares `Header.summary` (useful when the row is filled by `#summary*` slots only). |
| `summary-scope` | `'page' \| 'all'` | `'all'` | Rows fed to aggregations in client mode. `'all'`: the **filtered + sorted** dataset (`totalItems`). `'page'`: current page only (`pageItems`). Ignored in server mode. |
| `summary-row` | `SummaryRow \| null` | `null` | Precomputed totals keyed by `header.value`. Overrides `Header.summary` per key and is the **only** supported source in server mode. Non-`null` (even `{}`) renders the row. |
| `summary-text` | `string` | `'Total'` | Label rendered in the first totals cell that has no value and no slot of its own. `''` renders no label cell at all. |
| `fixed-summary` | `boolean` | `true` | Stick the totals row to the bottom of the scroll container (`position: sticky; bottom: 0`, `z-index` 3 / frozen cells 4). `false` leaves it in flow at the end of the table. |

```ts
type SummaryAggregation = 'sum' | 'avg' | 'min' | 'max' | 'count'

// which rows feed aggregations (client mode)
type SummaryScope = 'page' | 'all'

type SummaryContext = {
  items: Item[]   // rows in scope
  header: Header
  scope: SummaryScope
}

// custom totals cell; return null for an empty cell
type SummaryFn = (ctx: SummaryContext) => string | number | null

// precomputed totals keyed by header.value
type SummaryRow = Record<string, string | number | null>
```

All five types are exported from the package root (see [`types/main.d.ts`](../types/main.d.ts)). Semantics: [Summary (totals) row](#summary-totals-row) under Behavior notes.

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
| `summary-{value}` | `{ header, value, items, scope }` | Totals cell by `header.value` (also tries `summary-{value.toLowerCase()}`). Presence renders the totals `<tfoot>`. `value` is the resolved total (`summary-row` entry or `Header.summary` result, `null` when there is none); `items` are the rows in scope (empty array in server mode); `scope` is the `summary-scope` prop. |
| `summary` | `{ header, value, items, scope }` | Fallback totals cell for any non-synthetic column without a `summary-{value}` slot. Because it matches **every** such column, no `summary-text` label cell is emitted — render your own label. |
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
| `--easy-table-summary-background-color` | Totals row background (default `#fff`) |
| `--easy-table-summary-font-color` | Totals row text color (default `#212121`) |
| `--easy-table-summary-font-size` | Totals row font size (default `12px`) |
| `--easy-table-summary-font-weight` | Totals row font weight (default `600`) |
| `--easy-table-summary-item-padding` | Totals cell padding (default `0px 10px`) |
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
| `vue3-easy-data-table__summary` | Totals `<tfoot>` (only rendered when something opts in) |
| `fixed-summary` | On that `<tfoot>` when `fixed-summary` is true (sticky bottom) |
| `summary-cell` | Every totals `<th>` / `<td>` (also carries `direction-*` and `Header.className`) |
| `summary-label` | The `summary-text` label cell (`<th scope="row">`, also `summary-cell`) |
| `sortable` / `asc` / `desc` / `none` | Sortable `<th>` |
| `fixed-column` | Frozen `<th>` / `<td>` (`position: sticky` + painted `left`). Custom `#customize-headers` cells must add this class (also supplies the opaque header background so later headers cannot paint through). |
| `shadow` | Last frozen cell (inset shadow when the table is scrolled horizontally), including the totals row. |
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

### Summary (totals) row (1.7.0+)

Rendered as `<tfoot class="vue3-easy-data-table__summary">` when any of: `show-summary`, non-`null` `summary-row`, a visible leaf declares `Header.summary`, or a `#summary*` slot is present. **`hide-footer` does not hide the summary row.**

- Cells iterate `headersForRender` (same column order as body). Checkbox, index, and expand synthetic columns render empty.
- **`summary-text`** (default `'Total'`) becomes a `<th scope="row">` in the first non-synthetic column with no value and no dedicated slot. `''` skips the label cell.
- **`summary-row`** overrides `Header.summary` per key. **`#summary-{value}`** overrides both for presentation.
- **Client mode:** aggregations run over `summary-scope` — `'all'` uses the filtered + sorted dataset (`totalItems`); `'page'` uses `pageItems`.
- **Server mode:** never aggregates; pass precomputed totals via `summary-row`. `Header.summary` without `summary-row` warns once and renders blank cells.
- **`#summary` slot:** matches every non-synthetic column without a `summary-{value}` slot; no auto label — render your own.
- **Virtualization:** summary does not disable `virtual` (unlike `#body-append`).
- **Sticky columns:** frozen totals cells reuse header `left` / z-index (`fixed-column`, `shadow`, `FIXED_COLUMN_SUMMARY_Z_INDEX`).

Built-in aggregations skip null, undefined, empty string, and non-numeric strings for `sum`/`avg`/`min`/`max`; `count` counts non-empty values. Custom `SummaryFn` receives `{ items, header, scope }` and may return `null` for an empty cell.
