/**
 * @vitest-environment happy-dom
 *
 * Phase 3 — opt-in tbody virtualization over pageItems.
 * Deterministic: fixed virtual-row-height + table-height fallback for viewport.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';

const headers = [
  { text: 'ID', value: 'id' },
  { text: 'NAME', value: 'name' },
];

function makeItems(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `row-${i + 1}`,
  }));
}

/** Body data rows only (exclude virtual spacers). */
function dataRows(wrapper) {
  return wrapper.findAll('tbody tr').filter(
    (tr) => !tr.classes().includes('vue3-easy-data-table__virtual-spacer'),
  );
}

describe('Phase 3: virtualization (virtual=false default)', () => {
  it('renders full page without virtual props (smoke / identical path)', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(40),
        headers,
        rowsPerPage: 25,
      },
    });
    await nextTick();
    expect(dataRows(wrapper)).toHaveLength(25);
    expect(wrapper.find('.vue3-easy-data-table__virtual-spacer').exists()).toBe(false);
    expect(wrapper.find('.vue3-easy-data-table__body').exists()).toBe(true);
  });

  it('virtual=false ignores virtual-row-height and still renders full page', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(50),
        headers,
        rowsPerPage: 50,
        virtual: false,
        virtualRowHeight: 36,
        tableHeight: 200,
      },
    });
    await nextTick();
    expect(dataRows(wrapper)).toHaveLength(50);
    expect(wrapper.find('.vue3-easy-data-table__virtual-spacer').exists()).toBe(false);
  });
});

describe('Phase 3: virtualization (virtual=true)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders only a window of rows for large pageItems', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(200),
        headers,
        rowsPerPage: 200,
        virtual: true,
        virtualRowHeight: 36,
        virtualOverscan: 2,
        tableHeight: 180,
        itemKey: 'id',
      },
    });
    await nextTick();

    const rows = dataRows(wrapper);
    // viewport ~180/36 ≈ 5 visible + overscan*2 + 1 ≈ well under 200
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(40);
    expect(wrapper.find('.vue3-easy-data-table__virtual-spacer').exists()).toBe(true);

    // First visible row should be near the top of the page
    expect(rows.at(0).text()).toContain('row-1');
  });

  it('uses item-key for stable row identity with virtual', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(100),
        headers,
        rowsPerPage: 100,
        virtual: true,
        virtualRowHeight: 36,
        tableHeight: 200,
        itemKey: 'id',
      },
    });
    await nextTick();
    const rows = dataRows(wrapper);
    expect(rows.length).toBeLessThan(100);
    // Content still maps to keyed items
    expect(wrapper.text()).toContain('row-1');
  });

  it('selection still works with virtual + item-key', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(80),
        headers,
        itemsSelected: [],
        itemKey: 'id',
        rowsPerPage: 80,
        virtual: true,
        virtualRowHeight: 36,
        tableHeight: 200,
      },
    });
    await nextTick();
    const boxes = wrapper.findAll('.vue3-easy-data-table__body .easy-checkbox');
    expect(boxes.length).toBeGreaterThan(0);
    await boxes.at(0).trigger('click');
    const selected = wrapper.emitted('update:itemsSelected').at(-1)[0];
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe(1);
  });

  it('falls back to full page render when expand slot is used', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(60),
        headers,
        rowsPerPage: 60,
        virtual: true,
        virtualRowHeight: 36,
        tableHeight: 180,
      },
      slots: {
        expand: '<div class="expand-content">expanded</div>',
      },
    });
    await nextTick();
    expect(dataRows(wrapper).length).toBeGreaterThanOrEqual(60);
    expect(wrapper.find('.vue3-easy-data-table__virtual-spacer').exists()).toBe(false);
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).toContain('expand-slot');
  });

  it('falls back when virtualRowHeight is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(50),
        headers,
        rowsPerPage: 50,
        virtual: true,
        tableHeight: 180,
      },
    });
    await nextTick();
    expect(dataRows(wrapper)).toHaveLength(50);
    expect(wrapper.find('.vue3-easy-data-table__virtual-spacer').exists()).toBe(false);
    expect(String(warn.mock.calls[0][0])).toContain('missing-virtual-row-height');
  });

  it('does not apply virtual when custom body slot replaces tbody', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(30),
        headers,
        rowsPerPage: 30,
        virtual: true,
        virtualRowHeight: 36,
        tableHeight: 180,
      },
      slots: {
        body: '<tr class="custom-body-row"><td>custom</td></tr>',
      },
    });
    await nextTick();
    expect(wrapper.find('.custom-body-row').exists()).toBe(true);
    expect(wrapper.find('.vue3-easy-data-table__body').exists()).toBe(false);
  });

  it('updates window after scroll on the main container', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items: makeItems(200),
        headers,
        rowsPerPage: 200,
        virtual: true,
        virtualRowHeight: 36,
        virtualOverscan: 1,
        tableHeight: 144,
        itemKey: 'id',
      },
    });
    await nextTick();

    const main = wrapper.find('.vue3-easy-data-table__main').element;
    Object.defineProperty(main, 'clientHeight', {
      configurable: true,
      get: () => 144,
    });
    Object.defineProperty(main, 'scrollTop', {
      configurable: true,
      get: () => 36 * 50,
    });
    // thead offset: treat as 0 for deterministic math
    const thead = main.querySelector('thead');
    if (thead) {
      Object.defineProperty(thead, 'offsetHeight', {
        configurable: true,
        get: () => 0,
      });
    }
    main.dispatchEvent(new Event('scroll'));
    await nextTick();

    const text = dataRows(wrapper).map((tr) => tr.text()).join(' ');
    expect(text).toContain('row-51');
    expect(text).not.toContain('row-1');
  });
});
