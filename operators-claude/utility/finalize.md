# finalize

## Brief Description
`finalize` executes a callback function when the source observable terminates — whether it completes normally, errors out, or is unsubscribed. It is the RxJS equivalent of a `finally` block and is ideal for cleanup tasks such as hiding loading spinners, releasing resources, or logging the end of a stream regardless of how it ended.

## Category
utility

## Import
```typescript
import { finalize } from 'rxjs';
```

## Signature
```typescript
finalize<T>(callback: () => void): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| callback | `() => void` | A zero-argument function that is called when the source observable completes, errors, or is unsubscribed from. |

## Return Type
Returns a `MonoTypeOperatorFunction<T>` — an operator that returns an observable identical to the source. The values, errors, and completion are all passed through unchanged; the callback is only a teardown hook.

## Marble Diagram
```
Source completes normally:
--a--b--c--|>        callback fires on |
tap:    --a--b--c--|>

Source errors:
--a--b--#            callback fires on #
finalize: --a--b--#

Source unsubscribed:
--a--b--X (unsub)    callback fires on unsubscribe
finalize: --a--b--
```

## Examples

### Example 1: Hiding a loading spinner after a request
```typescript
import { of, delay, finalize } from 'rxjs';

let isLoading = true;

const request$ = of({ data: 'response' }).pipe(
  delay(300),
  finalize(() => {
    isLoading = false;
    console.log('Request finished, isLoading:', isLoading);
  })
);

request$.subscribe({
  next: response => console.log('Received:', response.data),
  error: err => console.error('Error:', err),
});

// Output (after ~300ms):
// Received: response
// Request finished, isLoading: false
```

### Example 2: Cleanup that runs even when an error occurs
```typescript
import { throwError, finalize, catchError, EMPTY } from 'rxjs';

const failingRequest$ = throwError(() => new Error('Network error')).pipe(
  finalize(() => console.log('Cleanup: closing connection')),
  catchError(err => {
    console.error('Handled error:', err.message);
    return EMPTY;
  })
);

failingRequest$.subscribe({
  complete: () => console.log('Stream complete')
});

// Output:
// Cleanup: closing connection
// Handled error: Network error
// Stream complete
```

### Example 3: Detecting unsubscription
```typescript
import { interval, finalize, take } from 'rxjs';

const counter$ = interval(200).pipe(
  take(3),
  finalize(() => console.log('Observable finalized (completed or unsubscribed)'))
);

const subscription = counter$.subscribe({
  next: val => console.log('Value:', val),
  complete: () => console.log('Completed naturally')
});

// After take(3), it completes naturally:
// Value: 0
// Value: 1
// Value: 2
// Completed naturally
// Observable finalized (completed or unsubscribed)

// If you unsubscribe early:
const subscription2 = interval(200).pipe(
  finalize(() => console.log('Cleanup after early unsubscribe'))
).subscribe(val => console.log(val));

setTimeout(() => {
  subscription2.unsubscribe();
  // Output: Cleanup after early unsubscribe
}, 500);
```

## Common Pitfalls

### Pitfall 1: Assuming finalize only fires on completion, not on error or unsubscribe
`finalize` fires for all three termination paths. If you only want to run logic on normal completion, use `tap({ complete: () => ... })` instead.

```typescript
import { throwError, finalize, tap } from 'rxjs';

// ❌ Incorrect assumption — finalize fires even on error
throwError(() => new Error('oops')).pipe(
  finalize(() => console.log('This runs even on error!'))
).subscribe({ error: () => {} });
// Output: This runs even on error!

// ✅ Correct — use tap's complete callback for completion-only logic
import { of } from 'rxjs';
of(1, 2, 3).pipe(
  tap({ complete: () => console.log('Only on normal completion') })
).subscribe();
```

### Pitfall 2: Placing finalize before catchError swallows the cleanup order
The position of `finalize` in the pipe matters. If placed before `catchError`, the cleanup still happens, but `finalize` sees the original error before `catchError` handles it.

```typescript
import { throwError, finalize, catchError, EMPTY, of } from 'rxjs';

// ❌ Potentially confusing — finalize is inside catchError's scope
throwError(() => new Error('fail')).pipe(
  catchError(() => of('recovered')),
  finalize(() => console.log('Finalize after catchError: stream treated as completed'))
).subscribe(val => console.log(val));
// Output:
// recovered
// Finalize after catchError: stream treated as completed

// ✅ Intentional — finalize before catchError, cleanup sees the raw error
throwError(() => new Error('fail')).pipe(
  finalize(() => console.log('Finalize sees error path')),
  catchError(() => of('recovered'))
).subscribe(val => console.log(val));
// Output:
// Finalize sees error path
// recovered
```

## Related Operators
- **`tap`**: Use `tap` with an observer object for `next`/`error`/`complete` callbacks inline; `finalize` is specifically for teardown after any termination.
- **`takeUntil`**: Often paired with `finalize` — `takeUntil` triggers unsubscription, `finalize` handles cleanup when that happens.
- **`catchError`**: Handles errors in the stream; `finalize` complements it by running cleanup regardless of whether the error was caught.
