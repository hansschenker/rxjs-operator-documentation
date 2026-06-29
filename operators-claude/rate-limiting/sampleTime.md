# sampleTime

## Brief Description
`sampleTime` emits the most recently received value from the source observable on a fixed repeating clock tick. Every `period` milliseconds, if the source has produced at least one new value since the last tick, that value is forwarded; otherwise, the tick is skipped silently. Unlike `auditTime` (where the timer is triggered by the first source emission), `sampleTime` runs an independent, always-on clock. It is ideal for scenarios where you want to poll a fast-changing stream at a steady, predictable rate — such as rendering a live chart, broadcasting state snapshots, or rate-limiting telemetry.

## Category
rate-limiting

## Import
```typescript
import { sampleTime } from 'rxjs';
```

## Signature
```typescript
sampleTime<T>(period: number, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | `number` | The interval in milliseconds between sample ticks. The clock runs continuously for the lifetime of the subscription. |
| `scheduler` | `SchedulerLike` (optional) | The scheduler used to drive the repeating clock. Defaults to `asyncScheduler`. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable of the same type as the source that emits the most recent source value once per `period`, only when a new value has been received since the last tick.

## Marble Diagram
```
Source:   --a-b-c-----d-e--------f--|
Clock:    ----x----x----x----x----x-|
          sampleTime(40ms)
Output:   ----c-----(silent)-e---f--|

Explanation:
- First clock tick: 'c' is the most recent source value → emits 'c'
- Second clock tick: no new source value since 'c' → silent
- Third clock tick: 'e' is most recent since 'c' → emits 'e'
- Fourth clock tick: no new value → silent
- Fifth clock tick: 'f' is most recent → emits 'f'
```

## Examples

### Example 1: Live chart updating at a fixed refresh rate
```typescript
import { Subject } from 'rxjs';
import { sampleTime, scan } from 'rxjs';

const priceUpdate$ = new Subject<number>();

// Update chart at most once per second, always with the freshest price
priceUpdate$.pipe(
  sampleTime(1000)
).subscribe(price => {
  console.log('Chart update — latest price:', price);
  // renderChartPoint(price);
});

// Simulate a high-frequency feed
const feedInterval = setInterval(() => {
  priceUpdate$.next(+(Math.random() * 100 + 200).toFixed(2));
}, 50); // 20 updates/second → compressed to 1/second

setTimeout(() => clearInterval(feedInterval), 5000);
```

### Example 2: Periodic snapshot of accumulated events
```typescript
import { fromEvent } from 'rxjs';
import { sampleTime, scan, map } from 'rxjs';

const clicks$ = fromEvent(document, 'click').pipe(
  scan((count) => count + 1, 0)
);

// Report total click count every 2 seconds
clicks$.pipe(
  sampleTime(2000)
).subscribe(total => {
  console.log(`Total clicks so far: ${total}`);
});
```

### Example 3: Rate-limiting telemetry from a game loop
```typescript
import { animationFrames } from 'rxjs';
import { sampleTime, map } from 'rxjs';

// animationFrames emits on every requestAnimationFrame (~60fps)
const gameState$ = animationFrames().pipe(
  map(() => ({
    playerX: Math.random() * 800,
    playerY: Math.random() * 600,
    score: Math.floor(Math.random() * 1000),
  }))
);

// Send telemetry at most once every 5 seconds, not 60fps
gameState$.pipe(
  sampleTime(5000)
).subscribe(state => {
  console.log('Telemetry snapshot:', state);
  // fetch('/telemetry', { method: 'POST', body: JSON.stringify(state) });
});
```

## Common Pitfalls

### Pitfall 1: Expecting output even when the source is idle
`sampleTime` only emits if the source produced a **new** value since the last tick. If the source is silent during a period, that tick produces no output. Use `BehaviorSubject` or `startWith` if you always need the latest known value.

```typescript
import { Subject } from 'rxjs';
import { sampleTime, startWith } from 'rxjs';

const value$ = new Subject<number>();

// ❌ Silent ticks when source has no new values
value$.pipe(sampleTime(1000)).subscribe(console.log);

// ✅ Always have a seed value so every tick produces output
value$.pipe(
  startWith(0),
  sampleTime(1000)
).subscribe(console.log);
```

### Pitfall 2: Confusing `sampleTime` with `auditTime`
Both emit the most recent value, but `auditTime` only runs its timer after a source emission arrives; `sampleTime` runs an unconditional repeating clock. For a source that emits rarely, `auditTime` is more reactive; `sampleTime` introduces a predictable (possibly long) delay.

```typescript
import { Subject } from 'rxjs';
import { sampleTime, auditTime } from 'rxjs';

const rare$ = new Subject<string>();

// sampleTime: waits up to 5s after the value arrives before emitting
rare$.pipe(sampleTime(5000)).subscribe(v => console.log('sampleTime:', v));

// auditTime: starts 5s timer the moment the value arrives
rare$.pipe(auditTime(5000)).subscribe(v => console.log('auditTime:', v));

// Both emit 5s after 'hello', but sampleTime's delay depends on clock phase
rare$.next('hello');
```

## Related Operators
- **`sample`**: Uses any observable as the notifier instead of a fixed timer, giving full external control over sampling.
- **`auditTime`**: Source-triggered window — the timer starts when a value arrives rather than running continuously.
- **`throttleTime`**: Emits immediately on the first value then suppresses; `sampleTime` always waits for the next clock tick.
- **`bufferTime`**: Collects *all* values during each time window into an array rather than keeping only the most recent.
