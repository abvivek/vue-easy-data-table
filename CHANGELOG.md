# Changelog

## 1.7.0

Additive totals (summary) row:

- **`Header.summary`**: built-in aggregations (`sum`, `avg`, `min`, `max`, `count`) or custom `SummaryFn` on leaf columns — **client mode only**.
- **Props**: `show-summary`, `summary-scope` (`page` \| `all`), `summary-row`, `summary-text`, `fixed-summary`.
- **Slots**: `#summary-{value}` and `#summary` with `{ header, value, items, scope }`.
- **`<tfoot>` row**: does not disable `virtual` (unlike `#body-append` totals); `hide-footer` does not hide the summary row.
- **Server mode**: pass precomputed totals via `summary-row`; `Header.summary` is ignored (console warn once).
- **Sticky columns**: frozen totals cells reuse painted `left` / z-index (`FIXED_COLUMN_SUMMARY_Z_INDEX`).
- **Types exported**: `SummaryAggregation`, `SummaryScope`, `SummaryContext`, `SummaryFn`, `SummaryRow`.

See [MIGRATION.md](./MIGRATION.md) and [docs/API.md](./docs/API.md).

## 1.6.1

Docs — README rewrite for the stable 1.6 line (install, migration, features). No runtime change.

## 1.6.0

First stable release of the `vue-easy-data-table` fork. Drop-in compatible with `vue3-easy-data-table` 1.5.x; new APIs are additive.

- **Package**: renamed from `vue3-easy-data-table`; Vue is a peer (`^3.4.0 || ^3.5.0`); Vite 6 / Vitest 3 toolchain.
- **Correctness**: numeric sort, null-safe search, pagination / `currentPage` sync, packaging `exports`, expand-row index + `expandable`.
- **`item-key`**: optional stable row identity for selection / expand / virtual (omit for legacy `JSON.stringify`).
- **Virtual rows**: opt-in `virtual` + `virtual-row-height` (windows the current page).
- **Server DX**: footer page tracks `serverOptions.page`; custom `serverOptions` fields preserved; `server-select-all`.
- **Accessibility**: `aria-sort`, labeled checkboxes / pagination / expand, keyboard sort, `aria-busy`.
- **Headers**: `align` / `headerAlign` / `className` / `hidden` / `children` (grouped thead); `#customize-headers` keeps sort / select-all / fixed columns.
- **Sticky columns**: painted-width `left`, opaque backgrounds, and stacking so scrolling cells cannot paint through frozen ones (including custom thead).

See [MIGRATION.md](./MIGRATION.md) and [docs/API.md](./docs/API.md).

## 1.6.0-alpha.9

Bugfix — `#customize-headers` + fixed columns:

- Slot now also binds `getHeaderCellFixedStyle`, `getFixedDistance`, `lastFixedColumn`, and `fixedHeaders` so a custom thead can reuse painted sticky `left` / z-index (no consumer math).
- Frozen custom `<th>` should use that style plus class `fixed-column` (and `shadow` on the last frozen leaf/group).
- `.fixed-header th` stays vertically sticky (`z-index` 3); `th.fixed-column` wins at `z-index` 4 with an opaque header background, including custom thead markup that omits `vue3-easy-data-table__header`. Those header rules use `:deep()` so they match `#customize-headers` cells (scoped CSS without `:deep` left slotted frozen `<th>` transparent).

See [MIGRATION.md](./MIGRATION.md) and [docs/API.md](./docs/API.md).

## 1.6.0-alpha.8

Phase 6 — customizable table headers (additive):

- **`Header.align`**: per-column text direction on matching `<td>` (and `<th>` unless `headerAlign` is set).
- **`Header.headerAlign`**: header-only align (falls back to `align`, then `header-text-direction`).
- **`Header.minWidth` / `maxWidth`**: column `<col>` min/max width in px.
- **`Header.sort`**: client-mode custom compare `(a, b) => number` (ignored in server mode).
- **`Header.className`**: extra class on that column’s `<th>` and `<td>`, merged with table-level class-name props.
- **`Header.hidden`**: omit a column from render without changing item data.
- **`Header.children`**: nested group headers (multi-row `<thead>`). Only leaves are body columns. Sort stays on sortable leaves.
- **Fixed groups**: a group is sticky only when every visible leaf is `fixed: true`. Mixed fixed/unfixed children warn and are treated as unfixed.
- **No mutation**: sorting no longer writes `sortType` onto consumer `Header` objects.
- **Sticky measurement**: painted widths follow leaf columns (`colgroup` / `data-leaf-column`), not group parent `<th>` cells.
- **`#customize-headers`**: still replaces thead; now binds `headers`, `headerRows`, `updateSortField`, `toggleSelectAll`, and related helpers. Prefer `children` for grouped headers.

