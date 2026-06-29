# mergeMapTo

## Brief Description
`mergeMapTo` maps every source emission to the **same** inner Observable and merges all active subscriptions concurrently without waiting for any to complete. It is a specialization of `mergeMap` (also known as `flatMap`) where the projection is a fixed Observable. This operator is **deprecated** as of RxJS 7 — use `mergeMap(() => innerObservable)` instead.

> **Deprecated:** `mergeMapTo` is deprecated and will be removed in a future version. Use `mergeMap(() => innerObservable)` to achieve identical behavior.

## Category
higher-order

## Import
```typescript
import { mergeMapTo } from 'rxjs';
```

## Signature
```typescript
mergeMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O,
  concurrent?: number
): OperatorFunction<T, ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `innerObservable` | `ObservableInput<O>` | A fixed Observable (or Promise, array, iterable) to subscribe to for every source emission. |
| `concurrent` | `number` | Optional. Maximum number of inner Observables subscribed to simultaneously. Defaults to `Infinity`. |

## Return Type
An `Observable<ObservedValueOf<O>>` that emits values from all concurrently active inner subscriptions, interleaved as they arrive.

## Marble Diagram
```
Source:       a---------b---------c---------|
              mergeMapTo(x--x--x|)

inner (a):    x--x--x|
inner (b):              x--x--x|
inner (c):                        x--x--x|
Output:       x--x--x---x--x--x---x--x--x|

(When intervals overlap, emissions interleave)
Source:   a---b---|
          mergeMapTo(x---x---x|)
inner(a): x---x---x|
inner(b):     x---x---x|
Output:   x---(xx)--x-x|
```

## Examples

### Example 1: Trigger Concurrent Animations (Deprecated Form)
```typescript
import { fromEvent, mergeMapTo, interval, take } from 'rxjs';

const button = document.getElementById('btn')!;
const pulse$ = interval(300).pipe(take(4));

// ❌ Deprecated — each click spawns a new concurrent pulse sequence
fromEvent(button, 'click').pipe(
  mergeMapTo(pulse$)
).subscribe((tick) => console.log('Pulse tick:', tick));
```

### Example 2: Preferred Modern Replacement
```typescript
import { fromEvent, mergeMap, interval, take } from 'rxjs';

const button = document.getElementById('btn')!;
const pulse$ = interval(300).pipe(take(4));

// ✅ Use mergeMap with an arrow function
fromEvent(button, 'click').pipe(
  mergeMap(() => pulse$)
).subscribe((tick) => console.log('Pulse tick:', tick));
```

### Example 3: Fan-out Parallel Requests for Every Item in a Stream
```typescript
import { from, mergeMap, of, delay } from 'rxjs';

const ids = [1, 2, 3, 4, 5];
const fetchDetails = (id: number) =>
  of({ id, data: `details for ${id}` }).pipe(delay(Math.random() * 500));

// ✅ All requests fire concurrently; results arrive as each completes
from(ids).pipe(
  mergeMap((id) => fetchDetails(id))
).subscribe({
  next: ({ id, data }) => console.log(`ID ${id}:`, data),
  complete: () => console.log('All fetched')
});
```

## Common Pitfalls

### Pitfall 1: Using the Deprecated Operator in New Code
Any new code should migrate to `mergeMap(() => obs$)` immediately to avoid future breaking changes.

```typescript
import { fromEvent, mergeMap, mergeMapTo, of } from 'rxjs';

const clicks$ = fromEvent(document, 'click');
const action$ = of('done');

// ❌ Deprecated
clicks$.pipe(mergeMapTo(action$)).subscribe(console.log);

// ✅ Use mergeMap
clicks$.pipe(mergeMap(() => action$)).subscribe(console.log);
```

### Pitfall 2: Uncapped Concurrency Leading to Resource Exhaustion
Because `mergeMapTo` defaults to unlimited concurrency, rapid source emissions can open many simultaneous requests or subscriptions.

```typescript
import { fromEvent, mergeMap, of, delay } from 'rxjs';
import { ajax } from 'rxjs/ajax';

// ❌ Every keystroke fires a new request immediately (unlimited concurrency)
fromEvent(document, 'keydown').pipe(
  mergeMap(() => ajax.get('/api/search'))
).subscribe(console.log);

// ✅ Cap concurrency and consider debouncing
import { debounceTime } from 'rxjs';
fromEvent(document, 'keydown').pipe(
  debounceTime(300),
  mergeMap(() => ajax.get('/api/search'), 3) // max 3 concurrent
).subscribe(console.log);
```

## Related Operators
- **`mergeMap`**: The non-deprecated replacement; accepts a full projection function.
- **`concatMapTo`**: Deprecated; same concept but sequential (waits for each inner to complete).
- **`switchMapTo`**: Deprecated; same concept but cancels the previous inner Observable on each new source value.
- **`mergeAll`**: Flattens a higher-order Observable concurrently without a projection.
