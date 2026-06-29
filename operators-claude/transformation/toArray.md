# toArray

## Brief Description
Collects all values emitted by the source Observable into a single array and emits that array when the source completes. It is a convenience shorthand for `reduce((acc, val) => [...acc, val], [])`. Because `toArray` waits for completion, it is unsuitable for infinite or long-running streams unless they are bounded with operators like `take` or `takeUntil`.

## Category
transformation

## Import
```typescript
import { toArray } from 'rxjs';
```

## Signature
```typescript
toArray<T>(): OperatorFunction<T, T[]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| (none) | — | `toArray` takes no parameters. |

## Return Type
An `Observable<T[]>` that emits a single array containing all source values when the source completes.

## Marble Diagram
```
Source:  --1----2----3----4--|
toArray()
Output:  --------------------[1,2,3,4]|
```

## Examples

### Example 1: Collect a finite stream into an array
```typescript
import { range, toArray } from 'rxjs';

range(1, 5).pipe(
  toArray()
).subscribe({
  next: arr => console.log('Array:', arr),
  complete: () => console.log('Complete')
});
// Output:
// Array: [1, 2, 3, 4, 5]
// Complete
```

### Example 2: Accumulate filtered values into an array
```typescript
import { from, filter, map, toArray } from 'rxjs';

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

const products: Product[] = [
  { id: 1, name: 'Widget', price: 9.99, inStock: true },
  { id: 2, name: 'Gadget', price: 49.99, inStock: false },
  { id: 3, name: 'Doohickey', price: 14.99, inStock: true },
  { id: 4, name: 'Thingamajig', price: 5.99, inStock: true },
];

from(products).pipe(
  filter(p => p.inStock && p.price < 20),
  map(p => p.name),
  toArray()
).subscribe(names => console.log('Affordable in-stock items:', names));
// Output:
// Affordable in-stock items: ['Widget', 'Doohickey', 'Thingamajig']
```

### Example 3: Batch API results into an array before processing
```typescript
import { from, mergeMap, toArray, take } from 'rxjs';
import { of } from 'rxjs';

const userIds = [101, 102, 103, 104];

// Simulate fetching user data
function fetchUser(id: number) {
  return of({ id, name: `User ${id}`, active: id % 2 === 0 });
}

from(userIds).pipe(
  mergeMap(id => fetchUser(id)),
  toArray()
).subscribe(users => {
  const activeUsers = users.filter(u => u.active);
  console.log('All users:', users.length);
  console.log('Active users:', activeUsers);
});
// Output:
// All users: 4
// Active users: [{ id: 102, name: 'User 102', active: true }, { id: 104, name: 'User 104', active: true }]
```

## Common Pitfalls

### Pitfall 1: Using toArray on an infinite Observable
`toArray` only emits when the source completes. Infinite Observables will never emit the array.

```typescript
import { interval, toArray, take } from 'rxjs';

// ❌ interval never completes — toArray never emits
interval(1000).pipe(
  toArray()
).subscribe(arr => console.log('Never printed:', arr));

// ✅ Bound the stream first
interval(1000).pipe(
  take(5),
  toArray()
).subscribe(arr => console.log('First 5 ticks:', arr));
```

### Pitfall 2: Expecting a stream of arrays from toArray
`toArray` emits exactly one array. It does not emit a new array for each value.

```typescript
import { of, toArray, bufferCount } from 'rxjs';

// ❌ Expecting multiple arrays
of(1, 2, 3, 4).pipe(
  toArray()
).subscribe(x => console.log(x)); // prints ONE array: [1, 2, 3, 4]

// ✅ Use bufferCount for chunked arrays
of(1, 2, 3, 4).pipe(
  bufferCount(2)
).subscribe(x => console.log(x));
// [1, 2]
// [3, 4]
```

## Related Operators
- **`reduce`**: General-purpose aggregation operator; `toArray` is equivalent to `reduce((acc, val) => [...acc, val], [])`.
- **`bufferCount`**: Emits arrays of a fixed size as the source emits, rather than waiting for completion.
- **`buffer`**: Collects values into arrays based on a signal from another Observable.
- **`count`**: Emits the total number of source emissions on completion, without collecting the values.
