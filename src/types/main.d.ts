export type SortType = 'asc' | 'desc'

export type FilterComparison = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'between' | 'in';

export type Item = Record<string, any>

export type FilterOption = {
  field: string
  comparison: 'between'
  criteria: [number, number]
} | {
  field: string
  comparison: '=' | '!='
  criteria: number | string
} | {
  field: string
  comparison: '>' | '>=' | '<' | '<='
  criteria: number
} | {
  field: number | string
  comparison: 'in'
  criteria: number[] | string[]
}| {
  field: string
  comparison: (value: any, criteria: string) => boolean
  criteria: string
}

/** Client-side compare: negative if `a` precedes `b` in ascending order. */
export type HeaderSortCompare = (a: Item, b: Item) => number

/** Built-in totals-row aggregations for `Header.summary`. */
export type SummaryAggregation = 'sum' | 'avg' | 'min' | 'max' | 'count'

/**
 * Which rows feed the totals row (client mode).
 * - `all` (default): filtered + sorted dataset.
 * - `page`: current page only.
 */
export type SummaryScope = 'page' | 'all'

export type SummaryContext = {
  /** Rows in scope (see `SummaryScope`). */
  items: Item[]
  header: Header
  scope: SummaryScope
}

/** Custom totals cell. Return `null` for an empty cell. */
export type SummaryFn = (ctx: SummaryContext) => string | number | null

/**
 * Precomputed totals keyed by `header.value`. Overrides `Header.summary`,
 * and is the only supported source in server mode.
 */
export type SummaryRow = Record<string, string | number | null>

export type Header = {
  text: string
  value: string
  sortable?: boolean
  fixed?: boolean
  width?: number
  /** Min column width in px (`<col>` style). */
  minWidth?: number
  /** Max column width in px (`<col>` style). */
  maxWidth?: number
  /** Per-column text align for th + matching td. Falls back to header/body text-direction props. */
  align?: TextDirection
  /** Header-only align. Falls back to `align`, then `header-text-direction`. */
  headerAlign?: TextDirection
  /** Extra class on that column's th and td; merged with table-level class-name props. */
  className?: string
  /** Omit from render; item data unchanged. */
  hidden?: boolean
  /**
   * Client-mode custom compare for this column. Return negative if `a` should
   * come before `b` when sorting ascending; the table negates for desc.
   * Ignored in server mode (parent owns sort).
   */
  sort?: HeaderSortCompare
  /**
   * Totals-row cell for this column: a built-in aggregation name or a custom
   * function. Client mode only — server mode must supply `summary-row`.
   */
  summary?: SummaryAggregation | SummaryFn
  /** Nested group headers. Only leaves (no children) are body columns. */
  children?: Header[]
}

export type ServerOptions = {
  page: number
  rowsPerPage: number
  sortBy?: string | string[]
  sortType?: SortType | SortType[]
  /** Custom fields are preserved on `update:serverOptions` (#388). */
  [key: string]: any
}

/**
 * Server-mode header select-all scope.
 * - `page` (default): merge/remove only the current page into `itemsSelected`.
 * - `all`: signal full-result selection via `selectAll`; replace/clear selection (see MIGRATION.md).
 */
export type ServerSelectAll = 'page' | 'all'

export type ClickRowArgument = Item & {
  isSelected?: boolean
  indexInCurrentPage?: number
}

export type UpdateSortArgument = {
  sortType: SortType | null
  sortBy: string
}

export type HeaderItemClassNameFunction = (header: Header, columnNumber: number) => string
export type BodyRowClassNameFunction = (item: Item, rowNumber: number) => string
export type BodyItemClassNameFunction = (column: string, rowNumber: number) => string

export type TextDirection = 'center' | 'left' | 'right'

/** Optional field path for stable row identity (`"id"` or nested `"meta.uuid"`). */
export type ItemKey = string

/**
 * Opt-in tbody virtualization over the current page (`pageItems`).
 * Requires a positive `virtualRowHeight`. See MIGRATION.md for fallback rules.
 */
export type Virtual = boolean
