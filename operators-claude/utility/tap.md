# tap

## Brief Description
`tap` performs a side effect for every emission on the source observable without modifying the values. It is primarily used for debugging, logging, or triggering external effects (such as updating a loading state) while keeping the observable pipeline pure and unaltered. Think of it as a transparent passthrough that lets you "peek" at values as they flow through the stream.

## Category
utility

## Import
```typescript
import { tap } from 'rxjs';
```

## Signature
```typescript
tap<T>(observerOrNext?: Partial<TapObserver<T>> | ((value: T) => void)): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| observerOrNext | `Partial<TapObserver<T>>` \| `(value: T) => void` | Either a partial observer object with `next`, `error`, and/or `complete` callbacks, or a single `next` callback function. |

## Return Type
Returns a `MonoTypeOperatorFunction<T>` — an operator that returns an observable identical to the source, emitting the same values, error, and completion signals unchanged.

## Marble Diagram
```
Source:   --a--b--c--|>
Side effect triggered at each emission
tap:      --a--b--c--|>
          (values pass through unmodified)
```

## Examples

### Example 1: Logging values for debugging
```typescript
import { of, tap } from 'rxjs';
import { map } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  tap(value => console.log('Before map:', value)),
  map(value => value * 2),
  tap(value => console.log('After map:', value))
).subscribe(value => console.log('Result:', value));

// Output:
// Before map: 1
// After map: 2
// Result: 2
// Before map: 2
// After map: 4
// Result: 4
// ... and so on
```

### Example 2: Using full observer object to handle next, error, and complete
```typescript
import { of, tap, throwError } from 'rxjs';
import { concatMap } from 'rxjs';

of('fetch-data').pipe(
  tap({
    next: value => console.log('Starting request for:', value),
    error: err => console.error('Request failed:', err.message),
    complete: () => console.log('All requests complete')
  }),
  concatMap(() => of({ id: 1, name: 'Alice' }))
).subscribe({
  next: data => console.log('Received:', data),
  complete: () => console.log('Done')
});

// Output:
// Starting request for: fetch-data
// Received: { id: 1, name: 'Alice' }
// All requests complete
// Done
```

### Example 3: Managing UI loading state
```typescript
import { of, tap, delay } from 'rxjs';

let isLoading = false;

const fetchUsers$ = of([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]).pipe(
  delay(500) // simulate network latency
);

fetchUsers$.pipe(
  tap({
    next: () => { isLoading = false; },
    error: () => { isLoading = false; }
  })
);

// Before subscribing, set loading to true:
isLoading = true;

fetchUsers$.pipe(
  tap({
    next: users => console.log('Users loaded, count:', users.length),
    complete: () => { isLoading = false; console.log('Loading done, isLoading:', isLoading); }
  })
).subscribe(users => console.log(users));
```

## Common Pitfalls

### Pitfall 1: Mutating values inside tap
Do not mutate values inside `tap`. It is intended for side effects only. Mutations can cause subtle bugs and violate the principle of observable purity.

```typescript
import { of, tap } from 'rxjs';

// ❌ Incorrect — mutating objects inside tap
of({ name: 'alice' }).pipe(
  tap(user => {
    user.name = user.name.toUpperCase(); // mutates the object!
  })
).subscribe(user => console.log(user.name)); // 'ALICE' — side-effected mutation

// ✅ Correct — use map to transform, tap only for side effects
import { map } from 'rxjs';
of({ name: 'alice' }).pipe(
  map(user => ({ ...user, name: user.name.toUpperCase() })),
  tap(user => console.log('Transformed user:', user.name))
).subscribe(user => console.log(user.name));
```

### Pitfall 2: Throwing errors inside tap
Throwing inside a `tap` callback will break the pipeline with an unhandled error and bypass any error handling you may have downstream.

```typescript
import { of, tap, catchError, EMPTY } from 'rxjs';

// ❌ Incorrect — throwing inside tap bypasses downstream catchError
of(null).pipe(
  tap(value => {
    if (!value) throw new Error('Value is null'); // disrupts the pipeline
  }),
  catchError(err => { console.log('Caught:', err.message); return EMPTY; })
).subscribe();

// ✅ Correct — use map or filter to gate logic; let errors propagate naturally
import { filter, map } from 'rxjs';
of(null, 1, 2).pipe(
  filter((value): value is number => value !== null),
  tap(value => console.log('Valid value:', value))
).subscribe();
```

## Related Operators
- **`map`**: Use `map` when you want to transform values; use `tap` when you only need side effects without transformation.
- **`finalize`**: Like `tap` but fires its callback only when the observable completes or errors (terminates), not on each emission.
- **`do`**: The legacy RxJS 5 name for `tap`; fully replaced by `tap` in RxJS 6+.
