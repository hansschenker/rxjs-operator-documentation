# combineLatestAll

## Brief Description
`combineLatestAll` collects all inner Observables emitted by a higher-order Observable, then subscribes to all of them and combines their latest values into an array whenever any inner Observable emits. It waits until the outer Observable completes before subscribing to the collected inner Observables, then behaves like `combineLatest` on the collected set. This is useful when you have a dynamic number of Observables and want to react to the latest value from each.

## Category
combination

## Import
```typescript
import { combineLatestAll } from 'rxjs';
```

## Signature
```typescript
combineLatestAll<T>(): OperatorFunction<ObservableInput<T>, T[]>
combineLatestAll<T, R>(project: (...values: T[]) => R): OperatorFunction<ObservableInput<T>, R>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | `(...values: T[]) => R` | Optional projection function that maps the combined latest values to a single result value. If omitted, the operator emits an array of latest values. |

## Return Type
An `OperatorFunction` that transforms a higher-order Observable into an Observable that emits either an array of the latest values from each inner Observable, or the result of applying the optional `project` function to those values.

## Marble Diagram
```
Outer:    --(A$)--(B$)--(C$)--|        (outer completes)
A$:           --1--------3----4--->
B$:                 2---------5-->
C$:                      6------->

Result:   ---------[1,2,6]-[3,2,6]-[3,5,6]-[4,5,6]-->
          (first emission when all inner Observables have emitted at least once)
```

## Examples

### Example 1: Combining a dynamic list of price streams
```typescript
import { interval, of, combineLatestAll } from 'rxjs';
import { map, take } from 'rxjs/operators';

// Simulate 3 price feeds that update at different rates
const priceFeeds$ = of(
  interval(1000).pipe(map((i) => `AAPL: ${150 + i}`), take(4)),
  interval(1500).pipe(map((i) => `GOOG: ${2800 + i * 10}`), take(4)),
  interval(800).pipe(map((i) => `MSFT: ${300 + i * 2}`), take(4))
);

priceFeeds$.pipe(
  combineLatestAll()
).subscribe(prices => {
  console.log('Latest prices:', prices);
});
// Output (once all three have emitted at least once):
// Latest prices: ['AAPL: 151', 'GOOG: 2800', 'MSFT: 300']
// Latest prices: ['AAPL: 151', 'GOOG: 2800', 'MSFT: 302']
// ... and so on
```

### Example 2: Using the project function for structured output
```typescript
import { of, fromEvent, combineLatestAll } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

// Combine form field streams into a form state object
const fields = ['username', 'email', 'password'];

const fieldStreams$ = of(
  ...fields.map(field =>
    of(`${field}_value`).pipe(
      map(value => ({ field, value }))
    )
  )
);

fieldStreams$.pipe(
  combineLatestAll((username, email, password) => ({
    username,
    email,
    password,
    isValid: true
  }))
).subscribe(formState => {
  console.log('Form state:', formState);
});
```

### Example 3: Combining results from parallel HTTP requests
```typescript
import { of, combineLatestAll } from 'rxjs';
import { map, delay } from 'rxjs/operators';

// Simulating parallel API calls with different response times
const endpoints = ['/api/users', '/api/products', '/api/orders'];

const responses$ = of(
  ...endpoints.map((url, i) =>
    of(`Data from ${url}`).pipe(delay((i + 1) * 500))
  )
);

responses$.pipe(
  combineLatestAll()
).subscribe({
  next: (results) => console.log('All latest results:', results),
  complete: () => console.log('Done')
});
```

## Common Pitfalls

### Pitfall 1: Outer Observable must complete before inner subscriptions begin
`combineLatestAll` buffers all inner Observables until the outer completes. If the outer Observable never completes, no inner subscriptions occur and the result Observable never emits.

```typescript
import { Subject, interval, combineLatestAll } from 'rxjs';
import { map } from 'rxjs/operators';

// ❌ This will never emit because the outer Subject never completes
const outer$ = new Subject<any>();
outer$.pipe(combineLatestAll()).subscribe(console.log);
outer$.next(interval(1000));
outer$.next(interval(2000));
// No output — outer never completes!

// ✅ Use a source that completes
import { of } from 'rxjs';
of(
  interval(1000).pipe(take(3)),
  interval(2000).pipe(take(3))
).pipe(
  combineLatestAll()
).subscribe(console.log);
```

### Pitfall 2: All inner Observables must emit at least once
`combineLatestAll` only emits when every collected inner Observable has emitted at least one value. If any inner Observable completes without emitting, the result Observable will also complete without emitting.

```typescript
import { of, EMPTY, combineLatestAll } from 'rxjs';

// ❌ EMPTY never emits, so combineLatestAll never produces output
of(
  of(1, 2, 3),
  EMPTY
).pipe(
  combineLatestAll()
).subscribe(console.log); // Nothing logged

// ✅ Ensure all inner Observables emit at least once, e.g. use startWith or defaultIfEmpty
import { startWith } from 'rxjs/operators';
of(
  of(1, 2, 3),
  EMPTY.pipe(startWith(0))
).pipe(
  combineLatestAll()
).subscribe(console.log); // [3, 0]
```

## Related Operators
- **`combineLatest`**: Static creation operator; use when you know the Observables at compile time instead of receiving them dynamically.
- **`combineLatestWith`**: Pipeable version of `combineLatest` for combining the current Observable with one or more known Observables.
- **`mergeAll`**: Subscribes to inner Observables as they arrive without waiting for the outer to complete.
- **`zipAll`**: Like `combineLatestAll` but pairs values strictly by index position rather than using the latest value.
- **`switchMap`**: If you want to react to the most recent inner Observable only rather than all collected ones.
