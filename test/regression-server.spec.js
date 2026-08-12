/**
 * @vitest-environment happy-dom
 *
 * Regression: server-side mode — pagination, sorting, item count.
 * Uses static fixtures (no mockServerItems delay) for deterministic tests.
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import { headersMocked } from '../src/mock';

const headers = [
  { text: 'NAME', value: 'name' },
  { text: 'SCORE', value: 'score', sortable: true },
];

function page1Items() {
  return [
    { id: 1, name: 'a', score: 10 },
    { id: 2, name: 'b', score: 20 },
    { id: 3, name: 'c', score: 30 },
    { id: 4, name: 'd', score: 40 },
    { id: 5, name: 'e', score: 50 },
  ];
}

function page2Items() {
  return [
    { id: 6, name: 'f', score: 60 },
    { id: 7, name: 'g', score: 70 },
    { id: 8, name: 'h', score: 80 },
    { id: 9, name: 'i', score: 90 },
    { id: 10, name: 'j', score: 100 },
  ];
}

function footerIndexText(wrapper) {
  return wrapper.find('.pagination__items-index').text().replace(/\s+/g, ' ').trim();
}

function firstName(wrapper) {
  return wrapper.findAll('tbody td').at(0).text();
}

describe('regression server: pagination', () => {
  it('server: pagination next emits update:serverOptions with page+1', async () => {
    const serverOptions = {
      page: 1,
      rowsPerPage: 5,
      sortBy: 'score',
      sortType: 'asc',
    };
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 50,
        serverOptions,
        rowsPerPage: 5,
      },
    });
    await nextTick();
    expect(firstName(wrapper)).toBe('a');

    await wrapper.find('.next-page__click-button').trigger('click');
    const events = wrapper.emitted('update:serverOptions');
    expect(events).toBeTruthy();
    expect(events.at(-1)[0]).toEqual({
      page: 2,
      rowsPerPage: 5,
      sortBy: 'score',
      sortType: 'asc',
    });
  });

  it('server: pagination prev emits update:serverOptions with page-1', async () => {
    const serverOptions = {
      page: 3,
      rowsPerPage: 5,
      sortBy: null,
      sortType: null,
    };
    const wrapper = mount(DataTable, {
      props: {
        items: page2Items(),
        headers,
        serverItemsLength: 50,
        serverOptions,
        rowsPerPage: 5,
      },
    });
    await nextTick();
    await wrapper.find('.previous-page__click-button').trigger('click');
    expect(wrapper.emitted('update:serverOptions').at(-1)[0].page).toBe(2);
  });

  it('server: parent supplying next page items updates visible rows', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 10,
        serverOptions: { page: 1, rowsPerPage: 5 },
        rowsPerPage: 5,
        loading: false,
      },
    });
    await nextTick();
    expect(firstName(wrapper)).toBe('a');

    // Intended server flow: loading true → fetch → new items/options → loading false
    // syncs currentPaginationNumber (footer index) from serverOptions.page.
    await wrapper.setProps({ loading: true });
    await nextTick();
    await wrapper.setProps({
      items: page2Items(),
      serverOptions: { page: 2, rowsPerPage: 5 },
      loading: false,
    });
    await nextTick();
    expect(firstName(wrapper)).toBe('f');
    expect(wrapper.findAll('tbody tr')).toHaveLength(5);
    expect(footerIndexText(wrapper)).toBe('6–10 of 10');
  });

  /**
   * Phase 4: serverOptions.page updates sync the footer index immediately
   * (no longer requires a loading true→false edge).
   */
  it('server: updating serverOptions.page syncs footer without loading cycle', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 10,
        serverOptions: { page: 1, rowsPerPage: 5 },
        rowsPerPage: 5,
      },
    });
    await nextTick();
    await wrapper.setProps({
      items: page2Items(),
      serverOptions: { page: 2, rowsPerPage: 5 },
    });
    await nextTick();
    expect(firstName(wrapper)).toBe('f');
    expect(footerIndexText(wrapper)).toBe('6–10 of 10');
    expect(wrapper.vm.currentPaginationNumber).toBe(2);
  });
});

describe('regression server: sorting', () => {
  it('server: sorting click emits update:serverOptions with sortBy/sortType', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 50,
        serverOptions: {
          page: 1,
          rowsPerPage: 5,
          sortBy: 'score',
          sortType: 'asc',
        },
        rowsPerPage: 5,
      },
    });
    await nextTick();
    const scoreHeader = wrapper.findAll('th').find((th) => th.text().includes('SCORE'));
    expect(scoreHeader).toBeTruthy();
    await scoreHeader.trigger('click');
    await nextTick();

    const emitted = wrapper.emitted('update:serverOptions').at(-1)[0];
    expect(emitted.sortBy).toBe('score');
    expect(emitted.sortType).toBe('desc');
    expect(emitted.page).toBe(1);
    expect(emitted.rowsPerPage).toBe(5);
  });

  it('server: does not re-sort client-side; shows items as provided', async () => {
    // Parent sends unsorted page payload while asking for desc — table must not reorder.
    const unsortedPage = [
      { id: 1, name: 'low', score: 1 },
      { id: 2, name: 'high', score: 99 },
      { id: 3, name: 'mid', score: 50 },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items: unsortedPage,
        headers,
        serverItemsLength: 3,
        serverOptions: {
          page: 1,
          rowsPerPage: 10,
          sortBy: 'score',
          sortType: 'desc',
        },
        rowsPerPage: 10,
      },
    });
    await nextTick();
    const names = wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').at(0).text());
    expect(names).toEqual(['low', 'high', 'mid']);
  });
});

describe('regression server: item count', () => {
  it('server: item count footer uses serverItemsLength not items.length', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(), // 5 rows on this page
        headers: headersMocked,
        serverItemsLength: 137,
        serverOptions: { page: 1, rowsPerPage: 5 },
        rowsPerPage: 5,
      },
    });
    await nextTick();
    expect(wrapper.findAll('tbody tr')).toHaveLength(5);
    expect(wrapper.vm.clientItemsLength).toBe(137);
    expect(footerIndexText(wrapper)).toBe('1–5 of 137');
    expect(wrapper.vm.maxPaginationNumber).toBe(28); // ceil(137/5)
  });

  it('server: rows-per-page change emits page 1 and new rowsPerPage', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: page1Items(),
        headers,
        serverItemsLength: 100,
        serverOptions: {
          page: 4,
          rowsPerPage: 5,
          sortBy: 'score',
          sortType: 'asc',
        },
        rowsPerPage: 5,
        rowsItems: [5, 10, 25],
      },
    });
    await nextTick();
    wrapper.vm.updateRowsPerPageActiveOption(25);
    await nextTick();

    const emitted = wrapper.emitted('update:serverOptions').at(-1)[0];
    expect(emitted).toEqual({
      page: 1,
      rowsPerPage: 25,
      sortBy: 'score',
      sortType: 'asc',
    });
  });

  it('server: last page index reflects partial page against serverItemsLength', async () => {
    const lastPageItems = [
      { id: 21, name: 'u' },
      { id: 22, name: 'v' },
    ];
    const wrapper = mount(DataTable, {
      props: {
        items: lastPageItems,
        headers,
        serverItemsLength: 22,
        serverOptions: { page: 5, rowsPerPage: 5 },
        rowsPerPage: 5,
      },
    });
    await nextTick();
    expect(footerIndexText(wrapper)).toBe('21–22 of 22');
    expect(wrapper.vm.isLastPage).toBe(true);
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
  });
});
