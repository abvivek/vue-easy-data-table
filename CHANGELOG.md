# Changelog

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
