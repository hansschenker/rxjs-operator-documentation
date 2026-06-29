# concatMap

## Brief Description
`concatMap` projects each source value to an inner Observable and merges the resulting Observables one at a time, waiting for each to complete before subscribing to the next. It preserves order and never interleaves emissions, making it ideal for sequential async operations where ordering and completeness guarantees matter — such as processing a queue of HTTP requests one by one.

## Category
higher-order

## Import
```typescript
import { concatMap } from 'rxjs';
```

## Signature
```typescript
concatMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O
): OperatorFunction<T, ObservedValueOf<O>>

concatMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): OperatorFunction<T, ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | `(value: T, index: number) => ObservableInput<O>` | A function that, given a source value and its zero-based index, returns an Observable (or Promise, array, iterable) to be subscribed to sequentially. |

## Return Type
An `Observable<ObservedValueOf<O>>` that emits values from each projected inner Observable in sequence. Each inner Observable must complete before the next one starts.

## Marble Diagram
```
Source:     a---------b---------c---------|
            concatMap(x => x---x---x|)

a inner:    a---a---a|
                     b inner: b---b---b|
                                        c inner: c---c---c|
Output:     a---a---a-b---b---b-c---c---c|
```

## Examples

### Example 1: Sequential HTTP Requests
```typescript
import { fromEvent, concatMap, of, delay } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const saveButton = document.getElementById('save-btn')!;

// Each click triggers a save request; requests are queued and processed in order
fromEvent(saveButton, 'click').pipe(
  concatMap((_, index) =>
    ajax.post('/api/save', { item: index + 1 })
  )
).subscribe({
  next: (response) => console.log('Saved:', response.response),
  error: (err) => console.error('Save failed:', err)
});
```

### Example 2: Processing a List of Tasks Sequentially
```typescript
import { from, concatMap, of, delay, tap } from 'rxjs';

const tasks = ['download', 'process', 'upload'];

const simulateTask = (name: string) =>
  of(`${name} complete`).pipe(
    delay(1000),
    tap(() => console.log(`Running: ${name}`))
  );

from(tasks).pipe(
  concatMap((task) => simulateTask(task))
).subscribe({
  next: (result) => console.log(result),
  complete: () => console.log('All tasks done')
});
// Logs in order, each one second apart:
// Running: download
// download complete
// Running: process
// process complete
// Running: upload
// upload complete
// All tasks done
```

### Example 3: Expanding a Tree Structure
```typescript
import { of, concatMap, delay } from 'rxjs';

interface Node {
  id: number;
  children: number[];
}

const nodeMap: Record<number, Node> = {
  1: { id: 1, children: [2, 3] },
  2: { id: 2, children: [4] },
  3: { id: 3, children: [] },
  4: { id: 4, children: [] }
};

const fetchNode = (id: number) =>
  of(nodeMap[id]).pipe(delay(200));

// Fetch root and then each child sequentially
of(1).pipe(
  concatMap((rootId) => fetchNode(rootId)),
  concatMap((node) => {
    console.log('Visiting node:', node.id);
    return from(node.children).pipe(
      concatMap((childId) => fetchNode(childId))
    );
  })
).subscribe((node) => console.log('Fetched child node:', node.id));
```

## Common Pitfalls

### Pitfall 1: Back-pressure Build-up from Slow Inner Observables
`concatMap` buffers all source emissions while an inner Observable is active. If the source emits faster than inner Observables complete, the buffer grows unboundedly, which can cause memory issues.

```typescript
import { interval, concatMap, take, delay } from 'rxjs';

// ❌ Source emits every 100ms, inner takes 2000ms — buffer grows fast
interval(100).pipe(
  take(50),
  concatMap(() => someSlowRequest().pipe(delay(2000)))
).subscribe();

// ✅ Use exhaustMap or switchMap if you can afford to drop or cancel
import { exhaustMap } from 'rxjs';
interval(100).pipe(
  take(50),
  exhaustMap(() => someSlowRequest())
).subscribe();
```

### Pitfall 2: Forgetting That Inner Observables Must Complete
If the projected inner Observable never completes, `concatMap` will never subscribe to subsequent projections. The outer source effectively stalls.

```typescript
import { of, concatMap, interval } from 'rxjs';

// ❌ interval never completes — 'b' and 'c' are never processed
of('a', 'b', 'c').pipe(
  concatMap((letter) => {
    if (letter === 'a') return interval(1000); // never completes!
    return of(letter);
  })
).subscribe(console.log);

// ✅ Ensure inner Observables complete, e.g. with take()
import { take } from 'rxjs';
of('a', 'b', 'c').pipe(
  concatMap((letter) => {
    if (letter === 'a') return interval(1000).pipe(take(3));
    return of(letter);
  })
).subscribe(console.log);
```

## Related Operators
- **`mergeMap`**: Like `concatMap` but subscribes to all inner Observables concurrently; does not preserve order.
- **`switchMap`**: Cancels the current inner Observable when a new source value arrives; only the latest projection is active.
- **`exhaustMap`**: Ignores new source values while an inner Observable is active; opposite of `switchMap`.
- **`concatAll`**: Flattens a higher-order Observable sequentially without a projection function.
- **`concatMapTo`**: Deprecated alias that maps every source value to the same static inner Observable.
