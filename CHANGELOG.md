# Changelog

## 1.6.0-alpha.3

Phase 2 — identity + performance foundation:

- **`item-key` prop** (additive): optional field path for stable row identity. When set, select/expand identity and `v-for` keys use the key instead of `JSON.stringify` / index. Omit for drop-in legacy behavior.
- **Hot paths**: client sort always sorts a copy (no in-place mutation of source arrays); keyed select-all / partial-select status use `Set` lookups.
- **Bench harness**: `npm run bench` (optional, not CI-gated). See [docs/BENCHMARKS.md](./docs/BENCHMARKS.md).
- **Recommendation**: use `item-key` for large datasets (10k+ rows). See [MIGRATION.md](./MIGRATION.md).

## 1.6.0-alpha.2

Phase 1 leftovers:

- **Expand (#239)**: Fixed expand-row index tracking (no longer re-finds via fragile `JSON.stringify` on page rows that may include `checkbox`/`index`). Added additive `expandable` prop (`boolean | (item) => boolean`) so expand icons/clicks can be gated per row.
- **Pagination docs**: Clarified client-side behavior — search/filter resets to page 1; replacing `items` clamps to the last valid page when the current page is out of range (does not always force page 1).

## 1.6.0-alpha.1

Phase 1 correctness / P0 packaging & bug fixes:

- **Packaging**: `package.json` `exports` map improved for Vite/Nuxt; TypeScript types now declare default + named `Vue3EasyDataTable` exports; runtime named export added without breaking the default import.
- **CSS**: Fixed invalid `var(easy-table-body-row-font-color)` → `var(--easy-table-body-row-font-color)` (expand icon).
- **Sort**: Client-side sort compares numbers / numeric decimal strings numerically while keeping lexicographic order for non-numeric values.
- **Search**: Null/undefined field values are coerced safely; RegExp metacharacters in search input are escaped.
- **Pagination**: `currentPage` prop sync works reactively; `update:currentPage` emitted for `v-model:current-page`; page clamps when filtered/replaced data shrinks; search/filter still resets to page 1 (client mode).
- **Server select-all**: Header select-all merges/removes **current page** items into the selection instead of overwriting the full selection with only the loaded page.

## 1.6.0-alpha.0

Phase 0 foundation:

- Package renamed to `vue-easy-data-table` (fork of `vue3-easy-data-table`).
- Vue moved to `peerDependencies`.
- Toolchain modernized (Vite 6, Vitest 3, ESLint 9 flat config, TypeScript 5.8).
- CI workflow and `MIGRATION.md` added.
