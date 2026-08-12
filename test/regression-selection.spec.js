/**
 * @vitest-environment happy-dom
 *
 * Regression: selection — single row, multiple rows, select all, deselect all.
 * Uses item-key for stable identity.
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';

const headers = [
  { text: 'ID', value: 'id' },
  { text: 'NAME', value: 'name' },
];

function makeItems(n = 12) {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `n-${i + 1}` }));
}

function lastSelected(wrapper) {
  return wrapper.emitted('update:itemsSelected').at(-1)[0];
}

function bodyCheckboxes(wrapper) {
  return wrapper.findAll('.vue3-easy-data-table__body .easy-checkbox');
}

describe('regression selection: single', () => {
  it('selection: single row emits selectRow and itemsSelected with one item', async () => {
    const items = makeItems(8);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemsSelected: [],
        itemKey: 'id',
        rowsPerPage: 10,
      },
    });
    await nextTick();
    await bodyCheckboxes(wrapper).at(2).trigger('click');

    const selected = lastSelected(wrapper);
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe(3);
    expect(wrapper.emitted('selectRow').at(-1)[0].id).toBe(3);
  });
});

describe('regression selection: multiple', () => {
  it('selection: multiple rows accumulate in itemsSelected', async () => {
    const items = makeItems(8);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemsSelected: [],
        itemKey: 'id',
        rowsPerPage: 10,
      },
    });
    await nextTick();

    await bodyCheckboxes(wrapper).at(0).trigger('click');
    await wrapper.setProps({ itemsSelected: lastSelected(wrapper) });
    await nextTick();

    await bodyCheckboxes(wrapper).at(1).trigger('click');
    await wrapper.setProps({ itemsSelected: lastSelected(wrapper) });
    await nextTick();

    await bodyCheckboxes(wrapper).at(3).trigger('click');
    const selected = lastSelected(wrapper);
    expect(selected.map((r) => r.id).sort((a, b) => a - b)).toEqual([1, 2, 4]);
  });

  it('selection: deselecting one row among many keeps the rest', async () => {
    const items = makeItems(5);
    const prior = [items[0], items[1], items[2]];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemsSelected: prior,
        itemKey: 'id',
        rowsPerPage: 10,
      },
    });
    await nextTick();
    // Row index 1 is already selected → click deselects
    await bodyCheckboxes(wrapper).at(1).trigger('click');
    const selected = lastSelected(wrapper);
    expect(selected.map((r) => r.id).sort((a, b) => a - b)).toEqual([1, 3]);
    expect(wrapper.emitted('deselectRow').at(-1)[0].id).toBe(2);
  });
});

describe('regression selection: select all / deselect all', () => {
  it('selection: select all selects every filtered/total row', async () => {
    const items = makeItems(12);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemsSelected: [],
        itemKey: 'id',
        rowsPerPage: 5,
      },
    });
    await nextTick();
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    const selected = lastSelected(wrapper);
    expect(selected).toHaveLength(12);
    expect(new Set(selected.map((r) => r.id)).size).toBe(12);
    expect(wrapper.emitted('selectAll')).toBeTruthy();
  });

  it('selection: deselect all clears the entire selection (client mode)', async () => {
    const items = makeItems(10);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemsSelected: [...items],
        itemKey: 'id',
        rowsPerPage: 10,
      },
    });
    await nextTick();
    // Header checked → click toggles off
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    const selected = lastSelected(wrapper);
    expect(selected).toEqual([]);
  });

  it('selection: select all respects current search filter', async () => {
    const items = makeItems(20);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemsSelected: [],
        itemKey: 'id',
        rowsPerPage: 25,
        searchField: 'name',
        searchValue: 'n-1', // n-1, n-10..n-19
      },
    });
    await nextTick();
    const visibleCount = wrapper.findAll('tbody tr').length;
    expect(visibleCount).toBeGreaterThan(1);

    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    const selected = lastSelected(wrapper);
    expect(selected).toHaveLength(visibleCount);
    expect(selected.every((r) => String(r.name).includes('n-1'))).toBe(true);
  });
});
