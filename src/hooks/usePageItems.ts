import {
  Ref, computed, ComputedRef, WritableComputedRef,
} from 'vue';
import type { Item } from '../types/main';
import type { MultipleSelectStatus } from '../types/internal';
import {
  itemsMatch, getItemIdentity, buildIdentitySet, stripEphemeralFields,
} from '../utils';

export default function usePageItems(
  currentPaginationNumber: Ref<number>,
  isMultipleSelectable: ComputedRef<boolean>,
  isServerSideMode: ComputedRef<boolean>,
  items: Ref<Item[]>,
  rowsPerPageRef: Ref<number>,
  selectItemsComputed: WritableComputedRef<Item[]>,
  showIndex: Ref<boolean>,
  totalItems: ComputedRef<Item[]>,
  totalItemsLength: ComputedRef<number>,
  itemKey: Ref<string>,
) {
  const currentPageFirstIndex = computed((): number => (currentPaginationNumber.value - 1)
    * rowsPerPageRef.value + 1);

  const currentPageLastIndex = computed((): number => {
    if (isServerSideMode.value) {
      return Math.min(totalItemsLength.value, currentPaginationNumber.value * rowsPerPageRef.value);
    }
    return Math.min(
      totalItems.value.length,
      currentPaginationNumber.value * rowsPerPageRef.value,
    );
  });

  // items in current page
  const itemsInPage = computed((): Item[] => {
    if (isServerSideMode.value) return items.value;
    return totalItems.value.slice(currentPageFirstIndex.value - 1, currentPageLastIndex.value);
  });

  const itemsWithIndex = computed((): Item[] => {
    if (showIndex.value) {
      return itemsInPage.value.map((item, index) => ({ index: currentPageFirstIndex.value + index, ...item }));
    }
    return itemsInPage.value;
  });

  const isItemSelected = (item: Item): boolean => {
    const key = itemKey.value;
    if (key) {
      const id = getItemIdentity(item, key);
      if (id === undefined) return false;
      return selectItemsComputed.value.some(
        (selectItem) => getItemIdentity(selectItem, key) === id,
      );
    }
    const itemDeepCloned = stripEphemeralFields(item);
    return selectItemsComputed.value.some((selectItem) => itemsMatch(selectItem, itemDeepCloned));
  };

  const multipleSelectStatus = computed((): MultipleSelectStatus => {
    // Client: select-all targets the full filtered set. Server: only the current page is loaded.
    const targetItems = isServerSideMode.value ? itemsInPage.value : totalItems.value;

    if (selectItemsComputed.value.length === 0 || targetItems.length === 0) {
      return 'noneSelected';
    }

    const key = itemKey.value;
    if (key) {
      const selectedKeys = buildIdentitySet(selectItemsComputed.value, key);
      let selectedCount = 0;
      for (let i = 0; i < targetItems.length; i += 1) {
        const id = getItemIdentity(targetItems[i], key);
        if (id !== undefined && selectedKeys.has(id)) selectedCount += 1;
      }
      if (selectedCount === 0) return 'noneSelected';
      if (selectedCount === targetItems.length) return 'allSelected';
      return 'partSelected';
    }

    const selectedCount = targetItems.filter((item) => isItemSelected(item)).length;
    if (selectedCount === 0) return 'noneSelected';
    if (selectedCount === targetItems.length) return 'allSelected';
    return 'partSelected';
  });

  // items for render
  const pageItems = computed((): Item[] => {
    if (!isMultipleSelectable.value) return itemsWithIndex.value;
    // multi select
    if (multipleSelectStatus.value === 'allSelected') {
      return itemsWithIndex.value.map((item) => ({ checkbox: true, ...item }));
    } if (multipleSelectStatus.value === 'noneSelected') {
      return itemsWithIndex.value.map((item) => ({ checkbox: false, ...item }));
    }

    const key = itemKey.value;
    if (key) {
      const selectedKeys = buildIdentitySet(selectItemsComputed.value, key);
      return itemsWithIndex.value.map((item) => {
        const id = getItemIdentity(item, key);
        const isSelected = id !== undefined && selectedKeys.has(id);
        return { checkbox: isSelected, ...item };
      });
    }

    return itemsWithIndex.value.map((item) => {
      const itemDeepCloned = stripEphemeralFields(item);
      const isSelected = selectItemsComputed.value.some(
        (selectItem) => itemsMatch(selectItem, itemDeepCloned),
      );
      return { checkbox: isSelected, ...item };
    });
  });

  return {
    currentPageFirstIndex,
    currentPageLastIndex,
    multipleSelectStatus,
    pageItems,
  };
}
