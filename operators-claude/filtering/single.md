# single

## Brief Description
The `single` operator emits the sole value (or sole value matching an optional predicate) from the source observable and then completes. It errors if the source emits more than one matching value or if no matching value is found before the source completes. It is a strict operator used when you want to enforce that exactly one value satisfies your condition.

## Category
filtering

## Import
```typescript
import { single } from 'rxjs';
```

## Signature
```typescript
single<T>(predicate?: (value: T, index: number, source: Observable<T>) => boolean): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| predicate | `(value: T, index: number, source: Observable<T>) => boolean` | Optional. A function to test each source value. If omitted, the source must emit exactly one value. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable that emits one value of type `T` and completes, or errors if the number of matching values is not exactly one.

## Marble Diagram
```
Source:  --42--|
single()
Output:  ------42|    (exactly one value — OK)

Source:  --1--2--|
single()
Output:  --------#    (SequenceError: more than one element)

Source:  --|
single()
Output:  --#           (EmptyError: no elements)
```

## Examples

### Example 1: Assert a stream emits exactly one value
```typescript
import { of, single } from 'rxjs';

of(42).pipe(
  single()
).subscribe({
  next: val => console.log('Single value:', val),
  error: err => console.error('Error:', err.message),
});
// Output: Single value: 42
```

### Example 2: Assert exactly one value matches a predicate
```typescript
import { of, single } from 'rxjs';

const tasks = [
  { id: 1, primary: false },
  { id: 2, primary: true },
  { id: 3, primary: false },
];

of(...tasks).pipe(
  single(task => task.primary)
).subscribe({
  next: task => console.log('Primary task:', task.id),
  error: err => console.error('Error:', err.message),
});
// Output: Primary task: 2
```

### Example 3: Handle SequenceError when multiple values match
```typescript
import { of, single } from 'rxjs';

of(1, 2, 3).pipe(
  single(n => n > 1)
).subscribe({
  next: val => console.log(val),
  error: err => console.error(err.name), // SequenceError
});
// Output: SequenceError
```

## Common Pitfalls

### Pitfall 1: Using single when multiple matches are expected
`single` is intentionally strict. Use `filter` if you expect multiple matches or `first` if you only care about the first one.

```typescript
import { of, single, filter, first } from 'rxjs';

// ❌ Throws SequenceError for multiple matches
of(2, 4, 6).pipe(
  single(n => n % 2 === 0)
).subscribe({ error: err => console.error(err.name) });

// ✅ Use filter for all matches
of(2, 4, 6).pipe(
  filter(n => n % 2 === 0)
).subscribe(console.log); // 2, 4, 6

// ✅ Use first for just the first match
of(2, 4, 6).pipe(
  first(n => n % 2 === 0)
).subscribe(console.log); // 2
```

### Pitfall 2: Not catching errors from empty sources
Like `first`, `single` throws `EmptyError` if the source completes without emitting a match. Always add an error handler.

```typescript
import { EMPTY, single } from 'rxjs';

// ❌ Unhandled EmptyError
EMPTY.pipe(single()).subscribe(console.log);

// ✅ Handle the error
EMPTY.pipe(single()).subscribe({
  next: console.log,
  error: err => console.error('Caught:', err.name),
});
// Output: Caught: EmptyError
```

## Related Operators
- **`first`**: Emits the first matching value; does not error if there are more matches.
- **`find`**: Emits the first matching value or `undefined`; never errors.
- **`filter`**: Emits all matching values without enforcing a count.
- **`every`**: Checks that all values satisfy a predicate.
