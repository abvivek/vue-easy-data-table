/**
 * @vitest-environment happy-dom
 *
 * Phase 4 — server-side DX: page sync, custom serverOptions fields, select-all scope.
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';

const headers = [
  { text: 'NAME', value: 'name' },
  { text: 'SCORE', value: 'score', sortable: true },
];

function page1Items() {
  return [
    { id: 1, name: 'a', score: 10 },
    { id: 2, name: 'b', score: 20 },
  ];
}

function page2Items() {
  return [
    { id: 3, name: 'c', score: 30 },
    { id: 4, name: 'd', score: 40 },
  ];
}

function footerIndexText(wrapper) {
  return wrapper.find('.pagination__items-index').text().replace(/\s+/g, ' ').trim();
}

describe('Phase 4: server page sync', () => {
  it('syncs currentPaginationNumber when serverOptions.page changes without loading', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 4,
        serverOptions: { page: 1, rowsPerPage: 2 },
        rowsPerPage: 2,
      },
    });
    await nextTick();
    expect(wrapper.vm.currentPaginationNumber).toBe(1);
    expect(footerIndexText(wrapper)).toBe('1–2 of 4');

    await wrapper.setProps({
      items: page2Items(),
      serverOptions: { page: 2, rowsPerPage: 2 },
    });
    await nextTick();
    expect(wrapper.vm.currentPaginationNumber).toBe(2);
    expect(footerIndexText(wrapper)).toBe('3–4 of 4');
  });

  it('still syncs on loading true→false (recommended fetch loop)', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 4,
        serverOptions: { page: 1, rowsPerPage: 2 },
        rowsPerPage: 2,
        loading: false,
      },
    });
    await nextTick();

    await wrapper.setProps({ loading: true });
    await nextTick();
    await wrapper.setProps({
      items: page2Items(),
      serverOptions: { page: 2, rowsPerPage: 2 },
      loading: false,
    });
    await nextTick();
    expect(wrapper.vm.currentPaginationNumber).toBe(2);
    expect(footerIndexText(wrapper)).toBe('3–4 of 4');
  });
});

describe('Phase 4: preserve custom serverOptions fields (#388)', () => {
  it('pagination next round-trips custom keys on update:serverOptions', async () => {
    const serverOptions = {
      page: 1,
      rowsPerPage: 2,
      sortBy: 'score',
      sortType: 'asc',
      groupId: 42,
      filter: 'active',
    };
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 10,
        serverOptions,
        rowsPerPage: 2,
      },
    });
    await nextTick();
    await wrapper.find('.next-page__click-button').trigger('click');
    const emitted = wrapper.emitted('update:serverOptions').at(-1)[0];
    expect(emitted).toEqual({
      page: 2,
      rowsPerPage: 2,
      sortBy: 'score',
      sortType: 'asc',
      groupId: 42,
      filter: 'active',
    });
  });

  it('sort click round-trips custom keys on update:serverOptions', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 10,
        serverOptions: {
          page: 1,
          rowsPerPage: 2,
          sortBy: 'score',
          sortType: 'asc',
          groupId: 7,
        },
        rowsPerPage: 2,
      },
    });
    await nextTick();
    const scoreHeader = wrapper.findAll('th').find((th) => th.text().includes('SCORE'));
    await scoreHeader.trigger('click');
    await nextTick();
    const emitted = wrapper.emitted('update:serverOptions').at(-1)[0];
    expect(emitted.page).toBe(1);
    expect(emitted.sortBy).toBe('score');
    expect(emitted.sortType).toBe('desc');
    expect(emitted.groupId).toBe(7);
  });

  it('rows-per-page change round-trips custom keys and resets page to 1', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 100,
        serverOptions: {
          page: 4,
          rowsPerPage: 2,
          sortBy: 'score',
          sortType: 'asc',
          locale: 'en',
        },
        rowsPerPage: 2,
        rowsItems: [2, 10, 25],
      },
    });
    await nextTick();
    wrapper.vm.updateRowsPerPageActiveOption(10);
    await nextTick();
    expect(wrapper.emitted('update:serverOptions').at(-1)[0]).toEqual({
      page: 1,
      rowsPerPage: 10,
      sortBy: 'score',
      sortType: 'asc',
      locale: 'en',
    });
  });
});

describe('Phase 4: serverSelectAll scope', () => {
  it('default page scope merges current page (Phase 1 behavior)', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
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
    expect(selected.map((i) => i.id)).toEqual([1, 2]);
    expect(wrapper.emitted('selectAll')).toBeTruthy();

    await wrapper.setProps({
      items: page2Items(),
      itemsSelected: selected,
      serverOptions: { page: 2, rowsPerPage: 2 },
    });
    await nextTick();
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected.map((i) => i.id).sort()).toEqual([1, 2, 3, 4]);
  });

  it('server-select-all=all replaces with page on check and clears all on uncheck', async () => {
    const prior = [
      { id: 99, name: 'prior' },
      { id: 1, name: 'a', score: 10 },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        itemsSelected: prior,
        itemKey: 'id',
        serverItemsLength: 4,
        serverOptions: { page: 1, rowsPerPage: 2 },
        rowsPerPage: 2,
        serverSelectAll: 'all',
      },
    });
    await nextTick();
    // partSelected → click selects (emits true)
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    let selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(wrapper.emitted('selectAll')).toBeTruthy();
    expect(selected.map((i) => i.id).sort()).toEqual([1, 2]);

    await wrapper.setProps({ itemsSelected: selected });
    await nextTick();
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected).toEqual([]);
  });
});
