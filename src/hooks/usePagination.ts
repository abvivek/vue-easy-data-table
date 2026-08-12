import {
  ref, Ref, computed, ComputedRef, watch,
} from 'vue';
import type { ServerOptions } from '../types/main';

export default function usePagination(
  currentPage: Ref<number>,
  isServerSideMode: ComputedRef<boolean>,
  loading: Ref<boolean>,
  totalItemsLength: Ref<number>,
  rowsPerPage: Ref<number>,
  serverOptions: Ref<ServerOptions | null>,
  updateServerOptionsPage: (page: number) => void,
) {
  const currentPaginationNumber = ref(serverOptions.value ? serverOptions.value.page : currentPage.value);
  const maxPaginationNumber = computed((): number => Math.ceil(totalItemsLength.value / rowsPerPage.value));

  const isLastPage = computed((): boolean => maxPaginationNumber.value === 0 || (currentPaginationNumber.value === maxPaginationNumber.value));
  const isFirstPage = computed((): boolean => currentPaginationNumber.value === 1);

  // Keep client pagination in sync when the `currentPage` prop changes (v-model / controlled).
  watch(currentPage, (page) => {
    if (isServerSideMode.value) return;
    if (typeof page === 'number' && page > 0 && page !== currentPaginationNumber.value) {
      currentPaginationNumber.value = page;
    }
  });

  // When filtered/replaced data shrinks, clamp to a valid page so the table is not blank.
  watch(maxPaginationNumber, (max) => {
    if (isServerSideMode.value) return;
    if (max === 0) {
      if (currentPaginationNumber.value !== 1) {
        currentPaginationNumber.value = 1;
      }
      return;
    }
    if (currentPaginationNumber.value > max) {
      currentPaginationNumber.value = max;
    }
  });

  const nextPage = () => {
    if (totalItemsLength.value === 0) return;
    if (isLastPage.value) return;
    if (loading.value) return;
    if (isServerSideMode.value) {
      const nextPaginationNumber = currentPaginationNumber.value + 1;
      updateServerOptionsPage(nextPaginationNumber);
    } else {
      currentPaginationNumber.value += 1;
    }
  };

  const prevPage = () => {
    if (totalItemsLength.value === 0) return;
    if (isFirstPage.value) return;
    if (loading.value) return;
    if (isServerSideMode.value) {
      const prevPaginationNumber = currentPaginationNumber.value - 1;
      updateServerOptionsPage(prevPaginationNumber);
    } else {
      currentPaginationNumber.value -= 1;
    }
  };

  const updatePage = (page: number) => {
    if (loading.value) return;
    if (isServerSideMode.value) {
      updateServerOptionsPage(page);
    } else {
      currentPaginationNumber.value = page;
    }
  };

  const updateCurrentPaginationNumber = (page: number) => {
    currentPaginationNumber.value = page;
  };

  return {
    currentPaginationNumber,
    maxPaginationNumber,
    isLastPage,
    isFirstPage,
    nextPage,
    prevPage,
    updatePage,
    updateCurrentPaginationNumber,
  };
}
