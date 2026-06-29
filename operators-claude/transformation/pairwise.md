# pairwise

## Brief Description
Emits the current and previous values as a pair `[previous, current]` each time the source emits. The first source value is never emitted on its own; `pairwise` waits for a second value before emitting the first pair. It is useful for calculating differences between consecutive values, detecting direction changes, or comparing each item to its predecessor.

## Category
transformation

## Import
```typescript
import { pairwise } from 'rxjs';
```

## Signature
```typescript
pairwise<T>(): OperatorFunction<T, [T, T]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| (none) | — | `pairwise` takes no parameters. |

## Return Type
An `Observable<[T, T]>` that emits a tuple of `[previousValue, currentValue]` for each source emission after the first.

## Marble Diagram
```
Source:  --a----b----c----d--|
pairwise()
Output:  -------[a,b]--[b,c]--[c,d]--|
```

## Examples

### Example 1: Calculate the difference between consecutive numbers
```typescript
import { of, pairwise, map } from 'rxjs';

of(1, 5, 3, 9, 2).pipe(
  pairwise(),
  map(([prev, curr]) => curr - prev)
).subscribe(diff => console.log('Difference:', diff));
// Output:
// Difference: 4
// Difference: -2
// Difference: 6
// Difference: -7
```

### Example 2: Detect mouse movement direction
```typescript
import { fromEvent, pairwise, map } from 'rxjs';

const mouseMoves$ = fromEvent<MouseEvent>(document, 'mousemove');

mouseMoves$.pipe(
  map(event => ({ x: event.clientX, y: event.clientY })),
  pairwise(),
  map(([prev, curr]) => ({
    dx: curr.x - prev.x,
    dy: curr.y - prev.y,
    direction: curr.x > prev.x ? 'right' : 'left',
  }))
).subscribe(movement => console.log(movement));
// Output (on each mousemove):
// { dx: 5, dy: 2, direction: 'right' }
// { dx: -3, dy: 8, direction: 'left' }
// ...
```

### Example 3: Compare consecutive route changes
```typescript
import { Subject, pairwise, filter } from 'rxjs';

interface Route {
  path: string;
  params: Record<string, string>;
}

const router$ = new Subject<Route>();

router$.pipe(
  pairwise(),
  filter(([prev, curr]) => prev.path !== curr.path)
).subscribe(([from, to]) => {
  console.log(`Navigated from ${from.path} to ${to.path}`);
});

router$.next({ path: '/home', params: {} });
router$.next({ path: '/home', params: { tab: '2' } }); // same path, filtered out
router$.next({ path: '/profile', params: { id: '42' } });
router$.next({ path: '/settings', params: {} });
// Output:
// Navigated from /home to /profile
// Navigated from /profile to /settings
```

## Common Pitfalls

### Pitfall 1: Expecting the first value to be emitted
`pairwise` requires at least two values before emitting. Streams with only one value produce no output.

```typescript
import { of, pairwise } from 'rxjs';

// ❌ Only one value — pairwise never emits
of(42).pipe(
  pairwise()
).subscribe({
  next: pair => console.log(pair),       // never called
  complete: () => console.log('Done')    // called but no values emitted
});

// ✅ Need at least two values
of(42, 100).pipe(
  pairwise()
).subscribe(pair => console.log(pair)); // [42, 100]
```

### Pitfall 2: Off-by-one when counting pairs
`pairwise` produces `n - 1` pairs for a source that emits `n` values.

```typescript
import { from, pairwise, count } from 'rxjs';

const source = from([10, 20, 30, 40, 50]); // 5 values

source.pipe(
  pairwise(),   // 4 pairs: [10,20], [20,30], [30,40], [40,50]
  count()
).subscribe(n => console.log('Pairs emitted:', n)); // 4
```

## Related Operators
- **`bufferCount`**: Collects emissions into fixed-size arrays; use `bufferCount(2, 1)` to get overlapping pairs similar to `pairwise`.
- **`withLatestFrom`**: Combines each source emission with the latest value from another Observable.
- **`scan`**: Can also compare consecutive values by keeping the previous value in the accumulator.
- **`distinctUntilChanged`**: Suppresses consecutive duplicate values — often used alongside `pairwise`.
