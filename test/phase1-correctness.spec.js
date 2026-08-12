/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import {
  compareValues, escapeRegExp, toSearchString, toComparableNumber,
} from '../src/utils';
import { headersMocked, mockClientItems } from '../src/mock';

describe('utils: compareValues / numeric sort helpers', () => {
  it('sorts numbers and numeric decimal strings numerically', () => {
    const values = ['999.01', '99.32', '9.32', '873.32', '83.33', '7.32'];
    const sorted = [...values].sort((a, b) => compareValues(b, a));
    expect(sorted).toEqual(['999.01', '873.32', '99.32', '83.33', '9.32', '7.32']);
  });

  it('keeps lexicographic order for non-numeric strings', () => {
    expect(compareValues('apple', 'banana')).toBeLessThan(0);
    expect(compareValues('zebra', 'apple')).toBeGreaterThan(0);
  });

  it('does not treat empty string as a number', () => {
    expect(toComparableNumber('')).toBeNull();
    expect(toComparableNumber('  ')).toBeNull();
  });
});

describe('utils: search helpers', () => {
  it('escapes RegExp metacharacters', () => {
    expect(escapeRegExp('a+b?c*(d)')).toBe('a\\+b\\?c\\*\\(d\\)');
  });

  it('coerces null/undefined object values safely', () => {
    expect(toSearchString(null)).toBe('');
    expect(toSearchString(undefined)).toBe('');
    expect(toSearchString({ a: 1 })).toBe('{"a":1}');
  });
});

describe('P0: numeric / decimal client sort', () => {
  it('sorts decimal string prices descending', async () => {
    const items = [
      { name: 'a', price: '99.32' },
      { name: 'b', price: '999.01' },
      { name: 'c', price: '7.32' },
      { name: 'd', price: '873.32' },
    ];
    const headers = [
      { text: 'NAME', value: 'name' },
      { text: 'PRICE', value: 'price', sortable: true },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        sortBy: 'price',
        sortType: 'desc',
      },
    });
    const names = wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').at(0).text());
    expect(names).toEqual(['b', 'd', 'a', 'c']);
  });
});

describe('P0: search nulls and special regex chars', () => {
  it('searches safely when item fields are null', async () => {
    const items = [
      { name: 'Alpha', note: null },
      { name: 'Beta', note: 'hello' },
      { name: null, note: 'world' },
    ];
    const headers = [
      { text: 'NAME', value: 'name' },
      { text: 'NOTE', value: 'note' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        searchValue: 'hel',
      },
    });
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.findAll('tbody td').at(0).text()).toBe('Beta');
  });

  it('treats RegExp special characters as literals', async () => {
    const items = [
      { name: 'plain', code: 'abc' },
      { name: 'plus', code: 'a+b' },
      { name: 'dot', code: 'a.b' },
    ];
    const headers = [
      { text: 'NAME', value: 'name' },
      { text: 'CODE', value: 'code' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        searchField: 'code',
        searchValue: 'a+b',
      },
    });
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.findAll('tbody td').at(0).text()).toBe('plus');
  });
});

describe('P0: currentPage sync and page clamp', () => {
  it('reacts when currentPage prop changes', async () => {
    const mockItems = mockClientItems(50);
    const wrapper = mount(DataTable, {
      props: {
        items: mockItems,
        headers: headersMocked,
        rowsPerPage: 5,
        currentPage: 1,
      },
    });
    expect(wrapper.findAll('tbody td').at(0).text()).toBe(mockItems[0].name);

    await wrapper.setProps({ currentPage: 3 });
    await nextTick();
    expect(wrapper.findAll('tbody td').at(0).text()).toBe(mockItems[10].name);
  });

  it('emits update:currentPage when navigating', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: mockClientItems(50),
        headers: headersMocked,
        rowsPerPage: 5,
      },
    });
    await wrapper.find('.next-page__click-button').trigger('click');
    const events = wrapper.emitted('update:currentPage');
    expect(events).toBeTruthy();
    expect(events[events.length - 1]).toEqual([2]);
  });

  it('resets to page 1 when searchValue changes', async () => {
    const mockItems = mockClientItems(50);
    const wrapper = mount(DataTable, {
      props: {
        items: mockItems,
        headers: headersMocked,
        rowsPerPage: 5,
        currentPage: 3,
      },
    });
    await wrapper.setProps({ currentPage: 3 });
    await nextTick();
    await wrapper.setProps({ searchValue: mockItems[0].name });
    await nextTick();
    const events = wrapper.emitted('update:currentPage');
    expect(events[events.length - 1]).toEqual([1]);
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThan(0);
  });

  it('clamps page when items shrink below current page', async () => {
    const many = mockClientItems(50);
    const few = mockClientItems(8);
    const wrapper = mount(DataTable, {
      props: {
        items: many,
        headers: headersMocked,
        rowsPerPage: 5,
        currentPage: 5,
      },
    });
    await nextTick();
    await wrapper.setProps({ items: few });
    await nextTick();
    // 8 items / 5 per page => max page 2
    expect(wrapper.vm.currentPaginationNumber).toBe(2);
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThan(0);
  });
});

