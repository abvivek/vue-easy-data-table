/**
 * Totals-row aggregations.
 *
 * Pure functions over an already scoped item list (page or filtered+sorted set);
 * they never look at props, so they are unit-testable without mounting.
 */

import type {
  Item, SummaryAggregation, SummaryContext, SummaryFn, SummaryRow, SummaryScope,
} from './types/main';
import { getItemValue, toComparableNumber } from './utils';

const AGGREGATIONS: readonly SummaryAggregation[] = [
  'sum', 'avg', 'min', 'max', 'count', 'length',
];

export function isSummaryAggregation(value: unknown): value is SummaryAggregation {
  return typeof value === 'string' && (AGGREGATIONS as readonly string[]).includes(value);
}

/** Plain object of totals (not an array / primitive). Used to detect nested `{ all, page }`. */
function isTotalsMap(value: unknown): value is Record<string, string | number | null> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Nested `summary-row` only when `all` and/or `page` is a non-null plain object
 * (not an array). A flat map like `{ amount: 1, all: 5 }` stays flat because
 * `all` is a number, not a totals object.
 */
export function isNestedSummaryRow(
  row: unknown,
): row is { all?: Record<string, string | number | null>; page?: Record<string, string | number | null> } {
  if (!isTotalsMap(row)) return false;
  return isTotalsMap(row.all) || isTotalsMap(row.page);
}

/**
 * Pick the totals map for the current scope.
 * Nested: prefer `summary-scope`, then the other side, then `{}`.
 * Flat: return the object as-is (including keys named `all` / `page`).
 */
export function resolveSummaryRowMap(
  row: SummaryRow | null | undefined,
  scope: SummaryScope,
): Record<string, string | number | null> | null {
  if (row == null) return null;
  if (!isNestedSummaryRow(row)) {
    return row as Record<string, string | number | null>;
  }
  const preferred = row[scope];
  if (isTotalsMap(preferred)) return preferred;
  const fallback = scope === 'page' ? row.all : row.page;
  if (isTotalsMap(fallback)) return fallback;
  return {};
}

/** Numeric values only: null, undefined, '' and non-numeric strings are skipped. */
function collectNumbers(items: Item[], column: string): number[] {
  const numbers: number[] = [];
  items.forEach((item) => {
    const num = toComparableNumber(getItemValue(column, item));
    if (num !== null) numbers.push(num);
  });
  return numbers;
}

/** Non-empty values, numeric or not (`count` counts filled cells). */
function countFilled(items: Item[], column: string): number {
  return items.reduce((acc, item) => {
    const value = getItemValue(column, item);
    if (value === '' || value == null) return acc;
    if (Array.isArray(value) && value.length === 0) return acc;
    return acc + 1;
  }, 0);
}

/**
 * Run a built-in aggregation. Returns `null` when nothing qualifies, which the
 * table renders as an empty cell rather than a misleading `0`.
 *
 * `count` = non-empty cells in `column`. `length` = `items.length` (row count,
 * including empty cells). `avg` is a raw float (format in a `#summary-*` slot).
 */
export function computeSummaryValue(
  aggregation: SummaryAggregation,
  items: Item[],
  column: string,
): number | null {
  if (aggregation === 'length') return items.length;
  if (aggregation === 'count') return countFilled(items, column);

  const numbers = collectNumbers(items, column);
  if (numbers.length === 0) return null;

  switch (aggregation) {
    case 'sum':
      return numbers.reduce((acc, num) => acc + num, 0);
    case 'avg':
      return numbers.reduce((acc, num) => acc + num, 0) / numbers.length;
    case 'min':
      return numbers.reduce((acc, num) => (num < acc ? num : acc));
    case 'max':
      return numbers.reduce((acc, num) => (num > acc ? num : acc));
    default:
      return null;
  }
}

/**
 * Resolve one `Header.summary` entry (aggregation name or custom function).
 * Unknown values yield `null` so a typo cannot render garbage.
 */
export function resolveHeaderSummary(
  summary: SummaryAggregation | SummaryFn | undefined,
  context: SummaryContext,
): string | number | null {
  if (summary == null) return null;
  if (typeof summary === 'function') {
    const value = summary(context);
    return value == null ? null : value;
  }
  if (isSummaryAggregation(summary)) {
    return computeSummaryValue(summary, context.items, context.header.value);
  }
  return null;
}
