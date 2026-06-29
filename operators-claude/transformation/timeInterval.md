# timeInterval

## Brief Description
Measures the time interval between consecutive emissions from the source Observable, wrapping each value in a `TimeInterval<T>` object containing the original value and the elapsed time in milliseconds since the previous emission (or subscription for the first emission). Unlike `timestamp`, which records the absolute time of emission, `timeInterval` records the relative gap between emissions.

## Category
transformation

## Import
```typescript
import { timeInterval } from 'rxjs';
```

## Signature
```typescript
timeInterval<T>(scheduler?: SchedulerLike): OperatorFunction<T, TimeInterval<T>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `scheduler` | `SchedulerLike` (optional) | The scheduler used to measure time intervals. Defaults to `asyncScheduler`. Override in tests with `TestScheduler`. |

## Return Type
An `Observable<TimeInterval<T>>` where each emission is `{ value: T, interval: number }`. The `interval` field is the elapsed time in milliseconds since the last emission (or since subscription for the first emission).

## Marble Diagram
```
Source:  --a---------b----c--|
timeInterval()
Output:  --{v:a,i:t1}--{v:b,i:t2}--{v:c,i:t3}--|
         (i values are milliseconds since the previous emission)
```

## Examples

### Example 1: Measure time between user keystrokes
```typescript
import { fromEvent, timeInterval, map } from 'rxjs';

fromEvent<KeyboardEvent>(document, 'keydown').pipe(
  timeInterval(),
  map(({ value, interval }) => ({
    key: value.key,
    msSincePrevious: Math.round(interval)
  }))
).subscribe(data => {
  console.log(`Key "${data.key}" pressed, gap: ${data.msSincePrevious}ms`);
});
// Output (on typing):
// Key "H" pressed, gap: 1200ms  (time since subscription)
// Key "e" pressed, gap: 120ms
// Key "l" pressed, gap: 95ms
// Key "l" pressed, gap: 88ms
// Key "o" pressed, gap: 200ms
```

### Example 2: Detect unusually slow emissions
```typescript
import { interval, timeInterval, filter, take } from 'rxjs';

const THRESHOLD_MS = 1100;

interval(1000).pipe(
  take(10),
  timeInterval(),
  filter(({ interval: elapsed }) => elapsed > THRESHOLD_MS)
).subscribe(({ value, interval: elapsed }) => {
  console.warn(`Slow emission detected: value=${value}, elapsed=${elapsed.toFixed(0)}ms`);
});
```

### Example 3: Build a typing speed monitor
```typescript
import { Subject, timeInterval, scan, map } from 'rxjs';

const keystrokes$ = new Subject<string>();

keystrokes$.pipe(
  timeInterval(),
  scan(
    (acc, { value, interval }) => ({
      chars: acc.chars + 1,
      totalTime: acc.totalTime + interval,
      lastKey: value,
    }),
    { chars: 0, totalTime: 0, lastKey: '' }
  ),
  map(({ chars, totalTime }) => ({
    chars,
    wpm: totalTime > 0 ? Math.round((chars / 5) / (totalTime / 60000)) : 0
  }))
).subscribe(stats => console.log(`WPM: ${stats.wpm} (${stats.chars} chars)`));

// Simulate keystrokes
keystrokes$.next('H');
keystrokes$.next('e');
keystrokes$.next('l');
```

## Common Pitfalls

### Pitfall 1: Confusing interval with timestamp
`timeInterval` gives the time between successive emissions, not the absolute time of emission. Use `timestamp` if you need absolute time.

```typescript
import { of, timeInterval, timestamp } from 'rxjs';

// timeInterval: { value: 'a', interval: 42 } — ms since last emission
of('a').pipe(
  timeInterval()
).subscribe(t => console.log('Elapsed since last:', t.interval, 'ms'));

// timestamp: { value: 'a', timestamp: 1705312841000 } — absolute ms
of('a').pipe(
  timestamp()
).subscribe(t => console.log('Absolute time:', new Date(t.timestamp).toISOString()));
```

### Pitfall 2: Large first interval due to subscription time
The first `interval` value includes the time from subscription to the first emission, which may be much larger than subsequent intervals if the source has a delay before the first value.

```typescript
import { timer, timeInterval, take } from 'rxjs';

// Starts after 2 seconds, then emits every 500ms
timer(2000, 500).pipe(
  take(3),
  timeInterval()
).subscribe(({ value, interval }) => {
  console.log(`Value: ${value}, interval: ${Math.round(interval)}ms`);
});
// Output:
// Value: 0, interval: 2000ms  ← includes startup delay
// Value: 1, interval: 501ms
// Value: 2, interval: 499ms
```

## Related Operators
- **`timestamp`**: Records the absolute time of each emission rather than the elapsed time since the last emission.
- **`debounceTime`**: Emits only when the source is silent for a specified duration — uses time differently.
- **`throttleTime`**: Throttles emissions to no more than one per time window.
- **`delay`**: Delays all emissions by a fixed duration without adding timing metadata.
