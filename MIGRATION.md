# Migration guide (vue3-easy-data-table → vue-easy-data-table)

This package is an actively maintained fork/successor of [`vue3-easy-data-table`](https://github.com/HC200ok/vue3-easy-data-table).

## Package name

| Before | After |
| --- | --- |
| `vue3-easy-data-table` | `vue-easy-data-table` |

```bash
npm uninstall vue3-easy-data-table
npm install vue-easy-data-table
```

## Imports

```js
// before
import Vue3EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';

// after
import Vue3EasyDataTable from 'vue-easy-data-table';
import 'vue-easy-data-table/dist/style.css';
```

The CSS export path string (`./dist/style.css`) is unchanged for consumers of this package.

Default export / component registration name remains `Vue3EasyDataTable`. Types (`Header`, `Item`, etc.) continue to come from the package root.

Named export is also available:

```js
import Vue3EasyDataTable, { Vue3EasyDataTable as EasyDataTable } from 'vue-easy-data-table';
```

## Vue peer dependency

Vue is no longer bundled as a dependency. Install Vue yourself:

```json
"peerDependencies": {
  "vue": "^3.4.0 || ^3.5.0"
}
```

## Public API

Props, slots, emits, and CSS class names remain compatible with upstream `vue3-easy-data-table`. Dist filenames still use the `vue3-easy-data-table.*` prefix for compatibility.

### Additive (Phase 1)

- `update:currentPage` emit supports `v-model:current-page` for client-side pagination control.
- Server-side header “select all” merges/removes the **current page** into `itemsSelected` (does not wipe prior cross-page selection). The existing `selectAll` event is still emitted when checking the header box.
- `expandable` prop (`boolean | (item) => boolean`, default `true`) gates per-row expand icon and expand clicks when using `#expand` (upstream #239).

### Additive (Phase 2) — `item-key`

Optional prop for stable row identity (recommended for large datasets):

```vue
<EasyDataTable
  :headers="headers"
  :items="items"
  item-key="id"
  v-model:items-selected="itemsSelected"
/>
```

| `item-key` | Select / expand identity | Row `v-for` key |
| --- | --- | --- |
| **set** (e.g. `"id"` or `"meta.uuid"`) | Key value via field path | Stable key |
| **omitted** (default) | Legacy `JSON.stringify` | Page-local index |

No breaking change when omitted. Prefer `item-key` at 10k+ rows so select-all stays usable (keyed path uses `Set` lookups).

### Additive (Phase 3) — tbody virtualization

Opt-in windowing over the **current page** (`pageItems`). Defaults preserve legacy DOM/behavior.

```vue
<EasyDataTable
  :headers="headers"
  :items="items"
  item-key="id"
  :rows-per-page="500"
  :table-height="480"
  virtual
  :virtual-row-height="36"
  :virtual-overscan="5"
/>
```

| Prop | Default | Notes |
| --- | --- | --- |
| `virtual` | `false` | Enable windowing |
| `virtual-row-height` | `null` | Fixed row height in px (**required** for virtual) |
| `virtual-overscan` | `5` | Extra rows above/below the viewport |

**Auto-disable (safe fallback to full page render):**

| Condition | Behavior |
| --- | --- |
| `#expand` slot present | Virtual off (variable-height expand unsupported in v1) |
| `#body-prepend` / `#body-append` | Virtual off (unknown scroll offset) |
| Missing / non-positive `virtual-row-height` | Virtual off |
| Custom `#body` slot | Virtual N/A (tbody already replaced) |

Fixed columns / sticky cells remain supported on the virtual path (same cell sticky styles). Prefer `item-key` + a real `table-height` so the scroll container has a bounded viewport.

### Pagination behavior (client mode)

| Trigger | Behavior |
| --- | --- |
| `searchValue` / `filterOptions` change | Reset to page **1** |
| `items` replaced and current page exceeds new max | **Clamp** to last valid page (does not force page 1 if still in range) |
| `currentPage` / `v-model:current-page` prop change | Sync internal page |

Server mode continues to own page via `v-model:server-options`. Footer/`currentPaginationNumber` syncs when `serverOptions.page` updates (loading edge still works).

### Additive (Phase 4) — server-side DX

#### Recommended fetch loop

Watch `serverOptions` (deep), set `loading`, fetch page data, then assign `items` / `serverItemsLength` and clear `loading`. Themes: upstream [#307](https://github.com/HC200ok/vue3-easy-data-table/issues/307), [#165](https://github.com/HC200ok/vue3-easy-data-table/issues/165).

```vue
<template>
  <EasyDataTable
    v-model:server-options="serverOptions"
    :server-items-length="serverItemsLength"
    :loading="loading"
    :headers="headers"
    :items="items"
  />
</template>

<script setup>
import { ref, watch } from 'vue';

const items = ref([]);
const loading = ref(false);
const serverItemsLength = ref(0);
const serverOptions = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'name',
  sortType: 'asc',
  // Custom fields are preserved on pagination/sort emits (#388):
  groupId: 42,
});

async function loadFromServer() {
  loading.value = true;
  try {
    const res = await fetchPage(serverOptions.value); // your API
    items.value = res.rows;
    serverItemsLength.value = res.total;
  } finally {
    loading.value = false;
  }
}

loadFromServer();
watch(serverOptions, () => { loadFromServer(); }, { deep: true });
</script>
```

#### Custom `serverOptions` fields (#388)

Unknown keys on `serverOptions` are **round-tripped** on `update:serverOptions` (pagination, rows-per-page, single-field sort). You can keep filters/group IDs on the same object.

#### `server-select-all`

| Value | Behavior |
| --- | --- |
| `'page'` (**default**) | Header select-all **merges/removes the current page** into `itemsSelected` (Phase 1). `@select-all` still fires on check. |
| `'all'` | Header select-all **replaces** selection with the current page and emits `@select-all` so the parent can treat it as “entire server result set”. Uncheck **clears** the whole selection. Remote rows are not loaded into `itemsSelected`. |

```vue
<EasyDataTable
  v-model:server-options="serverOptions"
  v-model:items-selected="itemsSelected"
  server-select-all="all"
  @select-all="onSelectAllServerResult"
  ...
/>
```

Omit the prop (or use `'page'`) for existing cross-page merge behavior.

### Additive (Phase 5) — accessibility

No breaking API changes. CSS class names (`sortable`, `expand-icon`, `easy-checkbox`, `previous-page__click-button`, `next-page__click-button`, `buttons-pagination`, etc.) are unchanged.

| Area | What changed |
| --- | --- |
| Sortable `<th>` | `aria-sort`, focusable when sortable, Enter/Space sorts |
| Checkboxes | Accessible name + `aria-checked` (header + rows) |
| Pagination | Native buttons + `aria-label` / `aria-current` |
| Expand | `<button type="button">` with `aria-expanded` |
| Loading | `aria-busy` on `<table>` |
| RTL | Minor logical CSS / `[dir="rtl"]` mirrors only |

Custom `#header` / `#item` / `#expand` / `#pagination` slots are unchanged — if you replace pagination or expand UI entirely, keep providing accessible names in your own markup.

Deep right-to-left layout (full mirror of sticky columns, arrow glyphs, etc.) is **not** complete in this release; set `dir="rtl"` on an ancestor for the quick wins above.

### Bugfix — sticky/fixed columns (1.6.0-alpha.7)

No public API change: `fixed: true` + `width` is still the documented way to pin columns.

Sticky `left` previously summed configured `header.width` only. With `table-layout: fixed` and `width: 100%`, painted columns are often wider than `width`, and content-box padding (`--easy-table-body-item-padding` / `--easy-table-header-item-padding`, default `0px 10px`) was omitted. Scrolling cells could slide over frozen ones.

**What you may notice (visual bugfix, not a breaking API):**

- Frozen columns stay aligned with their painted width (including padding and extra stretch).
- Sticky cells have an opaque background and sit above scrolling cells (z-index body `2`, sticky header `3`, frozen header corner `4`).
- Checkbox / index / expand columns that are auto-pinned with user `fixed` columns keep the same `left` chain.

Right-side frozen columns are still not implemented. Deep RTL sticky (`left` vs `right`) is still deferred.

If you overrode sticky `left` / `z-index` in app CSS, drop those workarounds — the library now measures painted widths.

### Additive (Phase 6) — customizable headers

No breaking API. New optional `Header` fields; omit them for identical single-row thead/body behavior.

| Field | Effect |
| --- | --- |
| `align` | Per-column text direction on matching `<td>` (and `<th>` unless `headerAlign` is set) |
| `headerAlign` | Header-only align (falls back to `align`, then `header-text-direction`) |
| `minWidth` / `maxWidth` | Column `<col>` min/max width in px |
| `className` | Extra class on that column’s `<th>` and `<td>` (merged with table-level class-name props) |
| `hidden` | Skip rendering the column; item data is unchanged |
| `sort` | Client-mode custom compare `(a, b) => number`; ignored in server mode |
| `children` | Nested group headers. Only leaves are body columns |

```ts
const headers: Header[] = [
  { text: 'Name', value: 'name', sortable: true },
  {
    text: 'Member info',
    value: 'member-info',
    children: [
      { text: 'Team', value: 'team' },
      { text: 'Number', value: 'number', sortable: true },
    ],
  },
];
```

**`fixed` + groups:** a group is sticky only if **all** visible leaves are `fixed: true`. Mixing fixed and unfixed children warns and treats the group as unfixed.

**`#customize-headers`** still replaces the entire `<thead>`. Prefer `children` for grouped headers. The slot binds `headers` (leaf columns for render), `headerRows`, `updateSortField`, `toggleSelectAll`, `multipleSelectStatus`, `isMultiSorting`, `getMultiSortNumber`, **`getHeaderCellFixedStyle`**, **`getFixedDistance`**, **`lastFixedColumn`**, and **`fixedHeaders`**.

Frozen custom `<th>` must apply `:style="getHeaderCellFixedStyle(header)"` and class `fixed-column` (plus `shadow` on the last fixed leaf/group). Do not reimplement painted-width `left`. `.fixed-header th` stays vertically sticky (`z-index` 3 / `STICKY_HEADER_Z_INDEX`); `th.fixed-column` wins at `z-index` 4 (`FIXED_COLUMN_HEADER_Z_INDEX`) with an opaque header background. Those rules pierce via `:deep()` so slotted `#customize-headers` cells match.

CSS class hooks (`vue3-easy-data-table__header`, `sortable`, `direction-*`) are unchanged. Sort still lives on sortable leaves, not group parent cells.
