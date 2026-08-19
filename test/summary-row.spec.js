/**
 * @vitest-environment happy-dom
 *
 * Totals (summary) row: aggregations, scope, server mode, slots,
 * synthetic columns, grouped headers, virtual coexistence, sticky cells.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import {
  computeSummaryValue,
  isSummaryAggregation,
  resolveHeaderSummary,
} from '../src/summary';
import { FIXED_COLUMN_SUMMARY_Z_INDEX } from '../src/stickyColumns';

const baseItems = [
  { name: 'Ada', amount: 10, score: '5', note: 'ok', meta: { qty: 2 } },
  { name: 'Bob', amount: '20', score: null, note: '', meta: { qty: 3 } },
  { name: 'Cal', amount: null, score: 'n/a', note: 'x', meta: { qty: null } },
  { name: 'Deb', amount: 30, score: 15, note: null, meta: { qty: '4' } },
];

const flatHeaders = [
  { text: 'Name', value: 'name' },
  { text: 'Amount', value: 'amount', summary: 'sum' },
  { text: 'Score', value: 'score', summary: 'avg' },
  { text: 'Note', value: 'note', summary: 'count' },
];

const groupedHeaders = [
  { text: 'Name', value: 'name' },
  {
    text: 'Member info',
    value: 'member-info',
    children: [
      { text: 'Team', value: 'team' },
      { text: 'Amount', value: 'amount', summary: 'sum' },
    ],
  },
];

const groupedItems = [
  { name: 'Ada', team: 'A', amount: 10 },
  { name: 'Bob', team: 'B', amount: 20 },
];

function parseStylePx(style, prop) {
  const match = String(style || '').match(new RegExp(`${prop}:\\s*([\\d.]+)px`));
  return match ? Number(match[1]) : null;
}

function parseStyleZIndex(style) {
  const match = String(style || '').match(/z-index:\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function summaryRowCells(wrapper) {
  const tfoot = wrapper.find('tfoot.vue3-easy-data-table__summary');
  if (!tfoot.exists()) return [];
  return tfoot.findAll('th, td');
}

function bodyRowCells(wrapper, rowIndex = 0) {
  return wrapper.findAll('tbody tr').at(rowIndex).findAll('td');
}

/** Body data rows only (exclude virtual spacers). */
function dataRows(wrapper) {
  return wrapper.findAll('tbody tr').filter(
    (tr) => !tr.classes().includes('vue3-easy-data-table__virtual-spacer'),
  );
}

describe('summary.ts helpers', () => {
  const items = baseItems;

  it('isSummaryAggregation recognizes built-in names only', () => {
    expect(isSummaryAggregation('sum')).toBe(true);
    expect(isSummaryAggregation('avg')).toBe(true);
    expect(isSummaryAggregation('min')).toBe(true);
    expect(isSummaryAggregation('max')).toBe(true);
    expect(isSummaryAggregation('count')).toBe(true);
    expect(isSummaryAggregation('total')).toBe(false);
    expect(isSummaryAggregation(null)).toBe(false);
  });

  it('sum skips nulls and non-numeric strings; accepts numeric strings', () => {
    expect(computeSummaryValue('sum', items, 'amount')).toBe(60);
    expect(computeSummaryValue('sum', items, 'score')).toBe(20);
  });

  it('avg uses only numeric values', () => {
    expect(computeSummaryValue('avg', items, 'amount')).toBe(20);
    expect(computeSummaryValue('avg', items, 'score')).toBe(10);
  });

  it('min and max over numeric values', () => {
    expect(computeSummaryValue('min', items, 'amount')).toBe(10);
    expect(computeSummaryValue('max', items, 'amount')).toBe(30);
  });

  it('min and max do not throw RangeError on large arrays', () => {
    const lots = Array.from({ length: 100_000 }, (_, i) => ({ n: i }));
    expect(computeSummaryValue('min', lots, 'n')).toBe(0);
    expect(computeSummaryValue('max', lots, 'n')).toBe(99_999);
  });

  it('count counts non-empty values including non-numeric strings', () => {
    expect(computeSummaryValue('count', items, 'note')).toBe(2);
    expect(computeSummaryValue('count', items, 'score')).toBe(3);
  });

  it('returns null for empty numeric columns', () => {
    expect(computeSummaryValue('sum', [{ x: null }, { x: 'bad' }], 'x')).toBe(null);
    expect(computeSummaryValue('count', [{ x: null }, { x: '' }], 'x')).toBe(0);
  });

  it('supports nested field paths via getItemValue', () => {
    expect(computeSummaryValue('sum', items, 'meta.qty')).toBe(9);
    expect(computeSummaryValue('count', items, 'meta.qty')).toBe(3);
  });

  it('resolveHeaderSummary runs custom SummaryFn and aggregations', () => {
    const header = { text: 'Amount', value: 'amount' };
    const ctx = { items, header, scope: 'all' };

    expect(resolveHeaderSummary('sum', ctx)).toBe(60);
    expect(resolveHeaderSummary(() => 'custom', ctx)).toBe('custom');
    expect(resolveHeaderSummary(() => null, ctx)).toBe(null);
    expect(resolveHeaderSummary('invalid', ctx)).toBe(null);
    expect(resolveHeaderSummary(undefined, ctx)).toBe(null);
  });
});

