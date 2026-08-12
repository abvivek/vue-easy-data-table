import {
  Ref, computed, ComputedRef, watch,
} from 'vue';
import type { Item, FilterOption } from '../types/main';
import type { ClientSortOptions, EmitsEventName } from '../types/internal';
import {
  getItemValue, escapeRegExp, toSearchString, compareValues,
  itemsMatch, getItemIdentity, buildIdentitySet,
} from '../utils';

export default function useTotalItems(
  clientSortOptions: Ref<ClientSortOptions | null>,
  filterOptions: Ref<FilterOption[]>,
  isServerSideMode: ComputedRef<boolean>,
  items: Ref<Item[]>,
  itemsSelected: Ref<Item[]>,
  searchField: Ref<string | string[]>,
  searchValue: Ref<string>,
  serverItemsLength: Ref<number>,
  multiSort: Ref<boolean>,
  itemKey: Ref<string>,
  emits: (event: EmitsEventName, ...args: any[]) => void,
) {
  const generateSearchingTarget = (item: Item): string => {
    if (typeof searchField.value === 'string' && searchField.value !== '') {
      return toSearchString(getItemValue(searchField.value, item));
    }
    if (Array.isArray(searchField.value)) {
      let searchString = '';
      searchField.value.forEach((field) => {
        searchString += toSearchString(getItemValue(field, item));
      });
      return searchString;
    }
    return Object.values(item).map((value) => toSearchString(value)).join(' ');
  };

  // items searching
  const itemsSearching = computed((): Item[] => {
    // searching feature is not available in server-side mode
    if (!isServerSideMode.value && searchValue.value !== '') {
      const regex = new RegExp(escapeRegExp(searchValue.value), 'i');
      return items.value.filter((item) => regex.test(generateSearchingTarget(item)));
    }
    return items.value;
  });
  // items filtering
  const itemsFiltering = computed((): Item[] => {
    let itemsFiltered = [...itemsSearching.value];
    if (filterOptions.value) {
      filterOptions.value.forEach((option: FilterOption) => {
        itemsFiltered = itemsFiltered.filter((item) => {
          const { field, comparison, criteria } = option;
          if (typeof comparison === 'function') {
            return comparison(getItemValue(String(field), item), criteria as string);
          }
          const itemValue = getItemValue(String(field), item);
          switch (comparison) {
            case '=':
              return itemValue === criteria;
            case '!=':
              return itemValue !== criteria;
            case '>':
              return itemValue > criteria;
            case '<':
              return itemValue < criteria;
            case '<=':
              return itemValue <= criteria;
            case '>=':
              return itemValue >= criteria;
            case 'between':
              return itemValue >= Math.min(...criteria) && itemValue <= Math.max(...criteria);
            case 'in':
              return (criteria as Array<string | number>).includes(itemValue);
            default:
              return itemValue === criteria;
          }
        });
      });
      return itemsFiltered;
    }
    return itemsSearching.value;
  });

  watch(itemsFiltering, (newVal) => {
    if (filterOptions.value) {
      emits('updateFilter', newVal);
    }
  }, { immediate: true, deep: true });

  function recursionMuiltSort(sortByArr: string[], sortDescArr: boolean[], itemsToSort: Item[], index: number): Item[] {
    const sortBy = sortByArr[index];
    const sortDesc = sortDescArr[index];
    // Always sort a copy — never mutate the input array inside a computed path.
    const base = index === 0
      ? itemsToSort
      : recursionMuiltSort(sortByArr, sortDescArr, itemsToSort, index - 1);
    return [...base].sort((a: Item, b: Item) => {
      let isAllSame = true;
      for (let i = 0; i < index; i += 1) {
        if (getItemValue(sortByArr[i], a) !== getItemValue(sortByArr[i], b)) {
          isAllSame = false;
          break;
        }
      }
      if (isAllSame) {
        const compared = compareValues(getItemValue(sortBy as string, a), getItemValue(sortBy as string, b));
        if (compared < 0) return sortDesc ? 1 : -1;
        if (compared > 0) return sortDesc ? -1 : 1;
        return 0;
      }
      return 0;
    });
  }

  // flow: searching => filtering => sorting
  // (last step: sorting)
  const totalItems = computed((): Item[] => {
    if (isServerSideMode.value) return items.value;
    if (clientSortOptions.value === null) return itemsFiltering.value;
    const { sortBy, sortDesc } = clientSortOptions.value;
    const itemsFilteringSorted = [...itemsFiltering.value];
    // multi sort
    if (multiSort && Array.isArray(sortBy) && Array.isArray(sortDesc)) {
      if (sortBy.length === 0) return itemsFilteringSorted;
      return recursionMuiltSort(sortBy, sortDesc, itemsFilteringSorted, sortBy.length - 1);
    }

    return [...itemsFilteringSorted].sort((a, b) => {
      const compared = compareValues(getItemValue(sortBy as string, a), getItemValue(sortBy as string, b));
      if (compared < 0) return sortDesc ? 1 : -1;
      if (compared > 0) return sortDesc ? -1 : 1;
      return 0;
    });
  });

  const totalItemsLength = computed((): number => (isServerSideMode.value ? serverItemsLength.value : totalItems.value.length));

  // multiple selecting
  const selectItemsComputed = computed({
    get: () => itemsSelected.value ?? [],
    set: (value) => {
      emits('update:itemsSelected', value);
    },
  });

  const toggleSelectAll = (isChecked: boolean): void => {
    const key = itemKey.value;

    // Server-side: only the current page is in `items`/`totalItems`.
    // Merge/remove current page into existing selection so cross-page selection works.
    if (isServerSideMode.value) {
      if (isChecked) {
        if (key) {
          const selectedKeys = buildIdentitySet(selectItemsComputed.value, key);
          const merged = [...selectItemsComputed.value];
          totalItems.value.forEach((item) => {
            const id = getItemIdentity(item, key);
            if (id !== undefined && !selectedKeys.has(id)) {
              selectedKeys.add(id);
              merged.push(item);
            }
          });
          selectItemsComputed.value = merged;
        } else {
          const merged = [...selectItemsComputed.value];
          totalItems.value.forEach((item) => {
            if (!merged.some((selected) => itemsMatch(selected, item))) {
              merged.push(item);
            }
          });
          selectItemsComputed.value = merged;
        }
        emits('selectAll');
      } else if (key) {
        const pageKeys = buildIdentitySet(totalItems.value, key);
        selectItemsComputed.value = selectItemsComputed.value.filter((selected) => {
          const id = getItemIdentity(selected, key);
          return id === undefined || !pageKeys.has(id);
        });
      } else {
        selectItemsComputed.value = selectItemsComputed.value.filter(
          (selected) => !totalItems.value.some((item) => itemsMatch(selected, item)),
        );
      }
      return;
    }

    selectItemsComputed.value = isChecked ? [...totalItems.value] : [];
    if (isChecked) emits('selectAll');
  };

  const toggleSelectItem = (item: Item): void => {
    const isAlreadyChecked = item.checkbox;

    delete item.checkbox;

    delete item.index;
    if (!isAlreadyChecked) {
      const selectItemsArr: Item[] = selectItemsComputed.value;
      selectItemsArr.unshift(item);
      selectItemsComputed.value = selectItemsArr;
      emits('selectRow', item);
    } else {
      const key = itemKey.value;
      if (key) {
        const id = getItemIdentity(item, key);
        selectItemsComputed.value = selectItemsComputed.value.filter(
          (selectedItem) => getItemIdentity(selectedItem, key) !== id,
        );
      } else {
        // Legacy: JSON.stringify identity (preserves prior omit-key behavior).
        selectItemsComputed.value = selectItemsComputed.value.filter((selectedItem) => JSON.stringify(selectedItem)
          !== JSON.stringify(item));
      }
      emits('deselectRow', item);
    }
  };

  return {
    totalItems,
    selectItemsComputed,
    totalItemsLength,
    toggleSelectAll,
    toggleSelectItem,
  };
}
