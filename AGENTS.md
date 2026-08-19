# AGENTS.md — vue-easy-data-table

Agent entrypoint for using and changing this library correctly.

## What this is

Actively maintained fork/successor of [`vue3-easy-data-table`](https://github.com/HC200ok/vue3-easy-data-table).

| | |
| --- | --- |
| **npm package** | `vue-easy-data-table` |
| **Default export** | `Vue3EasyDataTable` (register as `EasyDataTable` if you prefer) |
| **Named export** | `{ Vue3EasyDataTable }` |
| **Public API** | Drop-in compatible with upstream; additive props through 1.7.x |

## Install + import

```bash
npm install vue-easy-data-table
```

Peer: **Vue `^3.4.0 || ^3.5.0`** (not bundled).

```js
import Vue3EasyDataTable from 'vue-easy-data-table';
import 'vue-easy-data-table/dist/style.css'; // exact CSS path — required

// optional alias
import { Vue3EasyDataTable as EasyDataTable } from 'vue-easy-data-table';
```

Types (`Header`, `Item`, `ServerOptions`, …) come from the package root / `types/main.d.ts`.

## Critical rules

1. **Do not break the public API** — props, slots, emits, CSS class hooks stay compatible with upstream unless a major version says otherwise. Additive changes only on the 1.6.x path.
2. **Prefer `item-key`** for large datasets / selection / expand / virtual rows. Without it, identity uses `JSON.stringify` (slow and fragile).
3. **Virtualization is opt-in** — `virtual` defaults to `false`. Needs a positive `virtual-row-height` and a bounded scroll viewport (`table-height` recommended). Auto-disables with `#expand`, `#body-prepend`, `#body-append` (not with built-in summary `<tfoot>`).
4. **Server vs client mode**
   - **Client** (default): pass `items`; table searches, filters, sorts, and paginates locally.
   - **Server**: set `v-model:server-options` (non-null) + `server-items-length`; parent owns fetch/sort/page. Client search/filter/sort pipeline is skipped.

## Doc map

| Doc | Use when |
| --- | --- |
| [docs/API.md](./docs/API.md) | Full props / slots / emits / expose / CSS vars |
| [docs/RECIPES.md](./docs/RECIPES.md) | Copy-paste Vue 3 SFC patterns |
| [types/main.d.ts](./types/main.d.ts) | Published TypeScript types |
| [MIGRATION.md](./MIGRATION.md) | Rename + Phase 1–6 additive behavior |
| [CHANGELOG.md](./CHANGELOG.md) | Release notes |
| [docs/BENCHMARKS.md](./docs/BENCHMARKS.md) | Perf notes (`item-key`, benches) |

Source of truth for defaults: `src/propsWithDefault.ts` + required `headers` / `items` in `src/components/DataTable.vue`.

## Common pitfalls

| Pitfall | Fix |
| --- | --- |
| Selection/expand identity wrong or slow without `item-key` | Set `item-key` to a stable field path (`"id"`, `"meta.uuid"`) |
| `virtual` seems to do nothing | Set `:virtual-row-height` > 0; avoid expand/body-prepend/append; give `table-height` |
| Server footer page out of sync | Drive page only via `v-model:server-options`; watch it deeply and refetch |
| Missing styles | Import `vue-easy-data-table/dist/style.css` (not a guessed path) |
| Selection never appears | Selection requires `v-model:items-selected` (non-`null`); `null` disables checkboxes |
| Expecting client search in server mode | Search/filter are client-only; send criteria in `serverOptions` custom fields |
| Grouped headers mixing `fixed` and unfixed children | Make every visible leaf `fixed: true`, or none; mixed groups warn and are treated as unfixed |
| Reaching for `#customize-headers` just to group columns | Prefer `Header.children`; `#customize-headers` still replaces the entire thead (binds `updateSortField` / `toggleSelectAll` / `getHeaderCellFixedStyle` if you need a fully custom thead) |
| Custom thead + `fixed` columns sliding under later headers | Apply `getHeaderCellFixedStyle(header)` and class `fixed-column` (and `shadow` on the last frozen cell) |
| Custom date/order sort looking wrong | Set `Header.sort` `(a, b) => number` in **client** mode; server mode must sort on the parent |
| Expecting client totals in server mode | Pass precomputed totals via `summary-row`; the table never aggregates the loaded page. `Header.summary` without `summary-row` warns once |
| `summary-scope` not changing server totals | Flat `summary-row` ignores scope; use nested `{ all, page }` (plain objects) if page vs all should differ |
| `count` looking like a row count | `count` is non-empty cells in that column; use `'length'` for `items.length` |
| `#summary` (no suffix) stole the Total label | That slot matches every non-synthetic column; use `#summary-{value}` to format one cell |
| Totals disappeared with `hide-footer` | `hide-footer` only hides pagination; `<tfoot>` is separate |
| Virtual totals matching only painted rows | `<tfoot>` uses full `pageItems` / `totalItems`, same as client; virtual does not window the summary |
| `#body-append` totals disabled virtual | Prefer built-in `<tfoot>` summary (`Header.summary` / `summary-row`); virtual stays on |
| Avg showing a long float | `avg` is a raw float; format in `#summary-{value}` |

## Testing commands (this repo)

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run bench:ci
```

Full local benches (not CI-gated on timings): `npm run bench`.

## Versioning

Current line is **`1.7.1`** (see `package.json`). Public API is drop-in compatible with upstream 1.5.x; 1.6.x adds `item-key`, `virtual*`, `server-select-all`, a11y, grouped headers, and `#customize-headers` sticky helpers; 1.7.0 adds the built-in totals (summary) row; 1.7.1 is additive (`length`, named aggregator exports, optional nested `summary-row`).
