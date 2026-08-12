# Benchmarks

Optional local harness (`npm run bench`). **Not run in CI** with timing thresholds — timings vary by machine.

CI runs a non-flaky smoke only: `npm run bench:ci` (mount + tiny pipeline, exit 0; no ms gates). Full numbers below are from local `npm run bench`.

Last run: **2026-08-12T09:39:34.532Z**

Environment: `win32 x64 node v22.12.0`

| Operation | Rows | ms |
| --- | ---: | ---: |
| mount 10000 (item-key) | 10,000 | 1045.89 |
| sort 10000 (item-key UI) | 10,000 | 27.92 |
| select-all emit 10000 (item-key) | 10,000 | 20.61 |
| expand-toggle 10000 (item-key) | 10,000 | 51.24 |
| totalItems-sort pipeline 10000 | 10,000 | 32.77 |
| select-all status Set 10000 | 10,000 | 8.8 |
| mount 50000 (item-key) | 50,000 | 3993.35 |
| sort 50000 (item-key UI) | 50,000 | 17.03 |
| select-all emit 50000 (item-key) | 50,000 | 33.56 |
| expand-toggle 50000 (item-key) | 50,000 | 26.33 |
| totalItems-sort pipeline 50000 | 50,000 | 129.57 |
| select-all status Set 50000 | 50,000 | 19.45 |
| select-all status stringify 2000 (unkeyed) | 2,000 | 3778.33 |
| select-all status Set 2000 (keyed) | 2,000 | 0.63 |
| mount+select-all emit 2000 (unkeyed) | 2,000 | 219.34 |

## Notes

- Prefer **`item-key`** for large datasets: select/expand identity and select-all status use key/`Set` lookups instead of `JSON.stringify`.
- Omitting `item-key` preserves legacy stringify / index behavior (drop-in compatible). The 2k unkeyed status row shows O(n²) stringify cost vs keyed `Set`.
- `select-all emit` measures the click → `update:itemsSelected` path without re-binding a 10k/50k reactive selection into the wrapper (avoids Vue deep-reactive thrash in the harness).
- Mount includes first render of the first page (`rows-per-page` 25) plus selection + expand wiring.
- **Phase 3 virtualization**: set `virtual` + `virtual-row-height` (and preferably `item-key` + `table-height`) to window large pages. Virtual mounts should render far fewer DOM rows than `rows-per-page` when the page is large; see `test/phase3-virtualization.spec.js`. Table above remains the Phase 2 non-virtual baseline (default `rows-per-page` 25).

