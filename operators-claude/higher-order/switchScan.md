# switchScan

## Brief Description
`switchScan` is like `scan` combined with `switchMap`: for each source emission it calls an accumulator function that returns an Observable, but unlike `mergeScan` it cancels any still-active previous inner Observable before subscribing to the new one. The last emitted value from each inner Observable becomes the accumulated state passed to the next accumulator invocation. It is well-suited for building state that depends on async operations when only the result of the latest operation matters — for example, type-ahead search state where the user's latest query supersedes all earlier ones.

## Category
higher-order

## Import
```typescript
import { switchScan } from 'rxjs';
```

## Signature
```typescript
switchScan<T, R>(
  accumulator: (acc: R, value: T, index: number) => ObservableInput<R>,
  seed: R
): OperatorFunction<T, R>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `accumulator` | `(acc: R, value: T, index: number) => ObservableInput<R>` | A function that receives the latest accumulated value, the current source value, and its index, and returns an `ObservableInput`. The previous inner Observable is cancelled when a new source value arrives. |
| `seed` | `R` | The initial accumulated value supplied to the first call of `accumulator`. |

## Return Type
An `Observable<R>` that emits each value produced by the currently active inner Observable. When a new source emission arrives, the old inner subscription is cancelled and only the new one's emissions are forwarded.

## Marble Diagram
```
Source:          a-----------b-----c-----------|
                 switchScan((acc, x) => inner$, seed)

inner(a):        r1--r1--r1--r1...
inner(b):                    r2--r2...
inner(c):                          r3--r3--r3--|
                             ^ a's inner cancelled
                                   ^ b's inner cancelled
Output:          r1--r1--r1--r2--r2-r3--r3--r3--|
```

## Examples

### Example 1: Incremental Search with Accumulated History
```typescript
import { fromEvent, map, debounceTime, switchScan } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const searchInput = document.getElementById('search') as HTMLInputElement;

interface SearchState {
  query: string;
  results: string[];
  history: string[];
}

const initialState: SearchState = { query: '', results: [], history: [] };

fromEvent(searchInput, 'input').pipe(
  debounceTime(300),
  map((e) => (e.target as HTMLInputElement).value),
  switchScan(
    (acc, query) =>
      ajax.getJSON<string[]>(`/api/search?q=${encodeURIComponent(query)}`).pipe(
        map((results) => ({
          query,
          results,
          history: [...acc.history, query].slice(-5) // keep last 5 queries
        }))
      ),
    initialState
  )
).subscribe(({ query, results, history }) => {
  console.log(`Query: "${query}", Results: ${results.length}, History:`, history);
});
```

### Example 2: Auto-Saving Form State (Cancel Stale Saves)
```typescript
import { fromEvent, map, debounceTime, switchScan, of, delay } from 'rxjs';

const form = document.getElementById('my-form') as HTMLFormElement;

interface SaveState {
  lastSaved: string | null;
  saving: boolean;
  version: number;
}

const initialState: SaveState = { lastSaved: null, saving: false, version: 0 };

fromEvent(form, 'input').pipe(
  debounceTime(1000),
  map(() => new FormData(form)),
  switchScan(
    (acc, formData) => {
      const version = acc.version + 1;
      // If user keeps typing, this Observable is cancelled before completing
      return of({ lastSaved: null, saving: true, version }).pipe(
        // Simulate save
        delay(2000),
        map(() => ({
          lastSaved: new Date().toISOString(),
          saving: false,
          version
        }))
      );
    },
    initialState
  )
).subscribe((state) => {
  console.log(
    state.saving
      ? `Saving v${state.version}...`
      : `Saved v${state.version} at ${state.lastSaved}`
  );
});
```

### Example 3: Paginated Data with "Load More" that Resets on Filter Change
```typescript
import { Subject, merge, switchScan, of, delay, map } from 'rxjs';

interface PaginationState {
  filter: string;
  page: number;
  items: string[];
}

const filterChange$ = new Subject<string>();
const loadMore$ = new Subject<void>();

const fetchItems = (filter: string, page: number) =>
  of(Array.from({ length: 10 }, (_, i) => `${filter}-item-${page * 10 + i}`))
    .pipe(delay(500));

const initialState: PaginationState = { filter: 'all', page: 0, items: [] };

merge(
  filterChange$.pipe(map((filter) => ({ type: 'filter' as const, filter }))),
  loadMore$.pipe(map(() => ({ type: 'loadMore' as const, filter: '' })))
).pipe(
  switchScan((acc, action) => {
    if (action.type === 'filter') {
      // Reset on filter change — cancels any in-flight load
      return fetchItems(action.filter, 0).pipe(
        map((items) => ({ filter: action.filter, page: 0, items }))
      );
    }
    const nextPage = acc.page + 1;
    return fetchItems(acc.filter, nextPage).pipe(
      map((newItems) => ({
        ...acc,
        page: nextPage,
        items: [...acc.items, ...newItems]
      }))
    );
  }, initialState)
).subscribe(({ filter, page, items }) =>
  console.log(`Filter: ${filter}, Page: ${page}, Total items: ${items.length}`)
);

filterChange$.next('active');
setTimeout(() => loadMore$.next(), 1000);
setTimeout(() => filterChange$.next('archived'), 1800); // Cancels loadMore if in flight
```

## Common Pitfalls

### Pitfall 1: Accumulated State May Be Based on a Cancelled Inner Observable's Last Emission
When an inner Observable is cancelled mid-flight, the last value it emitted before cancellation becomes the seed for the next accumulation. If no value was emitted yet, the previous accumulated value is used unchanged.

```typescript
import { Subject, switchScan, of, delay } from 'rxjs';

const source$ = new Subject<number>();

source$.pipe(
  switchScan(
    (acc, val) => of(acc + val).pipe(delay(1000)),
    0
  )
).subscribe((v) => console.log('Acc:', v));

source$.next(10); // inner: of(10) delayed 1s
setTimeout(() => source$.next(5), 300); // cancels first inner before it emits
// Because the first inner was cancelled before emitting, acc stays 0
// Output after ~1.3s: Acc: 5  (0 + 5, not 10 + 5)
console.log('Note: first addition was lost due to switch cancellation');
```

### Pitfall 2: Unlike mergeScan, There Is No `concurrent` Option
`switchScan` always cancels the previous inner Observable — there is no option to keep multiple active. If you need concurrent reductions, use `mergeScan` with an appropriate `concurrent` value.

```typescript
import { Subject, switchScan, mergeScan, of, delay } from 'rxjs';

const items$ = new Subject<number>();

// ❌ switchScan — each new item cancels the previous async reduction
items$.pipe(
  switchScan((acc, val) => of(acc + val).pipe(delay(500)), 0)
).subscribe(console.log);

// ✅ mergeScan with concurrent:1 for serialized, non-cancelling reductions
items$.pipe(
  mergeScan((acc, val) => of(acc + val).pipe(delay(500)), 0, 1)
).subscribe(console.log);
```

## Related Operators
- **`mergeScan`**: Like `switchScan` but merges inner Observables concurrently rather than cancelling the previous one. Supports a `concurrent` parameter.
- **`scan`**: Synchronous accumulation — no inner Observables involved.
- **`switchMap`**: Like `switchScan` but without an accumulator; each inner Observable is independent.
- **`reduce`**: Synchronous accumulation that only emits the final value on source completion.
