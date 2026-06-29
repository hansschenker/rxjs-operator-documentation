# first

## Brief Description
The `first` operator emits only the first value (or the first value matching an optional predicate) from the source observable and then completes. If no matching value is found before the source completes, it throws an `EmptyError` by default — or emits a provided default value. This makes it ideal when you need exactly one value from a stream and want the subscription to end immediately.

## Category
filtering

## Import
```typescript
import { first } from 'rxjs';
```

## Signature
```typescript
first<T, D = T>(
  predicate?: ((value: T, index: number, source: Observable<T>) => boolean) | null,
  defaultValue?: D
): OperatorFunction<T, T | D>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| predicate | `((value: T, index: number, source: Observable<T>) => boolean) \| null` | Optional. A function to test each value. If omitted, the first emitted value is used. |
| defaultValue | `D` | Optional. A default value to emit if the source completes without a match. Without this, an `EmptyError` is thrown. |

## Return Type
An `OperatorFunction<T, T | D>` — an Observable that emits a single value of type `T` (the first match) or `D` (the default), then completes.

## Marble Diagram
```
Source:  --1--2--3--4--5--|
first()
Output:  --1|               (completes after first emission)

Source:  --1--2--3--4--5--|
first(x => x > 3)
Output:  -----------4|      (completes after first match)
```

## Examples

### Example 1: Emit only the first value
```typescript
import { interval, first } from 'rxjs';

interval(500).pipe(
  first()
).subscribe({
  next: val => console.log('Value:', val),
  complete: () => console.log('Completed'),
});
// Output: Value: 0
// Output: Completed
```

### Example 2: Emit the first value matching a predicate
```typescript
import { of, first } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  first(n => n > 3)
).subscribe(console.log);
// Output: 4
```

### Example 3: Use a default value to avoid EmptyError
```typescript
import { EMPTY, first } from 'rxjs';

EMPTY.pipe(
  first(null, 'default value')
).subscribe({
  next: val => console.log('Got:', val),
  error: err => console.error('Error:', err),
});
// Output: Got: default value
// (No error thrown because a default was provided)
```

## Common Pitfalls

### Pitfall 1: EmptyError when source completes without a match
Without a default value, `first` throws `EmptyError` if the source completes before emitting a matching value.

```typescript
import { EMPTY, first } from 'rxjs';

// ❌ Will throw EmptyError
EMPTY.pipe(
  first()
).subscribe({
  next: console.log,
  error: err => console.error(err.name), // EmptyError
});

// ✅ Provide a fallback default value
EMPTY.pipe(
  first(null, -1)
).subscribe(console.log); // -1
```

### Pitfall 2: Confusing first with take(1)
`take(1)` will complete silently if the source is empty, while `first()` throws. Choose based on whether an empty source is an error condition.

```typescript
import { EMPTY, first, take } from 'rxjs';

// take(1): completes silently on empty source
EMPTY.pipe(take(1)).subscribe({
  next: console.log,
  complete: () => console.log('completed silently'),
});
// Output: completed silently

// first(): errors on empty source (unless defaultValue is set)
EMPTY.pipe(first()).subscribe({
  error: err => console.error(err.name), // EmptyError
});
```

## Related Operators
- **`take(1)`**: Emits only the first value and completes silently even if the source is empty.
- **`last`**: Emits only the last value (or last match) from a completing source.
- **`find`**: Like `first` with a predicate but emits `undefined` instead of throwing on no match.
- **`filter`**: Emits all matching values rather than just the first.
