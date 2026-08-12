import { Ref, computed } from 'vue';
import type { HeaderForRender } from '../types/internal';
import {
  DEFAULT_CELL_HORIZONTAL_PADDING_PX,
  computeStickyDistances,
  resolveColumnPaintedWidth,
} from '../stickyColumns';

type FixedColumnsInfo = {
  value: string,
  fixed: Boolean,
  distance: number,
  width: number,
};

export default function useFixedColumn(
  headersForRender: Ref<HeaderForRender[]>,
  measuredColumnWidths?: Ref<number[]>,
  horizontalPadding?: Ref<number>,
) {
  const fixedHeaders = computed((): HeaderForRender[] => headersForRender.value.filter((header) => header.fixed));

  const lastFixedColumn = computed((): string => {
    if (!fixedHeaders.value.length) return '';
    return fixedHeaders.value[fixedHeaders.value.length - 1].value;
  });

  const fixedColumnsInfos = computed((): FixedColumnsInfo[] => {
    const headers = headersForRender.value;
    if (!headers.some((header) => header.fixed)) return [];

    const padding = horizontalPadding?.value ?? DEFAULT_CELL_HORIZONTAL_PADDING_PX;
    const measured = measuredColumnWidths?.value ?? [];
    const canUseMeasured = measured.length === headers.length
      && measured.every((width) => width > 0);

    const paintedWidths = headers.map((header, index) => resolveColumnPaintedWidth({
      measuredWidth: canUseMeasured ? measured[index] : null,
      configuredWidth: header.width ?? 100,
      horizontalPadding: padding,
    }));
    const distances = computeStickyDistances(paintedWidths);

    return headers.flatMap((header, index): FixedColumnsInfo[] => {
      if (!header.fixed) return [];
      return [{
        value: header.value,
        fixed: header.fixed ?? true,
        width: paintedWidths[index],
        distance: distances[index],
      }];
    });
  });

  return {
    fixedHeaders,
    lastFixedColumn,
    fixedColumnsInfos,
  };
}
