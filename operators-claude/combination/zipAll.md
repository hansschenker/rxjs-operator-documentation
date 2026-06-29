# zipAll

## Brief Description
`zipAll` collects all inner Observables emitted by a higher-order Observable, waits for the outer Observable to complete, then subscribes to all of them and pairs their values strictly by index — the first value of each inner Observable together, the second value of each together, and so on. It completes when any inner Observable completes. This operator is the higher-order counterpart to `zip` and is useful when you need strict 1-to-1 correspondence across a dynamic set of Observables.

## Category
combination

## Import
```typescript
import { zipAll } from 'rxjs';
```

## Signature
```typescript
zipAll<T>(): OperatorFunction<ObservableInput<T>, T[]>
zipAll<T, R>(project: (...values: T[]) => R): OperatorFunction<ObservableInput<T>, R>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | `(...values: T[]) => R` | Optional projection function applied to each set of index-paired values. If omitted, values are emitted as an array. |

## Return Type
An `OperatorFunction` that flattens a higher-order Observable into an Observable emitting arrays (or projected values) of the nth values from each inner Observable, where n is the index position. Completes when any inner Observable completes.

## Marble Diagram
```
Outer:    --(A$)--(B$)--(C$)--|        (outer must complete)
A$:           --1-----2-----3--|       (1st, 2nd, 3rd values
B$:                --10----20----30--|   paired by index)
C$:                     --100--200--|  

Result:   ----------[1,10,100]--[2,20,200]--|  (C$ completes after 2nd, so result completes)
```

## Examples

### Example 1: Pairing responses from parallel requests by index
```typescript
import { of, interval, zipAll } from 'rxjs';
import { map, take } from 'rxjs/operators';

// Simulate two streams of measurements
const sensorA$ = interval(700).pipe(
  take(3),
  map((i) => `A:${(i + 1) * 10}`)
);

const sensorB$ = interval(1000).pipe(
  take(3),
  map((i) => `B:${(i + 1) * 100}`)
);

// Pair each nth reading from A with the nth reading from B
of(sensorA$, sensorB$).pipe(
  zipAll()
).subscribe(([a, b]) => {
  console.log(`Paired reading: ${a}, ${b}`);
});
// Paired reading: A:10, B:100  (first values of each)
// Paired reading: A:20, B:200  (second values)
// Paired reading: A:30, B:300  (third values, then completes)
```

### Example 2: Correlating rows across multiple data tables
```typescript
import { of, from, zipAll } from 'rxjs';

const userNames = ['Alice', 'Bob', 'Carol'];
const userAges = [30, 25, 35];
const userRoles = ['admin', 'user', 'moderator'];

const combined$ = of(
  from(userNames),
  from(userAges),
  from(userRoles)
).pipe(
  zipAll((name, age, role) => ({ name, age, role }))
);

combined$.subscribe(user => console.log(user));
// { name: 'Alice', age: 30, role: 'admin' }
// { name: 'Bob', age: 25, role: 'user' }
// { name: 'Carol', age: 35, role: 'moderator' }
```

### Example 3: Running test rounds and pairing inputs with expected outputs
```typescript
import { of, from, zipAll } from 'rxjs';
import { map } from 'rxjs/operators';

const inputs = [1, 2, 3, 4, 5];
const expectedOutputs = [1, 4, 9, 16, 25]; // squares

const computeSquare = (n: number) => n * n;

of(
  from(inputs).pipe(map(computeSquare)),
  from(expectedOutputs)
).pipe(
  zipAll((actual, expected) => ({ actual, expected, pass: actual === expected }))
).subscribe(result => {
  const icon = result.pass ? 'PASS' : 'FAIL';
  console.log(`[${icon}] actual=${result.actual}, expected=${result.expected}`);
});
// [PASS] actual=1, expected=1
// [PASS] actual=4, expected=4
// ... etc.
```

## Common Pitfalls

### Pitfall 1: Outer Observable must complete before inner subscriptions begin
Like `combineLatestAll`, `zipAll` buffers inner Observables until the outer source completes. If the outer never completes, no inner subscriptions ever start.

```typescript
import { Subject, of, zipAll } from 'rxjs';

// ❌ outer Subject never completes — zipAll never subscribes to inner Observables
const outer$ = new Subject<any>();
outer$.pipe(zipAll()).subscribe(console.log);
outer$.next(of(1, 2, 3));
outer$.next(of('a', 'b', 'c'));
// Nothing emitted!

// ✅ Use a source that completes
of(
  of(1, 2, 3),
  of('a', 'b', 'c')
).pipe(
  zipAll()
).subscribe(console.log);
// [1, 'a'], [2, 'b'], [3, 'c']
```

### Pitfall 2: Completion when the shortest inner Observable completes
`zipAll` stops emitting as soon as the shortest inner Observable completes. Remaining buffered values in longer Observables are discarded.

```typescript
import { of, zipAll } from 'rxjs';

// ❌ 'c' and 'd' from the first Observable are never emitted
of(
  of('a', 'b', 'c', 'd'),
  of(1, 2)          // completes after 2 values
).pipe(
  zipAll()
).subscribe(console.log);
// ['a', 1]
// ['b', 2]
// (done — second Observable completed, remaining 'c' and 'd' discarded)

// ✅ Ensure all inner Observables have the same length when strict pairing is needed
of(
  of('a', 'b'),
  of(1, 2)
).pipe(
  zipAll()
).subscribe(console.log);
// ['a', 1], ['b', 2]
```

## Related Operators
- **`zip`**: Static creation function; use when inner Observables are known upfront rather than emitted dynamically.
- **`zipWith`**: Pipeable operator for zipping the current Observable with known Observables in a pipe chain.
- **`combineLatestAll`**: Like `zipAll` but uses the *latest* value from each inner Observable instead of strict index pairing.
- **`forkJoin`**: Emits one combined value after all source Observables complete; use for parallel one-shot requests where only the final value matters.
- **`mergeAll`**: Subscribes to inner Observables concurrently without index-based pairing.
