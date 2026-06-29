# distinct

## Brief Description
The `distinct` operator emits all items from the source observable that are not equal to any previously emitted item. It maintains an internal set of seen values for the lifetime of the subscription and only passes through values not yet seen. An optional `keySelector` function allows comparison by a derived key rather than the value itself, and an optional `flushes` observable can reset the set of seen values.

## Category
filtering

## Import
```typescript
import { distinct } from 'rxjs';
```

## Signature
```typescript
distinct<T, K>(
  keySelector?: (value: T) => K,
  flushes?: Observable<any>
): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| keySelector | `(value: T) => K` | Optional. A function to extract the key used for uniqueness comparison. If omitted, the value itself is used. |
| flushes | `Observable<any>` | Optional. An observable that, when it emits, resets the internal set of seen values, allowing duplicates to be emitted again. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type emitting only unique values.

## Marble Diagram
```
Source:  --1--2--1--3--2--4--|
distinct()
Output:  --1--2-----3-----4--|
```

## Examples

### Example 1: Filter duplicate numbers
```typescript
import { of, distinct } from 'rxjs';

of(1, 2, 1, 3, 2, 4, 3).pipe(
  distinct()
).subscribe(console.log);
// Output: 1, 2, 3, 4
```

### Example 2: Distinct by object property key
```typescript
import { of, distinct } from 'rxjs';

const items = [
  { id: 1, label: 'Apple' },
  { id: 2, label: 'Banana' },
  { id: 1, label: 'Apple (duplicate)' },
  { id: 3, label: 'Cherry' },
];

of(...items).pipe(
  distinct(item => item.id)
).subscribe(item => console.log(item.label));
// Output: Apple, Banana, Cherry
```

### Example 3: Use flushes to reset the seen-values set
```typescript
import { Subject, of, concat, distinct } from 'rxjs';

const flush$ = new Subject<void>();

concat(
  of(1, 2, 1, 3),
  new Promise<void>(resolve => {
    flush$.next(); // reset the set
    resolve();
  }).then(() => of(1, 2)) // 1 and 2 appear again after flush
);

// Simpler demonstration:
const source$ = new Subject<number>();

source$.pipe(
  distinct(undefined, flush$)
).subscribe(console.log);

source$.next(1); // 1
source$.next(2); // 2
source$.next(1); // suppressed
flush$.next();   // reset
source$.next(1); // 1 again (set was reset)
source$.next(2); // 2 again
```

## Common Pitfalls

### Pitfall 1: Memory growth on long-lived streams
`distinct` stores every unique value ever seen in an internal Set. For long-running streams with many unique values this set grows unboundedly, leading to memory leaks.

```typescript
import { interval, distinct } from 'rxjs';

// ❌ Internal set grows forever — memory leak
interval(100).pipe(
  distinct()
).subscribe();

// ✅ Use distinctUntilChanged for consecutive deduplication, or
//    use the flushes parameter to periodically clear the set
import { timer, distinctUntilChanged } from 'rxjs';
interval(100).pipe(
  distinctUntilChanged()
).subscribe();
```

### Pitfall 2: Using distinct for object identity (not deep equality)
`distinct` uses a JavaScript `Set` internally, which uses `===` for comparison. Two different object references with the same content are treated as distinct.

```typescript
import { of, distinct } from 'rxjs';

// ❌ Both objects are different references — both are emitted
of({ x: 1 }, { x: 1 }).pipe(
  distinct()
).subscribe(console.log); // { x: 1 }, { x: 1 }

// ✅ Use a key selector to compare by a primitive property
of({ x: 1 }, { x: 1 }).pipe(
  distinct(obj => obj.x)
).subscribe(console.log); // { x: 1 }
```

## Related Operators
- **`distinctUntilChanged`**: Only suppresses consecutive duplicates — more memory-efficient for long streams.
- **`distinctUntilKeyChanged`**: Like `distinctUntilChanged` but compares by a named object property.
- **`filter`**: General-purpose value suppression based on any predicate.
