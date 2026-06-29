# window

## Brief Description
`window` divides the source observable into nested observables ("windows"), each of which emits a subset of source values. A new window opens when the previous one closes, and windows close when the `windowBoundaries` observable emits. Unlike `buffer`, which collects values into arrays, `window` emits inner `Observable` objects, allowing each window to be further transformed with operators before subscription. This is useful when you need streaming access to grouped values rather than waiting for an entire batch to accumulate.

## Category
buffering

## Import
```typescript
import { window } from 'rxjs';
```

## Signature
```typescript
window<T>(windowBoundaries: Observable<any>): OperatorFunction<T, Observable<T>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| windowBoundaries | `Observable<any>` | An observable that triggers the closing of the current window and the opening of a new one |

## Return Type
An `Observable<Observable<T>>` — a higher-order observable where each emitted value is itself an observable representing one window of source values.

## Marble Diagram
```
Source:           --a--b--c--d--e--f--|
windowBoundaries: ---------W---------|

Outer emissions:  W1--------W2--------|
W1 values:        --a--b--c|
W2 values:                  --d--e--f--|
```

## Examples

### Example 1: Take the first value from each window
```typescript
import { interval, window, mergeMap, take } from 'rxjs';

const source$ = interval(100);
const boundaries$ = interval(500);

source$.pipe(
  window(boundaries$),
  mergeMap(win$ => win$.pipe(take(1))) // only take first value per window
).subscribe(val => {
  console.log('First of window:', val);
  // 0, 5, 10, 15, ...
});
```

### Example 2: Compute running max per window
```typescript
import { interval, window, mergeMap, reduce, take } from 'rxjs';

const source$ = interval(80).pipe(take(20));
const boundaries$ = interval(400);

source$.pipe(
  window(boundaries$),
  mergeMap(win$ =>
    win$.pipe(
      reduce((max, val) => Math.max(max, val), -Infinity)
    )
  )
).subscribe(max => {
  console.log('Window max:', max);
});
```

### Example 3: Group click events into windows separated by keyboard events
```typescript
import { fromEvent, window, mergeMap, toArray } from 'rxjs';

const clicks$ = fromEvent<MouseEvent>(document, 'click');
const keydowns$ = fromEvent<KeyboardEvent>(document, 'keydown');

clicks$.pipe(
  window(keydowns$),
  mergeMap(win$ => win$.pipe(toArray())) // collect each window into an array
).subscribe(clickBatch => {
  console.log(
    `${clickBatch.length} clicks between keypresses at positions:`,
    clickBatch.map(e => `(${e.clientX}, ${e.clientY})`)
  );
});
```

## Common Pitfalls

### Pitfall 1: Forgetting to subscribe to inner windows
Each emitted inner observable must be subscribed to (via `mergeMap`, `switchMap`, etc.), otherwise its values are lost. The outer observable alone does not cause the inner ones to emit to any consumer.

```typescript
import { interval, window } from 'rxjs';

// ❌ Inner observables are never subscribed — no values are consumed
interval(100).pipe(
  window(interval(500))
).subscribe(win$ => {
  // win$ is an Observable, but we never subscribe to it!
  console.log('Got window', win$); // just logs Observable object
});

// ✅ Use mergeMap (or another flattening operator) to subscribe to each window
import { mergeMap, toArray } from 'rxjs';
interval(100).pipe(
  window(interval(500)),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(batch => console.log('Window values:', batch));
```

### Pitfall 2: Using window when buffer is simpler
If you only need the collected array and no streaming access, prefer `buffer` — it avoids the complexity of managing inner observables.

```typescript
import { interval, window, mergeMap, toArray, buffer } from 'rxjs';

const closer$ = interval(500);

// ❌ Unnecessarily complex for a simple batch collection
interval(100).pipe(
  window(closer$),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(console.log);

// ✅ buffer is cleaner when you just need arrays
interval(100).pipe(
  buffer(closer$)
).subscribe(console.log);
```

## Related Operators
- **`buffer`**: same concept but emits arrays instead of inner Observables
- **`windowCount`**: closes windows based on item count rather than an observable signal
- **`windowTime`**: closes windows based on elapsed time
- **`groupBy`**: groups by a key rather than by time/count boundaries
