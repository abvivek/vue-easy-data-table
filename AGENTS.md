# AGENTS.md — vue-easy-data-table

Agent entrypoint for using and changing this library correctly.

## What this is

Actively maintained fork/successor of [`vue3-easy-data-table`](https://github.com/HC200ok/vue3-easy-data-table).

| | |
| --- | --- |
| **npm package** | `vue-easy-data-table` |
| **Default export** | `Vue3EasyDataTable` (register as `EasyDataTable` if you prefer) |
| **Named export** | `{ Vue3EasyDataTable }` |
| **Public API** | Drop-in compatible with upstream; additive props only in 1.6.x |

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
3. **Virtualization is opt-in** — `virtual` defaults to `false`. Needs a positive `virtual-row-height` and a bounded scroll viewport (`table-height` recommended). Auto-disables with `#expand`, `#body-prepend`, `#body-append`.
4. **Server vs client mode**
   - **Client** (default): pass `items`; table searches, filters, sorts, and paginates locally.
   - **Server**: set `v-model:server-options` (non-null) + `server-items-length`; parent owns fetch/sort/page. Client search/filter/sort pipeline is skipped.

## Doc map

| Doc | Use when |
| --- | --- |
| [docs/API.md](./docs/API.md) | Full props / slots / emits / expose / CSS vars |
| [docs/RECIPES.md](./docs/RECIPES.md) | Copy-paste Vue 3 SFC patterns |
| [types/main.d.ts](./types/main.d.ts) | Published TypeScript types |
| [MIGRATION.md](./MIGRATION.md) | Rename + Phase 1–5 additive behavior |
| [CHANGELOG.md](./CHANGELOG.md) | Release notes by alpha |
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

Current line is **`1.6.0-alpha.*`** (see `package.json`). Alphas/RCs ship additive Phase work (identity, virtual, server DX, a11y) before a stable 1.6.0. Prefer latest alpha when documenting or consuming fork-only APIs (`item-key`, `virtual*`, `server-select-all`, a11y).
