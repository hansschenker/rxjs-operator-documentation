# skip

## Brief Description
The `skip` operator skips the first `count` values emitted by the source observable and then passes all subsequent values through. It is the complement of `take` and is useful when you want to ignore an initial burst of values or bypass a known preamble in a stream.

## Category
filtering

## Import
```typescript
import { skip } from 'rxjs';
```

## Signature
```typescript
skip<T>(count: number): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| count | `number` | The number of items to skip from the beginning of the source sequence. Must be a non-negative integer. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type as the source that skips the first `count` values.

## Marble Diagram
```
Source:  --1--2--3--4--5--|
skip(2)
Output:  --------3--4--5--|
```

## Examples

### Example 1: Skip the first three values
```typescript
import { of, skip } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  skip(3)
).subscribe(console.log);
// Output: 4, 5
```

### Example 2: Skip the initial seed value from BehaviorSubject
```typescript
import { BehaviorSubject, skip } from 'rxjs';

const state$ = new BehaviorSubject({ count: 0 });

state$.pipe(
  skip(1) // skip the initial seed emission
).subscribe(state => {
  console.log('State changed to:', state.count);
});

state$.next({ count: 1 }); // Output: State changed to: 1
state$.next({ count: 2 }); // Output: State changed to: 2
```

### Example 3: Combine skip with take for a slice effect
```typescript
import { range, skip, take } from 'rxjs';

range(1, 10).pipe(
  skip(3),  // skip 1, 2, 3
  take(4)   // take 4, 5, 6, 7
).subscribe(console.log);
// Output: 4, 5, 6, 7
```

## Common Pitfalls

### Pitfall 1: Confusing skip with skipWhile
`skip(n)` always skips exactly `n` items regardless of value. `skipWhile` skips items while a condition is true.

```typescript
import { of, skip, skipWhile } from 'rxjs';

// skip(2) skips first 2 items unconditionally
of(5, 10, 1, 2, 3).pipe(skip(2)).subscribe(console.log);
// Output: 1, 2, 3

// skipWhile skips based on condition
of(5, 10, 1, 2, 3).pipe(skipWhile(n => n > 3)).subscribe(console.log);
// Output: 1, 2, 3
```

### Pitfall 2: Using skip(0) — it's a no-op
`skip(0)` does nothing and should be removed from pipelines to avoid confusion.

```typescript
import { of, skip } from 'rxjs';

// ❌ Confusing no-op
of(1, 2, 3).pipe(skip(0)).subscribe(console.log); // 1, 2, 3

// ✅ Just remove it
of(1, 2, 3).subscribe(console.log); // 1, 2, 3
```

## Related Operators
- **`take`**: Emits only the first N values (the complement of `skip`).
- **`skipLast`**: Skips the last N values of the source.
- **`skipWhile`**: Skips values while a predicate returns true.
- **`skipUntil`**: Skips values until a notifier observable emits.
