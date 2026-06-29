# switchMapTo

## Brief Description
`switchMapTo` maps every source emission to the **same** inner Observable, subscribing to it and cancelling (unsubscribing from) any previously active inner subscription whenever a new source value arrives. It is a specialization of `switchMap` where the projection is a fixed Observable. This operator is **deprecated** as of RxJS 7 — use `switchMap(() => innerObservable)` instead.

> **Deprecated:** `switchMapTo` is deprecated and will be removed in a future version. Use `switchMap(() => innerObservable)` to achieve identical behavior.

## Category
higher-order

## Import
```typescript
import { switchMapTo } from 'rxjs';
```

## Signature
```typescript
switchMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O
): OperatorFunction<T, ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `innerObservable` | `ObservableInput<O>` | A fixed Observable (or Promise, array, iterable) to switch to on each source emission. The previous subscription is cancelled whenever a new source value arrives. |

## Return Type
An `Observable<ObservedValueOf<O>>` that emits values from the most recent subscription to `innerObservable`, switching away from the previous one on each new source emission.

## Marble Diagram
```
Source:          a-----------b-----------c-----------|
                 switchMapTo(x--x--x--x--x...)

inner (a):       x--x--x--x--x...
inner (b):                   x--x--x--x--x...
                 ^ cancelled  ^ cancelled
inner (c):                               x--x--x--x--x...
Output:          x--x--x--x---x--x--x-----x--x--x--x...|
```

## Examples

### Example 1: Switch to a Heartbeat on Each Login (Deprecated Form)
```typescript
import { fromEvent, switchMapTo, interval, takeUntil } from 'rxjs';

const login$ = fromEvent(document.getElementById('login-btn')!, 'click');
const logout$ = fromEvent(document.getElementById('logout-btn')!, 'click');
const heartbeat$ = interval(5000);

// ❌ Deprecated — each login restarts the heartbeat interval
login$.pipe(
  switchMapTo(heartbeat$.pipe(takeUntil(logout$)))
).subscribe(() => console.log('Sending heartbeat'));
```

### Example 2: Preferred Modern Replacement
```typescript
import { fromEvent, switchMap, interval, takeUntil } from 'rxjs';

const login$ = fromEvent(document.getElementById('login-btn')!, 'click');
const logout$ = fromEvent(document.getElementById('logout-btn')!, 'click');
const heartbeat$ = interval(5000);

// ✅ Use switchMap with an arrow function
login$.pipe(
  switchMap(() => heartbeat$.pipe(takeUntil(logout$)))
).subscribe(() => console.log('Sending heartbeat'));
```

### Example 3: Restart a Timer on Each User Interaction
```typescript
import { fromEvent, switchMap, timer, merge } from 'rxjs';

const userActivity$ = merge(
  fromEvent(document, 'click'),
  fromEvent(document, 'keydown'),
  fromEvent(document, 'mousemove')
);

// ✅ Restart a 30-second inactivity timer on any user activity
userActivity$.pipe(
  switchMap(() => timer(30_000))
).subscribe(() => {
  console.log('User has been inactive for 30 seconds — logging out');
  // performLogout();
});
```

## Common Pitfalls

### Pitfall 1: Using the Deprecated Operator in New Code
Migrate all usages to `switchMap(() => obs$)` to avoid compiler warnings and future breakage.

```typescript
import { fromEvent, switchMap, switchMapTo, of } from 'rxjs';

const clicks$ = fromEvent(document, 'click');
const data$ = of('result');

// ❌ Deprecated
clicks$.pipe(switchMapTo(data$)).subscribe(console.log);

// ✅ Non-deprecated equivalent
clicks$.pipe(switchMap(() => data$)).subscribe(console.log);
```

### Pitfall 2: Cancellation of In-Flight Async Work
Because `switchMapTo`/`switchMap` cancels the previous inner subscription, any pending async operations (like HTTP requests) will be aborted. This is usually desirable for search-as-you-type but can cause lost writes.

```typescript
import { fromEvent, switchMap } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const saveClicks$ = fromEvent(document.getElementById('save')!, 'click');

// ❌ Rapid double-clicks cancel the first save request
saveClicks$.pipe(
  switchMap(() => ajax.post('/api/save', { data: 'important' }))
).subscribe(console.log);

// ✅ Use concatMap to queue saves, or exhaustMap to ignore extra clicks
import { exhaustMap } from 'rxjs';
saveClicks$.pipe(
  exhaustMap(() => ajax.post('/api/save', { data: 'important' }))
).subscribe(console.log);
```

## Related Operators
- **`switchMap`**: The non-deprecated replacement; accepts a full projection function.
- **`concatMapTo`**: Deprecated; same concept but sequential — waits for each inner to complete.
- **`mergeMapTo`**: Deprecated; same concept but concurrent — does not cancel previous subscriptions.
- **`switchAll`**: Flattens a higher-order Observable using switch semantics, without a projection function.
