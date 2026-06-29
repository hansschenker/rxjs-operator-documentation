# raceWith

## Brief Description
`raceWith` subscribes to the source Observable and one or more competitor Observables simultaneously, then mirrors whichever one emits a value first, immediately unsubscribing from all others. This is useful for implementing timeout patterns, fallback data sources, or selecting the fastest of several equivalent data providers — whichever responds first "wins the race".

## Category
combination

## Import
```typescript
import { raceWith } from 'rxjs';
```

## Signature
```typescript
raceWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `...otherSources` | `ObservableInputTuple<A>` | One or more Observables to race against the source Observable. All are subscribed to simultaneously; whichever emits first wins. |

## Return Type
An `OperatorFunction` returning an Observable that mirrors the first Observable (among the source and all competitors) to emit a value. All other Observables are unsubscribed once a winner is determined.

## Marble Diagram
```
source$:  --------1--2--3--|     (source is slowest)
other1$:  ----A--B--C--|         (other1 emits first!)
other2$:  ----------X--Y--|      (other2 never gets a chance)

result$:  ----A--B--C--|         (mirrors other1, the winner; source & other2 are unsubscribed)
```

## Examples

### Example 1: Implementing a request timeout
```typescript
import { of, timer, raceWith } from 'rxjs';
import { delay, map, mapTo } from 'rxjs/operators';

// Simulate a slow API call
const apiCall$ = of({ user: 'Alice', score: 42 }).pipe(delay(3000));

// Timeout after 2 seconds
const timeout$ = timer(2000).pipe(
  map(() => { throw new Error('Request timed out after 2 seconds'); })
);

apiCall$.pipe(
  raceWith(timeout$)
).subscribe({
  next: (result) => console.log('Got result:', result),
  error: (err) => console.error(err.message)
});
// Output: Request timed out after 2 seconds
// (because timeout$ fires at 2000ms, before apiCall$ completes at 3000ms)
```

### Example 2: Choosing the fastest of multiple CDN mirrors
```typescript
import { of, raceWith } from 'rxjs';
import { delay, map } from 'rxjs/operators';

// Simulate fetching from three CDN mirrors with different latencies
const cdn1$ = of('https://cdn1.example.com/asset.js').pipe(
  delay(400),
  map(url => ({ url, data: 'content from CDN1' }))
);

const cdn2$ = of('https://cdn2.example.com/asset.js').pipe(
  delay(200), // fastest!
  map(url => ({ url, data: 'content from CDN2' }))
);

const cdn3$ = of('https://cdn3.example.com/asset.js').pipe(
  delay(600),
  map(url => ({ url, data: 'content from CDN3' }))
);

cdn1$.pipe(
  raceWith(cdn2$, cdn3$)
).subscribe(result => {
  console.log(`Loaded from fastest CDN: ${result.url}`);
  console.log(result.data);
});
// Loaded from fastest CDN: https://cdn2.example.com/asset.js
```

### Example 3: First user gesture determines interaction mode
```typescript
import { fromEvent, raceWith } from 'rxjs';
import { map, take } from 'rxjs/operators';

const firstTouch$ = fromEvent(document, 'touchstart').pipe(
  take(1),
  map(() => 'touch' as const)
);

const firstMouseMove$ = fromEvent(document, 'mousemove').pipe(
  take(1),
  map(() => 'mouse' as const)
);

const firstKeyPress$ = fromEvent(document, 'keydown').pipe(
  take(1),
  map(() => 'keyboard' as const)
);

firstTouch$.pipe(
  raceWith(firstMouseMove$, firstKeyPress$)
).subscribe(mode => {
  console.log(`User is using: ${mode} input`);
  document.body.dataset.inputMode = mode;
});
```

## Common Pitfalls

### Pitfall 1: A synchronous winner means all others never get a chance
If any Observable is synchronous (emits during subscription), it will always win the race — the others will be unsubscribed before they can emit.

```typescript
import { of, raceWith } from 'rxjs';
import { delay } from 'rxjs/operators';

// ❌ of(1) is synchronous and always wins, making raceWith pointless here
of(1).pipe(
  raceWith(
    of(2),            // also synchronous, but loses
    of(99).pipe(delay(100)) // async, never wins
  )
).subscribe(console.log); // Always logs 1

// ✅ raceWith is meaningful when all sources are asynchronous
import { timer } from 'rxjs';
timer(300).pipe(
  raceWith(timer(100), timer(500))
).subscribe(() => console.log('timer(100) won'));
```

### Pitfall 2: Errors from the losing Observables are swallowed, but errors from the winner propagate
Once a winner is determined, losing Observables are unsubscribed. However, if the winning Observable errors, that error propagates to the subscriber.

```typescript
import { throwError, of, raceWith } from 'rxjs';
import { delay } from 'rxjs/operators';

// ❌ If the winner errors, the entire stream errors
of('fast').pipe(
  delay(100),
  // Simulate error in another competing source — if it were the winner, it propagates
).pipe(
  raceWith(
    throwError(() => new Error('Winner errored!'))
  )
).subscribe({
  next: console.log,
  error: (e) => console.error('Caught:', e.message)
});
// throwError is synchronous so it "wins" and the error propagates

// ✅ Handle errors appropriately
import { catchError } from 'rxjs/operators';
of('slow').pipe(
  delay(200),
  raceWith(
    throwError(() => new Error('oops')).pipe(
      catchError(() => of('fallback'))
    )
  )
).subscribe(console.log); // fallback
```

## Related Operators
- **`race`**: Static creation function; use when no source is already in a pipe chain.
- **`mergeWith`**: Subscribes to all sources concurrently and forwards every emission from all of them.
- **`combineLatestWith`**: Waits for all sources to emit and combines their latest values.
- **`timer`**: Commonly paired with `raceWith` to implement timeouts.
- **`takeUntil`**: An alternative for timeout patterns — completes the source when a notifier emits.
