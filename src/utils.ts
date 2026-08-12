import type { Item } from './types/main';

export function getItemValue(column: string, item: Item) {
  if (column.includes('.')) {
    const keys = column.split('.');
    const { length } = keys;

    let content;
    let i = 0;

    while (i < length) {
      if (i === 0) {
        content = item[keys[0]];
      } else if (content && typeof content === 'object') {
        content = content[keys[i]];
      } else {
        content = '';
        break;
      }
      i += 1;
    }
    return content ?? '';
  }
  return item[column] ?? '';
}

export function generateColumnContent(column: string, item: Item) {
  const content = getItemValue(column, item);
  return Array.isArray(content) ? content.join(',') : content;
}

/** Escape RegExp metacharacters so search treats input as a literal substring. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Coerce a cell value into a safe searchable string (null/undefined → ''). */
export function toSearchString(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(toSearchString).join(' ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

/** Parse finite numbers and numeric strings (including decimals); otherwise null. */
export function toComparableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

/**
 * Compare two cell values for client-side sorting.
 * Uses numeric order when both sides are numbers or numeric strings; otherwise lexicographic.
 */
export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  const aNum = toComparableNumber(a);
  const bNum = toComparableNumber(b);
  if (aNum !== null && bNum !== null) {
    return aNum - bNum;
  }

  const aStr = String(a);
  const bStr = String(b);
  if (aStr < bStr) return -1;
  if (aStr > bStr) return 1;
  return 0;
}

export function itemsEqual(a: Item, b: Item): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
