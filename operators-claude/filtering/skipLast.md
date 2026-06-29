# skipLast

## Brief Description
The `skipLast` operator skips the last `count` values emitted by the source observable and emits all preceding values. Because the operator must know the last N items in advance, it buffers values internally — each emission is delayed by `count` positions. It completes when the source completes.

## Category
filtering

## Import
```typescript
import { skipLast } from 'rxjs';
```

## Signature
```typescript
skipLast<T>(skipCount: number): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| skipCount | `number` | The number of items to skip from the end of the source sequence. Must be a non-negative integer. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type that omits the last `skipCount` values.

## Marble Diagram
```
Source:  --1--2--3--4--5--|
skipLast(2)
Output:  --------1--2--3--| (1,2 delayed; 4,5 suppressed)
```

## Examples

### Example 1: Skip the last two values
```typescript
import { of, skipLast } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  skipLast(2)
).subscribe(console.log);
// Output: 1, 2, 3
```

### Example 2: Skip last item to exclude a trailing sentinel
```typescript
import { of, skipLast } from 'rxjs';

// Stream ends with a special "done" sentinel value
of('data-1', 'data-2', 'data-3', 'DONE').pipe(
  skipLast(1)
).subscribe(console.log);
// Output: data-1, data-2, data-3
```

### Example 3: Observe the buffering/delay effect with interval
```typescript
import { interval, skipLast, take } from 'rxjs';

interval(300).pipe(
  take(6),
  skipLast(2)
).subscribe({
  next: val => console.log('Emitted:', val),
  complete: () => console.log('Complete'),
});
// Output (after source completes): 0, 1, 2, 3 (4 and 5 are skipped)
```

## Common Pitfalls

### Pitfall 1: Expecting real-time emission from infinite streams
Because `skipLast(n)` buffers `n` values internally, it delays each emission by `n` steps. For infinite streams this means values are always delayed — and if the stream never completes, the last N values are never emitted at all.

```typescript
import { interval, skipLast } from 'rxjs';

// ❌ Every value is delayed by 3 positions; stream never completes so
//    the most-recent 3 values are never seen
interval(500).pipe(
  skipLast(3)
).subscribe(console.log);
// 0 appears after 2000ms, 1 after 2500ms, etc.
```

### Pitfall 2: Confusing skipLast with takeLast
`skipLast(n)` keeps all values *except* the last `n`. `takeLast(n)` keeps only the last `n`.

```typescript
import { of, skipLast, takeLast } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(skipLast(2)).subscribe(console.log);
// Output: 1, 2, 3  (skips 4 and 5)

of(1, 2, 3, 4, 5).pipe(takeLast(2)).subscribe(console.log);
// Output: 4, 5  (keeps only 4 and 5)
```

## Related Operators
- **`takeLast`**: Emits only the last N values from a completing source.
- **`skip`**: Skips the first N values (not the last).
- **`last`**: Emits only the very last value.
- **`slice` (array)**: For static arrays, `Array.prototype.slice` is often simpler.
