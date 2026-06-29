# exhaustAll

## Brief Description
`exhaustAll` subscribes to a higher-order Observable (a stream of Observables) and forwards emissions from the first inner Observable it receives. While that inner Observable is active, any newly emitted inner Observables are **ignored and dropped**. Only after the current inner Observable completes will `exhaustAll` accept the next one. This "first wins" strategy is the opposite of `switchAll` and is useful for preventing duplicate submissions — for example, ignoring button clicks while a save operation is already in progress.

## Category
higher-order

## Import
```typescript
import { exhaustAll } from 'rxjs';
```

## Signature
```typescript
exhaustAll<O extends ObservableInput<any>>(): OperatorFunction<O, ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| *(none)* | — | `exhaustAll` takes no parameters. The source Observable must emit `ObservableInput` values (Observables, Promises, arrays, etc.). |

## Return Type
An `Observable<ObservedValueOf<O>>` that emits values only from the currently active inner Observable. New inner Observables arriving while one is active are discarded entirely.

## Marble Diagram
```
Source (higher-order):   --A-----------B---C---------|
                           |           |   |
A inner:                   a--a--a--a--a--|
B inner (ignored):                     (dropped — A still active)
C inner:                                         c--c--c--|

exhaustAll()
Output:                  --a--a--a--a--a---c--c--c--|
                                    ^ B dropped, A still active
                                              ^ C accepted, A has completed
```

## Examples

### Example 1: Prevent Double-Submit on a Form
```typescript
import { fromEvent, map, exhaustAll } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const submitButton = document.getElementById('submit-btn')!;

fromEvent(submitButton, 'click').pipe(
  map(() => ajax.post('/api/submit', { data: 'payload' })),
  exhaustAll() // ignore clicks while a submission is in flight
).subscribe({
  next: ({ response }) => console.log('Submitted:', response),
  error: (err) => console.error('Submission failed:', err)
});
// Rapid double-clicks only send one request; second click is silently ignored
```

### Example 2: Non-Interruptible Tab Transition
```typescript
import { Subject, map, exhaustAll, interval, take } from 'rxjs';

const tabClick$ = new Subject<string>();

const loadTabContent = (tab: string) =>
  interval(200).pipe(
    take(5),
    map((i) => `${tab}: chunk ${i + 1}/5`)
  );

tabClick$.pipe(
  map((tab) => loadTabContent(tab)),
  exhaustAll() // ignore tab clicks until current content finishes loading
).subscribe((chunk) => console.log(chunk));

tabClick$.next('home');
setTimeout(() => tabClick$.next('news'), 300);    // Ignored — home still loading
setTimeout(() => tabClick$.next('profile'), 700); // Ignored — home still loading
setTimeout(() => tabClick$.next('settings'), 1200); // Accepted — home finished at ~1000ms
```

### Example 3: Rate-Limiting User-Triggered Polling
```typescript
import { fromEvent, map, exhaustAll, interval, take } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const refreshBtn = document.getElementById('refresh')!;

// Each refresh triggers a short burst of 3 polls, 1s apart
const pollBurst = () =>
  interval(1000).pipe(
    take(3),
    map((i) => ajax.getJSON(`/api/status?tick=${i}`))
  );

fromEvent(refreshBtn, 'click').pipe(
  map(() => pollBurst()),
  exhaustAll() // If a burst is in progress, ignore new refresh clicks
).subscribe((request$) => {
  // Inner here is the ajax call — need one more flatten level:
  // For a cleaner pattern, use exhaustMap directly
  console.log('Burst item triggered');
});

// Cleaner equivalent using exhaustMap:
import { exhaustMap } from 'rxjs';
fromEvent(refreshBtn, 'click').pipe(
  exhaustMap(() =>
    interval(1000).pipe(
      take(3),
      exhaustMap((i) => ajax.getJSON(`/api/status?tick=${i}`))
    )
  )
).subscribe(({ response }) => console.log('Poll result:', response));
```

## Common Pitfalls

### Pitfall 1: Source Must Emit Observables, Not Plain Values
`exhaustAll` is a flattening operator for higher-order Observables. Applying it to a plain value stream results in a TypeScript error or unexpected behavior.

```typescript
import { of, exhaustAll, map } from 'rxjs';

// ❌ Source emits numbers — exhaustAll cannot flatten them
of(1, 2, 3).pipe(
  exhaustAll() // TypeScript error: Type 'number' is not assignable to ObservableInput
).subscribe(console.log);

// ✅ Map to Observables first
of(1, 2, 3).pipe(
  map((n) => of(n * 100)),
  exhaustAll()
).subscribe(console.log); // Logs: 100, 200, 300
```

### Pitfall 2: Silent Loss of Inner Observables
Unlike `concatAll` which queues inner Observables, `exhaustAll` drops them silently. This is the desired behavior for de-duplication, but can cause data loss if you need to process every emission.

```typescript
import { Subject, map, exhaustAll, concatAll, of, delay } from 'rxjs';

const events$ = new Subject<number>();

// ❌ Using exhaustAll when all events must be processed
events$.pipe(
  map((n) => of(n).pipe(delay(500))),
  exhaustAll() // events 2 and 3 may be dropped if 1 is still running
).subscribe((n) => console.log('Processed:', n));

events$.next(1);
events$.next(2); // silently dropped
events$.next(3); // silently dropped

// ✅ Use concatAll to queue and process every event in order
events$.pipe(
  map((n) => of(n).pipe(delay(500))),
  concatAll() // queues all events, processes sequentially
).subscribe((n) => console.log('Processed:', n));
```

## Related Operators
- **`exhaustMap`**: Combines the projection and flattening steps of `map` + `exhaustAll` in one operator — the more common choice.
- **`switchAll`**: Opposite strategy — cancels the current inner Observable in favor of the newest one.
- **`concatAll`**: Queues inner Observables and processes them sequentially; nothing is dropped.
- **`mergeAll`**: Subscribes to all inner Observables concurrently; nothing is dropped.
- **`exhaustMap`**: Projects each source value with a function and applies exhaust logic; preferred over `map` + `exhaustAll`.
