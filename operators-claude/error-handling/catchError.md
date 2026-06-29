# catchError

## Brief Description
`catchError` intercepts an error on the source observable and returns a new observable (or throws a new error) in its place, allowing the stream to recover gracefully. It is the primary operator for error recovery in RxJS pipelines — you can substitute a fallback value, retry with a different source, or rethrow a transformed error.

## Category
error-handling

## Import
```typescript
import { catchError } from 'rxjs';
```

## Signature
```typescript
catchError<T, O extends ObservableInput<any>>(
  selector: (err: any, caught: Observable<T>) => O
): OperatorFunction<T, T | ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `(err: any, caught: Observable<T>) => ObservableInput<any>` | A function that receives the error and the caught (source) observable. Must return an `ObservableInput` (Observable, Promise, array, etc.) to replace the errored stream, or rethrow. |

## Return Type
An `OperatorFunction` that returns an observable that mirrors the source but replaces any error with the observable returned by the selector. If the selector itself throws, the resulting observable errors with that new error.

## Marble Diagram
```
Source:   --a--b--#  (# = error)
selector: returns --c--d--|

Result:   --a--b--c--d--|

Source:   --a--b--#
selector: throwError(() => newError)

Result:   --a--b--#  (new error)
```

## Examples

### Example 1: Return a fallback observable on error
```typescript
import { of, throwError, catchError } from 'rxjs';

const source$ = throwError(() => new Error('Something went wrong'));

source$.pipe(
  catchError(err => {
    console.error('Caught error:', err.message);
    return of('Fallback value');
  })
).subscribe({
  next: value => console.log('Value:', value),
  complete: () => console.log('Complete'),
});
// Output:
// Caught error: Something went wrong
// Value: Fallback value
// Complete
```

### Example 2: Retry the original source using the `caught` argument
```typescript
import { interval, throwError, catchError, mergeMap, take } from 'rxjs';

let attempts = 0;

const source$ = interval(500).pipe(
  take(3),
  mergeMap(i => {
    attempts++;
    if (attempts < 4) {
      return throwError(() => new Error(`Attempt ${attempts} failed`));
    }
    return of(i);
  })
);

const result$ = source$.pipe(
  catchError((err, caught) => {
    console.warn(err.message, '— retrying...');
    return caught; // resubscribe to the original source
  })
);

result$.subscribe({
  next: v => console.log('Got:', v),
  complete: () => console.log('Done'),
});
// Retries automatically by returning `caught` until success
```

### Example 3: Transform and rethrow the error
```typescript
import { of, throwError, catchError } from 'rxjs';

class AppError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message);
    this.name = 'AppError';
  }
}

const httpRequest$ = throwError(() => ({ status: 404, message: 'Not Found' }));

httpRequest$.pipe(
  catchError(err => {
    // Transform raw HTTP error into domain error
    throw new AppError(`HTTP ${err.status}: ${err.message}`, err.status);
  })
).subscribe({
  next: data => console.log(data),
  error: (err: AppError) => console.error(`[${err.code}] ${err.message}`),
});
// Output: [404] HTTP 404: Not Found
```

## Common Pitfalls

### Pitfall 1: Forgetting that `catchError` must return an ObservableInput
If you return `void` or forget to return something, the observable will emit `undefined` or error.

```typescript
// ❌ Incorrect — logs the error but returns undefined, causing unexpected behavior
source$.pipe(
  catchError(err => {
    console.error(err);
    // Missing return!
  })
);

// ✅ Correct — always return an ObservableInput
source$.pipe(
  catchError(err => {
    console.error(err);
    return EMPTY; // or of(defaultValue), or throwError(() => err)
  })
);
```

### Pitfall 2: Infinite retry loop with `caught`
Returning `caught` unconditionally creates an infinite loop if the source always errors.

```typescript
// ❌ Dangerous — retries forever if the source never succeeds
source$.pipe(
  catchError((err, caught) => caught)
);

// ✅ Correct — limit retries or use the retry() operator instead
let retryCount = 0;
source$.pipe(
  catchError((err, caught) => {
    if (retryCount++ < 3) return caught;
    return throwError(() => err);
  })
);
```

## Related Operators
- **`retry`**: Automatically resubscribes on error a fixed number of times without needing a selector function.
- **`retryWhen`**: (deprecated in RxJS 7) Resubscribes based on a notifier observable; prefer `retry({ delay })` instead.
- **`throwIfEmpty`**: Throws an error if the source completes without emitting; pairs well with `catchError`.
- **`onErrorResumeNextWith`**: Switches to the next observable on error, silently swallowing the error.