describe('DataTable summary row', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders no tfoot when nothing opts in', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [{ text: 'Name', value: 'name' }],
        items: baseItems,
      },
    });
    await nextTick();
    expect(wrapper.find('tfoot').exists()).toBe(false);
  });

  it('aggregates sum, avg, min, max, count and leaves unsummarized columns empty', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name' },
          { text: 'Amount', value: 'amount', summary: 'sum' },
          { text: 'Score', value: 'score', summary: 'avg' },
          { text: 'Min', value: 'minCol', summary: 'min' },
          { text: 'Max', value: 'maxCol', summary: 'max' },
          { text: 'Note', value: 'note', summary: 'count' },
          { text: 'Empty', value: 'empty' },
        ],
        items: [
          { name: 'A', amount: 10, score: 4, minCol: 3, maxCol: 7, note: 'a', empty: 99 },
          { name: 'B', amount: '20', score: null, minCol: '1', maxCol: 20, note: '', empty: null },
          { name: 'C', amount: null, score: 'x', minCol: null, maxCol: 'bad', note: 'c', empty: undefined },
        ],
      },
    });
    await nextTick();

    const cells = summaryRowCells(wrapper);
    expect(cells).toHaveLength(7);
    expect(cells[0].text()).toBe('Total');
    expect(cells[0].element.tagName).toBe('TH');
    expect(cells[0].attributes('scope')).toBe('row');
    expect(cells[1].text()).toBe('30');
    expect(cells[2].text()).toBe('4');
    expect(cells[3].text()).toBe('1');
    expect(cells[4].text()).toBe('20');
    expect(cells[5].text()).toBe('2');
    expect(cells[6].text()).toBe('');
  });

  it('uses custom SummaryFn from Header.summary', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name' },
          {
            text: 'Amount',
            value: 'amount',
            summary: ({ items }) => items.length * 2,
          },
        ],
        items: baseItems.slice(0, 2),
      },
    });
    await nextTick();
    const cells = summaryRowCells(wrapper);
    expect(cells[0].text()).toBe('Total');
    expect(cells[1].text()).toBe('4');
  });

  it('summary-scope all vs page after search-value', async () => {
    const headers = [
      { text: 'Name', value: 'name' },
      { text: 'Amount', value: 'amount', summary: 'sum' },
    ];
    const items = [
      { name: 'Ada', amount: 10 },
      { name: 'Bob', amount: 20 },
      { name: 'Cal', amount: 30 },
      { name: 'Deb', amount: 40 },
    ];

    const allScope = mount(DataTable, {
      props: {
        headers,
        items,
        rowsPerPage: 1,
        summaryScope: 'all',
      },
    });
    await nextTick();
    let cells = summaryRowCells(allScope);
    expect(cells[1].text()).toBe('100');

    const pageScope = mount(DataTable, {
      props: {
        headers,
        items,
        rowsPerPage: 1,
        summaryScope: 'page',
      },
    });
    await nextTick();
    cells = summaryRowCells(pageScope);
    expect(cells[1].text()).toBe('10');

    const filteredAll = mount(DataTable, {
      props: {
        headers,
        items,
        rowsPerPage: 1,
        searchValue: 'a',
        summaryScope: 'all',
      },
    });
    await nextTick();
    cells = summaryRowCells(filteredAll);
    expect(cells[1].text()).toBe('40');

    const filteredPage = mount(DataTable, {
      props: {
        headers,
        items,
        rowsPerPage: 1,
        searchValue: 'a',
        summaryScope: 'page',
      },
    });
    await nextTick();
    cells = summaryRowCells(filteredPage);
    expect(cells[1].text()).toBe('10');
  });

  it('summary-row overrides Header.summary per column', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: flatHeaders,
        items: baseItems,
        summaryRow: { amount: 999, score: 'override' },
      },
    });
    await nextTick();
    const cells = summaryRowCells(wrapper);
    expect(cells[1].text()).toBe('999');
    expect(cells[2].text()).toBe('override');
    expect(cells[3].text()).toBe('2');
  });

  it('server mode: summary-row works; Header.summary warns once and renders blank', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const blank = mount(DataTable, {
      props: {
        headers: flatHeaders,
        items: baseItems.slice(0, 2),
        serverOptions: { page: 1, rowsPerPage: 10 },
        serverItemsLength: 100,
      },
    });
    await nextTick();
    expect(blank.find('tfoot.vue3-easy-data-table__summary').exists()).toBe(true);
    const blankCells = summaryRowCells(blank);
    expect(blankCells[1].text()).toBe('');
    expect(blankCells[2].text()).toBe('');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('Header.summary is ignored in server mode');

    warn.mockClear();
    const withRow = mount(DataTable, {
      props: {
        headers: flatHeaders,
        items: baseItems.slice(0, 2),
        serverOptions: { page: 1, rowsPerPage: 10 },
        serverItemsLength: 100,
        summaryRow: { amount: 1234 },
      },
    });
    await nextTick();
    expect(summaryRowCells(withRow)[1].text()).toBe('1234');
    expect(warn).not.toHaveBeenCalled();
  });

  it('aggregates a data column named index (injected synthetics only are skipped)', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Index', value: 'index', summary: 'sum' },
          { text: 'Name', value: 'name' },
        ],
        items: [
          { index: 1, name: 'A' },
          { index: 2, name: 'B' },
        ],
      },
    });
    await nextTick();
    const cells = summaryRowCells(wrapper);
    expect(cells).toHaveLength(2);
    expect(cells[0].text()).toBe('3');
    expect(cells[1].text()).toBe('Total');
  });

  it('still aggregates a data column named index when show-index injects a synthetic column', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Index', value: 'index', summary: 'sum' },
          { text: 'Name', value: 'name' },
        ],
        items: [
          { index: 1, name: 'A' },
          { index: 2, name: 'B' },
        ],
        showIndex: true,
      },
    });
    await nextTick();
    const cells = summaryRowCells(wrapper);
    expect(cells).toHaveLength(3);
    expect(cells[0].text()).toBe('');
    expect(cells[1].text()).toBe('3');
    expect(cells[2].text()).toBe('Total');
  });

  it('synthetic checkbox, index, and expand columns are empty; cell count matches body', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: flatHeaders,
        items: baseItems,
        showIndex: true,
        itemsSelected: [],
        fixedExpand: true,
      },
      slots: {
        expand: '<div class="expand-panel">x</div>',
      },
    });
    await nextTick();

    const bodyCells = bodyRowCells(wrapper);
    const summaryCells = summaryRowCells(wrapper);
    expect(bodyCells).toHaveLength(summaryCells.length);
    expect(summaryCells[0].text()).toBe('');
    expect(summaryCells[1].text()).toBe('');
    expect(summaryCells[2].text()).toBe('');
    expect(summaryCells[3].text()).toBe('Total');
    expect(summaryCells[4].text()).toBe('60');
  });

  it('aligns with grouped headers and hidden leaves', async () => {
    const headers = [
      { text: 'Name', value: 'name' },
      {
        text: 'Stats',
        value: 'stats',
        children: [
          { text: 'Team', value: 'team', hidden: true },
          { text: 'Amount', value: 'amount', summary: 'sum' },
        ],
      },
    ];
    const wrapper = mount(DataTable, {
      props: { headers, items: groupedItems },
    });
    await nextTick();

    expect(bodyRowCells(wrapper)).toHaveLength(2);
    const cells = summaryRowCells(wrapper);
    expect(cells).toHaveLength(2);
    expect(cells[0].text()).toBe('Total');
    expect(cells[1].text()).toBe('30');
  });

  it('keeps virtual active with summary (unlike body-append)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'ID', value: 'id' },
          { text: 'Amount', value: 'amount', summary: 'sum' },
        ],
        items: Array.from({ length: 80 }, (_, i) => ({ id: i + 1, amount: 1 })),
        rowsPerPage: 80,
        virtual: true,
        virtualRowHeight: 36,
        tableHeight: 200,
        itemKey: 'id',
      },
    });
    await nextTick();

    expect(wrapper.find('.vue3-easy-data-table__virtual-spacer').exists()).toBe(true);
    expect(dataRows(wrapper).length).toBeLessThan(80);
    expect(summaryRowCells(wrapper)[1].text()).toBe('80');
    expect(warn).not.toHaveBeenCalled();
  });

  it('applies sticky left, fixed-column, shadow, and summary z-index on frozen totals cells', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name', fixed: true, width: 100 },
          { text: 'Amount', value: 'amount', fixed: true, width: 80, summary: 'sum' },
          { text: 'Note', value: 'note', width: 200 },
        ],
        items: [
          { name: 'Ada', amount: 10, note: 'a' },
          { name: 'Bob', amount: 20, note: 'b' },
        ],
        tableHeight: 240,
      },
    });
    await nextTick();
    await nextTick();

    const cells = summaryRowCells(wrapper);
    expect(cells[0].classes()).toContain('fixed-column');
    expect(cells[0].classes()).not.toContain('shadow');
    expect(cells[1].classes()).toContain('fixed-column');
    expect(cells[1].classes()).toContain('shadow');
    expect(cells[2].classes()).not.toContain('fixed-column');

    expect(parseStylePx(cells[0].attributes('style'), 'left')).toBe(0);
    expect(parseStylePx(cells[1].attributes('style'), 'left')).toBe(120);
    expect(parseStyleZIndex(cells[0].attributes('style'))).toBe(FIXED_COLUMN_SUMMARY_Z_INDEX);
    expect(parseStyleZIndex(cells[1].attributes('style'))).toBe(FIXED_COLUMN_SUMMARY_Z_INDEX);
    expect(cells[0].attributes('style')).toMatch(/position:\s*sticky/);
  });

  it('uses summaryText on the label th scope=row', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: flatHeaders,
        items: baseItems,
        summaryText: 'Grand total',
      },
    });
    await nextTick();
    const label = summaryRowCells(wrapper)[0];
    expect(label.element.tagName).toBe('TH');
    expect(label.attributes('scope')).toBe('row');
    expect(label.classes()).toContain('summary-label');
    expect(label.text()).toBe('Grand total');
  });

  it('renders tfoot when only #summary-{value} slots opt in (show-summary)', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name' },
          { text: 'Amount', value: 'amount' },
        ],
        items: baseItems,
        showSummary: true,
      },
      slots: {
        'summary-amount': ({ value }) => h('span', { class: 'slot-amount' }, `slot:${value ?? 'empty'}`),
      },
    });
    await nextTick();
    expect(wrapper.find('tfoot').exists()).toBe(true);
    expect(wrapper.find('.slot-amount').text()).toBe('slot:empty');
  });

  it('#summary-{value} beats Header.summary; #summary fallback covers all non-synthetic columns', async () => {
    const perColumn = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name' },
          { text: 'Amount', value: 'amount', summary: 'sum' },
        ],
        items: baseItems.slice(0, 2),
      },
      slots: {
        'summary-amount': ({ value }) => h('span', { class: 'custom-amount' }, `v:${value}`),
      },
    });
    await nextTick();
    expect(perColumn.find('.custom-amount').text()).toBe('v:30');

    const fallback = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name' },
          { text: 'Amount', value: 'amount', summary: 'sum' },
        ],
        items: baseItems.slice(0, 2),
      },
      slots: {
        summary: ({ header, value }) => h(
          'span',
          { class: `fallback-${header.value}` },
          header.value === 'name' ? 'Label' : String(value),
        ),
      },
    });
    await nextTick();
    const cells = summaryRowCells(fallback);
    expect(cells.some((c) => c.text() === 'Total')).toBe(false);
    expect(fallback.find('.fallback-name').text()).toBe('Label');
    expect(fallback.find('.fallback-amount').text()).toBe('30');
  });

  it('summary remains visible when hide-footer is true', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: flatHeaders,
        items: baseItems,
        hideFooter: true,
      },
    });
    await nextTick();
    expect(wrapper.find('.vue3-easy-data-table__footer').exists()).toBe(false);
    expect(wrapper.find('tfoot.vue3-easy-data-table__summary').exists()).toBe(true);
  });
});
