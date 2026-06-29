# auditTime

## Brief Description
`auditTime` periodically emits the most recent value from the source observable at the end of each fixed-duration window. When the first source value arrives, a timer of `duration` milliseconds starts. When the timer fires, the most recent source value received during that window is emitted and the cycle resets. It differs from `throttleTime` (which emits the *first* value immediately) and `debounceTime` (which resets the timer on each emission) — `auditTime` commits to a fixed window and always delivers the freshest value at the window boundary.

## Category
rate-limiting

## Import
```typescript
import { auditTime } from 'rxjs';
```

## Signature
```typescript
auditTime<T>(duration: number, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `duration` | `number` | The window length in milliseconds (or scheduler units). One value is emitted per window — the most recent. |
| `scheduler` | `SchedulerLike` (optional) | The scheduler used to manage the timer. Defaults to `asyncScheduler`. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable of the same type as the source that emits the most recent source value once per active `duration` window.

## Marble Diagram
```
Source:   --a-b-c---------d-e-f------|
          auditTime(40ms)
Output:   ----------c----------f-----|

Explanation:
- 'a' arrives and starts the 40ms timer
- 'b' and 'c' arrive; when the timer fires, 'c' (most recent) is emitted
- The cycle resets; silence until 'd'
- 'd' starts a new timer; 'e' and 'f' arrive
- Timer fires and emits 'f' (most recent)
```

## Examples

### Example 1: Capping DOM updates to 60fps
```typescript
import { fromEvent } from 'rxjs';
import { auditTime, map } from 'rxjs';

const mousemove$ = fromEvent<MouseEvent>(document, 'mousemove').pipe(
  auditTime(16), // ~60 frames per second
  map(event => ({ x: event.clientX, y: event.clientY }))
);

mousemove$.subscribe(({ x, y }) => {
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }
});
```

### Example 2: Batching rapid state changes before rendering
```typescript
import { Subject } from 'rxjs';
import { auditTime, scan } from 'rxjs';

interface AppState {
  count: number;
  lastUpdated: number;
}

const stateUpdates$ = new Subject<Partial<AppState>>();

const state$ = stateUpdates$.pipe(
  scan((state, patch) => ({ ...state, ...patch }), { count: 0, lastUpdated: 0 }),
  auditTime(100) // only re-render at most 10 times per second
);

state$.subscribe(state => {
  console.log('Rendering state:', state);
});

// Rapid fire updates — only the last snapshot within 100ms renders
for (let i = 0; i < 100; i++) {
  stateUpdates$.next({ count: i, lastUpdated: Date.now() });
}
```

### Example 3: Throttling analytics events with the latest context
```typescript
import { fromEvent } from 'rxjs';
import { auditTime, map, withLatestFrom } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

const userContext$ = new BehaviorSubject({ userId: 'u123', page: '/home' });

const clicks$ = fromEvent(document, 'click').pipe(
  auditTime(500), // at most 2 analytics events per second
  withLatestFrom(userContext$),
  map(([event, context]) => ({
    type: 'click',
    target: (event.target as Element).tagName,
    ...context,
    timestamp: Date.now(),
  }))
);

clicks$.subscribe(analyticsEvent => {
  console.log('Sending analytics:', analyticsEvent);
  // navigator.sendBeacon('/analytics', JSON.stringify(analyticsEvent));
});
```

## Common Pitfalls

### Pitfall 1: Expecting `auditTime` to behave like `throttleTime`
`throttleTime` emits the *first* value in each window immediately; `auditTime` waits until the window closes and emits the *last* value. Neither behavior is universally correct — pick based on whether leading or trailing is more important.

```typescript
// ❌ If you need immediate click feedback, auditTime adds a delay
auditTime(500) // user waits 500ms to see any response

// ✅ throttleTime for immediate response with a cooldown
import { throttleTime } from 'rxjs';
throttleTime(500) // first click responds instantly
```

### Pitfall 2: Confusing with `sampleTime` — both emit on a clock, but differently
`sampleTime` emits on a fixed repeating clock regardless of source activity; `auditTime` only activates when a source value arrives. If the source is silent, `auditTime` emits nothing.

```typescript
// auditTime — only ticks when source has emitted
source$.pipe(auditTime(1000)) // silent if source is silent

// sampleTime — ticks every 1000ms unconditionally
import { sampleTime } from 'rxjs';
source$.pipe(sampleTime(1000)) // emits the last value even across quiet periods
```

## Related Operators
- **`audit`**: Dynamic version — pass a factory function returning an observable to vary the window duration per emission.
- **`throttleTime`**: Emits the *first* value at the start of each window rather than the last at the end.
- **`debounceTime`**: Restarts the timer on every emission; emits only after a silence period.
- **`sampleTime`**: Uses an independent repeating clock rather than a window triggered by source activity.
