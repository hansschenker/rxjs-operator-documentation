# retry

## Brief Description
`retry` resubscribes to the source observable when it errors, effectively retrying the operation up to a specified number of times. In RxJS 7+ the operator accepts a configuration object that supports a delay factory function, making it easy to implement exponential backoff or jitter without needing `retryWhen`.

## Category
error-handling

## Import
```typescript
import { retry } from 'rxjs';
```

## Signature
```typescript
// Simple count overload
retry(count?: number): MonoTypeOperatorFunction<T>

// Config object overload (RxJS 7+)
retry<T>(config: RetryConfig): MonoTypeOperatorFunction<T>

// RetryConfig shape
interface RetryConfig {
  count?: number;          // max retry attempts (default: Infinity)
  delay?: number | ((error: any, retryCount: number) => ObservableInput<any>);
  resetOnSuccess?: boolean; // reset retry counter on each success (default: false)
}
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `count` | `number` | Maximum number of retry attempts. Defaults to `Infinity` when using the number overload with no argument. |
| `config` | `RetryConfig` | Configuration object (RxJS 7+). Allows specifying `count`, a `delay` (number of ms or factory function), and `resetOnSuccess`. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable of the same type as the source. If all retry attempts are exhausted, the error is forwarded to subscribers.

## Marble Diagram
```
Source (errors on 3rd item, retry count = 1):
Attempt 1:  --a--b--#
Attempt 2:  --a--b--c--|

Result:     --a--b--a--b--c--|

Source (always errors, retry count = 2):
Attempt 1:  --#
Attempt 2:  --#
Attempt 3:  --#  (error propagates)

Result:     --#
```

## Examples

### Example 1: Simple fixed retry count
```typescript
import { interval, mergeMap, throwError, of, retry, take } from 'rxjs';

let attempt = 0;

const unstable$ = interval(300).pipe(
  take(5),
  mergeMap(i => {
    attempt++;
    if (attempt <= 2) {
      return throwError(() => new Error(`Attempt ${attempt} failed`));
    }
    return of(i);
  })
);

unstable$.pipe(
  retry(3)
).subscribe({
  next: v => console.log('Value:', v),
  error: err => console.error('Final error:', err.message),
  complete: () => console.log('Complete'),
});
```

### Example 2: Exponential backoff with delay factory (RxJS 7+)
```typescript
import { fromFetch, retry, timer } from 'rxjs';

const fetchWithBackoff$ = fromFetch('https://api.example.com/data').pipe(
  retry({
    count: 4,
    delay: (error, retryIndex) => {
      const backoffMs = Math.min(1000 * 2 ** retryIndex, 30_000); // cap at 30s
      console.log(`Retry #${retryIndex} in ${backoffMs}ms — ${error.message}`);
      return timer(backoffMs);
    },
  })
);

fetchWithBackoff$.subscribe({
  next: response => console.log('Status:', response.status),
  error: err => console.error('All retries exhausted:', err.message),
});
```

### Example 3: Reset retry counter on success with `resetOnSuccess`
```typescript
import { Subject, retry } from 'rxjs';

// Simulates a long-running stream that occasionally errors but should
// reset the retry budget after each successful stretch.
const events$ = new Subject<number>();

events$.pipe(
  retry({
    count: 2,
    resetOnSuccess: true,
    delay: 500,
  })
).subscribe({
  next: v => console.log('Event:', v),
  error: err => console.error('Unrecoverable:', err),
});

events$.next(1);
events$.next(2);
events$.error(new Error('transient'));
// After resubscription:
events$.next(3); // success resets the counter — 2 more retries available
```

## Common Pitfalls

### Pitfall 1: `retry()` with no argument retries infinitely
Calling `retry()` without arguments is equivalent to `retry(Infinity)`, which can lock your application in an infinite resubscription loop.

```typescript
// ❌ Dangerous — loops forever if the source always errors
source$.pipe(retry());

// ✅ Always provide a finite count
source$.pipe(retry(3));

// ✅ Or use a delay factory that eventually throws
source$.pipe(
  retry({
    count: 5,
    delay: (err, i) => {
      if (i >= 5) throw err;
      return timer(1000 * i);
    },
  })
);
```

### Pitfall 2: Retrying non-idempotent operations
`retry` resubscribes to the entire observable chain. If your source performs side effects (e.g., writing to a database), those effects will execute on every retry attempt.

```typescript
// ❌ Risky — POST request fires on every retry
const save$ = from(fetch('/api/save', { method: 'POST', body: JSON.stringify(data) }));
save$.pipe(retry(3));

// ✅ Make the side-effectful operation idempotent, or catch at a higher level
// and only retry the read/query portions of your pipeline
```

## Related Operators
- **`catchError`**: Intercepts errors manually; `retry` is more ergonomic when you just need resubscription.
- **`retryWhen`**: Deprecated in RxJS 7 — the `delay` factory in `retry`'s config object is the modern replacement.
- **`repeat`**: Like `retry` but resubscribes on *completion* rather than on error.
- **`timer`**: Commonly used inside the `delay` factory to implement backoff delays.
