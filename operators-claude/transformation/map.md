# map

## Brief Description
Transforms each value emitted by the source Observable by applying a projection function to it. The `map` operator is the most fundamental transformation operator in RxJS, analogous to `Array.prototype.map`. It applies a given function to each emitted value and emits the resulting value, allowing you to transform data as it flows through the Observable pipeline.

## Category
transformation

## Import
```typescript
import { map } from 'rxjs';
```

## Signature
```typescript
map<T, R>(project: (value: T, index: number) => R): OperatorFunction<T, R>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | `(value: T, index: number) => R` | A function applied to each source value. Receives the emitted value and its zero-based index. Returns the transformed value. |

## Return Type
An `Observable<R>` that emits the values produced by the `project` function applied to each source value.

## Marble Diagram
```
Source:  --1----2----3----4--|
map(x => x * 10)
Output:  --10---20---30---40-|
```

## Examples

### Example 1: Transform numbers
```typescript
import { of, map } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  map(x => x * x)
).subscribe({
  next: value => console.log(value),
  complete: () => console.log('Complete')
});
// Output:
// 1
// 4
// 9
// 16
// 25
// Complete
```

### Example 2: Extract a property from objects
```typescript
import { from, map } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
];

from(users).pipe(
  map(user => user.name)
).subscribe(name => console.log(name));
// Output:
// Alice
// Bob
// Charlie
```

### Example 3: Use the index parameter to add positional metadata
```typescript
import { from, map } from 'rxjs';

from(['apple', 'banana', 'cherry']).pipe(
  map((fruit, index) => ({ position: index + 1, name: fruit.toUpperCase() }))
).subscribe(item => console.log(item));
// Output:
// { position: 1, name: 'APPLE' }
// { position: 2, name: 'BANANA' }
// { position: 3, name: 'CHERRY' }
```

## Common Pitfalls

### Pitfall 1: Confusing map with tap for side effects
Use `tap` when you need side effects and want to pass the value through unchanged. Use `map` only when you need to transform the value.

```typescript
import { of, map, tap } from 'rxjs';

// ❌ Using map for a side effect — returns undefined
of(1, 2, 3).pipe(
  map(x => { console.log(x); }) // project returns void/undefined
).subscribe(val => console.log('value:', val)); // val is undefined

// ✅ Use tap for side effects, keep value intact
of(1, 2, 3).pipe(
  tap(x => console.log('side effect:', x)),
  map(x => x * 2) // or just use the value as-is
).subscribe(val => console.log('value:', val));
```

### Pitfall 2: Throwing inside the project function without error handling
If the project function throws, the error propagates to the Observable error channel. Always handle errors downstream.

```typescript
import { of, map, catchError, EMPTY } from 'rxjs';

const data = of('42', 'not-a-number', '100');

// ❌ Unhandled error will terminate the stream
data.pipe(
  map(str => {
    const num = parseInt(str, 10);
    if (isNaN(num)) throw new Error(`Invalid number: ${str}`);
    return num;
  })
).subscribe({
  next: val => console.log(val),
  error: err => console.error(err.message) // stream ends here
});

// ✅ Handle errors gracefully
data.pipe(
  map(str => {
    const num = parseInt(str, 10);
    if (isNaN(num)) throw new Error(`Invalid number: ${str}`);
    return num;
  }),
  catchError(err => {
    console.error('Caught:', err.message);
    return EMPTY;
  })
).subscribe(val => console.log(val));
```

## Related Operators
- **`mapTo`**: Deprecated in RxJS 7; maps every emission to a single constant value instead of applying a function.
- **`tap`**: Performs side effects for each emission without transforming the value.
- **`switchMap`**: Like `map` but the project function returns an Observable, and it switches to the latest inner Observable.
- **`mergeMap`**: Like `map` but the project function returns an Observable, and it merges all inner Observables.
- **`scan`**: Like `map` but accumulates state across emissions, similar to `Array.prototype.reduce`.
