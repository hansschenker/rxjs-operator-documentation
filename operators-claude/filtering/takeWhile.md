# takeWhile

## Brief Description
The `takeWhile` operator emits values from the source observable as long as a provided predicate function returns `true`. The moment the predicate returns `false`, the output observable completes (and by default does not emit that final non-matching value). An optional `inclusive` parameter can be set to `true` to include the first value that fails the predicate before completing.

## Category
filtering

## Import
```typescript
import { takeWhile } from 'rxjs';
```

## Signature
```typescript
takeWhile<T>(predicate: (value: T, index: number) => boolean, inclusive?: boolean): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| predicate | `(value: T, index: number) => boolean` | A function evaluated for each source value. Values are emitted while this returns `true`. |
| inclusive | `boolean` | Optional. If `true`, the first value for which the predicate returns `false` is also emitted before completing. Defaults to `false`. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type that completes when the predicate first returns `false`.

## Marble Diagram
```
Source:  --1--2--3--4--5--|
takeWhile(x => x < 4)
Output:  --1--2--3--|        (completes when x=4 fails predicate)

takeWhile(x => x < 4, true)
Output:  --1--2--3--4|      (includes the failing value)
```

## Examples

### Example 1: Emit values until a threshold is exceeded
```typescript
import { of, takeWhile } from 'rxjs';

of(2, 4, 6, 8, 3, 5).pipe(
  takeWhile(n => n < 7)
).subscribe(console.log);
// Output: 2, 4, 6
```

### Example 2: Use inclusive to capture the boundary value
```typescript
import { of, takeWhile } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  takeWhile(n => n !== 4, true) // include 4 in the output
).subscribe(console.log);
// Output: 1, 2, 3, 4
```

### Example 3: Emit real-time sensor data until a limit is reached
```typescript
import { interval, map, takeWhile } from 'rxjs';

const temperature$ = interval(500).pipe(
  map(i => 20 + i * 2) // simulated rising temperature
);

temperature$.pipe(
  takeWhile(temp => temp < 30, true) // include the value that exceeded 30
).subscribe({
  next: temp => console.log('Temp:', temp),
  complete: () => console.log('Threshold exceeded — shutting down'),
});
// Output: 20, 22, 24, 26, 28, 30, Threshold exceeded — shutting down
```

## Common Pitfalls

### Pitfall 1: Not realizing the stream completes when the predicate fails
Unlike `filter` (which just drops values), `takeWhile` completes the observable when the predicate first returns `false`. Later values that would have passed the predicate are never emitted.

```typescript
import { of, takeWhile, filter } from 'rxjs';

// Source: 1, 2, 5, 2, 1 — predicate fails at 5
of(1, 2, 5, 2, 1).pipe(
  takeWhile(n => n < 4)
).subscribe(console.log);
// Output: 1, 2 — the trailing 2, 1 are never seen

// Use filter if you want to pass those through
of(1, 2, 5, 2, 1).pipe(
  filter(n => n < 4)
).subscribe(console.log);
// Output: 1, 2, 2, 1
```

### Pitfall 2: Forgetting the inclusive option when you need the triggering value
By default, the value that causes the predicate to fail is swallowed. Use `inclusive: true` to include it.

```typescript
import { of, takeWhile } from 'rxjs';

// ❌ 4 is dropped
of(1, 2, 3, 4).pipe(takeWhile(n => n < 4)).subscribe(console.log);
// Output: 1, 2, 3

// ✅ 4 is included
of(1, 2, 3, 4).pipe(takeWhile(n => n < 4, true)).subscribe(console.log);
// Output: 1, 2, 3, 4
```

## Related Operators
- **`skipWhile`**: The complement — skips while predicate is true, then emits everything.
- **`takeUntil`**: Completes based on an external notifier rather than a per-value predicate.
- **`take`**: Emits a fixed number of values regardless of their content.
- **`filter`**: Suppresses non-matching values without completing the stream.
