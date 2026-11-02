/** Floor used when a leaf has no `minWidth`. Keeps the resize handle usable. */
export const COLUMN_RESIZE_FLOOR_PX = 48;

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
