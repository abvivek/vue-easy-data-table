/**
 * @vitest-environment happy-dom
 *
 * Regression: client-side sorting across number / decimal / string / null / undefined.
 * Locks current getItemValue + compareValues behavior (nullish → '').
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import { compareValues, getItemValue } from '../src/utils';

const nameHeaders = [
  { text: 'NAME', value: 'name' },
  { text: 'VALUE', value: 'value', sortable: true },
];

function pageNames(wrapper) {
  return wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').at(0).text());
}

describe('regression sorting: numbers', () => {
  it('sorting: numbers ascending', async () => {
    const items = [
      { name: 'c', value: 30 },
      { name: 'a', value: 10 },
      { name: 'b', value: 20 },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: nameHeaders,
        rowsPerPage: 10,
        sortBy: 'value',
        sortType: 'asc',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['a', 'b', 'c']);
  });

  it('sorting: numbers descending', async () => {
    const items = [
      { name: 'a', value: 10 },
      { name: 'c', value: 30 },
      { name: 'b', value: 20 },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: nameHeaders,
        rowsPerPage: 10,
        sortBy: 'value',
        sortType: 'desc',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['c', 'b', 'a']);
  });
});

describe('regression sorting: decimals', () => {
  it('sorting: decimal strings ascending', async () => {
    const items = [
      { name: 'a', value: '99.32' },
      { name: 'b', value: '7.32' },
      { name: 'c', value: '999.01' },
      { name: 'd', value: '873.32' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: nameHeaders,
        rowsPerPage: 10,
        sortBy: 'value',
        sortType: 'asc',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['b', 'a', 'd', 'c']);
  });

  it('sorting: mixed number and decimal string ascending', async () => {
    const items = [
      { name: 'a', value: 99.5 },
      { name: 'b', value: '7.25' },
      { name: 'c', value: 12 },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: nameHeaders,
        rowsPerPage: 10,
        sortBy: 'value',
        sortType: 'asc',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['b', 'c', 'a']);
  });
});

describe('regression sorting: strings', () => {
  it('sorting: strings ascending lexicographic', async () => {
    const items = [
      { name: 'c', value: 'zebra' },
      { name: 'a', value: 'apple' },
      { name: 'b', value: 'mango' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: nameHeaders,
        rowsPerPage: 10,
        sortBy: 'value',
        sortType: 'asc',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['a', 'b', 'c']);
  });

  it('sorting: strings descending lexicographic', async () => {
    const items = [
      { name: 'a', value: 'apple' },
      { name: 'c', value: 'zebra' },
      { name: 'b', value: 'mango' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: nameHeaders,
        rowsPerPage: 10,
        sortBy: 'value',
        sortType: 'desc',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['c', 'b', 'a']);
  });
});

describe('regression sorting: null / undefined', () => {
  it('getItemValue coerces null and undefined to empty string', () => {
    expect(getItemValue('value', { value: null })).toBe('');
    expect(getItemValue('value', { value: undefined })).toBe('');
    expect(getItemValue('value', {})).toBe('');
  });

  it('compareValues: null and undefined sort before non-nullish (direct util)', () => {
    expect(compareValues(null, 'a')).toBeLessThan(0);
    expect(compareValues(undefined, 1)).toBeLessThan(0);
    expect(compareValues(null, undefined)).toBe(0);
    expect(compareValues('a', null)).toBeGreaterThan(0);
  });

  /**
   * Documented table path: getItemValue turns null/undefined into '',
   * so client sort treats them like empty strings (first in ascending).
   */
  it('sorting: null values ascending (coerced to empty string)', async () => {
    const items = [
      { name: 'b', value: 'beta' },
      { name: 'n', value: null },
      { name: 'a', value: 'alpha' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: nameHeaders,
        rowsPerPage: 10,
        sortBy: 'value',
        sortType: 'asc',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['n', 'a', 'b']);
  });

  it('sorting: undefined values ascending (coerced to empty string)', async () => {
    const items = [
      { name: 'b', value: 'beta' },
      { name: 'u', value: undefined },
      { name: 'a', value: 'alpha' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: nameHeaders,
        rowsPerPage: 10,
        sortBy: 'value',
        sortType: 'asc',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['u', 'a', 'b']);
  });

  it('sorting: null and undefined group together as empty before values', async () => {
    const items = [
      { name: 'z', value: 'zulu' },
      { name: 'n', value: null },
      { name: 'u', value: undefined },
      { name: 'a', value: 'alpha' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: nameHeaders,
        rowsPerPage: 10,
        sortBy: 'value',
        sortType: 'asc',
      },
    });
    await nextTick();
    const names = pageNames(wrapper);
    expect(names.slice(0, 2).sort()).toEqual(['n', 'u']);
    expect(names.slice(2)).toEqual(['a', 'z']);
  });
});
