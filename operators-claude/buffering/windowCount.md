# windowCount

## Brief Description
`windowCount` divides the source observable into nested observables of fixed size. Each inner observable emits at most `windowSize` values, then completes and a new one is emitted. An optional `startWindowEvery` parameter creates overlapping windows by controlling how frequently a new window opens. This operator is the streaming equivalent of `bufferCount`, useful when you need to apply per-window operators (such as `reduce` or `scan`) to fixed-size chunks of a stream.

## Category
buffering

## Import
```typescript
import { windowCount } from 'rxjs';
```

## Signature
```typescript
windowCount<T>(windowSize: number, startWindowEvery?: number): OperatorFunction<T, Observable<T>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| windowSize | `number` | The maximum number of values each inner observable will emit before completing |
| startWindowEvery | `number` | Optional. How often (in source items) to open a new window. Defaults to `windowSize` (non-overlapping) |

## Return Type
An `Observable<Observable<T>>` — a higher-order observable where each inner observable emits up to `windowSize` values from the source.

## Marble Diagram
```
Non-overlapping (windowCount(3)):
Source:  --a--b--c--d--e--f--|
Output:  W1------W2------W3--|
W1:      --a--b--c|
W2:               --d--e--f|
W3:                        (empty on |)

Overlapping (windowCount(3, 1)):
Source:  --a--b--c--d--|
W1:      --a--b--c|
W2:        --b--c--d|
W3:             --c--d|
W4:                --d|
```

## Examples

### Example 1: Compute sum of each fixed-size chunk
```typescript
import { range, windowCount, mergeMap, reduce } from 'rxjs';

range(1, 12).pipe(
  windowCount(4),
  mergeMap(win$ => win$.pipe(reduce((acc, val) => acc + val, 0)))
).subscribe(sum => {
  console.log('Chunk sum:', sum);
});
// Chunk sum: 10  (1+2+3+4)
// Chunk sum: 26  (5+6+7+8)
// Chunk sum: 42  (9+10+11+12)
```

### Example 2: Sliding window average
```typescript
import { from, windowCount, mergeMap, reduce, map } from 'rxjs';

const prices = [10, 12, 11, 15, 14, 13, 16];

from(prices).pipe(
  windowCount(3, 1), // window of 3, slide by 1
  mergeMap(win$ =>
    win$.pipe(
      reduce<number, number[]>((acc, val) => [...acc, val], [])
    )
  ),
  map(window => window.reduce((a, b) => a + b, 0) / window.length)
).subscribe(avg => {
  console.log('Moving average:', avg.toFixed(2));
});
// 11.00, 12.67, 13.33, 14.00, 14.33
```

### Example 3: Process events in pairs
```typescript
import { fromEvent, windowCount, mergeMap, toArray, filter } from 'rxjs';

const clicks$ = fromEvent<MouseEvent>(document, 'click');

// Group clicks into pairs (useful for detecting double-click-like patterns)
clicks$.pipe(
  windowCount(2),
  mergeMap(win$ => win$.pipe(toArray())),
  filter(pair => pair.length === 2)
).subscribe(([first, second]) => {
  const timeDiff = second.timeStamp - first.timeStamp;
  console.log(`Pair of clicks, ${timeDiff.toFixed(0)}ms apart`);
});
```

## Common Pitfalls

### Pitfall 1: Must subscribe to inner observables
Like all higher-order observable operators, `windowCount` requires flattening. Inner observables silently drop values if not subscribed.

```typescript
import { range, windowCount } from 'rxjs';

// ❌ Inner observables never subscribed; all values are dropped
range(1, 9).pipe(
  windowCount(3)
).subscribe(win$ => {
  console.log(win$); // logs Observable objects, not values
});

// ✅ Use mergeMap + toArray to materialize each window
import { mergeMap, toArray } from 'rxjs';
range(1, 9).pipe(
  windowCount(3),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(batch => console.log(batch));
// [1,2,3], [4,5,6], [7,8,9]
```

### Pitfall 2: Last window may complete with fewer than windowSize items
When the source completes mid-window, the current inner observable completes immediately with however many values were emitted. Handle this in your window processing.

```typescript
import { range, windowCount, mergeMap, toArray } from 'rxjs';

// ❌ Assuming all windows are full
range(1, 7).pipe(
  windowCount(3),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(batch => {
  const [a, b, c] = batch;
  console.log(a * b * c); // NaN for [7] since b and c are undefined
});

// ✅ Guard against partial windows
range(1, 7).pipe(
  windowCount(3),
  mergeMap(win$ => win$.pipe(toArray())),
).subscribe(batch => {
  if (batch.length < 3) return; // skip partial windows
  const [a, b, c] = batch;
  console.log(a * b * c);
});
```

## Related Operators
- **`bufferCount`**: same semantics but emits arrays instead of inner Observables
- **`window`**: closes windows on an observable signal rather than item count
- **`windowTime`**: closes windows based on elapsed time
- **`pairwise`**: shorthand for `windowCount(2, 1)` that emits `[prev, curr]` tuples
