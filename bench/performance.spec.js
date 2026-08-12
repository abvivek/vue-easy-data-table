/**
 * @vitest-environment happy-dom
 *
 * Optional performance harness — NOT included in default `npm test`
 * (separate vitest.bench.config.ts). Run with: `npm run bench`
 */
import { describe, it, expect } from 'vitest';
import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';
import {
  compareValues, getItemValue, buildIdentitySet, getItemIdentity, itemsEqual,
} from '../src/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));

function makeItems(n) {
  const items = new Array(n);
  for (let i = 0; i < n; i += 1) {
    items[i] = {
      id: i + 1,
      name: `name-${i + 1}`,
      score: (n - i) % 997,
      group: i % 7,
    };
  }
  return items;
}

const headers = [
  { text: 'ID', value: 'id' },
  { text: 'NAME', value: 'name' },
  { text: 'SCORE', value: 'score', sortable: true },
  { text: 'GROUP', value: 'group', sortable: true },
];

async function time(label, fn) {
  const start = performance.now();
  await fn();
  const ms = Math.round((performance.now() - start) * 100) / 100;
  return { label, ms };
}

function mountTable(props) {
  return mount(DataTable, {
    props,
    slots: {
      expand: '<div class="expand-body">{{ id }}</div>',
    },
  });
}

function sortPipeline(items, sortBy, sortDesc) {
  return [...items].sort((a, b) => {
    const compared = compareValues(getItemValue(sortBy, a), getItemValue(sortBy, b));
    if (compared < 0) return sortDesc ? 1 : -1;
    if (compared > 0) return sortDesc ? -1 : 1;
    return 0;
  });
}

function selectAllStatusKeyed(items, selected) {
  const selectedKeys = buildIdentitySet(selected, 'id');
  let count = 0;
  for (let i = 0; i < items.length; i += 1) {
    const id = getItemIdentity(items[i], 'id');
    if (id !== undefined && selectedKeys.has(id)) count += 1;
  }
  return count === items.length ? 'allSelected' : 'partSelected';
}

function selectAllStatusUnkeyed(items, selected) {
  let count = 0;
  for (let i = 0; i < items.length; i += 1) {
    if (selected.some((s) => itemsEqual(s, items[i]))) count += 1;
  }
  return count === items.length ? 'allSelected' : 'partSelected';
}

async function runSuite(size) {
  const items = makeItems(size);
  const results = [];

  let wrapper;
  results.push(await time(`mount ${size} (item-key)`, async () => {
    wrapper = mountTable({
      items,
      headers,
      itemsSelected: [],
      itemKey: 'id',
      rowsPerPage: 25,
    });
    await nextTick();
  }));

  results.push(await time(`sort ${size} (item-key UI)`, async () => {
    await wrapper.setProps({ sortBy: 'score', sortType: 'desc' });
    await nextTick();
  }));

  results.push(await time(`select-all emit ${size} (item-key)`, async () => {
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    await nextTick();
  }));
  const selected = wrapper.emitted('update:itemsSelected')?.at(-1)?.[0];
  expect(selected?.length).toBe(size);

  results.push(await time(`expand-toggle ${size} (item-key)`, async () => {
    const cells = wrapper.findAll('td.can-expand');
    expect(cells.length).toBeGreaterThan(0);
    await cells.at(0).trigger('click');
    await nextTick();
    await cells.at(0).trigger('click');
    await nextTick();
  }));

  wrapper.unmount();

  results.push(await time(`totalItems-sort pipeline ${size}`, async () => {
    const sorted = sortPipeline(items, 'score', true);
    expect(sorted[0].score).toBeGreaterThanOrEqual(sorted[sorted.length - 1].score);
  }));

  results.push(await time(`select-all status Set ${size}`, async () => {
    expect(selectAllStatusKeyed(items, items)).toBe('allSelected');
  }));

  return results;
}

async function runUnkeyedBaseline() {
  const size = 2000;
  const items = makeItems(size);
  const results = [];

  results.push(await time(`select-all status stringify ${size} (unkeyed)`, async () => {
    expect(selectAllStatusUnkeyed(items, items)).toBe('allSelected');
  }));

  results.push(await time(`select-all status Set ${size} (keyed)`, async () => {
    expect(selectAllStatusKeyed(items, items)).toBe('allSelected');
  }));

  let wrapper;
  results.push(await time(`mount+select-all emit ${size} (unkeyed)`, async () => {
    wrapper = mountTable({
      items,
      headers,
      itemsSelected: [],
      rowsPerPage: 25,
    });
    await nextTick();
    await wrapper.find('.vue3-easy-data-table__header .easy-checkbox').trigger('click');
    await nextTick();
  }));
  expect(wrapper.emitted('update:itemsSelected')?.at(-1)?.[0]?.length).toBe(size);
  wrapper.unmount();

  return results;
}

function writeBenchmarksDoc(all) {
  const outDir = path.join(dirname, '..', 'docs');
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString();
  const platform = `${process.platform} ${process.arch} node ${process.version}`;
  const lines = [
    '# Benchmarks',
    '',
    'Optional local harness (`npm run bench`). **Not run in CI** and not required to pass — timings vary by machine.',
    '',
    `Last run: **${stamp}**`,
    '',
    `Environment: \`${platform}\``,
    '',
    '| Operation | Rows | ms |',
    '| --- | ---: | ---: |',
    ...all.map((r) => {
      const match = r.label.match(/(\d+)/);
      const rows = match ? match[1] : '';
      return `| ${r.label} | ${Number(rows).toLocaleString()} | ${r.ms} |`;
    }),
    '',
    '## Notes',
    '',
    '- Prefer **`item-key`** for large datasets: select/expand identity and select-all status use key/`Set` lookups instead of `JSON.stringify`.',
    '- Omitting `item-key` preserves legacy stringify / index behavior (drop-in compatible). The 2k unkeyed status row shows O(n²) stringify cost vs keyed `Set`.',
    '- `select-all emit` measures the click → `update:itemsSelected` path without re-binding a 10k/50k reactive selection into the wrapper (avoids Vue deep-reactive thrash in the harness).',
    '- Mount includes first render of the first page (`rows-per-page` 25) plus selection + expand wiring.',
    '- Phase 3 (virtualization) is out of scope here; these numbers are the Phase 2 identity/hot-path baseline.',
    '',
  ];
  writeFileSync(path.join(outDir, 'BENCHMARKS.md'), `${lines.join('\n')}\n`, 'utf8');
}

describe('Phase 2 performance bench', () => {
  it('measures 10k/50k pipelines and writes docs/BENCHMARKS.md', async () => {
    const all = [];
    for (const size of [10_000, 50_000]) {
      console.log(`\n--- ${size.toLocaleString()} rows ---`);
      const rows = await runSuite(size);
      rows.forEach((r) => {
        console.log(`${r.label.padEnd(46)} ${String(r.ms).padStart(10)} ms`);
      });
      all.push(...rows);
    }

    console.log('\n--- unkeyed baseline (2,000 rows) ---');
    const baseline = await runUnkeyedBaseline();
    baseline.forEach((r) => {
      console.log(`${r.label.padEnd(46)} ${String(r.ms).padStart(10)} ms`);
    });
    all.push(...baseline);

    writeBenchmarksDoc(all);
    console.log('\nWrote docs/BENCHMARKS.md');
    expect(all.length).toBeGreaterThan(0);
  }, 300_000);
});
