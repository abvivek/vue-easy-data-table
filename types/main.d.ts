import type { DefineComponent } from 'vue'

export type SortType = 'asc' | 'desc'

export type FilterComparison = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'between'| 'in';

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
} | {
  field: string
  comparison: (value: any, criteria: string) => boolean
  criteria: string
}

export type Header = {
  text: string
  value: string
  sortable?: boolean
  fixed?: boolean
  width?: number
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

/**
 * Optional prop: field path for stable row identity (e.g. `"id"` or `"meta.uuid"`).
 * When set, select/expand identity and row keys use this value instead of
 * `JSON.stringify` / index. Recommended for large datasets.
 */
export type ItemKey = string

/**
 * Opt-in tbody virtualization (`virtual` prop) over the current page (`pageItems`).
 * Requires a positive `virtual-row-height`. Auto-disabled with expand /
 * body-prepend / body-append slots, or when row height is missing/invalid.
 * Prefer `item-key` + fixed row height. See MIGRATION.md.
 */
export type Virtual = boolean

declare const Vue3EasyDataTable: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>

export default Vue3EasyDataTable
export { Vue3EasyDataTable }
