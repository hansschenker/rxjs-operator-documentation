# isEmpty

## Brief Description
The `isEmpty` operator emits `true` if the source observable completes without emitting any values, or `false` as soon as the source emits its first value (after which it completes immediately). It is useful for checking whether a stream produced any output — for example, validating that a search returned results.

## Category
filtering

## Import
```typescript
import { isEmpty } from 'rxjs';
```

## Signature
```typescript
isEmpty<T>(): OperatorFunction<T, boolean>
```

## Parameters
None.

## Return Type
An `OperatorFunction<T, boolean>` — an Observable that emits a single `boolean` and completes.

## Marble Diagram
```
Source:  --|
isEmpty()
Output:  --true|      (source completed without emitting)

Source:  --1--2--3--|
isEmpty()
Output:  --false|     (short-circuits on first emission)
```

## Examples

### Example 1: Check if a stream is empty
```typescript
import { EMPTY, isEmpty } from 'rxjs';

EMPTY.pipe(
  isEmpty()
).subscribe(result => console.log('Is empty?', result));
// Output: Is empty? true
```

### Example 2: Check if a filtered stream produced any results
```typescript
import { of, filter, isEmpty } from 'rxjs';

const items = [1, 3, 5, 7];

of(...items).pipe(
  filter(n => n % 2 === 0),
  isEmpty()
).subscribe(empty => {
  if (empty) {
    console.log('No even numbers found');
  } else {
    console.log('Found at least one even number');
  }
});
// Output: No even numbers found
```

### Example 3: Use isEmpty to conditionally show a placeholder
```typescript
import { of, filter, isEmpty, switchMap } from 'rxjs';

const searchResults$ = of('result-1', 'result-2');

searchResults$.pipe(
  isEmpty()
).subscribe(empty => {
  const placeholder = document.querySelector('#no-results');
  if (placeholder instanceof HTMLElement) {
    placeholder.style.display = empty ? 'block' : 'none';
  }
});
```

## Common Pitfalls

### Pitfall 1: Confusing isEmpty with checking the emitted values
`isEmpty` tells you whether the stream had *any* values — it does not give you the values themselves. If you need the values *and* a check, use a different approach.

```typescript
import { of, isEmpty, toArray } from 'rxjs';

// ❌ isEmpty throws away all values — cannot use them afterward
of(1, 2, 3).pipe(isEmpty()).subscribe(empty => {
  // You can check empty, but the values 1, 2, 3 are gone
});

// ✅ Use toArray to get the values and check length
of(1, 2, 3).pipe(toArray()).subscribe(arr => {
  console.log('Empty?', arr.length === 0);
  console.log('Values:', arr);
});
```

### Pitfall 2: Using isEmpty on an infinite observable
`isEmpty` can only emit `false` immediately on the first value, or `true` when the source completes. An infinite stream with no early values means `isEmpty` will never emit `true`.

```typescript
import { interval, isEmpty } from 'rxjs';

// interval immediately emits 0, so isEmpty emits false right away
interval(500).pipe(
  isEmpty()
).subscribe(console.log); // false (immediately)
```

## Related Operators
- **`every`**: Emits a boolean whether all values pass a predicate.
- **`defaultIfEmpty`**: Emits a default value if the source is empty (does not emit a boolean).
- **`count`**: Emits the total count of source values on completion.
- **`find`**: Emits the first matching value or `undefined`.
