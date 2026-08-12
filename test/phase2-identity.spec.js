/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import {
  getItemIdentity, itemsMatch, buildIdentitySet, stripEphemeralFields, compareValues,
} from '../src/utils';

describe('utils: item identity helpers', () => {
  it('resolves nested item-key paths', () => {
    expect(getItemIdentity({ id: 7 }, 'id')).toBe(7);
    expect(getItemIdentity({ meta: { uuid: 'abc' } }, 'meta.uuid')).toBe('abc');
    expect(getItemIdentity({ id: 1 }, '')).toBeUndefined();
  });

  it('matches by key when itemKey is set, stringify when omitted', () => {
    const a = { id: 1, name: 'a', checkbox: true };
    const b = { id: 1, name: 'a' };
    const c = { id: 2, name: 'a' };
    expect(itemsMatch(a, b, 'id')).toBe(true);
    expect(itemsMatch(a, c, 'id')).toBe(false);
    expect(itemsMatch(stripEphemeralFields(a), b)).toBe(true);
  });

  it('builds an identity Set for O(1) lookups', () => {
    const set = buildIdentitySet([{ id: 1 }, { id: 2 }, { id: 2 }], 'id');
    expect(set.has(1)).toBe(true);
    expect(set.has(2)).toBe(true);
    expect(set.size).toBe(2);
  });
});

describe('Phase 2: item-key select identity', () => {
  const headers = [
    { text: 'ID', value: 'id' },
    { text: 'NAME', value: 'name' },
  ];

  it('select/deselect uses key identity when item-key is set', async () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
    ];
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
    const boxes = wrapper.findAll('.vue3-easy-data-table__body .easy-checkbox');
    await boxes.at(0).trigger('click');
    let selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe(1);

    // Re-bind selection (parent v-model style) then deselect via key
    await wrapper.setProps({ itemsSelected: selected });
    await nextTick();
    await wrapper.findAll('.vue3-easy-data-table__body .easy-checkbox').at(0).trigger('click');
    selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected).toHaveLength(0);
  });

  it('unkeyed path still selects/deselects via JSON.stringify identity', async () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemsSelected: [],
        rowsPerPage: 10,
      },
    });
    await nextTick();
    await wrapper.findAll('.vue3-easy-data-table__body .easy-checkbox').at(0).trigger('click');
    let selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected).toHaveLength(1);

    await wrapper.setProps({ itemsSelected: selected });
    await nextTick();
    await wrapper.findAll('.vue3-easy-data-table__body .easy-checkbox').at(0).trigger('click');
    selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected).toHaveLength(0);
  });

  it('select-all with item-key selects every row once', async () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `n-${i}` }));
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemsSelected: [],
        itemKey: 'id',
        rowsPerPage: 25,
      },
    });
    await nextTick();
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    const selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected).toHaveLength(20);
    expect(new Set(selected.map((r) => r.id)).size).toBe(20);
  });

  it('server select-all merges by item-key across pages', async () => {
    const page1 = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
    const page2 = [{ id: 3, name: 'C' }, { id: 4, name: 'D' }];
    const wrapper = mount(DataTable, {
      props: {
        items: page1,
        headers,
        itemsSelected: [],
        itemKey: 'id',
        serverItemsLength: 4,
        serverOptions: { page: 1, rowsPerPage: 2 },
        rowsPerPage: 2,
      },
    });
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    let selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
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
});

describe('Phase 2: item-key expand identity', () => {
  const headers = [
    { text: 'ID', value: 'id' },
    { text: 'NAME', value: 'name' },
  ];

  it('keeps the same item expanded after sort when item-key is set', async () => {
    const items = [
      { id: 1, name: 'a', score: 10 },
      { id: 2, name: 'b', score: 30 },
      { id: 3, name: 'c', score: 20 },
    ];
    const sortHeaders = [
      ...headers,
      { text: 'SCORE', value: 'score', sortable: true },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: sortHeaders,
        itemKey: 'id',
        rowsPerPage: 10,
        sortBy: 'score',
        sortType: 'asc',
      },
      slots: {
        expand: '<div class="expand-body">{{ id }}-{{ name }}</div>',
      },
    });
    await nextTick();
    // Asc score order: a(10), c(20), b(30) — expand id=2 which is last row
    await wrapper.findAll('td.can-expand').at(2).trigger('click');
    expect(wrapper.find('.expand-body').text()).toBe('2-b');

    await wrapper.setProps({ sortType: 'desc' });
    await nextTick();
    // Desc: b first — same item still expanded via key
    expect(wrapper.find('.expand-body').text()).toBe('2-b');
  });

  it('unkeyed expand still tracks by index', async () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
      },
      slots: {
        expand: '<div class="expand-body">{{ name }}</div>',
      },
    });
    await nextTick();
    await wrapper.findAll('td.can-expand').at(1).trigger('click');
    expect(wrapper.emitted('expandRow')[0][0]).toBe(1);
    expect(wrapper.find('.expand-body').text()).toBe('b');
  });
});

describe('Phase 2: sort non-mutation', () => {
  it('does not mutate the source items array when sorting', async () => {
    const items = [
      { id: 1, name: 'a', score: 3 },
      { id: 2, name: 'b', score: 1 },
      { id: 3, name: 'c', score: 2 },
    ];
    const originalOrder = items.map((i) => i.id);
    const headers = [
      { text: 'NAME', value: 'name' },
      { text: 'SCORE', value: 'score', sortable: true },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        sortBy: 'score',
        sortType: 'asc',
      },
    });
    await nextTick();
    expect(items.map((i) => i.id)).toEqual(originalOrder);
    const names = wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').at(0).text());
    expect(names).toEqual(['b', 'c', 'a']);
  });

  it('multi-sort copies rather than mutating source', async () => {
    const items = [
      { id: 1, group: 'A', score: 2 },
      { id: 2, group: 'B', score: 1 },
      { id: 3, group: 'A', score: 1 },
    ];
    const snapshot = items.map((i) => ({ ...i }));
    const headers = [
      { text: 'GROUP', value: 'group', sortable: true },
      { text: 'SCORE', value: 'score', sortable: true },
    ];
    mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        multiSort: true,
        sortBy: ['group', 'score'],
        sortType: ['asc', 'asc'],
      },
    });
    await nextTick();
    expect(items).toEqual(snapshot);
  });

  it('compareValues still orders numbers correctly (sanity)', () => {
    expect(compareValues(1, 2)).toBeLessThan(0);
  });
});
