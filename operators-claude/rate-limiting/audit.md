# audit

## Brief Description
`audit` is a rate-limiting operator that, when triggered by a source emission, starts an inner observable produced by a factory function. When that inner observable emits its first value, `audit` forwards the **most recent** value from the source and then resets. Any values that arrived while the window was open are discarded — only the latest survives. Unlike `throttle` (which emits the *first* value in a window), `audit` always emits the *last* accumulated value, making it well-suited for tracking the final state of rapidly changing data such as form fields, animation frames, or sensor readings.

## Category
rate-limiting

## Import
```typescript
import { audit } from 'rxjs';
```

## Signature
```typescript
audit<T>(durationSelector: (value: T) => ObservableInput<any>): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `durationSelector` | `(value: T) => ObservableInput<any>` | A function called with the value that opens the window. Returns an observable or promise; when it emits, the most recent source value is forwarded and the window closes. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable of the same type as the source that emits the most recent value at the moment the duration observable fires.

## Marble Diagram
```
Source:   --a-b-c---------d-e-f-----|
          audit(() => timer(40ms))
Output:   ----------c---------f-----|

Explanation:
- 'a' opens a 40ms window via durationSelector
- 'b' and 'c' arrive; the window closes after 40ms and emits 'c' (most recent)
- The cycle resets; 'd' opens a new 40ms window
- 'e' and 'f' arrive; the window closes and emits 'f' (most recent)
```

## Examples

### Example 1: Capture the most recent drag position
```typescript
import { fromEvent, timer } from 'rxjs';
import { audit, map, takeUntil } from 'rxjs';

const mousedown$ = fromEvent<MouseEvent>(document, 'mousedown');
const mouseup$ = fromEvent<MouseEvent>(document, 'mouseup');
const mousemove$ = fromEvent<MouseEvent>(document, 'mousemove');

mousedown$.subscribe(() => {
  mousemove$.pipe(
    takeUntil(mouseup$),
    audit(() => timer(50)), // capture position every 50ms
    map(event => ({ x: event.clientX, y: event.clientY }))
  ).subscribe(pos => {
    console.log('Drag snapshot (most recent):', pos);
  });
});
```

### Example 2: Dynamic audit window based on stream state
```typescript
import { Subject, timer } from 'rxjs';
import { audit } from 'rxjs';

interface SensorReading {
  sensor: string;
  value: number;
  critical: boolean;
}

const readings$ = new Subject<SensorReading>();

// Critical readings flush fast; normal readings on a longer window
readings$.pipe(
  audit(reading => timer(reading.critical ? 50 : 500))
).subscribe(reading => {
  console.log(`[${reading.sensor}] Latest value: ${reading.value}`);
});

readings$.next({ sensor: 'temp', value: 21, critical: false });
readings$.next({ sensor: 'temp', value: 22, critical: false }); // wins the window
setTimeout(() => readings$.next({ sensor: 'temp', value: 23, critical: true }), 600);
```

### Example 3: Audit with a promise-based gate
```typescript
import { Subject } from 'rxjs';
import { audit } from 'rxjs';

const updates$ = new Subject<{ field: string; value: string }>();

// Gate on an animation frame via a promise
updates$.pipe(
  audit(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
).subscribe(update => {
  // Runs once per animation frame with the latest update
  console.log('Applying to DOM:', update);
  const el = document.getElementById(update.field);
  if (el) el.textContent = update.value;
});

updates$.next({ field: 'title', value: 'Hello' });
updates$.next({ field: 'title', value: 'Hello World' }); // this one wins
```

## Common Pitfalls

### Pitfall 1: Confusing `audit` with `throttle` — they emit opposite ends
`throttle` emits the **first** value that opens a window; `audit` emits the **last** (most recent) value when the window closes. Choosing the wrong one causes stale-first or stale-last bugs.

```typescript
// ❌ throttle gives you the first position in each drag burst
import { throttle, timer } from 'rxjs';
throttle(() => timer(50))

// ✅ audit gives you the latest position at each 50ms boundary
import { audit, timer } from 'rxjs';
audit(() => timer(50))
```

### Pitfall 2: Opening the window only on the first value of each cycle
The `durationSelector` is called with the value that **starts** the window (the first unthrottled value), not with subsequent values. The inner observable is shared for the entire window.

```typescript
const stream$ = new Subject<number>();

// The window duration is determined by the FIRST value (1),
// even though values 2–5 arrive during the window
stream$.pipe(
  audit(firstVal => {
    console.log('Window opened by:', firstVal); // logs once per window
    return timer(200);
  })
).subscribe(console.log);
```

## Related Operators
- **`auditTime`**: Fixed-duration convenience wrapper for `audit`; use it when the window duration is constant.
- **`throttle`**: Emits the *first* value that opens a window; `audit` emits the *last* value when the window closes.
- **`debounce`**: Restarts a timer on each emission and waits for silence; `audit` commits to the window opened by the first emission.
- **`sample`**: Emits the most recent source value when a separate notifier fires, with no window opened by the source itself.
