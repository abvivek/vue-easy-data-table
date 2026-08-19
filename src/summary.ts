/**
 * Totals-row aggregations.
 *
 * Pure functions over an already scoped item list (page or filtered+sorted set);
 * they never look at props, so they are unit-testable without mounting.
 */

import type {
  Item, SummaryAggregation, SummaryContext, SummaryFn,
} from './types/main';
import { getItemValue, toComparableNumber } from './utils';

const AGGREGATIONS: readonly SummaryAggregation[] = ['sum', 'avg', 'min', 'max', 'count'];

export function isSummaryAggregation(value: unknown): value is SummaryAggregation {
  return typeof value === 'string' && (AGGREGATIONS as readonly string[]).includes(value);
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
 */
export function computeSummaryValue(
  aggregation: SummaryAggregation,
  items: Item[],
  column: string,
): number | null {
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
