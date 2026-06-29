# windowWhen

## Brief Description
`windowWhen` divides the source observable into sequential, non-overlapping inner observables (windows), where each window's duration is controlled by an observable returned from a factory function. When the closing observable emits (or completes), the current window completes and a new one starts, with the factory function invoked again to get the next closing signal. This is the streaming equivalent of `bufferWhen`, offering dynamic window boundaries with full reactive operator support on each window.

## Category
buffering

## Import
```typescript
import { windowWhen } from 'rxjs';
```

## Signature
```typescript
windowWhen<T>(closingSelector: () => ObservableInput<any>): OperatorFunction<T, Observable<T>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| closingSelector | `() => ObservableInput<any>` | A zero-argument function called at the start of each window that returns an observable; the current window closes when that observable emits or completes |

## Return Type
An `Observable<Observable<T>>` — a higher-order observable where each emitted inner observable represents one sequential window of source values.

## Marble Diagram
```
Source:          --a--b--c--d--e--f--|
ClosingSelector: --C1---------C2-----|
                 (re-invoked)  (re-invoked...)

Outer:           W1---W2------W3-----|
W1 emits:        --a|
W2 emits:             --b--c--d|
W3 emits:                      --e--f--|
```

## Examples

### Example 1: Dynamically sized windows with per-window max
```typescript
import { interval, windowWhen, mergeMap, take, toArray, timer } from 'rxjs';

const source$ = interval(100);

source$.pipe(
  windowWhen(() => {
    // Each window lasts between 300ms and 700ms randomly
    return timer(300 + Math.random() * 400);
  }),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(batch => {
  console.log(`Dynamic window: ${batch.length} items`, batch);
});
```

### Example 2: Apply different aggregations per window
```typescript
import { interval, windowWhen, mergeMap, scan, last, timer } from 'rxjs';

const source$ = interval(200);
let windowIndex = 0;

source$.pipe(
  windowWhen(() => timer(1000)),
  mergeMap((win$, idx) => {
    // Alternate between sum and max aggregation per window
    return idx % 2 === 0
      ? win$.pipe(scan((acc, val) => acc + val, 0), last())
      : win$.pipe(scan((max, val) => Math.max(max, val), -Infinity), last());
  })
).subscribe((result, idx) => {
  console.log(`Window result (${idx % 2 === 0 ? 'sum' : 'max'}):`, result);
});
```

### Example 3: Buffer until Enter key, then process as a stream
```typescript
import { fromEvent, windowWhen, mergeMap, filter, map } from 'rxjs';

const keydowns$ = fromEvent<KeyboardEvent>(document, 'keydown');

keydowns$.pipe(
  windowWhen(() =>
    keydowns$.pipe(
      filter(e => e.key === 'Enter')
    )
  ),
  mergeMap(win$ =>
    win$.pipe(
      filter(e => e.key !== 'Enter' && e.key.length === 1),
      map(e => e.key)
    )
  )
).subscribe(char => {
  process.stdout.write(char); // stream characters as they arrive within the window
});
```

## Common Pitfalls

### Pitfall 1: closingSelector is re-called for every new window
The factory runs once per window, not just once overall. Any side effects in the factory (API calls, logging, etc.) will repeat.

```typescript
import { interval, windowWhen, mergeMap, toArray, timer } from 'rxjs';

let callCount = 0;

// ❌ Side effect fires on every new window
interval(100).pipe(
  windowWhen(() => {
    callCount++; // runs N times over the observable's lifetime
    console.log(`Factory called ${callCount} times`);
    return timer(500);
  }),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(console.log);

// ✅ Keep the factory free of side effects
interval(100).pipe(
  windowWhen(() => timer(500)),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(console.log);
```

### Pitfall 2: Unsubscribed inner windows are silently dropped
If the outer subscriber does not subscribe to each inner observable using a flattening operator, values are lost.

```typescript
import { interval, windowWhen, timer } from 'rxjs';

// ❌ Inner observables never subscribed
interval(100).pipe(
  windowWhen(() => timer(500))
).subscribe(win$ => {
  // win$ is an Observable<number> but nothing subscribes to it
  console.log('window opened:', win$); // just logs the Observable object
});

// ✅ Always flatten with mergeMap (or switchMap, concatMap, etc.)
import { mergeMap, toArray } from 'rxjs';
interval(100).pipe(
  windowWhen(() => timer(500)),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(batch => console.log('Window values:', batch));
```

## Related Operators
- **`bufferWhen`**: same dynamic-closing semantics but emits arrays instead of inner Observables
- **`window`**: uses a single shared boundary observable rather than a per-window factory
- **`windowToggle`**: allows overlapping windows via separate open and close observables
- **`windowTime`**: simpler API when window duration is a fixed millisecond value
