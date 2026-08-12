import { Ref, ref } from 'vue';
import type { Item } from '../types/main';
import type { EmitsEventName } from '../types/internal';
import { getItemIdentity } from '../utils';

export default function useExpandableRow(
  itemKey: Ref<string>,
  emits: (event: EmitsEventName, ...args: any[]) => void,
) {
  /** Index-based when `itemKey` is omitted; key-based when set. */
  const expandingItemIndexList = ref<(number | string)[]>([]);

  const resolveExpandIdentity = (expandingItemIndex: number, expandingItem: Item): number | string => {
    const key = itemKey.value;
    if (key) {
      const id = getItemIdentity(expandingItem, key);
      if (id !== undefined) return id;
    }
    return expandingItemIndex;
  };

  const isRowExpanding = (expandingItemIndex: number, expandingItem: Item): boolean => {
    const id = resolveExpandIdentity(expandingItemIndex, expandingItem);
    return expandingItemIndexList.value.includes(id);
  };

  const updateExpandingItemIndexList = (expandingItemIndex: number, expandingItem: Item, event: Event) => {
    event.stopPropagation();
    const id = resolveExpandIdentity(expandingItemIndex, expandingItem);
    const index = expandingItemIndexList.value.indexOf(id);
    if (index !== -1) {
      expandingItemIndexList.value.splice(index, 1);
      return;
    }

    // Always emit the caller-provided global index for public API compatibility.
    emits('expandRow', expandingItemIndex, expandingItem);
    expandingItemIndexList.value.push(id);
  };

  const clearExpandingItemIndexList = () => {
    expandingItemIndexList.value = [];
  };

  return {
    expandingItemIndexList,
    isRowExpanding,
    updateExpandingItemIndexList,
    clearExpandingItemIndexList,
  };
}
