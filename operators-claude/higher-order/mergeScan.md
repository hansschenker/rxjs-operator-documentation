# mergeScan

## Brief Description
`mergeScan` is like `scan` but the accumulator function returns an Observable (or other `ObservableInput`) instead of a plain value, and those inner Observables are merged concurrently. The result of each inner Observable becomes the accumulated state passed to the next call of the accumulator. It is particularly useful for building state machines, optimistic UI updates, and any scenario where each reduction step involves async work.

## Category
higher-order

## Import
```typescript
import { mergeScan } from 'rxjs';
```

## Signature
```typescript
mergeScan<T, R>(
  accumulator: (acc: R, value: T, index: number) => ObservableInput<R>,
  seed: R,
  concurrent?: number
): OperatorFunction<T, R>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `accumulator` | `(acc: R, value: T, index: number) => ObservableInput<R>` | A function called for each source value, receiving the latest accumulated value, the current source value, and its index. Must return an `ObservableInput` whose emitted values become the next accumulated state. |
| `seed` | `R` | The initial accumulator value passed to the first call of `accumulator`. |
| `concurrent` | `number` | Optional. Maximum number of inner Observables active at once. Defaults to `Infinity`. |

## Return Type
An `Observable<R>` that emits each intermediate accumulated value produced by the inner Observables — analogous to `scan` but async.

## Marble Diagram
```
Source:       a-----------b-----------c-----------|
              mergeScan((acc, x) => acc$, seed)

inner(a):     r1--r1--|
                       inner(b): r2--r2--|
                                          inner(c): r3--r3--|
Output:       r1--r1------r2--r2----------r3--r3---|
              (each inner emission becomes both output and new acc)
```

## Examples

### Example 1: Async Running Total
```typescript
import { of, mergeScan, delay } from 'rxjs';

const additions$ = of(1, 2, 3, 4, 5);

// Each addition is simulated as an async operation
additions$.pipe(
  mergeScan(
    (acc, value) => of(acc + value).pipe(delay(500)),
    0
  )
).subscribe({
  next: (total) => console.log('Running total:', total),
  complete: () => console.log('Done')
});
// Logs: 1, 3, 6, 10, 15 (each ~500ms apart, but inner Observables may overlap)
```

### Example 2: Optimistic Cart State with Server Sync
```typescript
import { Subject, mergeScan, of, delay, catchError } from 'rxjs';

interface CartState {
  items: string[];
  synced: boolean;
}

const initialState: CartState = { items: [], synced: true };
const addItem$ = new Subject<string>();

const syncWithServer = (state: CartState) =>
  of({ ...state, synced: true }).pipe(
    delay(800), // simulate server round-trip
    catchError(() => of({ ...state, synced: false }))
  );

addItem$.pipe(
  mergeScan(
    (acc, item) => {
      const optimistic = { items: [...acc.items, item], synced: false };
      // Emit optimistic state immediately, then sync
      return of(optimistic, null).pipe(
        mergeMap((s) => s ? of(s) : syncWithServer(optimistic))
      );
    },
    initialState
  )
).subscribe((state) => console.log('Cart:', state));

addItem$.next('apple');
addItem$.next('banana');
```

### Example 3: Recursive Loading with Accumulated Results
```typescript
import { of, mergeScan, delay, expand, EMPTY } from 'rxjs';

interface Page {
  items: number[];
  nextPage: number | null;
}

const fetchPage = (page: number): Observable<Page> =>
  of({
    items: [page * 10, page * 10 + 1, page * 10 + 2],
    nextPage: page < 3 ? page + 1 : null
  }).pipe(delay(300));

import { Observable, from } from 'rxjs';

// Use mergeScan to accumulate all pages into one array
from([1]).pipe(
  expand((page) => page !== null ? fetchPage(page as number).pipe(
    // simplified: just emit next page numbers
    mergeMap((p) => p.nextPage !== null ? of(p.nextPage) : EMPTY)
  ) : EMPTY),
  mergeScan(
    (acc, page) => fetchPage(page as number).pipe(
      map((p) => [...acc, ...p.items])
    ),
    [] as number[]
  )
).subscribe((allItems) => console.log('Accumulated items:', allItems));
```

## Common Pitfalls

### Pitfall 1: Concurrent Inner Observables Causing Race Conditions on State
By default `concurrent` is `Infinity`, so multiple inner Observables can update the accumulator simultaneously. If ordering matters, set `concurrent: 1` to serialize.

```typescript
import { Subject, mergeScan, of, delay } from 'rxjs';

const actions$ = new Subject<number>();

// ❌ Concurrent updates may apply out of order if inner Observables have
// variable latency, leading to incorrect accumulated state
actions$.pipe(
  mergeScan(
    (acc, val) => of(acc + val).pipe(delay(Math.random() * 1000)),
    0
  )
).subscribe(console.log);

// ✅ Serialize with concurrent: 1 when state integrity requires ordering
actions$.pipe(
  mergeScan(
    (acc, val) => of(acc + val).pipe(delay(Math.random() * 1000)),
    0,
    1 // process one at a time
  )
).subscribe(console.log);
```

### Pitfall 2: Infinite Inner Observables Blocking Future Reductions
If an inner Observable never completes and `concurrent` is `1`, subsequent source emissions are queued forever. Always ensure inner Observables complete (or raise the concurrency limit).

```typescript
import { Subject, mergeScan, interval, take, of } from 'rxjs';

const trigger$ = new Subject<void>();

// ❌ interval() never completes; with concurrent:1 the second emission is stuck
trigger$.pipe(
  mergeScan(
    (acc) => interval(1000), // never completes
    0,
    1
  )
).subscribe(console.log);

// ✅ Bound the inner Observable
trigger$.pipe(
  mergeScan(
    (acc) => interval(1000).pipe(take(3), map((v) => acc + v)),
    0,
    1
  )
).subscribe(console.log);
```

## Related Operators
- **`scan`**: Synchronous version — the accumulator returns a plain value, not an Observable.
- **`reduce`**: Like `scan` but only emits the final accumulated value when the source completes.
- **`mergeMap`**: Projects each value to an inner Observable and merges, but without accumulation.
- **`switchScan`**: Like `mergeScan` but cancels the previous inner Observable on each new source emission.
- **`exhaustMap`**: Ignores new source values while an inner Observable is active.
