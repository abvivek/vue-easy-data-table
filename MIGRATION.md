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

### Pagination behavior (client mode)

| Trigger | Behavior |
| --- | --- |
| `searchValue` / `filterOptions` change | Reset to page **1** |
| `items` replaced and current page exceeds new max | **Clamp** to last valid page (does not force page 1 if still in range) |
| `currentPage` / `v-model:current-page` prop change | Sync internal page |

Server mode continues to own page via `v-model:server-options` (unchanged).
