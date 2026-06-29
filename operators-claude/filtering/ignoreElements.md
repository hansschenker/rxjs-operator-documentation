# ignoreElements

## Brief Description
The `ignoreElements` operator suppresses all `next` notifications from the source observable but passes through `error` and `complete` notifications unchanged. The resulting observable will only notify observers of errors or completion, making it useful when you care about the side-effects of a stream or its terminal state but not its emitted values.

## Category
filtering

## Import
```typescript
import { ignoreElements } from 'rxjs';
```

## Signature
```typescript
ignoreElements<T>(): OperatorFunction<T, never>
```

## Parameters
None.

## Return Type
An `OperatorFunction<T, never>` — an Observable that never emits values (`never` type) but can notify on error or complete.

## Marble Diagram
```
Source:  --1--2--3--4--5--|
ignoreElements()
Output:  -----------------| (no values; only completion passes through)

Source:  --1--2--#
ignoreElements()
Output:  ----------#        (error passes through)
```

## Examples

### Example 1: Wait for a stream to complete, ignoring its values
```typescript
import { interval, take, ignoreElements } from 'rxjs';

interval(500).pipe(
  take(5),
  ignoreElements()
).subscribe({
  next: () => {},           // Never called
  complete: () => console.log('Stream completed after 5 ticks'),
  error: err => console.error(err),
});
// Output (after ~2500ms): Stream completed after 5 ticks
```

### Example 2: Monitor only for errors
```typescript
import { of, throwError, ignoreElements, catchError } from 'rxjs';

const riskyOperation$ = throwError(() => new Error('Something went wrong'));

riskyOperation$.pipe(
  ignoreElements(),
  catchError(err => {
    console.error('Caught error:', err.message);
    return of(null);
  })
).subscribe();
// Output: Caught error: Something went wrong
```

### Example 3: Combine with merge to react to completion
```typescript
import { interval, take, ignoreElements, merge, of } from 'rxjs';

const background$ = interval(500).pipe(
  take(3),
  ignoreElements()
);

merge(background$, of('Start!')).pipe().subscribe({
  next: val => console.log(val),
  complete: () => console.log('Background task done'),
});
// Output: Start!, Background task done (after ~1500ms)
```

## Common Pitfalls

### Pitfall 1: Expecting ignoreElements to prevent subscription
`ignoreElements` still subscribes to the source and lets it execute — it just suppresses `next` emissions. Side effects in the source (like HTTP calls) still occur.

```typescript
import { of, tap, ignoreElements } from 'rxjs';

// The tap side-effect still runs even though next is suppressed
of(1, 2, 3).pipe(
  tap(n => console.log('Side effect:', n)), // Still runs!
  ignoreElements()
).subscribe({
  next: () => console.log('Next (never)'),   // Never called
  complete: () => console.log('Complete'),
});
// Output: Side effect: 1, Side effect: 2, Side effect: 3, Complete
```

### Pitfall 2: Confusing ignoreElements with NEVER or EMPTY
`NEVER` creates a stream that never emits and never completes. `EMPTY` completes immediately. `ignoreElements` lets a real source run to completion (or error), dropping only `next` notifications.

```typescript
import { interval, take, ignoreElements, NEVER, EMPTY } from 'rxjs';

// EMPTY: completes immediately with no side effects
EMPTY.subscribe({ complete: () => console.log('EMPTY done') }); // Immediate

// ignoreElements: waits for the real source to finish
interval(500).pipe(take(3), ignoreElements()).subscribe({
  complete: () => console.log('Interval done'), // After ~1500ms
});
```

## Related Operators
- **`filter`**: Drops specific values by predicate; still emits others.
- **`EMPTY`**: A pre-made observable that completes immediately with no emissions.
- **`NEVER`**: A pre-made observable that never emits and never completes.
- **`tap`**: Inspect values without changing them; use alongside `ignoreElements` for side-effect-only pipelines.
