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
