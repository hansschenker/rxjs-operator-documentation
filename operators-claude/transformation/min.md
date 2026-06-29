# min

## Brief Description
Emits the minimum value from the source Observable when it completes. By default, it uses JavaScript's natural comparison (`<`). A custom comparator function can be supplied to compare objects or apply non-standard ordering. Like all aggregation operators, `min` waits for the source to complete before emitting.

## Category
transformation

## Import
```typescript
import { min } from 'rxjs';
```

## Signature
```typescript
min<T>(comparer?: (x: T, y: T) => number): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `comparer` | `(x: T, y: T) => number` (optional) | A function to compare two values. Should return a negative number if `x < y`, positive if `x > y`, or zero if equal. If omitted, values are compared with the `<` operator. |

## Return Type
An `Observable<T>` that emits a single value — the minimum — when the source completes.

## Marble Diagram
```
Source:  --3----1----4----1----5----9--|
min()
Output:  ------------------------------1|
```

## Examples

### Example 1: Find the minimum number
```typescript
import { of, min } from 'rxjs';

of(5, 3, 9, 1, 7, 2, 8).pipe(
  min()
).subscribe({
  next: minVal => console.log('Min value:', minVal),
  complete: () => console.log('Done')
});
// Output:
// Min value: 1
// Done
```

### Example 2: Find the cheapest product with a custom comparator
```typescript
import { from, min } from 'rxjs';

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
  min((a, b) => a.price - b.price)
).subscribe(cheapest => {
  console.log('Cheapest product:', cheapest.name, `($${cheapest.price})`);
});
// Output:
// Cheapest product: Thingamajig ($5.99)
```

### Example 3: Find the earliest date in a stream
```typescript
import { from, min, map } from 'rxjs';

const eventDates = [
  new Date('2024-08-15'),
  new Date('2024-03-01'),
  new Date('2024-11-30'),
  new Date('2024-06-20'),
];

from(eventDates).pipe(
  min((a, b) => a.getTime() - b.getTime())
).subscribe(earliest => {
  console.log('Earliest event:', earliest.toDateString());
});
// Output:
// Earliest event: Fri Mar 01 2024
```

## Common Pitfalls

### Pitfall 1: Using min on objects without a comparator
Without a comparator, `min` uses the `<` operator, which does not meaningfully compare objects.

```typescript
import { from, min } from 'rxjs';

// ❌ Unreliable for objects — < compares by reference
from([{ val: 10 }, { val: 3 }, { val: 7 }]).pipe(
  min()
).subscribe(v => console.log(v)); // unpredictable result

// ✅ Provide a comparator for objects
from([{ val: 10 }, { val: 3 }, { val: 7 }]).pipe(
  min((a, b) => a.val - b.val)
).subscribe(v => console.log('Min:', v)); // { val: 3 }
```

### Pitfall 2: Using min on a non-completing stream
`min` only emits when the source completes. Use `take` or `takeUntil` to bound infinite streams.

```typescript
import { interval, min, take } from 'rxjs';

// ❌ Never emits — interval never completes
interval(100).pipe(min());

// ✅ Bound the stream
interval(100).pipe(
  take(10),
  min()
).subscribe(minTick => console.log('Min tick index:', minTick)); // 0
```

## Related Operators
- **`max`**: Finds the maximum value; the complement of `min`.
- **`reduce`**: General-purpose aggregation; implement `min` as `reduce((acc, val) => val < acc ? val : acc)`.
- **`count`**: Counts the number of emissions rather than finding the smallest value.
- **`first`**: Emits only the first value without waiting for completion — different from `min`.
