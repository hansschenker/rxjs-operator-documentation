# max

## Brief Description
Emits the maximum value from the source Observable when it completes. By default, it uses JavaScript's natural comparison (`>`). A custom comparator function can be provided to handle objects or non-standard ordering. Like all aggregation operators, `max` buffers all values and emits only once on source completion.

## Category
transformation

## Import
```typescript
import { max } from 'rxjs';
```

## Signature
```typescript
max<T>(comparer?: (x: T, y: T) => number): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `comparer` | `(x: T, y: T) => number` (optional) | A function to compare two values. Should return a positive number if `x > y`, negative if `x < y`, or zero if equal. If omitted, values are compared with the `>` operator. |

## Return Type
An `Observable<T>` that emits a single value — the maximum — when the source completes.

## Marble Diagram
```
Source:  --3----1----4----1----5----9--|
max()
Output:  ------------------------------9|
```

## Examples

### Example 1: Find the maximum number
```typescript
import { of, max } from 'rxjs';

of(5, 3, 9, 1, 7, 2, 8).pipe(
  max()
).subscribe({
  next: maxVal => console.log('Max value:', maxVal),
  complete: () => console.log('Done')
});
// Output:
// Max value: 9
// Done
```

### Example 2: Find the maximum with a custom comparator (objects)
```typescript
import { from, max } from 'rxjs';

interface Product {
  name: string;
  price: number;
}

const products: Product[] = [
  { name: 'Widget', price: 9.99 },
  { name: 'Gadget', price: 49.99 },
  { name: 'Doohickey', price: 14.99 },
  { name: 'Thingamajig', price: 5.99 },
];

from(products).pipe(
  max((a, b) => a.price - b.price)
).subscribe(mostExpensive => {
  console.log('Most expensive product:', mostExpensive.name, `($${mostExpensive.price})`);
});
// Output:
// Most expensive product: Gadget ($49.99)
```

### Example 3: Find the latest date in a stream
```typescript
import { from, max, map } from 'rxjs';

const dateStrings = [
  '2024-03-15',
  '2024-01-01',
  '2024-07-22',
  '2024-05-10',
];

from(dateStrings).pipe(
  map(s => new Date(s)),
  max((a, b) => a.getTime() - b.getTime())
).subscribe(latest => console.log('Latest date:', latest.toDateString()));
// Output:
// Latest date: Mon Jul 22 2024
```

## Common Pitfalls

### Pitfall 1: Expecting max to work correctly with objects without a comparator
Without a comparator, `max` uses JavaScript's `>` operator, which compares objects by reference rather than by value.

```typescript
import { from, max } from 'rxjs';

// ❌ Object comparison without comparator — result is unpredictable
from([{ score: 10 }, { score: 5 }, { score: 20 }]).pipe(
  max()
).subscribe(val => console.log(val)); // unreliable!

// ✅ Provide a comparator for objects
from([{ score: 10 }, { score: 5 }, { score: 20 }]).pipe(
  max((a, b) => a.score - b.score)
).subscribe(val => console.log('Max:', val)); // { score: 20 }
```

### Pitfall 2: Using max on an empty Observable
If the source completes without emitting any values, `max` completes without emitting.

```typescript
import { EMPTY, max } from 'rxjs';

EMPTY.pipe(
  max()
).subscribe({
  next: val => console.log('Received:', val), // never called
  complete: () => console.log('Completed without a value')
});
```

## Related Operators
- **`min`**: Finds the minimum value; the mirror image of `max`.
- **`reduce`**: General-purpose aggregation; implement `max` as `reduce((acc, val) => val > acc ? val : acc)`.
- **`count`**: Counts the number of emissions instead of finding the maximum.
- **`toArray`**: Collects all values; you can then use `Math.max(...arr)` on the result.
