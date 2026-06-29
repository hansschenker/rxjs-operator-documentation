# last

## Brief Description
The `last` operator emits only the last value (or the last value matching an optional predicate) from the source observable once it completes, and then completes itself. If the source completes without emitting a matching value, it throws an `EmptyError` unless a default value is provided. It is useful when you only care about the final result of a finite stream.

## Category
filtering

## Import
```typescript
import { last } from 'rxjs';
```

## Signature
```typescript
last<T, D = T>(
  predicate?: ((value: T, index: number, source: Observable<T>) => boolean) | null,
  defaultValue?: D
): OperatorFunction<T, T | D>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| predicate | `((value: T, index: number, source: Observable<T>) => boolean) \| null` | Optional. A function to test each value. If provided, only the last value passing the test is emitted. |
| defaultValue | `D` | Optional. A value to emit if the source completes without a matching emission. Without this, an `EmptyError` is thrown. |

## Return Type
An `OperatorFunction<T, T | D>` — an Observable that emits a single value (the last match or the default), then completes.

## Marble Diagram
```
Source:  --1--2--3--4--5--|
last()
Output:  -----------------5|   (emits after source completes)

Source:  --1--2--3--4--5--|
last(x => x % 2 === 0)
Output:  -----------------4|   (last even number)
```

## Examples

### Example 1: Get the last emitted value
```typescript
import { of, last } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  last()
).subscribe(console.log);
// Output: 5
```

### Example 2: Get the last value matching a predicate
```typescript
import { of, last } from 'rxjs';

of(1, 2, 3, 4, 5, 6).pipe(
  last(n => n % 2 !== 0)
).subscribe(console.log);
// Output: 5  (last odd number)
```

### Example 3: Use a default to avoid EmptyError
```typescript
import { of, last } from 'rxjs';

of(1, 2, 3).pipe(
  last(n => n > 100, -1)
).subscribe({
  next: val => console.log('Result:', val),
  error: err => console.error(err),
});
// Output: Result: -1
```

## Common Pitfalls

### Pitfall 1: Using last on an infinite observable
`last` must wait for the source to complete before it can emit. An infinite observable (like `interval`) will never let `last` emit, causing a subscription that never produces a value.

```typescript
import { interval, last, take } from 'rxjs';

// ❌ Never emits — interval never completes
interval(500).pipe(
  last()
).subscribe(console.log);

// ✅ Bound the source to make it finite
interval(500).pipe(
  take(5),
  last()
).subscribe(console.log);
// Output: 4
```

### Pitfall 2: EmptyError when predicate matches nothing
When using a predicate and no value matches, `last` throws `EmptyError`. Always provide a default value when the predicate might not match.

```typescript
import { of, last } from 'rxjs';

// ❌ Throws EmptyError
of(1, 3, 5).pipe(
  last(n => n % 2 === 0)
).subscribe({ error: err => console.error(err.name) }); // EmptyError

// ✅ Provide a default
of(1, 3, 5).pipe(
  last(n => n % 2 === 0, null)
).subscribe(val => console.log(val)); // null
```

## Related Operators
- **`first`**: Emits only the first value (or first match) from a source.
- **`takeLast`**: Emits the last N values, not just one.
- **`reduce`**: Accumulates all source values into a single result emitted on completion.
- **`filter`**: Emits all matching values throughout the stream.