describe('P0: server-side select-all merges current page', () => {
  it('adds current page items without wiping prior selection', async () => {
    const page1 = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    const page2 = [
      { id: 3, name: 'C' },
      { id: 4, name: 'D' },
    ];
    const headers = [
      { text: 'NAME', value: 'name' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items: page1,
        headers,
        itemsSelected: [],
        serverItemsLength: 4,
        serverOptions: { page: 1, rowsPerPage: 2 },
        rowsPerPage: 2,
      },
    });

    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    let selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected).toHaveLength(2);
    expect(selected.map((i) => i.id).sort()).toEqual([1, 2]);

    await wrapper.setProps({
      items: page2,
      itemsSelected: selected,
      serverOptions: { page: 2, rowsPerPage: 2 },
    });
    await nextTick();

    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected.map((i) => i.id).sort()).toEqual([1, 2, 3, 4]);
  });

  it('deselect-all on server mode only removes current page items', async () => {
    const page2 = [
      { id: 3, name: 'C' },
      { id: 4, name: 'D' },
    ];
    const headers = [{ text: 'NAME', value: 'name' }];
    const prior = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
      { id: 4, name: 'D' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items: page2,
        headers,
        itemsSelected: prior,
        serverItemsLength: 4,
        serverOptions: { page: 2, rowsPerPage: 2 },
        rowsPerPage: 2,
      },
    });
    await nextTick();
    // Header is allSelected for current page → click unchecks current page
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    const selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected.map((i) => i.id).sort()).toEqual([1, 2]);
  });
});

describe('P0: package entry surface', () => {
  it('exposes default and named Vue3EasyDataTable exports from src/index', async () => {
    const mod = await import('../src/index.ts');
    expect(mod.default).toBeTruthy();
    expect(mod.Vue3EasyDataTable).toBeTruthy();
    expect(mod.default).toBe(mod.Vue3EasyDataTable);
  });
});

describe('P1 leftover: expand row (#239)', () => {
  const headers = [
    { text: 'NAME', value: 'name' },
    { text: 'HAS DETAIL', value: 'hasDetail' },
  ];

  it('expands using the page-global index even when rows have checkbox metadata', async () => {
    const items = [
      { name: 'a', note: 'one' },
      { name: 'b', note: 'two' },
      { name: 'c', note: 'three' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemsSelected: [],
        rowsPerPage: 10,
      },
      slots: {
        expand: '<div class="expand-body">{{ note }}</div>',
      },
    });
    await nextTick();
    expect(wrapper.findAll('.expand-icon')).toHaveLength(3);
    await wrapper.findAll('td.can-expand').at(1).trigger('click');
    const expandEvents = wrapper.emitted('expandRow');
    expect(expandEvents).toBeTruthy();
    expect(expandEvents[0][0]).toBe(1);
    expect(expandEvents[0][1].name).toBe('b');
    expect(wrapper.find('.expand-body').text()).toBe('two');
  });

  it('hides expand icon and ignores clicks when expandable predicate is false', async () => {
    const items = [
      { name: 'a', hasDetail: true, note: 'one' },
      { name: 'b', hasDetail: false, note: 'two' },
      { name: 'c', hasDetail: true, note: 'three' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        expandable: (item) => item.hasDetail === true,
      },
      slots: {
        expand: '<div class="expand-body">{{ note }}</div>',
      },
    });
    await nextTick();
    expect(wrapper.findAll('.expand-icon')).toHaveLength(2);

    // Middle row has no icon and clicking its first (expand) cell must not emit
    const expandCells = wrapper.findAll('td.can-expand');
    expect(expandCells).toHaveLength(2);
    const middleRowCells = wrapper.findAll('tbody tr').at(1).findAll('td');
    await middleRowCells.at(0).trigger('click');
    expect(wrapper.emitted('expandRow')).toBeFalsy();
    expect(wrapper.findAll('.expand-body')).toHaveLength(0);
  });

  it('keeps expanded panel open for the correct row after toggle', async () => {
    const items = mockClientItems(5);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: headersMocked,
        rowsPerPage: 5,
      },
      slots: {
        expand: '<div class="expand-body">{{ name }}</div>',
      },
    });
    await wrapper.findAll('td.can-expand').at(2).trigger('click');
    expect(wrapper.find('.expand-body').text()).toBe(items[2].name);
    await wrapper.findAll('td.can-expand').at(2).trigger('click');
    expect(wrapper.findAll('.expand-body')).toHaveLength(0);
  });
});
