/**
 * @vitest-environment happy-dom
 *
 * Phase 6 — customizable headers: per-column align/className/hidden,
 * grouped headers, no consumer mutation, sticky leaf measurement.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import { readPaintedColumnWidths } from '../src/stickyColumns';
import {
  cloneHeader,
  filterHiddenHeaders,
  flattenLeaves,
  maxDepth,
  normalizeGroupFixed,
  partitionFixedTopLevel,
  visibleLeaves,
} from '../src/headerTree';

const items = [
  { name: 'Ada', team: 'A', number: 1, age: 36 },
  { name: 'Bob', team: 'B', number: 2, age: 28 },
];

function parseStylePx(style, prop) {
  const match = String(style || '').match(new RegExp(`${prop}:\\s*([\\d.]+)px`));
  return match ? Number(match[1]) : null;
}

const groupedHeaders = [
  { text: 'Name', value: 'name', sortable: true },
  {
    text: 'Member info',
    value: 'member-info',
    children: [
      { text: 'Team', value: 'team' },
      { text: 'Number', value: 'number', sortable: true },
    ],
  },
];

describe('headerTree helpers', () => {
  it('deep-clones headers including children without sharing references', () => {
    const original = {
      text: 'G',
      value: 'g',
      children: [{ text: 'A', value: 'a' }],
    };
    const cloned = cloneHeader(original);
    expect(cloned).not.toBe(original);
    expect(cloned.children).not.toBe(original.children);
    expect(cloned.children[0]).not.toBe(original.children[0]);
    cloned.children[0].text = 'changed';
    expect(original.children[0].text).toBe('A');
  });

  it('drops hidden leaves and omits groups whose children are all hidden', () => {
    const headers = [
      { text: 'A', value: 'a' },
      { text: 'B', value: 'b', hidden: true },
      {
        text: 'G',
        value: 'g',
        children: [
          { text: 'C', value: 'c', hidden: true },
          { text: 'D', value: 'd' },
        ],
      },
      {
        text: 'Empty',
        value: 'empty',
        children: [{ text: 'E', value: 'e', hidden: true }],
      },
    ];
    const visible = filterHiddenHeaders(headers);
    expect(flattenLeaves(visible).map((h) => h.value)).toEqual(['a', 'd']);
  });

  it('warns once and strips mixed fixed children in a group', () => {
    const warn = vi.fn();
    const header = {
      text: 'Member info',
      value: 'member-info',
      children: [
        { text: 'A', value: 'a', fixed: true },
        { text: 'B', value: 'b' },
      ],
    };
    const normalized = normalizeGroupFixed(header, warn);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('mixes fixed and unfixed children');
    expect(visibleLeaves(normalized).every((leaf) => leaf.fixed !== true)).toBe(true);
  });

  it('partitions fully-fixed top-level groups ahead of unfixed columns', () => {
    const headers = [
      { text: 'C', value: 'c' },
      {
        text: 'G',
        value: 'g',
        children: [
          { text: 'A', value: 'a', fixed: true },
          { text: 'B', value: 'b', fixed: true },
        ],
      },
    ];
    const ordered = partitionFixedTopLevel(headers);
    expect(flattenLeaves(ordered).map((h) => h.value)).toEqual(['a', 'b', 'c']);
  });

  it('reports maxDepth 1 for a flat header list', () => {
    expect(maxDepth([
      { text: 'A', value: 'a' },
      { text: 'B', value: 'b' },
    ])).toBe(1);
  });
});

describe('Phase 6 per-column header fields', () => {
  it('applies per-column align on matching th and td', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name' },
          { text: 'Age', value: 'age', align: 'right' },
        ],
        items,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    const ths = wrapper.findAll('thead th');
    const nameTh = ths.find((th) => th.text().includes('Name'));
    const ageTh = ths.find((th) => th.text().includes('Age'));
    expect(nameTh.find('.header').classes()).toContain('direction-left');
    expect(ageTh.find('.header').classes()).toContain('direction-right');

    const tds = wrapper.findAll('tbody tr')[0].findAll('td');
    expect(tds[0].classes()).toContain('direction-left');
    expect(tds[1].classes()).toContain('direction-right');

    wrapper.unmount();
  });

  it('applies className on th and td and merges with header-item-class-name', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name', className: 'my-col' },
          { text: 'Age', value: 'age' },
        ],
        items,
        rowsPerPage: 10,
        headerItemClassName: 'from-table',
        bodyItemClassName: 'body-from-table',
      },
    });
    await nextTick();

    const nameTh = wrapper.findAll('thead th').find((th) => th.text().includes('Name'));
    expect(nameTh.classes()).toContain('my-col');
    expect(nameTh.classes()).toContain('from-table');

    const nameTd = wrapper.findAll('tbody tr')[0].findAll('td')[0];
    expect(nameTd.classes()).toContain('my-col');
    expect(nameTd.classes()).toContain('body-from-table');

    wrapper.unmount();
  });

  it('merges className with a header-item-class-name function', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name', className: 'my-col' },
          { text: 'Age', value: 'age' },
        ],
        items,
        rowsPerPage: 10,
        headerItemClassName: (header) => (header.value === 'name' ? 'fn-class' : ''),
      },
    });
    await nextTick();

    const nameTh = wrapper.findAll('thead th').find((th) => th.text().includes('Name'));
    expect(nameTh.classes()).toContain('my-col');
    expect(nameTh.classes()).toContain('fn-class');

    wrapper.unmount();
  });

  it('omits hidden columns from thead/tbody without changing item data', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name' },
          { text: 'Age', value: 'age', hidden: true },
          { text: 'Team', value: 'team' },
        ],
        items,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    const thTexts = wrapper.findAll('thead th').map((th) => th.text());
    expect(thTexts.some((t) => t.includes('Age'))).toBe(false);
    expect(thTexts.some((t) => t.includes('Name'))).toBe(true);
    expect(thTexts.some((t) => t.includes('Team'))).toBe(true);

    const tds = wrapper.findAll('tbody tr')[0].findAll('td');
    expect(tds).toHaveLength(2);
    expect(tds[0].text()).toBe('Ada');
    expect(tds[1].text()).toBe('A');
    expect(wrapper.props('items')[0]).toHaveProperty('age', 36);

    wrapper.unmount();
  });

  it('does not mutate consumer header objects when sorting', async () => {
    const headers = [
      { text: 'Name', value: 'name', sortable: true },
      { text: 'Age', value: 'age', sortable: true },
    ];
    const wrapper = mount(DataTable, {
      props: {
        headers,
        items,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    const nameTh = wrapper.findAll('thead th').find((th) => th.text().includes('Name'));
    await nameTh.trigger('click');
    await nextTick();

    expect(headers[0]).not.toHaveProperty('sortType');
    expect('sortType' in headers[1]).toBe(false);

    wrapper.unmount();
  });
});

describe('Phase 6 grouped headers', () => {
  it('renders two thead rows with group colspan and leaf body columns', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: groupedHeaders,
        items,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    const headerRows = wrapper.findAll('thead tr');
    expect(headerRows).toHaveLength(2);

    const row0 = headerRows[0].findAll('th');
    const nameTh = row0.find((th) => th.text().includes('Name'));
    const groupTh = row0.find((th) => th.text().includes('Member info'));
    expect(nameTh.attributes('rowspan')).toBe('2');
    expect(groupTh.attributes('colspan')).toBe('2');

    const row1 = headerRows[1].findAll('th');
    expect(row1.map((th) => th.text())).toEqual(['Team', 'Number']);

    const tds = wrapper.findAll('tbody tr')[0].findAll('td');
    expect(tds).toHaveLength(3);

    wrapper.unmount();
  });

  it('sorts from a grouped leaf header without disabling sibling sort', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: groupedHeaders,
        items,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    const numberTh = wrapper.findAll('thead th').find((th) => th.text().includes('Number'));
    const nameTh = wrapper.findAll('thead th').find((th) => th.text().includes('Name'));
    expect(numberTh.classes()).toContain('sortable');
    expect(nameTh.classes()).toContain('sortable');
    expect(numberTh.attributes('aria-sort')).toBe('none');

    await numberTh.trigger('click');
    await nextTick();
    expect(numberTh.attributes('aria-sort')).toBe('ascending');
    expect(nameTh.attributes('aria-sort')).toBe('none');

    wrapper.unmount();
  });

  it('reduces group colspan when a child leaf is hidden', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name', sortable: true },
          {
            text: 'Member info',
            value: 'member-info',
            children: [
              { text: 'Team', value: 'team', hidden: true },
              { text: 'Number', value: 'number', sortable: true },
            ],
          },
        ],
        items,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    const groupTh = wrapper.findAll('thead th').find((th) => th.text().includes('Member info'));
    expect(groupTh.attributes('colspan')).toBe('1');
    expect(wrapper.findAll('thead th').some((th) => th.text() === 'Team')).toBe(false);
    expect(wrapper.findAll('tbody tr')[0].findAll('td')).toHaveLength(2);

    wrapper.unmount();
  });

  it('warns and treats mixed-fixed groups as unfixed', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          {
            text: 'Member info',
            value: 'member-info',
            children: [
              { text: 'Team', value: 'team', fixed: true, width: 100 },
              { text: 'Number', value: 'number', width: 80 },
            ],
          },
          { text: 'Name', value: 'name', width: 120 },
        ],
        items,
        rowsPerPage: 10,
        tableHeight: 240,
      },
    });
    await nextTick();
    await nextTick();

    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls.some((args) => String(args[0]).includes('mixes fixed and unfixed children'))).toBe(true);

    wrapper.findAll('thead th').forEach((th) => {
      expect(th.classes()).not.toContain('fixed-column');
    });
    wrapper.findAll('tbody td').forEach((td) => {
      expect(td.classes()).not.toContain('fixed-column');
    });

    wrapper.unmount();
    warnSpy.mockRestore();
  });

  it('pins a fully-fixed group parent to the first leaf sticky left', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          {
            text: 'Member info',
            value: 'member-info',
            children: [
              { text: 'Team', value: 'team', fixed: true, width: 100 },
              { text: 'Number', value: 'number', fixed: true, width: 80 },
            ],
          },
          { text: 'Name', value: 'name', width: 200 },
        ],
        items,
        rowsPerPage: 10,
        tableHeight: 240,
      },
    });
    await nextTick();
    await nextTick();

    const groupTh = wrapper.findAll('thead th').find((th) => th.text().includes('Member info'));
    expect(groupTh.classes()).toContain('fixed-column');
    expect(groupTh.attributes('style')).toMatch(/position:\s*sticky/);
    expect(parseStylePx(groupTh.attributes('style'), 'left')).toBe(0);

    const teamTh = wrapper.findAll('thead th').find((th) => th.text().includes('Team'));
    const numberTh = wrapper.findAll('thead th').find((th) => th.text().includes('Number'));
    expect(teamTh.classes()).toContain('fixed-column');
    expect(numberTh.classes()).toContain('fixed-column');
    expect(parseStylePx(teamTh.attributes('style'), 'left')).toBe(0);
    expect(parseStylePx(numberTh.attributes('style'), 'left')).toBe(120);

    wrapper.unmount();
  });

  it('keeps single-row tables at the same th count and order', async () => {
    const wrapper = mount(DataTable, {
      props: {
        headers: [
          { text: 'Name', value: 'name' },
          { text: 'Age', value: 'age' },
        ],
        items,
        rowsPerPage: 10,
      },
    });
    await nextTick();

    expect(wrapper.findAll('thead tr')).toHaveLength(1);
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Name', 'Age']);
    expect(wrapper.findAll('tbody tr')[0].findAll('td')).toHaveLength(2);

    wrapper.unmount();
  });
});

describe('Phase 6 sticky leaf measurement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('readPaintedColumnWidths ignores non-leaf group ths', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <table>
        <colgroup>
          <col /><col /><col />
        </colgroup>
        <thead class="vue3-easy-data-table__header">
          <tr>
            <th data-leaf-column="true">Name</th>
            <th>Member info</th>
          </tr>
          <tr>
            <th data-leaf-column="true">Team</th>
            <th data-leaf-column="true">Number</th>
          </tr>
        </thead>
      </table>
    `;
    const leafs = root.querySelectorAll('th[data-leaf-column]');
    const leafWidths = [40, 50, 60];
    leafs.forEach((el, i) => {
      Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => leafWidths[i] });
    });
    const groupTh = Array.from(root.querySelectorAll('th')).find((th) => th.textContent === 'Member info');
    Object.defineProperty(groupTh, 'offsetWidth', { configurable: true, get: () => 999 });

    expect(readPaintedColumnWidths(root)).toEqual([40, 50, 60]);
    expect(readPaintedColumnWidths(root)).toHaveLength(3);
    expect(root.querySelectorAll('thead th')).toHaveLength(4);
  });
});
