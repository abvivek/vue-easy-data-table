/**
 * Sticky/fixed-column geometry helpers.
 *
 * `left` must follow *painted* column widths (offsetWidth), not the
 * configured `header.width`. With `table-layout: fixed` + `width: 100%`
 * the browser distributes extra space, and content-box cells also add
 * horizontal padding (`--easy-table-*-item-padding`, default 0 10px).
 */

/** Default `--easy-table-body-item-padding` / header padding: 0px 10px. */
export const DEFAULT_CELL_HORIZONTAL_PADDING_PX = 20;

/** Body sticky cells sit above `position: relative` scrolling siblings. */
export const FIXED_COLUMN_BODY_Z_INDEX = 2;

/** Vertically sticky header row (non-fixed cells). */
export const STICKY_HEADER_Z_INDEX = 3;

/** Corner: horizontally + vertically sticky header cells. */
export const FIXED_COLUMN_HEADER_Z_INDEX = 4;

/** Vertically sticky totals row (non-fixed cells). Mirrors the header pair. */
export const SUMMARY_ROW_Z_INDEX = 3;

/** Corner: horizontally + vertically sticky totals cells. */
export const FIXED_COLUMN_SUMMARY_Z_INDEX = 4;

export function parseCssPx(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Horizontal padding in px from a CSS `padding` shorthand
 * (1–4 values, e.g. `0px 10px`).
 */
export function parseHorizontalPadding(padding: string | null | undefined): number {
  if (padding == null) return DEFAULT_CELL_HORIZONTAL_PADDING_PX;
  const parts = padding.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return DEFAULT_CELL_HORIZONTAL_PADDING_PX;
  if (parts.length === 1) return parseCssPx(parts[0]) * 2;
  if (parts.length === 2 || parts.length === 3) return parseCssPx(parts[1]) * 2;
  return parseCssPx(parts[1]) + parseCssPx(parts[3]);
}

export function readCellHorizontalPadding(
  el: HTMLElement | undefined | null,
  cssVar: string,
  fallback: number = DEFAULT_CELL_HORIZONTAL_PADDING_PX,
): number {
  if (!el || typeof getComputedStyle === 'undefined') return fallback;
  const raw = getComputedStyle(el).getPropertyValue(cssVar).trim();
  if (!raw) return fallback;
  return parseHorizontalPadding(raw);
}

export type ResolveColumnPaintedWidthOptions = {
  measuredWidth?: number | null;
  configuredWidth: number;
  horizontalPadding?: number;
  boxSizing?: 'content-box' | 'border-box';
};

/**
 * Prefer a measured border-box width. When layout cannot be measured
 * (SSR / happy-dom), content-box configured width + horizontal padding.
 */
export function resolveColumnPaintedWidth(options: ResolveColumnPaintedWidthOptions): number {
  const {
    measuredWidth,
    configuredWidth,
    horizontalPadding = DEFAULT_CELL_HORIZONTAL_PADDING_PX,
    boxSizing = 'content-box',
  } = options;
  if (measuredWidth != null && measuredWidth > 0) return measuredWidth;
  if (boxSizing === 'border-box') return configuredWidth;
  return configuredWidth + horizontalPadding;
}

/**
 * Sticky offset for one frozen cell.
 * LTR pins with `left`. RTL pins with `right` (inline start).
 * The binding replaces the whole style, so the unused side is cleared.
 */
export function stickyOffsetStyle(
  distancePx: number,
  zIndex: number,
  rtl: boolean,
): { position: 'sticky'; zIndex: number; left?: string; right?: string } {
  if (rtl) {
    return {
      position: 'sticky',
      zIndex,
      right: `${distancePx}px`,
      left: 'auto',
    };
  }
  return {
    position: 'sticky',
    zIndex,
    left: `${distancePx}px`,
  };
}

/**
 * How the browser reports `scrollLeft` when `direction` is `rtl`.
 * - `negative`: Chromium. 0 at the inline start, negative once scrolled.
 * - `positive-descending`: Firefox. Inline start is `scrollWidth - clientWidth`.
 * - `positive-ascending`: Safari. 0 at the inline start, positive once scrolled.
 */
export type RtlScrollType = 'negative' | 'positive-descending' | 'positive-ascending';

let cachedRtlScrollType: RtlScrollType | null = null;

/** Probe once. Falls back to Chromium (`negative`) when the DOM cannot scroll. */
export function detectRtlScrollType(): RtlScrollType {
  if (cachedRtlScrollType) return cachedRtlScrollType;
  if (typeof document === 'undefined' || !document.body) {
    cachedRtlScrollType = 'negative';
    return cachedRtlScrollType;
  }
  const outer = document.createElement('div');
  const inner = document.createElement('div');
  outer.dir = 'rtl';
  outer.style.width = '4px';
  outer.style.height = '1px';
  outer.style.overflow = 'scroll';
  outer.style.position = 'absolute';
  outer.style.top = '-9999px';
  inner.style.width = '8px';
  inner.style.height = '1px';
  outer.appendChild(inner);
  document.body.appendChild(outer);
  try {
    if (outer.scrollLeft > 0) {
      cachedRtlScrollType = 'positive-descending';
    } else {
      outer.scrollLeft = 1;
      cachedRtlScrollType = outer.scrollLeft === 0 ? 'negative' : 'positive-ascending';
    }
  } catch {
    cachedRtlScrollType = 'negative';
  } finally {
    outer.remove();
  }
  return cachedRtlScrollType;
}

/**
 * True when the scrollport has moved away from the inline start.
 * Pass `scrollType` in tests; otherwise the browser is probed once.
 */
export function scrolledFromInlineStart(
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
  rtl: boolean,
  scrollType?: RtlScrollType,
): boolean {
  if (!rtl) return scrollLeft > 0;
  const max = scrollWidth - clientWidth;
  if (max <= 0) return false;
  const type = scrollType ?? detectRtlScrollType();
  if (type === 'negative') return scrollLeft < -0.5;
  if (type === 'positive-ascending') return scrollLeft > 0.5;
  return scrollLeft < max - 0.5;
}

/** Cumulative inline-start offsets: distances[i] = sum(paintedWidths[0..i-1]). */
export function computeStickyDistances(paintedWidths: number[]): number[] {
  const distances: number[] = [];
  let acc = 0;
  for (let i = 0; i < paintedWidths.length; i += 1) {
    distances.push(acc);
    acc += paintedWidths[i];
  }
  return distances;
}

/**
 * Read painted column widths from leaf header cells, or the first body row
 * when the header is hidden.
 *
 * Grouped headers add extra parent `<th>` cells; widths must follow body
 * columns (`colgroup col`, then `th[data-leaf-column]`, then body `td`).
 */
export function readPaintedColumnWidths(tableRoot: HTMLElement): number[] {
  const cols = tableRoot.querySelectorAll<HTMLElement>('colgroup col');
  if (cols.length > 0) {
    const widths = Array.from(cols, (el) => el.offsetWidth);
    if (widths.some((width) => width > 0)) return widths;
  }

  const leafCells = tableRoot.querySelectorAll<HTMLElement>('.vue3-easy-data-table__header th[data-leaf-column]');
  if (leafCells.length > 0) {
    return Array.from(leafCells, (el) => el.offsetWidth);
  }

  const headerCells = tableRoot.querySelectorAll<HTMLElement>('.vue3-easy-data-table__header th');
  if (headerCells.length > 0) {
    return Array.from(headerCells, (el) => el.offsetWidth);
  }

  const rows = tableRoot.querySelectorAll('.vue3-easy-data-table__body tr');
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (row.classList.contains('vue3-easy-data-table__virtual-spacer')) continue;
    const cells = row.querySelectorAll<HTMLElement>('td');
    if (cells.length > 0) {
      return Array.from(cells, (el) => el.offsetWidth);
    }
  }
  return [];
}
