# mergeWith

## Brief Description
`mergeWith` merges the source Observable with one or more other Observables, subscribing to all of them concurrently and emitting values as they arrive from any source. Unlike `combineLatestWith`, it does not wait for all sources to have emitted — it simply forwards every emission from every source into a single stream. This makes it useful for aggregating multiple event sources, such as listening to clicks on several elements or merging multiple message channels.

## Category
combination

## Import
```typescript
import { mergeWith } from 'rxjs';
```

## Signature
```typescript
mergeWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `...otherSources` | `ObservableInputTuple<A>` | One or more Observables to merge with the source Observable. All are subscribed to immediately and concurrently. |

## Return Type
An `OperatorFunction` that returns an Observable emitting values from the source and all provided Observables as they arrive. The emissions are interleaved in real-time order. The result type is the union of all source emission types.

## Marble Diagram
```
source$:  --1-----3--------5------|
other1$:  -----2------4-----------|
other2$:  ----------6-------7-----|

result$:  --1--2--3--4-6---5--7---| (all emissions forwarded immediately)
```

## Examples

### Example 1: Merging keyboard and button click events
```typescript
import { fromEvent, mergeWith } from 'rxjs';
import { map, filter } from 'rxjs/operators';

const submitButton = document.querySelector('#submit') as HTMLButtonElement;
const form = document.querySelector('form') as HTMLFormElement;

const buttonClick$ = fromEvent(submitButton, 'click').pipe(
  map(() => 'button-click')
);

const enterKey$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
  filter((e) => e.key === 'Enter'),
  map(() => 'enter-key')
);

buttonClick$.pipe(
  mergeWith(enterKey$)
).subscribe(source => {
  console.log(`Form submitted via: ${source}`);
  // submitForm();
});
```

### Example 2: Aggregating notifications from multiple channels
```typescript
import { Subject, mergeWith } from 'rxjs';
import { map } from 'rxjs/operators';

interface Notification {
  type: string;
  message: string;
}

const emailNotifications$ = new Subject<string>();
const pushNotifications$ = new Subject<string>();
const smsNotifications$ = new Subject<string>();

const allNotifications$ = emailNotifications$.pipe(
  map((msg): Notification => ({ type: 'email', message: msg })),
  mergeWith(
    pushNotifications$.pipe(map((msg): Notification => ({ type: 'push', message: msg }))),
    smsNotifications$.pipe(map((msg): Notification => ({ type: 'sms', message: msg })))
  )
);

allNotifications$.subscribe(notification => {
  console.log(`[${notification.type.toUpperCase()}] ${notification.message}`);
  showToast(notification);
});

function showToast(n: Notification) { console.log('Toast:', n.message); }

// Simulate incoming notifications
emailNotifications$.next('Your order has shipped');
pushNotifications$.next('Flash sale: 50% off');
smsNotifications$.next('Your code is 123456');
```

### Example 3: Merging polling and real-time update streams
```typescript
import { interval, Subject, mergeWith } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { of } from 'rxjs';

// Poll every 30 seconds as a fallback
const polledData$ = interval(30000).pipe(
  startWith(0),
  switchMap(() => of({ source: 'poll', data: `Polled at ${Date.now()}` }))
);

// Real-time push updates via WebSocket (simulated)
const realtimeUpdates$ = new Subject<{ source: string; data: string }>();

polledData$.pipe(
  mergeWith(realtimeUpdates$)
).subscribe(update => {
  console.log(`[${update.source}] ${update.data}`);
});

// Simulate a real-time push coming in
setTimeout(() => {
  realtimeUpdates$.next({ source: 'websocket', data: 'Live price update' });
}, 5000);
```

## Common Pitfalls

### Pitfall 1: The combined Observable only completes when ALL sources complete
`mergeWith` keeps the subscription alive until every merged source completes. A long-lived source prevents completion.

```typescript
import { of, interval, mergeWith } from 'rxjs';
import { take } from 'rxjs/operators';

// ❌ The result never completes because interval() never completes
of(1, 2, 3).pipe(
  mergeWith(interval(1000)) // infinite!
).subscribe({
  next: console.log,
  complete: () => console.log('Done') // never called
});

// ✅ Bound finite sources
of(1, 2, 3).pipe(
  mergeWith(interval(1000).pipe(take(3)))
).subscribe({
  next: console.log,
  complete: () => console.log('Done') // called after all complete
});
```

### Pitfall 2: Confusing mergeWith with combineLatestWith
`mergeWith` emits each individual value as it arrives. `combineLatestWith` waits for all sources to have emitted and then emits combined arrays. Choose based on whether you need individual values or combined state.

```typescript
import { Subject, mergeWith, combineLatestWith } from 'rxjs';

const a$ = new Subject<string>();
const b$ = new Subject<string>();

// mergeWith: each emission forwarded individually
a$.pipe(mergeWith(b$)).subscribe(v => console.log('merge:', v));
a$.next('hello'); // merge: hello
b$.next('world'); // merge: world

// combineLatestWith: emits [latestA, latestB] on each emission
a$.pipe(combineLatestWith(b$)).subscribe(v => console.log('combine:', v));
a$.next('hello'); // nothing yet — b$ hasn't emitted
b$.next('world'); // combine: ['hello', 'world']
```

## Related Operators
- **`merge`**: Static creation function; use outside of a pipe chain when all sources are known upfront.
- **`mergeAll`**: Higher-order version; use when Observables to merge are emitted dynamically by another Observable.
- **`combineLatestWith`**: Emits arrays of latest values rather than individual emissions; use for state synchronization.
- **`concatWith`**: Sequential alternative; subscribes to the next Observable only after the current one completes.
- **`raceWith`**: Subscribes to all but keeps only the first Observable to emit, ignoring the rest.
