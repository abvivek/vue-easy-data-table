/**
 * @vitest-environment happy-dom
 *
 * CI bench sanity check — MUST stay fast and non-flaky.
 * Asserts the harness executes (mount + tiny pipeline) and exits 0.
 * No wall-clock thresholds. Full benches: `npm run bench` → docs/BENCHMARKS.md
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import { compareValues, getItemValue, buildIdentitySet } from '../src/utils';

function makeItems(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `name-${i + 1}`,
    score: (n - i) % 97,
  }));
}

const headers = [
  { text: 'ID', value: 'id' },
  { text: 'NAME', value: 'name' },
  { text: 'SCORE', value: 'score', sortable: true },
];

describe('CI bench smoke', () => {
  it('mounts default + virtual paths and runs a tiny sort/identity pipeline', async () => {
    const items = makeItems(300);

    const defaultWrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemKey: 'id',
        rowsPerPage: 25,
      },
    });
    await nextTick();
    expect(defaultWrapper.find('.vue3-easy-data-table').exists()).toBe(true);
    defaultWrapper.unmount();

    const virtualWrapper = mount(DataTable, {
      props: {
        items,
        headers,
        itemKey: 'id',
        rowsPerPage: 300,
        virtual: true,
        virtualRowHeight: 36,
        tableHeight: 200,
      },
    });
    await nextTick();
    expect(virtualWrapper.find('.vue3-easy-data-table__body').exists()).toBe(true);
    const dataRows = virtualWrapper.findAll('tbody tr').filter(
      (tr) => !tr.classes().includes('vue3-easy-data-table__virtual-spacer'),
    );
    expect(dataRows.length).toBeGreaterThan(0);
    expect(dataRows.length).toBeLessThan(300);
    virtualWrapper.unmount();

    const sorted = [...items].sort((a, b) => compareValues(
      getItemValue('score', a),
      getItemValue('score', b),
    ));
    expect(sorted).toHaveLength(300);
    expect(buildIdentitySet(items, 'id').size).toBe(300);
  });
});
