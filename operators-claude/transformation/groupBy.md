# groupBy

## Brief Description
Groups source emissions into separate Observables based on a key selector function, emitting a `GroupedObservable` for each unique key encountered. Each `GroupedObservable` emits the values belonging to its group. This operator is useful for categorizing stream data — such as grouping log entries by level, users by role, or transactions by category — and processing each group independently.

## Category
transformation

## Import
```typescript
import { groupBy } from 'rxjs';
```

## Signature
```typescript
groupBy<T, K, R>(
  keySelector: (value: T) => K,
  options?: {
    element?: (value: T) => R;
    duration?: (grouped: GroupedObservable<K, R>) => Observable<unknown>;
    connector?: () => Subject<R>;
  }
): OperatorFunction<T, GroupedObservable<K, R>>

// Legacy overload (still supported but prefer options object):
groupBy<T, K>(
  keySelector: (value: T) => K,
  elementSelector?: void,
  durationSelector?: (grouped: GroupedObservable<K, T>) => Observable<unknown>
): OperatorFunction<T, GroupedObservable<K, T>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `keySelector` | `(value: T) => K` | A function that extracts the grouping key from each source value. |
| `options.element` | `(value: T) => R` (optional) | A function to transform values before emitting them in the group. |
| `options.duration` | `(grouped: GroupedObservable<K, R>) => Observable<unknown>` (optional) | A function that returns an Observable; when that Observable emits, the group is closed. |
| `options.connector` | `() => Subject<R>` (optional) | Factory for the Subject used internally to multicast group values. Defaults to a plain `Subject`. |

## Return Type
An `Observable<GroupedObservable<K, R>>` where each `GroupedObservable<K, R>` has a `key` property and emits the values belonging to that group.

## Marble Diagram
```
Source:  --{k:a,v:1}--{k:b,v:2}--{k:a,v:3}--{k:b,v:4}--|
groupBy(x => x.k)
Output:  --GroupA---------GroupB-----------------------|
          GroupA: --1-----------3-----------------------|
          GroupB: -------------2-----------4-----------|
```

## Examples

### Example 1: Group users by role
```typescript
import { from, groupBy, mergeMap, toArray } from 'rxjs';

interface User {
  name: string;
  role: 'admin' | 'user' | 'moderator';
}

const users: User[] = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Charlie', role: 'moderator' },
  { name: 'Diana', role: 'admin' },
  { name: 'Eve', role: 'user' },
];

from(users).pipe(
  groupBy(user => user.role),
  mergeMap(group$ =>
    group$.pipe(
      toArray(),
      // Add the key back for labeling
    )
  )
).subscribe(group => console.log(group));
// Output (order may vary):
// [{ name: 'Alice', role: 'admin' }, { name: 'Diana', role: 'admin' }]
// [{ name: 'Bob', role: 'user' }, { name: 'Eve', role: 'user' }]
// [{ name: 'Charlie', role: 'moderator' }]
```

### Example 2: Group and transform with element selector
```typescript
import { from, groupBy, mergeMap, toArray } from 'rxjs';

interface Transaction {
  id: number;
  category: string;
  amount: number;
}

const transactions: Transaction[] = [
  { id: 1, category: 'food', amount: 20 },
  { id: 2, category: 'travel', amount: 150 },
  { id: 3, category: 'food', amount: 35 },
  { id: 4, category: 'travel', amount: 80 },
  { id: 5, category: 'food', amount: 12 },
];

from(transactions).pipe(
  groupBy(
    t => t.category,
    { element: t => t.amount } // extract only the amount
  ),
  mergeMap(group$ =>
    group$.pipe(
      toArray(),
      // combine key and amounts
    )
  )
).subscribe(amounts => console.log('Amounts:', amounts));
// Output:
// Amounts: [20, 35, 12]  (food)
// Amounts: [150, 80]     (travel)
```

### Example 3: Access group key and reduce each group
```typescript
import { from, groupBy, mergeMap, reduce, map } from 'rxjs';

interface Sale {
  product: string;
  amount: number;
}

const sales: Sale[] = [
  { product: 'Widget', amount: 100 },
  { product: 'Gadget', amount: 200 },
  { product: 'Widget', amount: 150 },
  { product: 'Gadget', amount: 75 },
  { product: 'Widget', amount: 50 },
];

from(sales).pipe(
  groupBy(sale => sale.product),
  mergeMap(group$ =>
    group$.pipe(
      reduce((total, sale) => total + sale.amount, 0),
      map(total => ({ product: group$.key, total }))
    )
  )
).subscribe(summary => console.log(summary));
// Output:
// { product: 'Widget', total: 300 }
// { product: 'Gadget', total: 275 }
```

## Common Pitfalls

### Pitfall 1: Not subscribing to the GroupedObservable
Each `GroupedObservable` emitted by `groupBy` must be subscribed to (usually via `mergeMap`). Unsubscribed groups buffer their values and may cause memory leaks.

```typescript
import { from, groupBy, mergeMap, toArray } from 'rxjs';

// ❌ Not subscribing to inner groups — values are buffered and lost
from([1, 2, 3, 4]).pipe(
  groupBy(x => x % 2 === 0 ? 'even' : 'odd')
).subscribe(group$ => {
  console.log('Got group:', group$.key);
  // Never subscribing to group$ — values buffered forever
});

// ✅ Always subscribe to each group (typically with mergeMap)
from([1, 2, 3, 4]).pipe(
  groupBy(x => x % 2 === 0 ? 'even' : 'odd'),
  mergeMap(group$ => group$.pipe(toArray()))
).subscribe(group => console.log(group));
```

### Pitfall 2: Expecting groups to complete with the source
Groups complete when the source completes only if there is no `duration` selector. With `duration`, groups can complete independently.

```typescript
import { from, groupBy, mergeMap, reduce } from 'rxjs';

// ✅ Without duration, groups complete when the source completes
from([1, 2, 3]).pipe(
  groupBy(x => x % 2),
  mergeMap(group$ => group$.pipe(reduce((acc, val) => acc + val, 0)))
).subscribe(sum => console.log(sum));
// Prints final sums because source completes, which closes groups
```

## Related Operators
- **`partition`**: Splits a source into exactly two Observables based on a predicate — simpler than `groupBy` when you only need two groups.
- **`mergeMap`**: Essential companion to `groupBy` for subscribing to each group Observable.
- **`reduce`**: Often used inside `mergeMap` after `groupBy` to aggregate each group.
- **`toArray`**: Collects each group's emissions into an array.
