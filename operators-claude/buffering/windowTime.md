# windowTime

## Brief Description
`windowTime` divides a source observable into time-based nested observables (windows). Each inner observable collects values for `windowTimeSpan` milliseconds before completing, at which point the outer observable emits a new inner observable for the next window. An optional `windowCreationInterval` enables overlapping windows, and `maxWindowSize` caps the number of items per window. This is the streaming counterpart to `bufferTime`, offering the ability to apply per-window operators in a reactive pipeline.

## Category
buffering

## Import
```typescript
import { windowTime } from 'rxjs';
```

## Signature
```typescript
windowTime<T>(windowTimeSpan: number, scheduler?: SchedulerLike): OperatorFunction<T, Observable<T>>
windowTime<T>(windowTimeSpan: number, windowCreationInterval: number | null | undefined, scheduler?: SchedulerLike): OperatorFunction<T, Observable<T>>
windowTime<T>(windowTimeSpan: number, windowCreationInterval: number | null | undefined, maxWindowSize: number, scheduler?: SchedulerLike): OperatorFunction<T, Observable<T>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| windowTimeSpan | `number` | Duration (ms) each window stays open |
| windowCreationInterval | `number \| null \| undefined` | Optional. How often (ms) a new window opens. Defaults to `windowTimeSpan` (non-overlapping) |
| maxWindowSize | `number` | Optional. Maximum items emitted by each inner observable before it completes |
| scheduler | `SchedulerLike` | Optional. Scheduler for timing. Defaults to `asyncScheduler` |

## Return Type
An `Observable<Observable<T>>` — a higher-order observable where each inner observable represents one time window of source values.

## Marble Diagram
```
Non-overlapping (windowTime(3)):
Source:   --a--b--c--d--e--f--|
          [W1    ][W2    ][W3 ]
Outer:    W1------W2------W3--|
W1 emits: --a--b--c|
W2 emits:          --d--e--f|

Overlapping (windowTime(4, 2)):
          [W1      ]
                [W2      ]
W1 emits: --a--b--c--d|
W2 emits:        --c--d--e--f|
```

## Examples

### Example 1: Count events per second
```typescript
import { fromEvent, windowTime, mergeMap, count } from 'rxjs';

const clicks$ = fromEvent(document, 'click');

clicks$.pipe(
  windowTime(1000),
  mergeMap(win$ => win$.pipe(count()))
).subscribe(clicksPerSecond => {
  console.log(`${clicksPerSecond} clicks/sec`);
});
```

### Example 2: Rolling 2-second window updated every 500ms
```typescript
import { interval, windowTime, mergeMap, toArray } from 'rxjs';

const source$ = interval(200);

source$.pipe(
  windowTime(2000, 500), // 2s window, new one every 500ms
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(windowValues => {
  console.log('Rolling window:', windowValues);
});
```

### Example 3: Find the most frequent value per time window
```typescript
import { Subject, windowTime, mergeMap, toArray, map } from 'rxjs';

const events$ = new Subject<string>();

events$.pipe(
  windowTime(1000),
  mergeMap(win$ => win$.pipe(toArray())),
  map(events => {
    const freq = events.reduce<Record<string, number>>((acc, e) => {
      acc[e] = (acc[e] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })
).subscribe(topEvent => {
  if (topEvent) console.log('Most frequent event this second:', topEvent);
});

// Simulate events
const types = ['click', 'hover', 'click', 'scroll', 'click'];
types.forEach((t, i) => setTimeout(() => events$.next(t), i * 150));
```

## Common Pitfalls

### Pitfall 1: Inner observables must be subscribed to receive values
The outer observable emits inner observables that are cold-like. Not subscribing to them (via a flattening operator) means values are never received.

```typescript
import { interval, windowTime } from 'rxjs';

// ❌ Each inner window$ is emitted but never subscribed
interval(100).pipe(
  windowTime(500)
).subscribe(win$ => {
  console.log('new window', win$); // just an Observable — no values seen
});

// ✅ Flatten with mergeMap
import { mergeMap, toArray } from 'rxjs';
interval(100).pipe(
  windowTime(500),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(batch => console.log('Window batch:', batch));
```

### Pitfall 2: Empty windows when source is idle
Like `bufferTime`, `windowTime` emits windows even when no values arrived. An inner observable that completes immediately with no emissions should be handled.

```typescript
import { Subject, windowTime, mergeMap, toArray, filter } from 'rxjs';

const sparse$ = new Subject<number>();

// ❌ Downstream processes empty windows unnecessarily
sparse$.pipe(
  windowTime(1000),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(batch => processBatch(batch)); // called with [] when quiet

// ✅ Skip empty windows
sparse$.pipe(
  windowTime(1000),
  mergeMap(win$ => win$.pipe(toArray())),
  filter(batch => batch.length > 0)
).subscribe(batch => processBatch(batch));

function processBatch(batch: number[]) {
  console.log('Processing:', batch);
}
```

## Related Operators
- **`bufferTime`**: same time-windowing but emits arrays instead of inner Observables
- **`window`**: closes windows on an observable boundary rather than a timer
- **`windowCount`**: closes windows based on item count
- **`throttleTime`** / **`debounceTime`**: single-value rate-limiting alternatives
