import type { HeaderSortCompare, SortType, TextDirection } from './main';

export type ServerOptionsComputed = {
  page: number
  rowsPerPage: number
  sortBy: string | string[] | null
  sortType: SortType | SortType[] | null
}

export type HeaderForRender = {
  text: string
  value: string
  sortable?: boolean
  sortType?: SortType | 'none'
  fixed?: Boolean
  width?: number
  minWidth?: number
  maxWidth?: number
  align?: TextDirection
  headerAlign?: TextDirection
  className?: string
  sort?: HeaderSortCompare
  colspan?: number
  rowspan?: number
  /** Group parent cell (not a body column). Sort is ignored. */
  isGroup?: boolean
  /** First leaf column value under this cell (for sticky left on group parents). */
  firstLeafValue?: string
  /** Last leaf column value under this cell (for shadow on group parents). */
  lastLeafValue?: string
}

export type ClientSortOptions = {
  sortBy: string | string[],
  sortDesc: boolean | boolean[],
}

export type ClickEventType = 'single' | 'double'

export type MultipleSelectStatus = 'allSelected' | 'noneSelected' | 'partSelected'

 
export type EmitsEventName = 'clickRow' | 'selectRow' | 'deselectRow' | 'expandRow' | 'updateSort' | 'update:itemsSelected' | 'update:serverOptions' | 'update:currentPage' | 'updateFilter' | 'updatePageItems' | 'updateTotalItems' | 'selectAll'
