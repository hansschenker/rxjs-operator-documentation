# sequenceEqual

## Brief Description
Compares all emissions from two Observables, element by element in order, and emits a single boolean `true` when both sequences complete with the same values in the same order, or `false` if any value differs or the lengths differ. An optional custom comparator can be provided for non-primitive comparison. It is useful for testing, verifying data integrity, or comparing parallel data pipelines.

## Category
transformation

## Import
```typescript
import { sequenceEqual } from 'rxjs';
```

## Signature
```typescript
sequenceEqual<T>(
  compareTo: Observable<T>,
  comparator?: (a: T, b: T) => boolean
): OperatorFunction<T, boolean>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `compareTo` | `Observable<T>` | The second Observable to compare against. |
| `comparator` | `(a: T, b: T) => boolean` (optional) | A function to compare two values. Returns `true` if the values are considered equal. Defaults to strict equality (`===`). |

## Return Type
An `Observable<boolean>` that emits a single `true` if both Observables emit the same values in the same order and complete, or `false` otherwise. Emits as soon as it can determine the result (e.g., immediately on the first mismatch).

## Marble Diagram
```
SourceA: --1----2----3--|
SourceB: --1----2----3--|
sequenceEqual(SourceB)
Output:  ---------------true|

SourceA: --1----2----4--|
SourceB: --1----2----3--|
sequenceEqual(SourceB)
Output:  ---------------false|
```

## Examples

### Example 1: Compare two equal sequences
```typescript
import { of, sequenceEqual } from 'rxjs';

const source$ = of(1, 2, 3, 4, 5);
const compareTo$ = of(1, 2, 3, 4, 5);

source$.pipe(
  sequenceEqual(compareTo$)
).subscribe(isEqual => console.log('Sequences are equal:', isEqual));
// Output:
// Sequences are equal: true
```

### Example 2: Detect sequence mismatch
```typescript
import { from, sequenceEqual } from 'rxjs';

const expected = [10, 20, 30, 40];
const actual = [10, 20, 99, 40]; // 30 vs 99

from(actual).pipe(
  sequenceEqual(from(expected))
).subscribe(isEqual => {
  if (!isEqual) {
    console.error('Data integrity check FAILED: sequences do not match');
  } else {
    console.log('Data integrity check passed');
  }
});
// Output:
// Data integrity check FAILED: sequences do not match
```

### Example 3: Compare object sequences with a custom comparator
```typescript
import { from, sequenceEqual } from 'rxjs';

interface Point {
  x: number;
  y: number;
}

const pathA: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }];
const pathB: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }];

from(pathA).pipe(
  sequenceEqual(
    from(pathB),
    (a, b) => a.x === b.x && a.y === b.y // deep comparison
  )
).subscribe(isEqual => console.log('Paths are equal:', isEqual));
// Output:
// Paths are equal: true

// Without custom comparator, object references differ → false
from(pathA).pipe(
  sequenceEqual(from(pathB)) // uses ===, which compares references
).subscribe(isEqual => console.log('By reference:', isEqual)); // false
```

## Common Pitfalls

### Pitfall 1: Comparing object sequences without a custom comparator
By default, `sequenceEqual` uses `===` (strict equality). Two objects with the same properties but different references are not strictly equal.

```typescript
import { from, sequenceEqual } from 'rxjs';

// ❌ Objects compared by reference — always false for different object literals
from([{ id: 1 }, { id: 2 }]).pipe(
  sequenceEqual(from([{ id: 1 }, { id: 2 }]))
).subscribe(eq => console.log(eq)); // false — different object references

// ✅ Provide a custom comparator for structural equality
from([{ id: 1 }, { id: 2 }]).pipe(
  sequenceEqual(
    from([{ id: 1 }, { id: 2 }]),
    (a, b) => a.id === b.id
  )
).subscribe(eq => console.log(eq)); // true
```

### Pitfall 2: Using sequenceEqual on infinite Observables
`sequenceEqual` buffers values from both streams while waiting for both to complete. Infinite streams will cause unbounded memory usage and `sequenceEqual` will never emit.

```typescript
import { interval, sequenceEqual, take } from 'rxjs';

// ❌ interval never completes — sequenceEqual buffers forever
interval(100).pipe(
  sequenceEqual(interval(100))
).subscribe(eq => console.log('Never printed:', eq));

// ✅ Bound both streams before comparing
interval(100).pipe(
  take(5),
  sequenceEqual(interval(100).pipe(take(5)))
).subscribe(eq => console.log('Equal:', eq));
```

## Related Operators
- **`distinctUntilChanged`**: Suppresses consecutive duplicate values within a single stream rather than comparing two streams.
- **`combineLatest`**: Combines the latest values from multiple streams, but for real-time comparison rather than full-sequence equality.
- **`zip`**: Pairs corresponding emissions from multiple sources — can be used with `every` to implement a custom equality check.
- **`reduce`**: Can be used to build a custom sequence comparison if `sequenceEqual` is too restrictive.
