# reduce

## Brief Description
Applies an accumulator function over the source Observable and emits a single result when the source completes. Unlike `scan`, which emits on every value, `reduce` is silent until the source Observable completes, at which point it emits the final accumulated value. It mirrors the behavior of `Array.prototype.reduce` for Observable streams.

## Category
transformation

## Import
```typescript
import { reduce } from 'rxjs';
```

## Signature
```typescript
reduce<V, A>(accumulator: (acc: A, value: V, index: number) => A, seed?: A): OperatorFunction<V, A>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `accumulator` | `(acc: A, value: V, index: number) => A` | A function applied to the current accumulated value and each source value. Returns the next accumulated value. |
| `seed` | `A` (optional) | The initial accumulator value. If omitted, the first emitted value is used as the seed. |

## Return Type
An `Observable<A>` that emits a single value — the final accumulated result — when the source Observable completes.

## Marble Diagram
```
Source:  --1----2----3----4--|
reduce((acc, x) => acc + x, 0)
Output:  --------------------10|
```

## Examples

### Example 1: Sum all values
```typescript
import { of, reduce } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  reduce((acc, val) => acc + val, 0)
).subscribe({
  next: total => console.log('Total:', total),
  complete: () => console.log('Complete')
});
// Output:
// Total: 15
// Complete
```

### Example 2: Build a frequency map from a stream of events
```typescript
import { from, reduce } from 'rxjs';

const events = ['click', 'hover', 'click', 'scroll', 'click', 'hover'];

from(events).pipe(
  reduce((acc: Record<string, number>, event: string) => ({
    ...acc,
    [event]: (acc[event] ?? 0) + 1
  }), {})
).subscribe(frequencyMap => console.log(frequencyMap));
// Output:
// { click: 3, hover: 2, scroll: 1 }
```

### Example 3: Collect all HTTP results into a summary object
```typescript
import { from, reduce, mergeMap } from 'rxjs';
import { of } from 'rxjs';

interface ApiResult {
  endpoint: string;
  status: number;
  duration: number;
}

// Simulated API results
const results$= from([
  { endpoint: '/users', status: 200, duration: 120 },
  { endpoint: '/posts', status: 200, duration: 85 },
  { endpoint: '/comments', status: 404, duration: 30 },
  { endpoint: '/profile', status: 200, duration: 200 },
]);

results$.pipe(
  reduce(
    (summary, result: ApiResult) => ({
      total: summary.total + 1,
      successful: summary.successful + (result.status === 200 ? 1 : 0),
      totalDuration: summary.totalDuration + result.duration,
    }),
    { total: 0, successful: 0, totalDuration: 0 }
  )
).subscribe(summary => {
  console.log('API Summary:', summary);
  console.log(`Avg duration: ${summary.totalDuration / summary.total}ms`);
});
// Output:
// API Summary: { total: 4, successful: 3, totalDuration: 435 }
// Avg duration: 108.75ms
```

## Common Pitfalls

### Pitfall 1: Using reduce on a never-completing Observable
`reduce` only emits when the source completes. If the source never completes (e.g., `interval`, `Subject`), `reduce` will never emit.

```typescript
import { interval, reduce, take } from 'rxjs';

// ❌ interval never completes — reduce will never emit
interval(1000).pipe(
  reduce((acc, val) => acc + val, 0)
).subscribe(total => console.log('Never printed:', total));

// ✅ Use take to bound the stream
interval(1000).pipe(
  take(5),
  reduce((acc, val) => acc + val, 0)
).subscribe(total => console.log('Total after 5 ticks:', total));
```

### Pitfall 2: Expecting multiple emissions from reduce
If you need intermediate results during accumulation, use `scan` instead.

```typescript
import { of, reduce, scan } from 'rxjs';

// ❌ reduce only emits once
of(1, 2, 3).pipe(
  reduce((acc, val) => acc + val, 0)
).subscribe(val => console.log(val)); // prints: 6

// ✅ Use scan to get each intermediate result
of(1, 2, 3).pipe(
  scan((acc, val) => acc + val, 0)
).subscribe(val => console.log(val)); // prints: 1, 3, 6
```

## Related Operators
- **`scan`**: Like `reduce` but emits the accumulated value after every source emission, not just on completion.
- **`toArray`**: Collects all source values into a single array and emits it on completion — a specialized form of `reduce`.
- **`count`**: Counts the number of emissions and emits the count on completion.
- **`sum`** (not in RxJS): Use `reduce((acc, val) => acc + val, 0)` to compute a sum.
