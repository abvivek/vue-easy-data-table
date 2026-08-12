/**
 * @vitest-environment happy-dom
 *
 * Regression: client-side pagination — first/last page, navigation, rows-per-page.
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import { headersMocked, mockClientItems } from '../src/mock';

function firstName(wrapper) {
  return wrapper.findAll('tbody td').at(0).text();
}

function footerIndexText(wrapper) {
  return wrapper.find('.pagination__items-index').text().replace(/\s+/g, ' ').trim();
}

describe('regression pagination: first / last page', () => {
  it('pagination: first page shows rows 1–N and disables prev', async () => {
    const items = mockClientItems(25);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: headersMocked,
        rowsPerPage: 5,
        buttonsPagination: true,
      },
    });
    await nextTick();
    expect(wrapper.vm.isFirstPage).toBe(true);
    expect(wrapper.vm.isLastPage).toBe(false);
    expect(wrapper.find('.previous-page__click-button').classes()).toContain('first-page');
    expect(firstName(wrapper)).toBe(items[0].name);
    expect(wrapper.findAll('tbody tr')).toHaveLength(5);
    expect(footerIndexText(wrapper)).toBe('1–5 of 25');
  });

  it('pagination: last page shows remaining rows and disables next', async () => {
    const items = mockClientItems(25);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: headersMocked,
        rowsPerPage: 5,
        currentPage: 5,
        buttonsPagination: true,
      },
    });
    await nextTick();
    expect(wrapper.vm.currentPaginationNumber).toBe(5);
    expect(wrapper.vm.isLastPage).toBe(true);
    expect(wrapper.find('.next-page__click-button').classes()).toContain('last-page');
    expect(firstName(wrapper)).toBe(items[20].name);
    expect(wrapper.findAll('tbody tr')).toHaveLength(5);
    expect(footerIndexText(wrapper)).toBe('21–25 of 25');
  });
});

describe('regression pagination: page changes', () => {
  it('pagination: next page advances visible rows and emits update:currentPage', async () => {
    const items = mockClientItems(30);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: headersMocked,
        rowsPerPage: 5,
      },
    });
    await nextTick();
    expect(firstName(wrapper)).toBe(items[0].name);

    await wrapper.find('.next-page__click-button').trigger('click');
    await nextTick();
    expect(firstName(wrapper)).toBe(items[5].name);
    expect(wrapper.emitted('update:currentPage').at(-1)).toEqual([2]);
    expect(footerIndexText(wrapper)).toBe('6–10 of 30');
  });

  it('pagination: prev page returns to earlier rows', async () => {
    const items = mockClientItems(30);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: headersMocked,
        rowsPerPage: 5,
        currentPage: 3,
      },
    });
    await nextTick();
    expect(firstName(wrapper)).toBe(items[10].name);

    await wrapper.find('.previous-page__click-button').trigger('click');
    await nextTick();
    expect(firstName(wrapper)).toBe(items[5].name);
    expect(wrapper.emitted('update:currentPage').at(-1)).toEqual([2]);
  });

  it('pagination: jumping via buttonsPagination updates page', async () => {
    // 30 items / 5 = 6 pages (≤7) so all page buttons render without omission.
    const items = mockClientItems(30);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: headersMocked,
        rowsPerPage: 5,
        buttonsPagination: true,
      },
    });
    await nextTick();
    const pageFour = wrapper.findAll('.item.button').find((btn) => btn.text() === '4');
    expect(pageFour).toBeTruthy();
    await pageFour.trigger('click');
    await nextTick();
    expect(wrapper.vm.currentPaginationNumber).toBe(4);
    expect(firstName(wrapper)).toBe(items[15].name);
    expect(footerIndexText(wrapper)).toBe('16–20 of 30');
  });
});

describe('regression pagination: rows-per-page', () => {
  it('pagination: changing rows-per-page updates page size and resets to page 1', async () => {
    const items = mockClientItems(40);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: headersMocked,
        rowsPerPage: 5,
        rowsItems: [5, 10, 25],
        currentPage: 3,
      },
    });
    await nextTick();
    expect(wrapper.vm.currentPaginationNumber).toBe(3);
    expect(wrapper.findAll('tbody tr')).toHaveLength(5);

    wrapper.vm.updateRowsPerPageActiveOption(10);
    await nextTick();

    expect(wrapper.vm.rowsPerPageActiveOption).toBe(10);
    expect(wrapper.vm.currentPaginationNumber).toBe(1);
    expect(wrapper.findAll('tbody tr')).toHaveLength(10);
    expect(firstName(wrapper)).toBe(items[0].name);
    expect(footerIndexText(wrapper)).toBe('1–10 of 40');
  });

  it('pagination: rows-per-page via selector UI', async () => {
    const items = mockClientItems(30);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: headersMocked,
        rowsPerPage: 5,
        rowsItems: [5, 15, 25],
      },
    });
    await nextTick();
    await wrapper.find('.rows-input__wrapper').trigger('click');
    const options = wrapper.findAll('.select-items li');
    const fifteen = options.find((li) => li.text() === '15');
    expect(fifteen).toBeTruthy();
    await fifteen.trigger('click');
    await nextTick();

    expect(wrapper.findAll('tbody tr')).toHaveLength(15);
    expect(footerIndexText(wrapper)).toBe('1–15 of 30');
  });
});
