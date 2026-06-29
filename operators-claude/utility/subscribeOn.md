# subscribeOn

## Brief Description
`subscribeOn` controls the scheduler on which the subscription to the source observable is initiated. It defers the act of calling `subscribe` on the upstream observable to run within a specified scheduler's execution context. This is distinct from `observeOn`, which affects where emissions are delivered. `subscribeOn` is primarily useful for making synchronous sources behave asynchronously, or for running source-side work on a particular scheduler.

## Category
utility

## Import
```typescript
import { subscribeOn } from 'rxjs';
```

## Signature
```typescript
subscribeOn<T>(scheduler: SchedulerLike, delay?: number): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| scheduler | `SchedulerLike` | The scheduler on which to perform the subscription. Common options: `asyncScheduler`, `asapScheduler`, `queueScheduler`. |
| delay | `number` | Optional. Additional delay in milliseconds before performing the subscription. Defaults to `0`. |

## Return Type
Returns a `MonoTypeOperatorFunction<T>` — an observable that behaves like the source but whose subscription is deferred to the specified scheduler.

## Marble Diagram
```
Without subscribeOn (synchronous source):
Subscribe → (a)(b)(c)|>   (emissions happen immediately on subscribe)

With subscribeOn(asyncScheduler):
Subscribe → [defer to macro-task] → (a)(b)(c)|>
            |<-- async gap ------->|
(subscription to source is scheduled asynchronously)
```

## Examples

### Example 1: Deferring subscription to asyncScheduler
```typescript
import { of, subscribeOn, asyncScheduler } from 'rxjs';

console.log('1 - before subscribe');

of(1, 2, 3).pipe(
  subscribeOn(asyncScheduler)
).subscribe({
  next: val => console.log('3 - value:', val),
  complete: () => console.log('4 - complete')
});

console.log('2 - after subscribe call');

// Output:
// 1 - before subscribe
// 2 - after subscribe call
// 3 - value: 1
// 3 - value: 2
// 3 - value: 3
// 4 - complete
```

### Example 2: Contrasting subscribeOn vs observeOn
```typescript
import { of, subscribeOn, observeOn, asyncScheduler } from 'rxjs';
import { tap } from 'rxjs';

// subscribeOn — delays WHEN subscription (upstream) starts
of('subscribeOn').pipe(
  tap(val => console.log('upstream tap (runs async):', val)),
  subscribeOn(asyncScheduler)
).subscribe(val => console.log('subscriber (runs async):', val));

console.log('sync code after first subscribe');

// observeOn — delays WHEN notifications are DELIVERED (downstream)
of('observeOn').pipe(
  tap(val => console.log('upstream tap (runs sync):', val)),
  observeOn(asyncScheduler)
).subscribe(val => console.log('subscriber (runs async):', val));

console.log('sync code after second subscribe');

// Output:
// upstream tap (runs sync): observeOn
// sync code after first subscribe
// sync code after second subscribe
// subscriber (runs async): observeOn
// upstream tap (runs async): subscribeOn
// subscriber (runs async): subscribeOn
```

### Example 3: Using asapScheduler to defer subscription to microtask
```typescript
import { of, subscribeOn, asapScheduler } from 'rxjs';

const result: number[] = [];

of(1, 2, 3).pipe(
  subscribeOn(asapScheduler)
).subscribe(val => result.push(val));

// result is still empty here (microtask hasn't run yet)
console.log('Synchronous result:', result); // []

// After microtask queue flushes:
Promise.resolve().then(() => {
  console.log('After microtask:', result); // [1, 2, 3]
});
```

## Common Pitfalls

### Pitfall 1: Expecting subscribeOn to control where emissions are delivered
`subscribeOn` only controls when and where the subscription itself is initiated. The emissions still propagate on the source's scheduler unless `observeOn` is also used.

```typescript
import { of, subscribeOn, asyncScheduler, tap } from 'rxjs';

// ❌ Incorrect assumption — thinking subscribeOn makes all operators run async
of(1, 2, 3).pipe(
  subscribeOn(asyncScheduler),
  tap(val => {
    // This tap still runs in the context of the source (which here is synchronous after subscription)
    console.log('tap value:', val);
  })
).subscribe();

// ✅ Correct — use observeOn to control delivery context
import { observeOn } from 'rxjs';
of(1, 2, 3).pipe(
  subscribeOn(asyncScheduler),
  observeOn(asyncScheduler),
  tap(val => console.log('tap runs async:', val))
).subscribe();
```

### Pitfall 2: Placement of subscribeOn in the pipe matters
`subscribeOn` should typically be placed at the end of the pipe (or as the last operator before subscribe). Placing it early changes the subscription timing for the entire chain, but it only affects the subscription phase, not the runtime scheduling of operators above it in the pipe.

```typescript
import { of, subscribeOn, asyncScheduler, map } from 'rxjs';

// ✅ Best practice — place subscribeOn at the end of the pipe
of(1, 2, 3).pipe(
  map(x => x * 2),
  // ...other operators...
  subscribeOn(asyncScheduler) // clear intent: delay subscription
).subscribe(val => console.log(val));
```

## Related Operators
- **`observeOn`**: Controls where emissions are *delivered* (downstream notifications); counterpart to `subscribeOn`.
- **`scheduled`** (creation operator): Creates an observable from an iterable or array-like source using a given scheduler, which can be more explicit than `subscribeOn`.
- **`defer`**: Defers creation of the observable until subscription; can achieve lazy init similar to `subscribeOn` in some patterns.
