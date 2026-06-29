# timeout

## Brief Description
`timeout` errors the observable if no value is emitted within a specified time window. It is used to impose time limits on operations such as HTTP requests, WebSocket messages, or any observable that must produce results within a bounded period. When the timeout elapses, it throws a `TimeoutError` (or a custom error), enabling downstream error handling to detect and react to slowness or hanging operations.

## Category
utility

## Import
```typescript
import { timeout } from 'rxjs';
```

## Signature
```typescript
// Simple form — timeout from first value or between values
timeout<T>(config: TimeoutConfig<T, ObservableInput<T>, any>): OperatorFunction<T, T | any>
timeout<T>(first: number | Date): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| config | `TimeoutConfig` | A configuration object with optional properties: `first` (ms or Date until first value), `each` (ms between each value), `with` (factory to return an alternate observable on timeout), `meta` (arbitrary metadata attached to TimeoutError), `scheduler`. Alternatively, a plain `number` or `Date` for a simple "first value by" timeout. |

## Return Type
Returns an `OperatorFunction<T, T>` — an observable that mirrors the source but errors with a `TimeoutError` (or switches to the `with` observable) if no emission occurs within the specified window.

## Marble Diagram
```
Timeout = 5 time units between emissions:

Source emits in time:   --a----b--c--|>
timeout(5):             --a----b--c--|>   (no timeout — all within 5 units)

Source too slow:
--a---------b           (gap > 5 between a and b)
timeout(5):  --a----#    (TimeoutError after 5 units with no new value)
```

## Examples

### Example 1: Simple first-value timeout
```typescript
import { Subject, timeout, catchError, EMPTY } from 'rxjs';

const source$ = new Subject<string>();

source$.pipe(
  timeout(2000), // error if no value arrives within 2 seconds
  catchError(err => {
    console.error('Timed out:', err.message);
    return EMPTY;
  })
).subscribe({
  next: val => console.log('Received:', val),
  complete: () => console.log('Complete')
});

// Simulate no emission — timeout fires after 2 seconds:
// Output: Timed out: Timeout has occurred

// To prevent timeout, emit before 2s:
// setTimeout(() => source$.next('on time'), 1000);
```

### Example 2: Per-emission timeout using the config object
```typescript
import { Subject, timeout, catchError, of } from 'rxjs';

const data$ = new Subject<number>();

data$.pipe(
  timeout({
    first: 3000, // wait up to 3s for the first value
    each: 1500,  // each subsequent value must arrive within 1.5s
    with: () => of(-1) // fallback value instead of error
  })
).subscribe(val => {
  if (val === -1) {
    console.log('Timed out — fell back to -1');
  } else {
    console.log('Value:', val);
  }
});

setTimeout(() => data$.next(1), 500);
setTimeout(() => data$.next(2), 1000);
// Third value takes too long — timeout fires and emits -1:
setTimeout(() => data$.next(3), 3000);
```

### Example 3: Adding metadata to TimeoutError for diagnostics
```typescript
import { Subject, timeout, catchError, EMPTY, TimeoutError } from 'rxjs';

const api$ = new Subject<string>();

api$.pipe(
  timeout({
    each: 5000,
    meta: { endpoint: '/api/data', requestId: 'abc-123' }
  }),
  catchError(err => {
    if (err instanceof TimeoutError) {
      console.error('Timeout metadata:', err.info?.meta);
      // { endpoint: '/api/data', requestId: 'abc-123' }
    }
    return EMPTY;
  })
).subscribe();

// Simulate no response — timeout fires after 5s:
// Output: Timeout metadata: { endpoint: '/api/data', requestId: 'abc-123' }
```

## Common Pitfalls

### Pitfall 1: Not handling TimeoutError downstream
If you don't catch a `TimeoutError`, it propagates as an unhandled error and terminates the subscription silently in many environments.

```typescript
import { Subject, timeout, catchError, EMPTY, TimeoutError } from 'rxjs';

// ❌ Incorrect — no error handler for TimeoutError
const source$ = new Subject<string>();
source$.pipe(
  timeout(1000)
).subscribe(val => console.log(val));
// After 1s, unhandled TimeoutError crashes the subscription

// ✅ Correct — always handle TimeoutError
source$.pipe(
  timeout(1000),
  catchError(err => {
    if (err instanceof TimeoutError) {
      console.warn('Request timed out, retrying...');
      // return retry logic or EMPTY
    }
    return EMPTY;
  })
).subscribe(val => console.log(val));
```

### Pitfall 2: Misunderstanding first vs each timeout semantics
`first` is a one-time deadline for the very first emission. `each` applies after every emission. Mixing them up leads to unexpected behavior.

```typescript
import { Subject, timeout } from 'rxjs';

const data$ = new Subject<number>();

data$.pipe(
  timeout({
    first: 5000, // 5s to get the FIRST value — won't fire after first value arrives
    each: 2000   // each SUBSEQUENT value must come within 2s
  })
).subscribe(console.log);

// ✅ If you need to limit total duration, combine with take or a race:
import { race, timer, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs';
const timedData$ = race(
  data$,
  timer(10000).pipe(switchMap(() => EMPTY)) // total deadline of 10s
);
```

## Related Operators
- **`timeoutWith`**: Deprecated alias of `timeout` with the `with` factory option; use `timeout({ with: ... })` instead.
- **`race`**: Subscribes to multiple observables and mirrors the first one to emit; can serve as a manual timeout pattern.
- **`catchError`**: Required alongside `timeout` to handle the `TimeoutError` gracefully.
- **`retry`**: Often combined with `timeout` to retry timed-out operations.