See [MIGRATION.md](./MIGRATION.md) and [docs/API.md](./docs/API.md).

## 1.6.0-alpha.7

Bugfix — sticky/fixed columns overlapping scrolling cells:

- Sticky `left` now follows **painted** column widths (ResizeObserver / `offsetWidth` of header cells). Fallback when layout cannot be measured: configured `width` + horizontal cell padding (default `0px 10px` → +20px).
- Fixed cells use an opaque background, `position: sticky`, and higher z-index (body `2`, header corner `4`) so scrolling cells cannot paint through them. Blanket `position: relative` on every `td`/`th` was removed (kept on expand cells).
- Checkbox / index / expand pinned columns share the same distance chain. Header and body `left` stay in sync. Last-fixed shadow stays on the last frozen cell.
- Tables with fixed columns get `min-width` from the column-width sum so `width: 100%` + `table-layout: fixed` can still stretch, while sticky offsets track the stretched widths.
- Body cell styles pierce `DataTableBodyRow` via `:deep()` (padding, background, hover, shadow).

See [MIGRATION.md](./MIGRATION.md).

## 1.6.0-alpha.6

Phase 5 — accessibility (additive; class hooks preserved):

- **Sortable headers**: `aria-sort` (`none` / `ascending` / `descending`), keyboard focus (`tabindex="0"`), Enter/Space activates sort (themes [#333](https://github.com/HC200ok/vue3-easy-data-table/issues/333)).
- **Checkboxes**: header select-all and row checkboxes expose `role="checkbox"`, `aria-label`, `aria-checked` (incl. `mixed`) and keyboard activation ([#302](https://github.com/HC200ok/vue3-easy-data-table/issues/302)).
- **Pagination**: prev/next and page controls are real `<button type="button">` with `aria-label` / `aria-current`; footer `role="navigation"`.
- **Expand**: expand control is `<button type="button">` with `aria-expanded` and Expand/Collapse labels (not a bare `<i>`).
- **Table**: keeps `table` / `thead` / `tbody`; `aria-busy` while loading; decorative sort/multi-sort icons `aria-hidden`.
- **RTL quick wins**: logical margins for sort markers; `[dir="rtl"]` expand chevron + fixed-column shadow mirror ([#303](https://github.com/HC200ok/vue3-easy-data-table/issues/303) / [#368](https://github.com/HC200ok/vue3-easy-data-table/issues/368)). Deep RTL layout is deferred.

## 1.6.0-alpha.5

Phase 4 — server-side DX (additive / safer behavior):

- **Page sync**: Footer / `currentPaginationNumber` tracks `serverOptions.page` directly in server mode (no longer depends only on `loading` flipping `true → false`). Loading-edge sync and expand clear remain.
- **Custom `serverOptions` fields (#388)**: `update:serverOptions` preserves unknown keys (filters, group IDs, etc.) on pagination / rows-per-page / sort emits.
- **`server-select-all` prop** (`'page'` | `'all'`, default `'page'`): makes page-vs-all select-all intent explicit. Default keeps Phase 1 page-merge behavior; `'all'` signals full-result selection via `@select-all` (see [MIGRATION.md](./MIGRATION.md)).
- **Docs**: Recommended server fetch loop (pagination / sort / loading) documented in MIGRATION.md (themes [#307](https://github.com/HC200ok/vue3-easy-data-table/issues/307), [#165](https://github.com/HC200ok/vue3-easy-data-table/issues/165)).

## 1.6.0-alpha.4

Phase 3 — opt-in tbody virtualization (additive):

- **`virtual`**, **`virtual-row-height`**, **`virtual-overscan`** props. Default `virtual=false` keeps the legacy full-page render path.
- Windows over **`pageItems`** (current page), not the full unpaged dataset — pagination semantics unchanged.
- Shared `DataTableBodyRow` for default and virtual paths (slots / checkbox / expand / fixed columns stay consistent).
- **Safe auto-fallback** (full page render + console warning) when: `#expand` is used, `#body-prepend` / `#body-append` is used, or `virtual-row-height` is missing/invalid. Custom `#body` already replaces tbody (virtual N/A).
- Recommend **`item-key`** + fixed row height when enabling virtual. See [MIGRATION.md](./MIGRATION.md).
- **CI quality gate**: GitHub Actions runs `lint` / `typecheck` / `test` / `build` / `bench:ci` (smoke, no timing thresholds) on PRs and `main` (Node 20 + 22).

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
