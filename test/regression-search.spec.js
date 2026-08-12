/**
 * @vitest-environment happy-dom
 *
 * Regression: client-side search — single field, multiple fields, empty result.
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import DataTable from '../src/components/DataTable.vue';

const headers = [
  { text: 'NAME', value: 'name' },
  { text: 'CITY', value: 'city' },
  { text: 'TAG', value: 'tag' },
];

const items = [
  { name: 'Alice', city: 'Austin', tag: 'alpha' },
  { name: 'Bob', city: 'Boston', tag: 'bravo' },
  { name: 'Carol', city: 'Austin', tag: 'charlie' },
  { name: 'Dave', city: 'Denver', tag: 'delta' },
  { name: 'Eve', city: 'Boston', tag: 'echo' },
];

function pageNames(wrapper) {
  return wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').at(0).text());
}

describe('regression search: single field', () => {
  it('search: single field matches only that column', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        searchField: 'city',
        searchValue: 'Austin',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['Alice', 'Carol']);
  });

  it('search: single field is case-insensitive', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        searchField: 'name',
        searchValue: 'bob',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['Bob']);
  });
});

describe('regression search: multiple fields', () => {
  it('search: multiple fields matches any listed column', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        searchField: ['name', 'tag'],
        searchValue: 'echo',
      },
    });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['Eve']);
  });

  it('search: multiple fields finds hits across different columns', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        searchField: ['city', 'tag'],
        searchValue: 'den',
      },
    });
    await nextTick();
    // city Denver + tag delta
    expect(pageNames(wrapper)).toEqual(['Dave']);
  });
});

describe('regression search: empty result', () => {
  it('search: empty result shows empty message and zero body rows', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        searchField: 'name',
        searchValue: 'no-such-person',
        emptyMessage: 'No matching records',
      },
    });
    await nextTick();
    expect(wrapper.findAll('tbody tr')).toHaveLength(0);
    expect(wrapper.find('.vue3-easy-data-table__message').text()).toContain('No matching records');
    expect(wrapper.find('.pagination__items-index').text()).toMatch(/0/);
  });

  it('search: clearing searchValue restores rows', async () => {
    const wrapper = mount(DataTable, {
      props: {
        items,
        headers,
        rowsPerPage: 10,
        searchField: 'name',
        searchValue: 'zzz',
      },
    });
    await nextTick();
    expect(wrapper.findAll('tbody tr')).toHaveLength(0);

    await wrapper.setProps({ searchValue: '' });
    await nextTick();
    expect(pageNames(wrapper)).toEqual(['Alice', 'Bob', 'Carol', 'Dave', 'Eve']);
  });
});
