import {
  ref, computed, watch, onMounted, onBeforeUnmount,
  type Ref, type ComputedRef,
} from 'vue';
import type { Item } from '../types/main';

export type VirtualRowEntry = {
  item: Item
  /** Index within `pageItems` (not the full dataset). */
  index: number
};

/**
 * Window `pageItems` for tbody virtualization.
 * Scroll container is `.vue3-easy-data-table__main` (overflow: auto).
 * Uses fixed row height + top/bottom spacer rows (no external deps).
 */
export default function useVirtualRows(
  enabled: ComputedRef<boolean>,
  pageItems: Ref<Item[]> | ComputedRef<Item[]>,
  rowHeight: Ref<number | null | undefined>,
  overscan: Ref<number>,
  scrollContainer: Ref<HTMLElement | undefined>,
  /** Fallback when `clientHeight` is 0 (common in jsdom/happy-dom). */
  fallbackViewport: Ref<number | null | undefined>,
) {
  const scrollTop = ref(0);
  const viewportHeight = ref(0);
  const headerOffset = ref(0);

  const updateMetrics = () => {
    const el = scrollContainer.value;
    if (!el) return;
    scrollTop.value = el.scrollTop;
    const measured = el.clientHeight;
    viewportHeight.value = measured > 0
      ? measured
      : Math.max(0, fallbackViewport.value ?? 0);
    const thead = el.querySelector('thead');
    headerOffset.value = thead ? (thead as HTMLElement).offsetHeight : 0;
  };

  const onScroll = () => {
    if (!enabled.value) return;
    const el = scrollContainer.value;
    if (!el) return;
    scrollTop.value = el.scrollTop;
    const measured = el.clientHeight;
    if (measured > 0) {
      viewportHeight.value = measured;
    }
  };

  let resizeObserver: ResizeObserver | null = null;

  onMounted(() => {
    const el = scrollContainer.value;
    if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (enabled.value) updateMetrics();
      });
      resizeObserver.observe(el);
    }
    updateMetrics();
  });

  onBeforeUnmount(() => {
    const el = scrollContainer.value;
    if (el) el.removeEventListener('scroll', onScroll);
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  watch(enabled, (on) => {
    if (on) updateMetrics();
  });

  watch(pageItems, () => {
    if (enabled.value) updateMetrics();
  });

  watch(fallbackViewport, () => {
    if (enabled.value) updateMetrics();
  });

  const range = computed(() => {
    const count = pageItems.value.length;
    const h = Math.max(0, rowHeight.value || 0);
    if (!enabled.value || h <= 0 || count === 0) {
      return {
        start: 0, end: count, offsetTop: 0, offsetBottom: 0,
      };
    }
    // Unknown viewport → render all (safe) rather than an empty window.
    if (viewportHeight.value <= 0) {
      return {
        start: 0, end: count, offsetTop: 0, offsetBottom: 0,
      };
    }
    const over = Math.max(0, overscan.value);
    const contentScroll = Math.max(0, scrollTop.value - headerOffset.value);
    const start = Math.max(0, Math.floor(contentScroll / h) - over);
    const visible = Math.ceil(viewportHeight.value / h) + 1;
    const end = Math.min(count, start + visible + over * 2);
    return {
      start,
      end,
      offsetTop: start * h,
      offsetBottom: Math.max(0, (count - end) * h),
    };
  });

  const virtualRows = computed((): VirtualRowEntry[] => {
    const { start, end } = range.value;
    const items = pageItems.value;
    const rows: VirtualRowEntry[] = [];
    for (let i = start; i < end; i += 1) {
      rows.push({ item: items[i], index: i });
    }
    return rows;
  });

  return {
    virtualRows,
    offsetTop: computed(() => range.value.offsetTop),
    offsetBottom: computed(() => range.value.offsetBottom),
    updateMetrics,
  };
}
