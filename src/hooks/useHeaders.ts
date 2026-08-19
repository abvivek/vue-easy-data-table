import {
  ref, Ref, computed, ComputedRef, WritableComputedRef,
} from 'vue';
import type { Header, SortType } from '../types/main';
import type {
  ServerOptionsComputed, HeaderForRender, ClientSortOptions, EmitsEventName,
} from '../types/internal';
import {
  cloneHeader,
  filterHiddenHeaders,
  flattenLeaves,
  maxDepth,
  normalizeGroupFixed,
  partitionFixedTopLevel,
  buildHeaderRows,
} from '../headerTree';

export default function useHeaders(
  showIndexSymbol: Ref<string>,
  checkboxColumnWidth: Ref<number>,
  expandColumnWidth: Ref<number>,
  fixedCheckbox: Ref<boolean>,
  fixedExpand: Ref<boolean>,
  fixedIndex: Ref<boolean>,
  headers: Ref<Header[]>,
  ifHasExpandSlot: ComputedRef<boolean>,
  indexColumnWidth: Ref<number>,
  isMultipleSelectable: ComputedRef<boolean>,
  isServerSideMode: ComputedRef<boolean>,
  mustSort: Ref<boolean>,
  serverOptionsComputed: WritableComputedRef<ServerOptionsComputed | null>,
  showIndex: Ref<boolean>,
  sortBy: Ref<string | string[]>,
  sortType: Ref<SortType | SortType[]>,
  multiSort: Ref<boolean>,
  updateServerOptionsSort: (newSortBy: string, newSortType: SortType | null) => void,
  emits: (event: EmitsEventName, ...args: any[]) => void,
) {
  const mixedFixedWarnedGroups = new Set<string>();

  const warnMixedFixed = (msg: string) => {
    if (mixedFixedWarnedGroups.has(msg)) return;
    mixedFixedWarnedGroups.add(msg);
    console.warn(msg);
  };

  const orderedTopLevel = computed((): Header[] => {
    const cloned = headers.value.map(cloneHeader);
    const visible = filterHiddenHeaders(cloned);
    const normalized = visible.map((header) => normalizeGroupFixed(header, warnMixedFixed));
    return partitionFixedTopLevel(normalized);
  });

  const hasFixedColumnsFromUser = computed(() => (
    flattenLeaves(orderedTopLevel.value).some((header) => header.fixed)
  ));

  const generateClientSortOptions = (sortByValue: string | string[], sortTypeValue: SortType | SortType[]): ClientSortOptions | null => {
    // multi sort
    if (Array.isArray(sortByValue) && Array.isArray(sortTypeValue)) {
      return {
        sortBy: sortByValue,
        sortDesc: sortTypeValue.map((val: SortType) => val === 'desc'),
      };
    }
    // single sort
    if (sortByValue !== '') {
      return {
        sortBy: sortBy.value,
        sortDesc: sortType.value === 'desc',
      };
    }
    return null;
  };

  const clientSortOptions = ref<ClientSortOptions | null>(generateClientSortOptions(sortBy.value, sortType.value));

  const applySortToLeaf = (header: Header): HeaderForRender => {
    const { children, hidden, ...rest } = header;
    const headerSorting: HeaderForRender = { ...rest };

    if (headerSorting.sortable) headerSorting.sortType = 'none';

    // server mode
    if (serverOptionsComputed.value) {
      if (Array.isArray(serverOptionsComputed.value.sortBy) && Array.isArray(serverOptionsComputed.value.sortType)
      && serverOptionsComputed.value.sortBy.includes(headerSorting.value)) {
        // multi sort
        const index = serverOptionsComputed.value.sortBy.indexOf(headerSorting.value);
        headerSorting.sortType = serverOptionsComputed.value.sortType[index];
      } else if (headerSorting.value === serverOptionsComputed.value.sortBy && serverOptionsComputed.value.sortType) {
        // single sort
        headerSorting.sortType = serverOptionsComputed.value.sortType as SortType;
      }
    }

    // client mode
    // multi sort
    if (clientSortOptions.value && Array.isArray(clientSortOptions.value.sortBy) && Array.isArray(clientSortOptions.value.sortDesc)
    && clientSortOptions.value.sortBy.includes(headerSorting.value)) {
      const index = clientSortOptions.value.sortBy.indexOf(headerSorting.value);
      headerSorting.sortType = clientSortOptions.value.sortDesc[index] ? 'desc' : 'asc';
    } else if (clientSortOptions.value && headerSorting.value === clientSortOptions.value.sortBy) {
      // single sort
      headerSorting.sortType = clientSortOptions.value.sortDesc ? 'desc' : 'asc';
    }
    return headerSorting;
  };

  const syntheticHeaders = computed((): HeaderForRender[] => {
    const synthetics: HeaderForRender[] = [];
    if (isMultipleSelectable.value) {
      synthetics.push(
        (fixedCheckbox.value || hasFixedColumnsFromUser.value) ? {
          text: 'checkbox', value: 'checkbox', fixed: true, width: checkboxColumnWidth.value ?? 36,
        } : { text: 'checkbox', value: 'checkbox' },
      );
    }
    if (showIndex.value) {
      synthetics.push(
        (fixedIndex.value || hasFixedColumnsFromUser.value) ? {
          text: showIndexSymbol.value, value: 'index', fixed: true, width: indexColumnWidth.value,
        } : { text: showIndexSymbol.value, value: 'index' },
      );
    }
    if (ifHasExpandSlot.value) {
      synthetics.push(
        (fixedExpand.value || hasFixedColumnsFromUser.value) ? {
          text: '', value: 'expand', fixed: true, width: expandColumnWidth.value,
        } : { text: '', value: 'expand' },
      );
    }
    return synthetics;
  });

  const headersForRender = computed((): HeaderForRender[] => {
    const leaves = flattenLeaves(orderedTopLevel.value).map(applySortToLeaf);
    return [...syntheticHeaders.value, ...leaves];
  });

  const headerRows = computed((): HeaderForRender[][] => {
    const depth = maxDepth(orderedTopLevel.value);
    if (depth <= 1) return [headersForRender.value];
    return buildHeaderRows(orderedTopLevel.value, syntheticHeaders.value, applySortToLeaf);
  });

  const headerColumns = computed((): string[] => headersForRender.value.map((header) => header.value));

  const updateSortField = (newSortBy: string, oldSortType: SortType | 'none') => {
    let newSortType: SortType | null = null;
    if (oldSortType === 'none') {
      newSortType = 'asc';
    } else if (oldSortType === 'asc') {
      newSortType = 'desc';
    } else {
      newSortType = (mustSort.value) ? 'asc' : null;
    }

    if (isServerSideMode.value) {
      // update server options
      updateServerOptionsSort(newSortBy, newSortType);
    }

    // multi sort
    if (clientSortOptions.value && Array.isArray(clientSortOptions.value.sortBy)
      && Array.isArray(clientSortOptions.value.sortDesc)) {
      const index = clientSortOptions.value.sortBy.indexOf(newSortBy);
      if (index === -1) {
        if (newSortType !== null) {
          clientSortOptions.value.sortBy.push(newSortBy);
          clientSortOptions.value.sortDesc.push(newSortType === 'desc');
        }
      } else if (newSortType === null) {
        clientSortOptions.value.sortDesc.splice(index, 1);
        clientSortOptions.value.sortBy.splice(index, 1);
      } else {
        clientSortOptions.value.sortDesc[index] = newSortType === 'desc';
      }
    } else if (newSortType === null) {
      clientSortOptions.value = null;
    } else {
      clientSortOptions.value = {
        sortBy: newSortBy,
        sortDesc: newSortType === 'desc',
      };
    }
    emits('updateSort', {
      sortType: newSortType,
      sortBy: newSortBy,
    });
  };

  const isMultiSorting = (headerText: string): boolean => {
    if (serverOptionsComputed.value) {
      if (Array.isArray(serverOptionsComputed.value.sortBy)) return serverOptionsComputed.value.sortBy.includes(headerText);
    }
    if (clientSortOptions.value && Array.isArray(clientSortOptions.value.sortBy)) {
      return clientSortOptions.value.sortBy.includes(headerText);
    }
    return false;
  };

  const getMultiSortNumber = (headerText: string) => {
    if (serverOptionsComputed.value) {
      if (Array.isArray(serverOptionsComputed.value.sortBy)) return serverOptionsComputed.value.sortBy.indexOf(headerText) + 1;
    }
    if (clientSortOptions.value && Array.isArray(clientSortOptions.value.sortBy)) {
      return clientSortOptions.value.sortBy.indexOf(headerText) + 1;
    }
    return false;
  };

  return {
    clientSortOptions,
    headerColumns,
    headersForRender,
    headerRows,
    syntheticHeaders,
    updateSortField,
    isMultiSorting,
    getMultiSortNumber,
  };
}
