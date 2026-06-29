# retryWhen

## Brief Description
`retryWhen` resubscribes to the source observable based on a *notifier observable* — every error from the source triggers a notification that is passed into your factory function, and whenever that notifier emits a value the source is retried. It was the primary tool for custom retry strategies (backoff, jitter) before RxJS 7 introduced the `delay` factory option on `retry`. **`retryWhen` is deprecated in RxJS 7+ and will be removed in a future major version; prefer `retry({ delay: ... })` for new code.**

## Category
error-handling

## Import
```typescript
import { retryWhen } from 'rxjs';
```

## Signature
```typescript
/** @deprecated Use retry({ delay }) instead. Will be removed in v9. */
retryWhen<T>(
  notifier: (errors: Observable<any>) => Observable<any>
): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `notifier` | `(errors: Observable<any>) => Observable<any>` | A function that receives an observable of errors from the source and returns a notifier observable. Each emission on the notifier triggers a resubscription to the source; an error or completion on the notifier terminates the result observable with that error/completion. |

## Return Type
A `MonoTypeOperatorFunction<T>` — a mirror of the source observable that resubscribes whenever the notifier emits.

## Marble Diagram
```
Source:   --a--b--#  (error)
Notifier emits after 1s: -------1
Source (retry 1): --a--b--c--|

Result:   --a--b---------a--b--c--|
                  (1s delay before retry)
```

## Examples

### Example 1: Basic retry with fixed delay (deprecated — shown for reference)
```typescript
import { interval, mergeMap, throwError, of, retryWhen, delay, take } from 'rxjs';

let attempt = 0;

const source$ = interval(300).pipe(
  take(3),
  mergeMap(i => {
    attempt++;
    return attempt < 3
      ? throwError(() => new Error(`Fail on attempt ${attempt}`))
      : of(i);
  })
);

// @deprecated — prefer retry({ delay: 1000, count: 3 })
source$.pipe(
  retryWhen(errors$ =>
    errors$.pipe(
      delay(1000) // wait 1 second before each retry
    )
  )
).subscribe({
  next: v => console.log('Value:', v),
  complete: () => console.log('Done'),
});
```

### Example 2: Exponential backoff (deprecated — shown for reference)
```typescript
import { throwError, timer, retryWhen, mergeMap, tap } from 'rxjs';

const flakyApi$ = throwError(() => new Error('Network error'));

// @deprecated — the modern equivalent is:
// retry({ count: 3, delay: (err, i) => timer(Math.min(1000 * 2 ** i, 16000)) })
flakyApi$.pipe(
  retryWhen(errors$ =>
    errors$.pipe(
      mergeMap((err, index) => {
        const retryAttempt = index + 1;
        if (retryAttempt > 3) {
          return throwError(() => err);
        }
        const backoff = Math.min(1000 * 2 ** retryAttempt, 16_000);
        console.log(`Retry #${retryAttempt} in ${backoff}ms`);
        return timer(backoff);
      })
    )
  )
).subscribe({
  next: v => console.log(v),
  error: err => console.error('Failed:', err.message),
});
```

### Example 3: Modern equivalent using retry({ delay }) — PREFERRED
```typescript
import { throwError, timer, retry } from 'rxjs';

const flakyApi$ = throwError(() => new Error('Network error'));

// ✅ Modern replacement for retryWhen with exponential backoff
flakyApi$.pipe(
  retry({
    count: 3,
    delay: (error, retryIndex) => {
      const backoffMs = Math.min(1000 * 2 ** retryIndex, 16_000);
      console.log(`Retry #${retryIndex} in ${backoffMs}ms — ${error.message}`);
      return timer(backoffMs);
    },
  })
).subscribe({
  next: v => console.log(v),
  error: err => console.error('Final error:', err.message),
});
```

## Common Pitfalls

### Pitfall 1: Using `retryWhen` in new RxJS 7+ code
`retryWhen` is deprecated and scheduled for removal. New code should use `retry` with a delay factory.

```typescript
// ❌ Deprecated — avoid in new code
import { retryWhen, delay } from 'rxjs';
source$.pipe(retryWhen(errors$ => errors$.pipe(delay(500))));

// ✅ Modern equivalent
import { retry } from 'rxjs';
source$.pipe(retry({ count: 3, delay: 500 }));
```

### Pitfall 2: Notifier completing without error swallows the stream
If the notifier observable completes (rather than errors), the result observable also completes immediately — which may be unexpected.

```typescript
import { retryWhen, take, delay } from 'rxjs';

// ❌ After 3 notifications the notifier completes → result completes silently
source$.pipe(
  retryWhen(errors$ => errors$.pipe(take(3), delay(1000)))
);

// ✅ Make the intent explicit: rethrow after max retries
import { retryWhen, mergeMap, throwError, timer } from 'rxjs';
source$.pipe(
  retryWhen(errors$ =>
    errors$.pipe(
      mergeMap((err, i) => i < 3 ? timer(1000) : throwError(() => err))
    )
  )
);
```

## Related Operators
- **`retry`**: The modern replacement — use `retry({ count, delay })` instead of `retryWhen`.
- **`catchError`**: For one-shot error handling or fallback values rather than resubscription.
- **`repeatWhen`**: The analogous operator for resubscribing on *completion* rather than error (also deprecated).
