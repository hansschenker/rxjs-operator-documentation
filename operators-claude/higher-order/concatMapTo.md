# concatMapTo

## Brief Description
`concatMapTo` maps every source emission to the **same** inner Observable and subscribes to them sequentially, waiting for each to complete before starting the next. It is a specialization of `concatMap` where the projection always returns the same Observable regardless of the source value. This operator is **deprecated** as of RxJS 7 — use `concatMap(() => innerObservable)` instead.

> **Deprecated:** `concatMapTo` is deprecated and will be removed in a future version. Use `concatMap(() => innerObservable)` to achieve identical behavior.

## Category
higher-order

## Import
```typescript
import { concatMapTo } from 'rxjs';
```

## Signature
```typescript
concatMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O
): OperatorFunction<T, ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `innerObservable` | `ObservableInput<O>` | A fixed Observable (or Promise, array, iterable) that every source emission is mapped to. Subscriptions are queued sequentially. |

## Return Type
An `Observable<ObservedValueOf<O>>` emitting values from successive subscriptions to `innerObservable`, one at a time in source order.

## Marble Diagram
```
Source:       a-------b-------c-------|
              concatMapTo(x--x--x|)

inner (a):    x--x--x|
                      inner (b): x--x--x|
                                          inner (c): x--x--x|
Output:       x--x--x-x--x--x-x--x--x|
```

## Examples

### Example 1: Trigger the Same Animation on Each Click (Deprecated Form)
```typescript
import { fromEvent, concatMapTo, of, delay } from 'rxjs';

const button = document.getElementById('btn')!;
const runAnimation$ = of('fade-in', 'fade-out').pipe(
  // Simulate a two-step animation taking 500ms per step
  concatMap((step) => of(step).pipe(delay(500)))
);

// ❌ Deprecated — still works but will be removed
fromEvent(button, 'click').pipe(
  concatMapTo(runAnimation$)
).subscribe((step) => console.log('Animation step:', step));
```

### Example 2: Preferred Modern Replacement
```typescript
import { fromEvent, concatMap, of, delay } from 'rxjs';

const button = document.getElementById('btn')!;
const runAnimation$ = of('fade-in', 'fade-out').pipe(
  concatMap((step) => of(step).pipe(delay(500)))
);

// ✅ Use concatMap with an arrow function instead
fromEvent(button, 'click').pipe(
  concatMap(() => runAnimation$)
).subscribe((step) => console.log('Animation step:', step));
```

### Example 3: Polling a Fixed Endpoint on Each User Action
```typescript
import { fromEvent, concatMap, of, delay } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const refreshButton = document.getElementById('refresh')!;

// ✅ Modern equivalent of concatMapTo(ajax.get('/api/status'))
fromEvent(refreshButton, 'click').pipe(
  concatMap(() => ajax.get('/api/status'))
).subscribe({
  next: ({ response }) => console.log('Status:', response),
  error: (err) => console.error(err)
});
```

## Common Pitfalls

### Pitfall 1: Using the Deprecated Operator in New Code
New code should never use `concatMapTo`. Linters and TypeScript will emit deprecation warnings.

```typescript
import { fromEvent, concatMap, concatMapTo, timer } from 'rxjs';

const clicks$ = fromEvent(document, 'click');
const tick$ = timer(1000);

// ❌ Deprecated
clicks$.pipe(concatMapTo(tick$)).subscribe(console.log);

// ✅ Equivalent, non-deprecated
clicks$.pipe(concatMap(() => tick$)).subscribe(console.log);
```

### Pitfall 2: Assuming the Inner Observable Is Re-created Each Time
`concatMapTo` and its `concatMap(() => obs$)` replacement both **resubscribe** to the provided Observable for each source emission — they do not share a single subscription. Cold Observables will re-run their logic on each subscription.

```typescript
import { concatMap, fromEvent, of, tap } from 'rxjs';

const sideEffectObs$ = of(1).pipe(
  tap(() => console.log('Inner subscribed — side effect runs!'))
);

// Each click triggers a new subscription to sideEffectObs$
fromEvent(document, 'click').pipe(
  concatMap(() => sideEffectObs$)
).subscribe();
// Logs 'Inner subscribed — side effect runs!' on every click
```

## Related Operators
- **`concatMap`**: The non-deprecated replacement; accepts a projection function for full flexibility.
- **`mergeMapTo`**: Deprecated; same concept but subscribes concurrently rather than sequentially.
- **`switchMapTo`**: Deprecated; same concept but cancels the previous inner Observable.
- **`exhaustMapTo`**: Deprecated; same concept but ignores new source values while inner is active.
