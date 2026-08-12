/**
 * @vitest-environment happy-dom
 *
 * Sticky/fixed columns: painted-width `left`, padding fallback,
 * stacking (z-index + background class), checkbox/index/expand pins.
 */
import { describe, it, expect } from 'vitest';
import { nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import useFixedColumn from '../src/hooks/useFixedColumn';
import {
  DEFAULT_CELL_HORIZONTAL_PADDING_PX,
  FIXED_COLUMN_BODY_Z_INDEX,
  FIXED_COLUMN_HEADER_Z_INDEX,
  computeStickyDistances,
  parseHorizontalPadding,
  resolveColumnPaintedWidth,
} from '../src/stickyColumns';

const items = [
  { name: 'Ada', age: 36, address: 'London' },
  { name: 'Bob', age: 28, address: 'Paris' },
];

function parseStylePx(style, prop) {
  const match = String(style || '').match(new RegExp(`${prop}:\\s*([\\d.]+)px`));
  return match ? Number(match[1]) : null;
}

function parseStyleZIndex(style) {
  const match = String(style || '').match(/z-index:\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

describe('sticky distance helpers', () => {
  it('sums painted widths into cumulative left offsets', () => {
    expect(computeStickyDistances([100, 80, 200])).toEqual([0, 100, 180]);
    expect(computeStickyDistances([])).toEqual([]);
    expect(computeStickyDistances([50])).toEqual([0]);
  });

  it('parses horizontal padding from CSS shorthand (content-box)', () => {
    expect(parseHorizontalPadding('0px 10px')).toBe(20);
    expect(parseHorizontalPadding('10px')).toBe(20);
    expect(parseHorizontalPadding('0 8px 0 12px')).toBe(20);
    expect(parseHorizontalPadding('0px 10px 4px')).toBe(20);
    expect(parseHorizontalPadding('')).toBe(DEFAULT_CELL_HORIZONTAL_PADDING_PX);
  });

  it('uses measured width when present; otherwise configured + padding', () => {
    expect(resolveColumnPaintedWidth({
      measuredWidth: 160,
      configuredWidth: 100,
      horizontalPadding: 20,
    })).toBe(160);

    expect(resolveColumnPaintedWidth({
      measuredWidth: 0,
      configuredWidth: 100,
      horizontalPadding: 20,
    })).toBe(120);

    expect(resolveColumnPaintedWidth({
      configuredWidth: 100,
      horizontalPadding: 20,
      boxSizing: 'border-box',
    })).toBe(100);

    expect(resolveColumnPaintedWidth({
      configuredWidth: 80,
    })).toBe(80 + DEFAULT_CELL_HORIZONTAL_PADDING_PX);
  });
});

describe('useFixedColumn distances', () => {
  it('falls back to configured width + horizontal padding', () => {
    const headers = ref([
      { text: 'A', value: 'a', fixed: true, width: 100 },
      { text: 'B', value: 'b', fixed: true, width: 80 },
      { text: 'C', value: 'c', width: 200 },
    ]);
    const measured = ref([]);
    const padding = ref(20);
    const { fixedColumnsInfos, lastFixedColumn } = useFixedColumn(headers, measured, padding);

    expect(lastFixedColumn.value).toBe('b');
    expect(fixedColumnsInfos.value.map((info) => info.distance)).toEqual([0, 120]);
    expect(fixedColumnsInfos.value[0].width).toBe(120);
    expect(fixedColumnsInfos.value[1].width).toBe(100);
  });

  it('uses measured painted widths when every column is measurable', () => {
    const headers = ref([
      { text: 'A', value: 'a', fixed: true, width: 100 },
      { text: 'B', value: 'b', fixed: true, width: 80 },
      { text: 'C', value: 'c', width: 200 },
    ]);
    const measured = ref([160, 110, 400]);
    const padding = ref(20);
    const { fixedColumnsInfos } = useFixedColumn(headers, measured, padding);

    expect(fixedColumnsInfos.value.map((info) => info.distance)).toEqual([0, 160]);
    expect(fixedColumnsInfos.value[1].width).toBe(110);
  });

  it('includes checkbox / index / expand widths in the pin chain', () => {
    const headers = ref([
      { text: 'checkbox', value: 'checkbox', fixed: true, width: 36 },
      { text: '#', value: 'index', fixed: true, width: 60 },
      { text: '', value: 'expand', fixed: true, width: 36 },
      { text: 'Name', value: 'name', fixed: true, width: 100 },
      { text: 'Age', value: 'age', width: 80 },
    ]);
    const measured = ref([]);
    const padding = ref(20);
    const { fixedColumnsInfos, lastFixedColumn } = useFixedColumn(headers, measured, padding);

    expect(lastFixedColumn.value).toBe('name');
    expect(fixedColumnsInfos.value.map((info) => [info.value, info.distance])).toEqual([
      ['checkbox', 0],
      ['index', 56],
      ['expand', 136],
      ['name', 192],
    ]);
  });

  it('is empty when no columns are fixed', () => {
    const headers = ref([
      { text: 'A', value: 'a', width: 100 },
      { text: 'B', value: 'b', width: 80 },
    ]);
    const { fixedHeaders, lastFixedColumn, fixedColumnsInfos } = useFixedColumn(headers);
    expect(fixedHeaders.value).toEqual([]);
    expect(lastFixedColumn.value).toBe('');
    expect(fixedColumnsInfos.value).toEqual([]);
  });
});

describe('DataTable sticky cells', () => {
  it('applies sticky left (padding-aware), z-index, background class, and shadow', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name', fixed: true, width: 100 },
          { text: 'Age', value: 'age', fixed: true, width: 80 },
          { text: 'Address', value: 'address', width: 200 },
        ],
        items,
        rowsPerPage: 10,
        tableHeight: 240,
      },
    });
    await nextTick();
    await nextTick();

    const ths = wrapper.findAll('thead th');
    const nameTh = ths[0];
    const ageTh = ths[1];
    const addrTh = ths[2];

    expect(nameTh.classes()).toContain('fixed-column');
    expect(ageTh.classes()).toContain('fixed-column');
    expect(ageTh.classes()).toContain('shadow');
    expect(addrTh.classes()).not.toContain('fixed-column');
    expect(addrTh.classes()).not.toContain('shadow');

    expect(nameTh.attributes('style')).toMatch(/position:\s*sticky/);
    expect(parseStylePx(nameTh.attributes('style'), 'left')).toBe(0);
    expect(parseStyleZIndex(nameTh.attributes('style'))).toBe(FIXED_COLUMN_HEADER_Z_INDEX);

    // happy-dom offsetWidth is 0 → fallback configured + 20px padding
    expect(parseStylePx(ageTh.attributes('style'), 'left')).toBe(120);
    expect(addrTh.attributes('style') || '').not.toMatch(/position:\s*sticky/);

    const tds = wrapper.findAll('tbody tr')[0].findAll('td');
    expect(tds[0].classes()).toContain('fixed-column');
    expect(tds[1].classes()).toContain('fixed-column');
    expect(tds[1].classes()).toContain('shadow');
    expect(tds[2].classes()).not.toContain('fixed-column');

    expect(parseStylePx(tds[0].attributes('style'), 'left')).toBe(0);
    expect(parseStylePx(tds[1].attributes('style'), 'left')).toBe(120);
    expect(parseStyleZIndex(tds[0].attributes('style'))).toBe(FIXED_COLUMN_BODY_Z_INDEX);
    expect(tds[0].attributes('style')).toMatch(/position:\s*sticky/);

    // Header and body share the same left (no header/body mismatch)
    expect(parseStylePx(ageTh.attributes('style'), 'left'))
      .toBe(parseStylePx(tds[1].attributes('style'), 'left'));

    const tableStyle = wrapper.find('table').attributes('style') || '';
    expect(tableStyle).toMatch(/min-width:\s*440px/);

    wrapper.unmount();
  });

  it('does not apply sticky styles when no columns are fixed', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name', width: 100 },
          { text: 'Age', value: 'age', width: 80 },
        ],
        items,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    wrapper.findAll('thead th').forEach((th) => {
      expect(th.classes()).not.toContain('fixed-column');
      expect(th.attributes('style') || '').not.toMatch(/position:\s*sticky/);
    });
    wrapper.findAll('tbody td').forEach((td) => {
      expect(td.classes()).not.toContain('fixed-column');
      expect(td.attributes('style') || '').not.toMatch(/position:\s*sticky/);
    });
    expect(wrapper.find('table').attributes('style') || '').not.toMatch(/min-width/);

    wrapper.unmount();
  });

  it('pins checkbox, index, and expand columns with padding-aware left', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name', fixed: true, width: 100 },
          { text: 'Age', value: 'age', width: 80 },
        ],
        items,
        itemsSelected: [],
        showIndex: true,
        rowsPerPage: 10,
        tableHeight: 240,
      },
      slots: {
        expand: '<div class="expand-slot">x</div>',
      },
    });
    await nextTick();
    await nextTick();

    const ths = wrapper.findAll('thead th');
    // checkbox, index, expand, name, age
    expect(ths).toHaveLength(5);
    expect(ths[0].classes()).toContain('fixed-column');
    expect(ths[1].classes()).toContain('fixed-column');
    expect(ths[2].classes()).toContain('fixed-column');
    expect(ths[3].classes()).toContain('fixed-column');
    expect(ths[3].classes()).toContain('shadow');
    expect(ths[4].classes()).not.toContain('fixed-column');

    expect(parseStylePx(ths[0].attributes('style'), 'left')).toBe(0);
    expect(parseStylePx(ths[1].attributes('style'), 'left')).toBe(56);
    expect(parseStylePx(ths[2].attributes('style'), 'left')).toBe(136);
    expect(parseStylePx(ths[3].attributes('style'), 'left')).toBe(192);

    const tds = wrapper.findAll('tbody tr')[0].findAll('td');
    expect(parseStylePx(tds[0].attributes('style'), 'left')).toBe(0);
    expect(parseStylePx(tds[3].attributes('style'), 'left')).toBe(192);
    expect(parseStyleZIndex(tds[0].attributes('style'))).toBe(FIXED_COLUMN_BODY_Z_INDEX);

    wrapper.unmount();
  });

  it('uses measured header offsetWidth for left when layout is available', async () => {
    const widths = [160, 110, 400];
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        if (this.tagName === 'TH' && this.parentElement) {
          const index = Array.from(this.parentElement.children).indexOf(this);
          return widths[index] ?? 0;
        }
        return descriptor && descriptor.get ? descriptor.get.call(this) : 0;
      },
    });

    try {
      const wrapper = mount(DataTable, {
        props: {
          headers: [
            { text: 'Name', value: 'name', fixed: true, width: 100 },
            { text: 'Age', value: 'age', fixed: true, width: 80 },
            { text: 'Address', value: 'address', width: 200 },
          ],
          items,
          rowsPerPage: 10,
          tableHeight: 240,
        },
      });
      await nextTick();
      await nextTick();

      const ageTh = wrapper.findAll('thead th')[1];
      const ageTd = wrapper.findAll('tbody tr')[0].findAll('td')[1];
      expect(parseStylePx(ageTh.attributes('style'), 'left')).toBe(160);
      expect(parseStylePx(ageTd.attributes('style'), 'left')).toBe(160);

      wrapper.unmount();
    } finally {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', descriptor);
      }
    }
  });

  it('keeps sticky styles on the virtualized body path', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name', fixed: true, width: 100 },
          { text: 'Age', value: 'age', width: 80 },
        ],
        items,
        rowsPerPage: 10,
        tableHeight: 240,
        virtual: true,
        virtualRowHeight: 36,
        itemKey: 'name',
      },
    });
    await nextTick();
    await nextTick();

    const td = wrapper.findAll('tbody tr')[0].findAll('td')[0];
    expect(td.classes()).toContain('fixed-column');
    expect(td.attributes('style')).toMatch(/position:\s*sticky/);
    expect(parseStylePx(td.attributes('style'), 'left')).toBe(0);

    wrapper.unmount();
  });
});
