# sample

## Brief Description
`sample` emits the most recently received value from the source observable whenever a separate **notifier** observable emits. If the source has not produced a new value since the last sample, nothing is emitted. This decouples the output rate entirely from the source rate, letting an external signal — a timer, a button click, a WebSocket heartbeat, or any other observable — act as the sampling trigger. It is ideal when you want to poll a continuously updating stream at an externally defined cadence.

## Category
rate-limiting

## Import
```typescript
import { sample } from 'rxjs';
```

## Signature
```typescript
sample<T>(notifier: ObservableInput<any>): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `notifier` | `ObservableInput<any>` | An observable whose emissions trigger a sample. Each emission from the notifier causes `sample` to forward the most recent source value (if any new value has arrived since the last sample). |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable of the same type as the source that emits only when the notifier fires and the source has produced at least one new value since the previous sample.

## Marble Diagram
```
Source:   --a-b-c-----d--e--f---g---|
Notifier: -------x-------x------x--|
          sample(notifier)
Output:   -------c-------e------g--|

Explanation:
- First notifier tick → 'c' is the most recent source value → emits 'c'
- Between first and second notifier ticks: 'd', 'e' arrive → emits 'e'
- Between second and third ticks: 'f', 'g' arrive → emits 'g'
- If source had no new value between two ticks, nothing is emitted
```

## Examples

### Example 1: Sampling a price stream on button press
```typescript
import { interval, fromEvent } from 'rxjs';
import { sample, map } from 'rxjs';

// Simulated live price feed
const price$ = interval(200).pipe(
  map(tick => +(Math.random() * 100 + 50).toFixed(2))
);

const snapshotBtn = document.getElementById('snapshot') as HTMLButtonElement;
const snapshot$ = fromEvent(snapshotBtn, 'click');

// Capture the price at the exact moment the user clicks
price$.pipe(sample(snapshot$)).subscribe(price => {
  console.log('Captured price:', price);
  document.getElementById('price-display')!.textContent = `$${price}`;
});
```

### Example 2: Heartbeat sampling of sensor data
```typescript
import { Subject, interval } from 'rxjs';
import { sample } from 'rxjs';

const sensorData$ = new Subject<{ temperature: number; humidity: number }>();

// Sample sensor readings every 5 seconds for a dashboard
const heartbeat$ = interval(5000);

sensorData$.pipe(sample(heartbeat$)).subscribe(reading => {
  console.log('Dashboard update:', reading);
  // Only the latest reading in each 5s window reaches the dashboard
});

// Simulate rapid sensor emissions
setInterval(() => {
  sensorData$.next({
    temperature: 20 + Math.random() * 5,
    humidity: 60 + Math.random() * 10,
  });
}, 100);
```

### Example 3: Sampling a form for periodic auto-save
```typescript
import { fromEvent, interval, merge } from 'rxjs';
import { sample, map, startWith } from 'rxjs';

const titleEl = document.getElementById('title') as HTMLInputElement;
const bodyEl = document.getElementById('body') as HTMLTextAreaElement;
const saveBtn = document.getElementById('save') as HTMLButtonElement;

const formValue$ = merge(
  fromEvent(titleEl, 'input'),
  fromEvent(bodyEl, 'input')
).pipe(
  startWith(null),
  map(() => ({ title: titleEl.value, body: bodyEl.value }))
);

// Sample on either the periodic timer OR a manual save click
const saveTrigger$ = merge(
  interval(30000), // auto-save every 30s
  fromEvent(saveBtn, 'click') // or on demand
);

formValue$.pipe(sample(saveTrigger$)).subscribe(draft => {
  localStorage.setItem('draft', JSON.stringify(draft));
  console.log('Draft saved:', draft);
});
```

## Common Pitfalls

### Pitfall 1: Nothing emits when the source is silent between notifier ticks
`sample` only forwards a value if the source has emitted at least one **new** value since the previous sample. If the source has been silent, the notifier tick is ignored.

```typescript
import { EMPTY, interval } from 'rxjs';
import { sample } from 'rxjs';

// ❌ EMPTY never emits, so sample never outputs anything
EMPTY.pipe(sample(interval(1000))).subscribe(console.log); // no output

// ✅ Use a BehaviorSubject or startWith to ensure there is always a current value
import { BehaviorSubject } from 'rxjs';
const state$ = new BehaviorSubject('initial');
state$.pipe(sample(interval(1000))).subscribe(console.log); // emits 'initial' first tick
```

### Pitfall 2: Confusing `sample` with `sampleTime` — the notifier is powerful but manual
`sampleTime` uses a fixed repeating timer internally; `sample` gives you full control over when sampling occurs. Forgetting that a `Subject` notifier must have `.next()` called on it results in no output.

```typescript
import { Subject } from 'rxjs';
import { sample } from 'rxjs';

const notifier = new Subject<void>();
const source$ = new Subject<number>();

source$.pipe(sample(notifier)).subscribe(console.log);

source$.next(1);
source$.next(2);
// ❌ Forgot to trigger the notifier — nothing is logged

// ✅ Fire the notifier to get the latest value
notifier.next();
```

## Related Operators
- **`sampleTime`**: Convenience wrapper that uses a fixed `interval` as the notifier; prefer it when the cadence is constant.
- **`audit`**: Also emits the most recent value, but the window is opened *by the source* rather than driven by an external notifier.
- **`debounceTime`**: Waits for source silence; `sample` ignores source timing entirely and responds to the notifier.
- **`withLatestFrom`**: Pulls the latest value from a secondary stream when the primary stream emits, which is the inverse pattern of `sample`.
