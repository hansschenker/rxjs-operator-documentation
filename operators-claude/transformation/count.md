# count

## Brief Description
Counts the number of emissions from the source Observable and emits the total count when the source completes. An optional predicate function can be provided to count only emissions that satisfy a condition. `count` is a specialized aggregation operator that waits for the source to complete before emitting the final count.

## Category
transformation

## Import
```typescript
import { count } from 'rxjs';
```

## Signature
```typescript
count<T>(predicate?: (value: T, index: number) => boolean): OperatorFunction<T, number>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `predicate` | `(value: T, index: number) => boolean` (optional) | A function to test each emission. Only emissions for which this returns `true` are counted. If omitted, all emissions are counted. |

## Return Type
An `Observable<number>` that emits a single number — the count of qualifying emissions — when the source completes.

## Marble Diagram
```
Source:  --1----2----3----4--|
count()
Output:  --------------------4|

Source:  --1----2----3----4--|
count(x => x % 2 === 0)
Output:  --------------------2|
```

## Examples

### Example 1: Count all emissions
```typescript
import { range, count } from 'rxjs';

range(1, 100).pipe(
  count()
).subscribe(total => console.log('Total emissions:', total));
// Output:
// Total emissions: 100
```

### Example 2: Count emissions matching a predicate
```typescript
import { from, count } from 'rxjs';

const scores = [88, 45, 92, 67, 55, 78, 95, 40, 83];

from(scores).pipe(
  count(score => score >= 75)
).subscribe(passing => console.log('Passing scores:', passing));
// Output:
// Passing scores: 5
```

### Example 3: Count items in a processed stream
```typescript
import { from, filter, map, count } from 'rxjs';

interface Order {
  id: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
}

const orders: Order[] = [
  { id: 1, status: 'delivered', total: 120 },
  { id: 2, status: 'cancelled', total: 45 },
  { id: 3, status: 'shipped', total: 230 },
  { id: 4, status: 'delivered', total: 89 },
  { id: 5, status: 'pending', total: 67 },
  { id: 6, status: 'delivered', total: 310 },
];

from(orders).pipe(
  filter(order => order.status === 'delivered' && order.total > 100),
  count()
).subscribe(n => console.log(`High-value delivered orders: ${n}`));
// Output:
// High-value delivered orders: 2
```

## Common Pitfalls

### Pitfall 1: Using count on a never-completing Observable
Like all aggregation operators, `count` only emits when the source completes. Infinite streams will cause `count` to never emit.

```typescript
import { interval, count, take } from 'rxjs';

// ❌ interval never completes — count never emits
interval(1000).pipe(
  count()
).subscribe(n => console.log('Never printed:', n));

// ✅ Bound the source first
interval(1000).pipe(
  take(10),
  count()
).subscribe(n => console.log('Count after 10 ticks:', n)); // 10
```

### Pitfall 2: Needing both a count and the values
`count` discards all emitted values and only returns the number. If you also need the values, use a different approach.

```typescript
import { from, count, toArray, map } from 'rxjs';

// ❌ You lose the values
from([1, 2, 3]).pipe(
  count()
).subscribe(n => console.log(n)); // 3 — values gone

// ✅ Use toArray to get both values and count
from([1, 2, 3]).pipe(
  toArray()
).subscribe(arr => {
  console.log('Values:', arr);
  console.log('Count:', arr.length);
});
```

## Related Operators
- **`reduce`**: General-purpose aggregation; use `reduce((acc) => acc + 1, 0)` as an equivalent to `count()`.
- **`toArray`**: Collects all values; `.length` of the resulting array equals `count()`.
- **`filter`**: Often used upstream of `count` to conditionally include values, equivalent to the `predicate` parameter.
- **`max`**: Finds the maximum value among all emissions, also waiting for source completion.
- **`min`**: Finds the minimum value among all emissions.
