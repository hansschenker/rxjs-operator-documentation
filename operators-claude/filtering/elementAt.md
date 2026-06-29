# elementAt

## Brief Description
The `elementAt` operator emits only the value at the specified zero-based index from the source observable and then completes. If the source completes before reaching the given index, it either emits a provided default value or throws an `ArgumentOutOfRangeError`. It is useful when you need a specific positional item from a stream.

## Category
filtering

## Import
```typescript
import { elementAt } from 'rxjs';
```

## Signature
```typescript
elementAt<T, D = T>(index: number, defaultValue?: D): OperatorFunction<T, T | D>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| index | `number` | The zero-based index of the item to emit. Must be a non-negative integer. |
| defaultValue | `D` | Optional. The value to emit if the source completes before emitting the item at `index`. |

## Return Type
An `OperatorFunction<T, T | D>` — an Observable that emits a single value at the specified index (or the default), then completes.

## Marble Diagram
```
Source:  --a--b--c--d--e--|
elementAt(2)
Output:  --------c|         (index 2 = 'c', then completes)
```

## Examples

### Example 1: Get the third emitted value
```typescript
import { of, elementAt } from 'rxjs';

of('a', 'b', 'c', 'd', 'e').pipe(
  elementAt(2)
).subscribe(console.log);
// Output: c
```

### Example 2: Use a default value when index is out of range
```typescript
import { of, elementAt } from 'rxjs';

of(10, 20).pipe(
  elementAt(5, -1)
).subscribe({
  next: val => console.log('Value:', val),
  error: err => console.error(err),
});
// Output: Value: -1
```

### Example 3: Get the second click event
```typescript
import { fromEvent, elementAt } from 'rxjs';

fromEvent(document, 'click').pipe(
  elementAt(1)
).subscribe(event => {
  console.log('Second click at:', (event as MouseEvent).clientX);
});
// Emits and completes after the second click
```

## Common Pitfalls

### Pitfall 1: Using a negative index
`elementAt` does not support negative indices (unlike array slicing). Passing a negative number throws `ArgumentOutOfRangeError` immediately.

```typescript
import { of, elementAt } from 'rxjs';

// ❌ Throws ArgumentOutOfRangeError
of(1, 2, 3).pipe(
  elementAt(-1)
).subscribe({ error: err => console.error(err.name) });

// ✅ Use a non-negative index; for the last item use last()
import { of, last } from 'rxjs';
of(1, 2, 3).pipe(last()).subscribe(console.log); // 3
```

### Pitfall 2: Not handling ArgumentOutOfRangeError
If the source ends before the requested index and no default is provided, `elementAt` will throw. Always provide a default or an error handler.

```typescript
import { of, elementAt } from 'rxjs';

// ❌ Throws ArgumentOutOfRangeError without error handler
of(1, 2).pipe(elementAt(10)).subscribe(console.log);

// ✅ Provide a default value
of(1, 2).pipe(elementAt(10, null)).subscribe(console.log); // null
```

## Related Operators
- **`first`**: Emits the first value (index 0) with optional predicate support.
- **`last`**: Emits the final value of the source.
- **`skip`**: Skips a given number of items and then emits all remaining.
- **`take`**: Emits only the first N values.
