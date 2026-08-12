# Benchmarks

Optional local harness (`npm run bench`). **Not run in CI** and not required to pass — timings vary by machine.

Last run: **2026-08-12T08:09:48.782Z**

Environment: `win32 x64 node v22.12.0`

| Operation | Rows | ms |
| --- | ---: | ---: |
| mount 10000 (item-key) | 10,000 | 816.91 |
| sort 10000 (item-key UI) | 10,000 | 17.57 |
| select-all emit 10000 (item-key) | 10,000 | 19.31 |
| expand-toggle 10000 (item-key) | 10,000 | 36.39 |
| totalItems-sort pipeline 10000 | 10,000 | 15.45 |
| select-all status Set 10000 | 10,000 | 7.44 |
| mount 50000 (item-key) | 50,000 | 2628.29 |
| sort 50000 (item-key UI) | 50,000 | 10.55 |
| select-all emit 50000 (item-key) | 50,000 | 25.68 |
| expand-toggle 50000 (item-key) | 50,000 | 31.61 |
| totalItems-sort pipeline 50000 | 50,000 | 65.67 |
| select-all status Set 50000 | 50,000 | 14.99 |
| select-all status stringify 2000 (unkeyed) | 2,000 | 3934.98 |
| select-all status Set 2000 (keyed) | 2,000 | 1.56 |
| mount+select-all emit 2000 (unkeyed) | 2,000 | 250.87 |

## Notes

- Prefer **`item-key`** for large datasets: select/expand identity and select-all status use key/`Set` lookups instead of `JSON.stringify`.
- Omitting `item-key` preserves legacy stringify / index behavior (drop-in compatible). The 2k unkeyed status row shows O(n²) stringify cost vs keyed `Set`.
- `select-all emit` measures the click → `update:itemsSelected` path without re-binding a 10k/50k reactive selection into the wrapper (avoids Vue deep-reactive thrash in the harness).
- Mount includes first render of the first page (`rows-per-page` 25) plus selection + expand wiring.
- Phase 3 (virtualization) is out of scope here; these numbers are the Phase 2 identity/hot-path baseline.

