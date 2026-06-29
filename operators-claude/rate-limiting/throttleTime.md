# throttleTime

## Brief Description
`throttleTime` limits the rate of emissions by forwarding the first value from the source and then ignoring all subsequent values for a fixed number of milliseconds. After the suppression window expires, the next value is let through and the cycle repeats. It is the simplest and most common way to cap event processing to a maximum rate, making it ideal for scroll handlers, drag events, rapid button clicks, and any other high-frequency source where immediate responsiveness matters more than capturing every value.

## Category
rate-limiting

## Import
```typescript
import { throttleTime } from 'rxjs';
```

## Signature
```typescript
throttleTime<T>(
  duration: number,
  scheduler?: SchedulerLike,
  config?: ThrottleConfig
): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `duration` | `number` | The suppression window length in milliseconds (or scheduler units). |
| `scheduler` | `SchedulerLike` (optional) | Scheduler for managing the timer. Defaults to `asyncScheduler`. |
| `config` | `ThrottleConfig` (optional) | Object with `leading` (default `true`) and `trailing` (default `false`) flags. `leading: true` emits the first value; `trailing: true` also emits the last value seen during the window. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable of the same type as the source that emits at most once per `duration` window (twice if both `leading` and `trailing` are enabled and multiple values arrived).

## Marble Diagram
```
Source:   --a-b-c------d-e-f------g--|
          throttleTime(40ms)
Output:   --a----------d----------g--|

With { leading: true, trailing: true }:
Output:   --a--------c-d--------f-g--|

Explanation (leading only):
- 'a' emits immediately, 40ms window opens
- 'b' and 'c' are suppressed during the window
- 'd' emits after the window closes, new window opens
- 'e' and 'f' are suppressed
- 'g' emits after the second window closes
```

## Examples

### Example 1: Preventing double-submit on a button
```typescript
import { fromEvent } from 'rxjs';
import { throttleTime, exhaustMap } from 'rxjs';
import { ajax } from 'rxjs/ajax';

const submitBtn = document.getElementById('submit') as HTMLButtonElement;

fromEvent(submitBtn, 'click').pipe(
  throttleTime(2000), // ignore clicks for 2s after the first
  exhaustMap(() =>
    ajax.post('/api/order', { item: 'widget' })
  )
).subscribe({
  next: response => console.log('Order placed:', response),
  error: err => console.error('Order failed:', err),
});
```

### Example 2: Throttling scroll events for performance
```typescript
import { fromEvent } from 'rxjs';
import { throttleTime, map } from 'rxjs';

const scrollPositions$ = fromEvent(window, 'scroll').pipe(
  throttleTime(16), // ~60fps cap
  map(() => ({
    x: window.scrollX,
    y: window.scrollY,
  }))
);

scrollPositions$.subscribe(({ x, y }) => {
  const header = document.getElementById('header');
  if (header) {
    header.classList.toggle('sticky', y > 100);
  }
});
```

### Example 3: Rate-limiting WebSocket messages sent to server
```typescript
import { Subject } from 'rxjs';
import { throttleTime } from 'rxjs';

const userActions$ = new Subject<{ type: string; data: unknown }>();

const ws = new WebSocket('wss://example.com/events');

// Never send more than one message per 500ms regardless of user activity
userActions$.pipe(
  throttleTime(500, undefined, { leading: true, trailing: true })
).subscribe(action => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(action));
  }
});

// Simulate rapid user actions
userActions$.next({ type: 'cursor_move', data: { x: 100, y: 200 } });
userActions$.next({ type: 'cursor_move', data: { x: 110, y: 205 } });
userActions$.next({ type: 'cursor_move', data: { x: 120, y: 210 } });
```

## Common Pitfalls

### Pitfall 1: Using `throttleTime` when `debounceTime` is needed
`throttleTime` fires immediately and discards everything after. For inputs where you need the *final settled value* (e.g., a search box), `debounceTime` is almost always the right choice.

```typescript
// ❌ Sends the first character typed, not the finished search term
throttleTime(300)

// ✅ Waits for the user to stop typing
import { debounceTime } from 'rxjs';
debounceTime(300)
```

### Pitfall 2: Not enabling `trailing` when the final value matters
With default config, the last value in a burst is dropped. For things like slider positions or drag coordinates, the resting value is often the most important one.

```typescript
// ❌ The slider's final resting position may never reach the handler
throttleTime(100)

// ✅ Capture both the immediate feedback and the final position
throttleTime(100, undefined, { leading: true, trailing: true })
```

## Related Operators
- **`throttle`**: Dynamic version — pass a factory returning an observable to vary the window per emission.
- **`debounceTime`**: Waits for `duration` ms of silence before emitting; better for search inputs where the settled value is needed.
- **`auditTime`**: Always emits the most recent value at the end of each periodic window, not the first value at the start.
- **`sampleTime`**: Emits on a fixed clock regardless of source activity; emits nothing if the source was silent.
