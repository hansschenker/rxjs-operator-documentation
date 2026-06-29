# expand

## Brief Description
Recursively projects each source value into an Observable, then subscribes to and merges all projected Observables. Unlike `mergeMap`, `expand` also applies the projection function to every value emitted by the inner Observables, creating a recursive expansion. It is typically used for tree traversals, pagination, and any algorithm that requires repeatedly applying a transformation until a termination condition is met.

## Category
transformation

## Import
```typescript
import { expand } from 'rxjs';
```

## Signature
```typescript
expand<T, O extends ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent?: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | `(value: T, index: number) => ObservableInput<T>` | A function applied to each source or inner-emitted value. Return `EMPTY` to stop recursion for a branch. |
| `concurrent` | `number` (optional) | Maximum number of inner Observables subscribed to concurrently. Defaults to `Infinity`. |
| `scheduler` | `SchedulerLike` (optional) | Scheduler for managing concurrency of inner subscriptions. |

## Return Type
An `Observable<T>` that emits all values produced by the recursive expansion.

## Marble Diagram
```
Source:  --2---------|
expand(x => x < 16 ? of(x * 2) : EMPTY)
Output:  --2--4--8--16--|
         (2 → of(4) → of(8) → of(16) → EMPTY)
```

## Examples

### Example 1: Recursively double a number until a limit
```typescript
import { of, expand, EMPTY, take } from 'rxjs';

of(1).pipe(
  expand(x => x < 64 ? of(x * 2) : EMPTY)
).subscribe({
  next: val => console.log(val),
  complete: () => console.log('Done')
});
// Output:
// 1
// 2
// 4
// 8
// 16
// 32
// 64
// Done
```

### Example 2: Paginated API fetching
```typescript
import { of, expand, EMPTY, concatMap, toArray } from 'rxjs';

interface Page {
  data: string[];
  nextPage: number | null;
}

// Simulate an API that returns pages
function fetchPage(page: number) {
  const pages: Record<number, Page> = {
    1: { data: ['item1', 'item2'], nextPage: 2 },
    2: { data: ['item3', 'item4'], nextPage: 3 },
    3: { data: ['item5'], nextPage: null },
  };
  return of(pages[page]);
}

fetchPage(1).pipe(
  expand(page => page.nextPage !== null ? fetchPage(page.nextPage) : EMPTY),
  concatMap(page => page.data),
  toArray()
).subscribe(allItems => console.log('All items:', allItems));
// Output:
// All items: ['item1', 'item2', 'item3', 'item4', 'item5']
```

### Example 3: Tree traversal
```typescript
import { of, expand, EMPTY, filter, map } from 'rxjs';

interface TreeNode {
  value: number;
  children: TreeNode[];
}

const tree: TreeNode = {
  value: 1,
  children: [
    { value: 2, children: [{ value: 4, children: [] }, { value: 5, children: [] }] },
    { value: 3, children: [{ value: 6, children: [] }] },
  ]
};

of(tree).pipe(
  expand(node => node.children.length > 0 ? of(...node.children) : EMPTY),
  map(node => node.value)
).subscribe(val => console.log('Visited node:', val));
// Output (order may vary due to concurrency):
// Visited node: 1
// Visited node: 2
// Visited node: 3
// Visited node: 4
// Visited node: 5
// Visited node: 6
```

## Common Pitfalls

### Pitfall 1: Forgetting to terminate the recursion
If the project function never returns `EMPTY`, `expand` creates an infinite stream.

```typescript
import { of, expand, EMPTY, take } from 'rxjs';

// ❌ No termination condition — infinite stream
of(1).pipe(
  expand(x => of(x + 1))
).subscribe(val => console.log(val)); // runs forever

// ✅ Always provide a termination condition or limit with take
of(1).pipe(
  expand(x => x < 10 ? of(x + 1) : EMPTY)
).subscribe(val => console.log(val));

// ✅ Or use take to cap the number of emissions
of(1).pipe(
  expand(x => of(x + 1)),
  take(10)
).subscribe(val => console.log(val));
```

### Pitfall 2: Not considering concurrent subscriptions
By default, `expand` subscribes to all projected Observables concurrently. For dependent recursive calls (like pagination), limit concurrency to 1.

```typescript
import { of, expand, EMPTY } from 'rxjs';

// ❌ Could cause ordering issues for sequential pagination
of(1).pipe(
  expand(page => page < 3 ? of(page + 1) : EMPTY)
  // concurrent defaults to Infinity
);

// ✅ Set concurrent = 1 for sequential processing
of(1).pipe(
  expand(page => page < 3 ? of(page + 1) : EMPTY, 1)
).subscribe(val => console.log('Page:', val));
```

## Related Operators
- **`mergeMap`**: Projects each value to an Observable and merges results, but does not recursively process inner emissions.
- **`concatMap`**: Like `mergeMap` but queues inner Observables for sequential subscription.
- **`scan`**: Accumulates state over time but does not recursively subscribe to Observables.
