/**
 * @vitest-environment happy-dom
 *
 * Phase 5 — Accessibility: aria-sort, checkbox names, pagination labels,
 * expand as button, keyboard sort activation.
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';

const baseHeaders = [
  { text: 'NAME', value: 'name', sortable: true },
  { text: 'AGE', value: 'age', sortable: true },
];

function makeItems(n = 25) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `n-${i + 1}`,
    age: 20 + (i % 10),
  }));
}

describe('Phase 5 a11y: sortable headers', () => {
  it('sets aria-sort on sortable headers (none / ascending / descending)', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(5),
        headers: baseHeaders,
        rowsPerPage: 10,
        sortBy: 'age',
        sortType: 'asc',
      },
    });
    await nextTick();

    const ths = wrapper.findAll('thead th');
    const nameTh = ths.find((th) => th.text().includes('NAME'));
    const ageTh = ths.find((th) => th.text().includes('AGE'));

    expect(nameTh.attributes('aria-sort')).toBe('none');
    expect(ageTh.attributes('aria-sort')).toBe('ascending');

    await ageTh.trigger('click');
    await nextTick();
    expect(ageTh.attributes('aria-sort')).toBe('descending');
  });

  it('activates sort via Enter and Space on focused sortable header', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(5),
        headers: baseHeaders,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    const nameTh = wrapper.findAll('thead th').find((th) => th.text().includes('NAME'));
    expect(nameTh.attributes('tabindex')).toBe('0');
    expect(nameTh.attributes('aria-sort')).toBe('none');

    await nameTh.trigger('keydown', { key: 'Enter' });
    await nextTick();
    expect(nameTh.attributes('aria-sort')).toBe('ascending');

    await nameTh.trigger('keydown', { key: ' ' });
    await nextTick();
    expect(nameTh.attributes('aria-sort')).toBe('descending');
  });

  it('does not set aria-sort on non-sortable headers', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(3),
        headers: [
          { text: 'NAME', value: 'name' },
          { text: 'AGE', value: 'age', sortable: true },
        ],
        rowsPerPage: 10,
      },
    });
    await nextTick();
    const nameTh = wrapper.findAll('thead th').find((th) => th.text().includes('NAME'));
    expect(nameTh.attributes('aria-sort')).toBeUndefined();
    expect(nameTh.attributes('tabindex')).toBeUndefined();
  });
});

describe('Phase 5 a11y: checkboxes', () => {
  it('exposes accessible names on header select-all and row checkboxes', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(4),
        headers: baseHeaders,
        itemsSelected: [],
        itemKey: 'id',
        rowsPerPage: 10,
      },
    });
    await nextTick();

    const headerCb = wrapper.find('.vue3-easy-data-table__header .easy-checkbox');
    expect(headerCb.attributes('role')).toBe('checkbox');
    expect(headerCb.attributes('aria-label')).toBe('Select all rows');
    expect(headerCb.attributes('aria-checked')).toBe('false');

    const rowCbs = wrapper.findAll('.vue3-easy-data-table__body .easy-checkbox');
    expect(rowCbs.length).toBeGreaterThan(0);
    expect(rowCbs.at(0).attributes('aria-label')).toBe('Select row 1');
    expect(rowCbs.at(1).attributes('aria-label')).toBe('Select row 2');
  });

  it('uses aria-checked mixed for partial header selection', async () => {
    const items = makeItems(4);
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers: baseHeaders,
        itemsSelected: [items[0]],
        itemKey: 'id',
        rowsPerPage: 10,
      },
    });
    await nextTick();
    const headerCb = wrapper.find('.vue3-easy-data-table__header .easy-checkbox');
    expect(headerCb.attributes('aria-checked')).toBe('mixed');
  });
});

describe('Phase 5 a11y: pagination', () => {
  it('provides aria-labels on previous/next page controls', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(30),
        headers: baseHeaders,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    const prev = wrapper.find('button.previous-page__click-button');
    const next = wrapper.find('button.next-page__click-button');
    expect(prev.exists()).toBe(true);
    expect(next.exists()).toBe(true);
    expect(prev.attributes('aria-label')).toBe('Previous page');
    expect(next.attributes('aria-label')).toBe('Next page');
    expect(prev.attributes('type')).toBe('button');
    expect(next.attributes('type')).toBe('button');
    expect(prev.attributes('disabled')).toBeDefined();
  });

  it('labels numbered pagination buttons and marks current page', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(40),
        headers: baseHeaders,
        rowsPerPage: 10,
        buttonsPagination: true,
      },
    });
    await nextTick();

    const pageBtns = wrapper.findAll('.buttons-pagination button.item');
    expect(pageBtns.length).toBeGreaterThan(1);
    expect(pageBtns.at(0).attributes('aria-label')).toBe('Page 1');
    expect(pageBtns.at(0).attributes('aria-current')).toBe('page');

    const page2 = pageBtns.find((b) => b.attributes('aria-label') === 'Page 2');
    expect(page2).toBeTruthy();
    await page2.trigger('click');
    await nextTick();
    expect(page2.attributes('aria-current')).toBe('page');
  });

  it('marks footer as pagination navigation', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(15),
        headers: baseHeaders,
        rowsPerPage: 5,
      },
    });
    await nextTick();
    const footer = wrapper.find('.vue3-easy-data-table__footer');
    expect(footer.attributes('role')).toBe('navigation');
    expect(footer.attributes('aria-label')).toBe('Table pagination');
  });
});

describe('Phase 5 a11y: expand controls', () => {
  it('renders expand control as a labeled button with aria-expanded', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(3),
        headers: baseHeaders,
        rowsPerPage: 10,
        itemKey: 'id',
      },
      slots: {
        expand: '<div class="expand-slot">details</div>',
      },
    });
    await nextTick();

    const btn = wrapper.find('button.expand-icon');
    expect(btn.exists()).toBe(true);
    expect(btn.attributes('type')).toBe('button');
    expect(btn.attributes('aria-label')).toBe('Expand row');
    expect(btn.attributes('aria-expanded')).toBe('false');

    await btn.trigger('click');
    await nextTick();
    expect(btn.attributes('aria-expanded')).toBe('true');
    expect(btn.attributes('aria-label')).toBe('Collapse row');
    expect(wrapper.find('.expand-slot').exists()).toBe(true);
  });
});

describe('Phase 5 a11y: table semantics', () => {
  it('keeps table/thead/tbody and sets aria-busy while loading', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(3),
        headers: baseHeaders,
        rowsPerPage: 10,
        loading: true,
      },
    });
    await nextTick();
    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.find('thead').exists()).toBe(true);
    expect(wrapper.find('tbody').exists()).toBe(true);
    expect(wrapper.find('table').attributes('aria-busy')).toBe('true');

    await wrapper.setProps({ loading: false });
    await nextTick();
    expect(wrapper.find('table').attributes('aria-busy')).toBeUndefined();
  });
});
