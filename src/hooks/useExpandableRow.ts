import { ref } from 'vue';
import type { Item } from '../types/main';
import type { EmitsEventName } from '../types/internal';

export default function useExpandableRow(
  emits: (event: EmitsEventName, ...args: any[]) => void,
) {
  const expandingItemIndexList = ref<number[]>([]);

  const updateExpandingItemIndexList = (expandingItemIndex: number, expandingItem: Item, event: Event) => {
    event.stopPropagation();
    const index = expandingItemIndexList.value.indexOf(expandingItemIndex);
    if (index !== -1) {
      expandingItemIndexList.value.splice(index, 1);
      return;
    }

    // Use the caller-provided global index directly.
    // Re-finding via JSON.stringify(pageItem) is fragile: page rows may include
    // ephemeral `checkbox` / `index` fields that break equality, yielding -1.
    emits('expandRow', expandingItemIndex, expandingItem);
    expandingItemIndexList.value.push(expandingItemIndex);
  };

  const clearExpandingItemIndexList = () => {
    expandingItemIndexList.value = [];
  };

  return {
    expandingItemIndexList,
    updateExpandingItemIndexList,
    clearExpandingItemIndexList,
  };
}
