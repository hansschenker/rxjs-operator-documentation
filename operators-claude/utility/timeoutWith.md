# timeoutWith

## Brief Description
`timeoutWith` is a **deprecated** RxJS operator that errors or switches to a fallback observable if the source does not emit a value within the specified time window. In RxJS 7+, its functionality is fully subsumed by `timeout` using the `with` option in the config object. Existing uses of `timeoutWith` should be migrated to `timeout({ each: ..., with: ... })` or `timeout({ first: ..., with: ... })`.

> **Deprecation Notice**: `timeoutWith` is deprecated as of RxJS 7. Use `timeout({ with: fallbackFactory })` instead.

## Category
utility

## Import
```typescript
// Deprecated — available but not recommended
import { timeoutWith } from 'rxjs';

// Preferred replacement
import { timeout } from 'rxjs';
```

## Signature
```typescript
// Deprecated signatures:
timeoutWith<T, R>(
  due: number | Date,
  withObservable: ObservableInput<R>
): OperatorFunction<T, T | R>

timeoutWith<T, R>(
  due: number | Date,
  withObservable: ObservableInput<R>,
  scheduler: SchedulerLike
): OperatorFunction<T, T | R>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| due | `number` \| `Date` | The timeout duration in milliseconds, or an absolute `Date` by which the first value must arrive. |
| withObservable | `ObservableInput<R>` | The observable to switch to when the timeout elapses. |
| scheduler | `SchedulerLike` | Optional. The scheduler used for managing the timeout. Defaults to `asyncScheduler`. |

## Return Type
Returns an `OperatorFunction<T, T | R>` — an observable that mirrors the source until a timeout occurs, at which point it switches to and mirrors `withObservable`.

## Marble Diagram
```
Timeout = 5 time units:
Source:       --a--------        (gap > 5 after a)
withObservable: ----x--y--|>
timeoutWith:  --a----x--y--|>    (switched to fallback after timeout)
```

## Examples

### Example 1: Migrating from timeoutWith to timeout (recommended)
```typescript
import { Subject, timeout, of } from 'rxjs';

const source$ = new Subject<string>();
const fallback$ = of('fallback value');

// ❌ Deprecated timeoutWith usage:
// import { timeoutWith } from 'rxjs';
// source$.pipe(
//   timeoutWith(3000, fallback$)
// ).subscribe(console.log);

// ✅ Modern replacement using timeout with config:
source$.pipe(
  timeout({
    each: 3000,
    with: () => fallback$
  })
).subscribe({
  next: val => console.log('Value:', val),
  complete: () => console.log('Complete')
});

// Trigger timeout — no emission in 3s:
// Output: Value: fallback value
//         Complete
```

### Example 2: Switching to a retry observable on timeout
```typescript
import { Subject, timeout, of, delay } from 'rxjs';

const request$ = new Subject<string>();
const retryObservable$ = of('retry response').pipe(delay(100));

request$.pipe(
  timeout({
    first: 2000,
    with: () => retryObservable$
  })
).subscribe({
  next: val => console.log('Got:', val),
  error: err => console.error('Failed:', err)
});

// If request$ doesn't emit in 2s, retryObservable$ takes over:
// Output (after 2s): Got: retry response
```

### Example 3: Per-emission fallback using timeout
```typescript
import { Subject, timeout, of } from 'rxjs';

const stream$ = new Subject<number>();

stream$.pipe(
  timeout({
    each: 1000,     // each value must arrive within 1 second
    with: () => of(0) // emit 0 as fallback when timeout occurs
  })
).subscribe(val => console.log('Value:', val));

setTimeout(() => stream$.next(1), 200);
setTimeout(() => stream$.next(2), 600);
// Next value arrives after 1600ms from value 2 — timeout fires:
// Output:
// Value: 1
// Value: 2
// Value: 0  (fallback after timeout)
```

## Common Pitfalls

### Pitfall 1: Continuing to use the deprecated timeoutWith
While `timeoutWith` still works in RxJS 7, it will be removed in a future major version and may show deprecation warnings in linters or TypeScript.

```typescript
import { Subject, of } from 'rxjs';

// ❌ Deprecated
import { timeoutWith } from 'rxjs';
new Subject().pipe(
  timeoutWith(1000, of('fallback'))
);

// ✅ Modern equivalent
import { timeout } from 'rxjs';
new Subject().pipe(
  timeout({ each: 1000, with: () => of('fallback') })
);
```

### Pitfall 2: Passing an observable directly to with instead of a factory
The `with` option in the modern `timeout` config expects a **factory function** that returns an observable, not the observable itself. This ensures the fallback observable is freshly created for each timeout occurrence.

```typescript
import { Subject, timeout, of } from 'rxjs';

const fallback$ = of('fallback');

// ❌ Incorrect — with expects a factory
new Subject().pipe(
  // @ts-expect-error
  timeout({ each: 1000, with: fallback$ })
);

// ✅ Correct — with is a factory function
new Subject().pipe(
  timeout({ each: 1000, with: () => fallback$ })
);
```

## Related Operators
- **`timeout`**: The modern, non-deprecated replacement for `timeoutWith`. Use `timeout({ with: () => fallback$ })` for equivalent behavior.
- **`catchError`**: Alternative pattern for handling `TimeoutError` by switching to a fallback.
- **`race`**: Subscribes to multiple observables, mirrors the first to emit — can serve as a manual "timeout or fallback" pattern.
