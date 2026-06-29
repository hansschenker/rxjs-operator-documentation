# take

## Brief Description
The `take` operator emits only the first `count` values from the source observable and then completes. It is one of the most frequently used operators in RxJS, essential for bounding infinite streams, preventing memory leaks, and limiting the number of events processed from event-based observables.

## Category
filtering

## Import
```typescript
import { take } from 'rxjs';
```

## Signature
```typescript
take<T>(count: number): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| count | `number` | The maximum number of values to emit before completing. Must be a non-negative integer. If `0`, the observable completes immediately without emitting. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type that completes after emitting at most `count` values.

## Marble Diagram
```
Source:  --1--2--3--4--5--6-->
take(3)
Output:  --1--2--3|            (completes after 3 values)
```

## Examples

### Example 1: Take the first 3 values from an infinite stream
```typescript
import { interval, take } from 'rxjs';

interval(1000).pipe(
  take(3)
).subscribe({
  next: val => console.log(val),
  complete: () => console.log('Done'),
});
// Output: 0, 1, 2, Done
```

### Example 2: Listen to only the first click
```typescript
import { fromEvent, take } from 'rxjs';

fromEvent(document, 'click').pipe(
  take(1)
).subscribe(event => {
  console.log('First click at:', (event as MouseEvent).clientX);
});
// Automatically unsubscribes after the first click
```

### Example 3: Use take(0) to create an immediately-completing observable
```typescript
import { interval, take } from 'rxjs';

interval(1000).pipe(
  take(0)
).subscribe({
  next: val => console.log(val),  // Never called
  complete: () => console.log('Completed immediately'),
});
// Output: Completed immediately
```

## Common Pitfalls

### Pitfall 1: Forgetting take on infinite streams leads to memory leaks
Subscribing to an infinite observable without bounding it (via `take`, `takeUntil`, etc.) keeps the subscription active forever unless manually unsubscribed.

```typescript
import { interval } from 'rxjs';

// ❌ Infinite subscription — never completes and never cleans up
interval(1000).subscribe(console.log);

// ✅ Bounded with take
import { take } from 'rxjs';
interval(1000).pipe(take(5)).subscribe(console.log);
```

### Pitfall 2: Confusing take(1) with first()
`take(1)` completes silently if the source is empty. `first()` throws `EmptyError`. Choose based on whether an empty source is an error.

```typescript
import { EMPTY, take, first } from 'rxjs';

EMPTY.pipe(take(1)).subscribe({
  complete: () => console.log('Completed silently'),
});

EMPTY.pipe(first()).subscribe({
  error: err => console.error(err.name), // EmptyError
});
```

## Related Operators
- **`takeLast`**: Emits the last N values from a completing source.
- **`takeUntil`**: Emits values until a notifier fires.
- **`takeWhile`**: Emits values while a predicate holds true.
- **`first`**: Takes exactly one value; errors if none are found.
- **`skip`**: The complement — skips the first N values.
