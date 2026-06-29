# repeatWhen

## Brief Description
`repeatWhen` resubscribes to the source observable based on a *notifier observable* — each time the source completes, a notification is passed into your factory function, and whenever the notifier emits the source is restarted. It was the customizable alternative to `repeat` before RxJS 7 introduced the `delay` factory option on `repeat`. **`repeatWhen` is deprecated in RxJS 7+ and will be removed in a future major version; prefer `repeat({ delay: ... })` for new code.**

## Category
error-handling

## Import
```typescript
import { repeatWhen } from 'rxjs';
```

## Signature
```typescript
/** @deprecated Use repeat({ delay }) instead. Will be removed in v9. */
repeatWhen<T>(
  notifier: (notifications: Observable<void>) => Observable<any>
): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `notifier` | `(notifications: Observable<void>) => Observable<any>` | A function that receives an observable that emits `void` on every source completion. Returns a notifier observable. Each emission on the notifier triggers resubscription; completion on the notifier completes the result; an error on the notifier errors the result. |

## Return Type
A `MonoTypeOperatorFunction<T>` that mirrors the source and resubscribes on each notifier emission after source completion.

## Marble Diagram
```
Source:   --a--b--|   (completes)
Notifier: ----1        (emits after 400ms — triggers retry)
Source (retry 1): --a--b--|  (completes again)
Notifier: -----2       (emits again — triggers another retry)
...
```

## Examples

### Example 1: Repeat with fixed delay (deprecated — shown for reference)
```typescript
import { of, repeatWhen, delay } from 'rxjs';

// @deprecated — prefer repeat({ delay: 2000 })
of('hello').pipe(
  repeatWhen(notifications$ => notifications$.pipe(delay(2000)))
).subscribe({
  next: v => console.log(v), // logs 'hello' every ~2 seconds
});
```

### Example 2: Repeat a fixed number of times (deprecated — shown for reference)
```typescript
import { of, repeatWhen, delay, take } from 'rxjs';

// @deprecated — prefer repeat({ count: 3, delay: 1000 })
of(1, 2, 3).pipe(
  repeatWhen(notifications$ =>
    notifications$.pipe(
      delay(1000),
      take(2) // allow 2 more repeats (3 total runs), then complete
    )
  )
).subscribe({
  next: v => console.log(v),
  complete: () => console.log('Done'),
});
```

### Example 3: Modern equivalent using repeat({ delay }) — PREFERRED
```typescript
import { of, repeat } from 'rxjs';

// ✅ Modern replacement: repeat with delay config (RxJS 7+)
of(1, 2, 3).pipe(
  repeat({
    count: 3,  // 3 total subscriptions (initial + 2 repeats)
    delay: 1000,
  })
).subscribe({
  next: v => console.log(v),
  complete: () => console.log('Done'),
});

// ✅ Dynamic delay factory equivalent
of('ping').pipe(
  repeat({
    count: 4,
    delay: (repeatCount) => {
      console.log(`Repeat #${repeatCount}`);
      return timer(repeatCount * 500);
    },
  })
).subscribe(console.log);
```

## Common Pitfalls

### Pitfall 1: Using `repeatWhen` in new RxJS 7+ code
`repeatWhen` is deprecated and will be removed in v9. Migrate to `repeat` with a delay factory.

```typescript
// ❌ Deprecated
import { repeatWhen, delay } from 'rxjs';
source$.pipe(repeatWhen(n$ => n$.pipe(delay(1000))));

// ✅ Modern equivalent
import { repeat } from 'rxjs';
source$.pipe(repeat({ delay: 1000 }));
```

### Pitfall 2: Notifier errors are forwarded, not retried
An error thrown inside the notifier factory terminates the result observable immediately rather than triggering another retry.

```typescript
import { repeatWhen, mergeMap, throwError, timer } from 'rxjs';

// ❌ Throwing in the notifier ends the stream — cannot recover from that
source$.pipe(
  repeatWhen(n$ =>
    n$.pipe(
      mergeMap((_, i) => {
        if (i >= 3) return throwError(() => new Error('Max repeats reached'));
        return timer(500);
      })
    )
  )
);
// The error from throwError propagates — there is no second chance
```

## Related Operators
- **`repeat`**: The modern replacement — use `repeat({ count, delay })` instead of `repeatWhen`.
- **`retryWhen`**: The analogous deprecated operator for resubscribing on *error* (also deprecated).
- **`retry`**: The modern operator for error-based resubscription.
