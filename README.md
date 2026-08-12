<p align="center">
<img src="logo.png"  width="400"/ />
</p>

## Introduction
**vue-easy-data-table** is an actively maintained fork/successor of [vue3-easy-data-table](https://github.com/HC200ok/vue3-easy-data-table) — a customizable and easy-to-use data table component for Vue.js 3.x.

See [MIGRATION.md](./MIGRATION.md) for package rename notes. The public component API (props/slots/emits) remains compatible; Phase 2 adds optional `item-key`, Phase 3 adds opt-in tbody `virtual` / `virtual-row-height`, Phase 4 improves server-side page sync / `server-select-all`, and Phase 5 adds accessibility attributes and keyboard-friendly controls without breaking class hooks (see [docs/BENCHMARKS.md](./docs/BENCHMARKS.md)).

## For AI agents

Start at [AGENTS.md](./AGENTS.md) (install, critical rules, pitfalls). Full surface: [docs/API.md](./docs/API.md). Copy-paste patterns: [docs/RECIPES.md](./docs/RECIPES.md).

## Website
https://hc200ok.github.io/vue3-easy-data-table-doc/ (upstream docs; still applicable)

<img src="./images/demo.png"  />

## Features
1. [Item slot](https://hc200ok.github.io/vue3-easy-data-table-doc/features/item-slot.html)
2. [Buttons pagination](https://hc200ok.github.io/vue3-easy-data-table-doc/features/buttons-pagination.html)
3. [Multiple selecting](https://hc200ok.github.io/vue3-easy-data-table-doc/features/multiple-selecting.html)
4. [Pagination slot](https://hc200ok.github.io/vue3-easy-data-table-doc/features/pagination-slot.html)
5. [Single field sorting](https://hc200ok.github.io/vue3-easy-data-table-doc/features/single-field-sorting.html)
6. [Searching](https://hc200ok.github.io/vue3-easy-data-table-doc/features/searching.html)
7. [Server side paginate and sort](https://hc200ok.github.io/vue3-easy-data-table-doc/features/server-side-paginate-and-sort.html) — fork improvements (page sync, custom `serverOptions` fields, `server-select-all`) in [MIGRATION.md](./MIGRATION.md)
8. [Loading slot](https://hc200ok.github.io/vue3-easy-data-table-doc/features/loading-slot.html)
9. [Footer customization](https://hc200ok.github.io/vue3-easy-data-table-doc/features/footer-customization.html)
10. [Filtering](https://hc200ok.github.io/vue3-easy-data-table-doc/features/filtering.html) (new feature since version `1.2.3`)
11. [Click row](https://hc200ok.github.io/vue3-easy-data-table-doc/features/click-row.html) (new feature since version `1.2.4`)
12. [Column width](https://hc200ok.github.io/vue3-easy-data-table-doc/features/column-width.html) (new feature since version `1.2.10`)
13. [Fixed columns](https://hc200ok.github.io/vue3-easy-data-table-doc/features/fixed-column.html) (new feature since version `1.2.10`)
14. [Header slot](https://hc200ok.github.io/vue3-easy-data-table-doc/features/header-slot.html) (new feature since version `1.2.25`)
15. [Expand slot](https://hc200ok.github.io/vue3-easy-data-table-doc/features/expand-slot.html) (new feature since version `1.3.2`)
16. [Style customization](https://hc200ok.github.io/vue3-easy-data-table-doc/features/style-customization.html) (new feature since version `1.3.11`)
17. [Border cell](https://hc200ok.github.io/vue3-easy-data-table-doc/features/border-cell.html) (new feature since version `1.3.11`)
18. [Class name customization](https://hc200ok.github.io/vue3-easy-data-table-doc/features/class-name-customization.html) (new feature since version `1.3.11`)
19. **Virtual rows** (opt-in `virtual` + `virtual-row-height`, since `1.6.0-alpha.4`) — see [MIGRATION.md](./MIGRATION.md)
20. **Accessibility** (sortable `aria-sort` + keyboard, labeled checkboxes/pagination/expand, since `1.6.0-alpha.6`) — see [MIGRATION.md](./MIGRATION.md)

## Getting started
### 1. ES module
#### Install
```js
npm install vue-easy-data-table
// or
yarn add vue-easy-data-table
```

Requires Vue `^3.4.0 || ^3.5.0` as a peer dependency.

#### Register
```js
import Vue3EasyDataTable from 'vue-easy-data-table';
import 'vue-easy-data-table/dist/style.css';

const app = createApp(App);
app.component('EasyDataTable', Vue3EasyDataTable);
```

#### Use
```js
<template>
  <EasyDataTable
    :headers="headers"
    :items="items"
  />
</template>

<script lang="ts">
import type { Header, Item } from "vue-easy-data-table";

export default defineComponent({
  setup() {
    const headers: Header[] = [
      { text: "Name", value: "name" },
      { text: "Height (cm)", value: "height", sortable: true },
      { text: "Weight (kg)", value: "weight", sortable: true },
      { text: "Age", value: "age", sortable: true }
    ];

    const items: Item[] = [
      { "name": "Curry", "height": 178, "weight": 77, "age": 20 },
      { "name": "James", "height": 180, "weight": 75, "age": 21 },
      { "name": "Jordan", "height": 181, "weight": 73, "age": 22 }
    ];

    return {
      headers,
      items
    };
  },
});
</script>
```

### 2. CDN:
```html
<link href="https://unpkg.com/vue-easy-data-table/dist/style.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.global.js"></script>
<script src="https://unpkg.com/vue-easy-data-table"></script>

<div id="app">
  <easy-data-table
    :headers="headers"
    :items="items"
  />
</div>

<script>
  const App = {
    components: {
      EasyDataTable: window['vue3-easy-data-table'].default, // or .Vue3EasyDataTable
    },
    data () {
      return {
        headers:[
          { text: "Name", value: "name" },
          { text: "Height (cm)", value: "height", sortable: true },
          { text: "Weight (kg)", value: "weight", sortable: true },
          { text: "Age", value: "age", sortable: true }
        ],
        items: [
          { "name": "Curry", "height": 178, "weight": 77, "age": 20 },
          { "name": "James", "height": 180, "weight": 75, "age": 21 },
          { "name": "Jordan", "height": 181, "weight": 73, "age": 22 }
        ],
      }
    },
  };
  Vue.createApp(App).mount('#app');
</script>
```

## Todo
1. Refactory.
3. Make table header customizable 🎛️.
4. ~~Vitual table rows.~~ (opt-in since `1.6.0-alpha.4`)
5. Mobile responsive.

## Contribution
Shout out to the people who made new feature requests and reported issues to make this component better.
