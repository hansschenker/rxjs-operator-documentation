# zipWith

## Brief Description
`zipWith` combines the source Observable with one or more other Observables by pairing their emissions **strictly by index**: the first value of each is emitted together as a tuple, then the second of each, and so on. It emits the Nth tuple only once *every* input has produced its Nth value, and it completes as soon as any one of the inputs completes. This operator is the pipeable counterpart to the `zip` creation function, making it ergonomic inside a `pipe` chain when the Observables to zip are known ahead of time.

## Category
combination

## Import
```typescript
import { zipWith } from 'rxjs';
```

## Signature
```typescript
zipWith<T, A extends readonly unknown[]>(
  ...otherInputs: [...ObservableInputTuple<A>]
): OperatorFunction<T, Cons<T, A>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `...otherInputs` | `ObservableInputTuple<A>` | One or more Observables (or values convertible to Observables) to zip with the source, paired by emission index. |

## Return Type
An `OperatorFunction` that produces an Observable emitting tuples (typed arrays). Each tuple holds the source value as its first element followed by the value at the same index from each provided Observable, in order.

## Marble Diagram
```
source$:  --1----2------3-----4--|
other$:   ----a------b------c--|

zipWith(other$)
result$:  ----[1,a]--[2,b]--[3,c]|
          (Nth tuple waits for the Nth value of every input;
           completes when the shortest input completes — 4 is never paired)
```

## Examples

### Example 1: Pair values from two Observables by index
```typescript
import { of, zipWith } from 'rxjs';

const letters$ = of('a', 'b', 'c');
const numbers$ = of(1, 2, 3);

letters$.pipe(
  zipWith(numbers$)
).subscribe(pair => console.log(pair));
// Output:
// [ 'a', 1 ]
// [ 'b', 2 ]
// [ 'c', 3 ]
```

### Example 2: Zip three streams into a structured record
```typescript
import { of, zipWith, map } from 'rxjs';

const ids$ = of(101, 102, 103);
const names$ = of('Alice', 'Bob', 'Charlie');
const roles$ = of('admin', 'editor', 'viewer');

ids$.pipe(
  zipWith(names$, roles$),
  map(([id, name, role]) => ({ id, name, role }))
).subscribe(user => console.log(user));
// Output:
// { id: 101, name: 'Alice', role: 'admin' }
// { id: 102, name: 'Bob', role: 'editor' }
// { id: 103, name: 'Charlie', role: 'viewer' }
```

### Example 3: Pace a fast stream against a timer (throttled reveal)
```typescript
import { from, interval, zipWith, map } from 'rxjs';

// A burst of values available immediately
const words$ = from(['reactive', 'programming', 'is', 'fun']);

// A clock that ticks once per second
const ticks$ = interval(1000);

// zipWith releases one word per tick — the fast source is buffered
// until the slow one catches up, pairing by index.
words$.pipe(
  zipWith(ticks$),
  map(([word]) => word)
).subscribe(word => console.log(word));
// Output (one per second):
// reactive
// programming
// is
// fun
```

## Common Pitfalls

### Pitfall 1: Confusing zipWith with combineLatestWith
`zipWith` pairs values *by index* — the Nth output waits for the Nth value of every input. `combineLatestWith` instead re-emits using the *latest* value from each source whenever any source emits. They produce very different results.

```typescript
import { of, zipWith, combineLatestWith } from 'rxjs';

const source$ = of(1, 2, 3);
const other$ = of('a', 'b', 'c');

// ✅ zipWith — strict 1-to-1 pairing by index
source$.pipe(zipWith(other$)).subscribe(console.log);
// [1, 'a'], [2, 'b'], [3, 'c']

// ❌ Not the same: combineLatestWith uses the latest of each
source$.pipe(combineLatestWith(other$)).subscribe(console.log);
// [3, 'a'], [3, 'b'], [3, 'c']  — source has already emitted its last value
```

### Pitfall 2: Unbounded buffering when inputs emit at different rates
Because output is index-aligned, `zipWith` must buffer values from a faster source while it waits for a slower one to reach the same index. If one input emits far more often than another (or the slower one never emits), the buffer grows without bound and leaks memory.

```typescript
import { interval, zipWith, map } from 'rxjs';

const fast$ = interval(10);   // emits ~100×/sec
const slow$ = interval(1000); // emits 1×/sec

// ❌ fast$ accumulates ~99 buffered values every second, forever
fast$.pipe(
  zipWith(slow$),
  map(([f, s]) => ({ f, s }))
).subscribe(console.log);
// Fix: rate-limit the fast source (e.g. sample/throttle) before zipping,
// or reach for withLatestFrom if you only need the latest slow value.
```

## Related Operators
- **`zip`**: Static creation function; use when all Observables to zip are known upfront and you are not already in a pipe chain.
- **`zipAll`**: Zips the inner Observables emitted by a higher-order Observable, rather than a fixed set known ahead of time.
- **`combineLatestWith`**: Emits using the *latest* value of each source instead of pairing by index.
- **`withLatestFrom`**: Emits only when the *source* emits, sampling the latest value from the other Observables — avoids the buffering problem when you do not need every pairing.
- **`forkJoin`**: Waits for every source to complete and emits only their final values once.
