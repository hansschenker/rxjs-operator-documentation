# scan

## Brief Description
Accumulates values from the source Observable over time, emitting the running accumulated result after each emission. It works like `Array.prototype.reduce`, but emits intermediate accumulation results as each value arrives rather than waiting for completion. This makes it ideal for building stateful streams such as running totals, accumulated lists, or event-driven state machines.

## Category
transformation

## Import
```typescript
import { scan } from 'rxjs';
```

## Signature
```typescript
scan<V, A>(accumulator: (acc: A, value: V, index: number) => A, seed?: A): OperatorFunction<V, A>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `accumulator` | `(acc: A, value: V, index: number) => A` | A function applied to the accumulated value and each source value. Returns the new accumulated value. |
| `seed` | `A` (optional) | The initial accumulator value. If omitted, the first source value is used as the initial accumulator. |

## Return Type
An `Observable<A>` that emits the running accumulated value after each source emission.

## Marble Diagram
```
Source:  --1----2----3----4--|
scan((acc, x) => acc + x, 0)
Output:  --1----3----6----10-|
```

## Examples

### Example 1: Running sum
```typescript
import { of, scan } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  scan((acc, val) => acc + val, 0)
).subscribe({
  next: runningTotal => console.log('Running total:', runningTotal),
  complete: () => console.log('Done')
});
// Output:
// Running total: 1
// Running total: 3
// Running total: 6
// Running total: 10
// Running total: 15
// Done
```

### Example 2: Accumulate items into an array
```typescript
import { fromEvent, scan, map } from 'rxjs';

interface LogEntry {
  time: Date;
  message: string;
}

// Simulate incoming log messages
import { Subject } from 'rxjs';

const logMessages$ = new Subject<string>();

logMessages$.pipe(
  map(message => ({ time: new Date(), message })),
  scan((log: LogEntry[], entry: LogEntry) => [...log, entry], [])
).subscribe(log => console.log('Log entries:', log.length));

logMessages$.next('User logged in');
logMessages$.next('Data fetched');
logMessages$.next('Render complete');
// Output:
// Log entries: 1
// Log entries: 2
// Log entries: 3
```

### Example 3: Simple Redux-style state reducer
```typescript
import { Subject, scan } from 'rxjs';

interface State {
  count: number;
  items: string[];
}

type Action =
  | { type: 'INCREMENT' }
  | { type: 'ADD_ITEM'; payload: string }
  | { type: 'RESET' };

const initialState: State = { count: 0, items: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const actions$ = new Subject<Action>();
const state$ = actions$.pipe(scan(reducer, initialState));

state$.subscribe(state => console.log('State:', JSON.stringify(state)));

actions$.next({ type: 'INCREMENT' });
actions$.next({ type: 'ADD_ITEM', payload: 'apple' });
actions$.next({ type: 'INCREMENT' });
actions$.next({ type: 'RESET' });
// Output:
// State: {"count":1,"items":[]}
// State: {"count":1,"items":["apple"]}
// State: {"count":2,"items":["apple"]}
// State: {"count":0,"items":[]}
```

## Common Pitfalls

### Pitfall 1: Mutating the accumulator instead of returning a new value
`scan` expects a pure accumulator function. Mutating the accumulator and returning the same reference can lead to unexpected behavior and breaks immutability.

```typescript
import { of, scan } from 'rxjs';

// ❌ Mutating the accumulator — side effects and unpredictable behavior
of('a', 'b', 'c').pipe(
  scan((acc: string[], val: string) => {
    acc.push(val); // mutates the existing array
    return acc;
  }, [])
).subscribe(arr => console.log([...arr]));

// ✅ Return a new array each time
of('a', 'b', 'c').pipe(
  scan((acc: string[], val: string) => [...acc, val], [])
).subscribe(arr => console.log(arr));
```

### Pitfall 2: Expecting scan to behave like reduce (emit only on completion)
`scan` emits after every source value, not just on completion. Use `reduce` if you only want the final accumulated value.

```typescript
import { of, scan, reduce } from 'rxjs';

// scan emits intermediate results
of(1, 2, 3).pipe(
  scan((acc, val) => acc + val, 0)
).subscribe(val => console.log('scan:', val));
// scan: 1
// scan: 3
// scan: 6

// reduce only emits the final result
of(1, 2, 3).pipe(
  reduce((acc, val) => acc + val, 0)
).subscribe(val => console.log('reduce:', val));
// reduce: 6
```

## Related Operators
- **`reduce`**: Like `scan` but only emits the final accumulated value when the source completes.
- **`map`**: Transforms each value independently without maintaining accumulated state.
- **`mergeScan`**: Like `scan` but the accumulator function returns an Observable.
- **`tap`**: Useful for inspecting intermediate values without affecting accumulation.
