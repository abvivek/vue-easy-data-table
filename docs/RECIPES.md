# Recipes — vue-easy-data-table

Copy-paste Vue 3 SFC patterns. Component is exported as `Vue3EasyDataTable`; examples register/use it as `EasyDataTable`.

```js
import Vue3EasyDataTable from 'vue-easy-data-table';
import 'vue-easy-data-table/dist/style.css';
// app.component('EasyDataTable', Vue3EasyDataTable)
// or: import { Vue3EasyDataTable as EasyDataTable } from 'vue-easy-data-table'
```

Full prop/slot/emit lists: [API.md](./API.md). Migration: [MIGRATION.md](../MIGRATION.md).

---

## 1. Basic client table

```vue
<template>
  <EasyDataTable
    :headers="headers"
    :items="items"
  />
</template>

<script setup lang="ts">
import type { Header, Item } from 'vue-easy-data-table';

const headers: Header[] = [
  { text: 'Name', value: 'name' },
  { text: 'Age', value: 'age', sortable: true },
];

const items: Item[] = [
  { name: 'Curry', age: 20 },
  { name: 'James', age: 21 },
];
</script>
```

---

## 2. Sorting + search

```vue
<template>
  <input v-model="searchValue" placeholder="Search" />
  <EasyDataTable
    :headers="headers"
    :items="items"
    :search-value="searchValue"
    search-field="name"
    sort-by="age"
    sort-type="desc"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Header, Item } from 'vue-easy-data-table';

const searchValue = ref('');
const headers: Header[] = [
  { text: 'Name', value: 'name', sortable: true },
  { text: 'Age', value: 'age', sortable: true },
];
const items: Item[] = [/* … */];
</script>
```

Client-only: in server mode, put search criteria on `serverOptions` and fetch yourself.

---

## 3. Selection with `item-key`

```vue
<template>
  <EasyDataTable
    :headers="headers"
    :items="items"
    item-key="id"
    v-model:items-selected="itemsSelected"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Header, Item } from 'vue-easy-data-table';

const headers: Header[] = [
  { text: 'Name', value: 'name' },
  { text: 'Age', value: 'age' },
];
const items: Item[] = [
  { id: 1, name: 'Curry', age: 20 },
  { id: 2, name: 'James', age: 21 },
];
// Must be an array (not null) to show checkboxes
const itemsSelected = ref<Item[]>([]);
</script>
```

Omit `item-key` only for legacy stringify identity. Prefer `item-key` whenever rows have a stable id.

---

## 4. Server-side fetch loop

```vue
<template>
  <EasyDataTable
    v-model:server-options="serverOptions"
    :server-items-length="serverItemsLength"
    :loading="loading"
    :headers="headers"
    :items="items"
    item-key="id"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Header, Item, ServerOptions } from 'vue-easy-data-table';

const headers: Header[] = [
  { text: 'Name', value: 'name', sortable: true },
  { text: 'Age', value: 'age', sortable: true },
];

const items = ref<Item[]>([]);
const loading = ref(false);
const serverItemsLength = ref(0);
const serverOptions = ref<ServerOptions>({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'name',
  sortType: 'asc',
  // custom fields are preserved on update:serverOptions
  groupId: 42,
});

async function loadFromServer() {
  loading.value = true;
  try {
    const res = await fetchPage(serverOptions.value); // your API
    items.value = res.rows;
    serverItemsLength.value = res.total;
  } finally {
    loading.value = false;
  }
}

loadFromServer();
watch(serverOptions, () => { loadFromServer(); }, { deep: true });
</script>
```

Optional: `server-select-all="all"` + `@select-all` when header select means the entire server result set (see MIGRATION.md).

---

## 5. Virtualization

```vue
<template>
  <EasyDataTable
    :headers="headers"
    :items="items"
    item-key="id"
    :rows-per-page="500"
    :table-height="480"
    virtual
    :virtual-row-height="36"
    :virtual-overscan="5"
  />
</template>

<script setup lang="ts">
import type { Header, Item } from 'vue-easy-data-table';

const headers: Header[] = [/* … */];
const items: Item[] = [/* large current page or client dataset */];
</script>
```

Requires positive `virtual-row-height`. Do not combine with `#expand` / `#body-prepend` / `#body-append` (auto-disabled). Windows **current page** only.

---

## 6. Expandable rows

```vue
<template>
  <EasyDataTable
    :headers="headers"
    :items="items"
    item-key="id"
    :expandable="(item) => !item.locked"
  >
    <template #expand="item">
      <div>Details for {{ item.name }}</div>
    </template>
  </EasyDataTable>
</template>

<script setup lang="ts">
import type { Header, Item } from 'vue-easy-data-table';

const headers: Header[] = [
  { text: 'Name', value: 'name' },
];
const items: Item[] = [
  { id: 1, name: 'Curry', locked: false },
  { id: 2, name: 'James', locked: true },
];
</script>
```

`#expand` disables virtualization. Use `click-row-to-expand` to toggle on row click.

---

## 7. Custom slots (`item-*`, `header`)

```vue
<template>
  <EasyDataTable :headers="headers" :items="items">
    <template #header-name="header">
      <strong>{{ header.text }}</strong>
    </template>

    <template #item-age="item">
      <span>{{ item.age }} yrs</span>
    </template>

    <!-- fallback for columns without item-{value} -->
    <template #item="{ column, item }">
      <span>{{ item[column] }}</span>
    </template>
  </EasyDataTable>
</template>

<script setup lang="ts">
import type { Header, Item } from 'vue-easy-data-table';

const headers: Header[] = [
  { text: 'Name', value: 'name' },
  { text: 'Age', value: 'age' },
];
const items: Item[] = [/* … */];
</script>
```

Also available: `#header`, `#header-{value}`, `#loading`, `#empty-message`, `#pagination`, `#body`, `#customize-headers`.

---

## 8. Migrating from `vue3-easy-data-table`

One-line package + CSS path change:

```diff
- import Vue3EasyDataTable from 'vue3-easy-data-table';
- import 'vue3-easy-data-table/dist/style.css';
+ import Vue3EasyDataTable from 'vue-easy-data-table';
+ import 'vue-easy-data-table/dist/style.css';
```

```bash
npm uninstall vue3-easy-data-table
npm install vue-easy-data-table
```

Props/slots/emits stay compatible. Opt into fork features (`item-key`, `virtual`, `server-select-all`, …) as needed — see [MIGRATION.md](../MIGRATION.md).
