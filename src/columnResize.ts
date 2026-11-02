/** Floor used when a leaf has no `minWidth` and is already at least this wide. */
export const COLUMN_RESIZE_FLOOR_PX = 48;

/**
 * Lower bound for a resize. An explicit `minWidth` wins.
 * A column already narrower than the floor (checkbox / expand default to 36)
 * keeps that width instead of snapping up to 48 on the first nudge.
 */
export function columnResizeMin(minWidth: number | undefined, configuredWidth?: number): number {
  if (typeof minWidth === 'number' && Number.isFinite(minWidth)) return minWidth;
  if (
    typeof configuredWidth === 'number'
    && configuredWidth > 0
    && configuredWidth < COLUMN_RESIZE_FLOOR_PX
  ) {
    return configuredWidth;
  }
  return COLUMN_RESIZE_FLOOR_PX;
}

/** Clamp a dragged or keyboard-nudged column width to min/max (px). */
export function clampColumnWidth(
  width: number,
  minWidth?: number,
  maxWidth?: number,
): number {
  const min = minWidth ?? COLUMN_RESIZE_FLOOR_PX;
  const max = maxWidth ?? Number.POSITIVE_INFINITY;
  const next = Math.round(width);
  return Math.min(max, Math.max(min, next));
}

/**
 * Pointer movement along the inline axis.
 * LTR: dragging right grows the column. RTL: dragging left grows it.
 */
export function resizeSignedDelta(pointerDeltaX: number, rtl: boolean): number {
  return rtl ? -pointerDeltaX : pointerDeltaX;
}
