# throttle

## Brief Description
`throttle` limits the rate of emissions from the source observable by opening a window after each emitted value, during which subsequent values are suppressed. The window duration is determined by a factory function that returns an observable, making it dynamic. Unlike `debounce`, which waits for silence, `throttle` lets the first value through immediately and then ignores the rest until the window closes. Its primary use case is rate-limiting high-frequency events where you want a responsive leading edge — such as mouse moves, scroll events, or button clicks — without processing every single occurrence.

## Category
rate-limiting

## Import
```typescript
import { throttle } from 'rxjs';
```

## Signature
```typescript
throttle<T>(
  durationSelector: (value: T) => ObservableInput<any>,
  config?: ThrottleConfig
): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `durationSelector` | `(value: T) => ObservableInput<any>` | A function called with each forwarded source value. Returns an observable whose first emission closes the throttle window and allows the next source value through. |
| `config` | `ThrottleConfig` (optional) | An object with `leading` (default `true`) and `trailing` (default `false`) boolean flags controlling whether to emit at the start and/or end of each throttle window. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an observable of the same type as the source that forwards values at a rate controlled by the duration observable.

## Marble Diagram
```
Source:   --a-b-c---------d-e-f--|
          throttle(() => timer(40ms), { leading: true, trailing: false })
Output:   --a-----------d--------|

With { leading: true, trailing: true }:
Output:   --a---------c-d------f-|

Explanation (leading only):
- 'a' passes immediately, opens a 40ms window
- 'b' and 'c' are suppressed within the window
- Window closes after 40ms of silence post 'a'
- 'd' passes immediately when the next burst starts
```

## Examples

### Example 1: Throttling mouse move events
```typescript
import { fromEvent, timer } from 'rxjs';
import { throttle, map } from 'rxjs';

const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove').pipe(
  throttle(() => timer(100)),
  map(event => ({ x: event.clientX, y: event.clientY }))
);

mouseMove$.subscribe(({ x, y }) => {
  console.log(`Mouse at (${x}, ${y})`);
  // Updates at most ~10 times per second instead of hundreds
});
```

### Example 2: Dynamic throttle window based on value
```typescript
import { Subject, timer } from 'rxjs';
import { throttle } from 'rxjs';

interface PriorityEvent {
  priority: 'high' | 'low';
  payload: string;
}

const events$ = new Subject<PriorityEvent>();

// High-priority events throttle at 100ms; low-priority at 500ms
events$.pipe(
  throttle(event => timer(event.priority === 'high' ? 100 : 500))
).subscribe(event => {
  console.log('Processing event:', event.payload);
});

events$.next({ priority: 'high', payload: 'critical-update' });
events$.next({ priority: 'high', payload: 'dropped-within-100ms' });
setTimeout(() => events$.next({ priority: 'low', payload: 'status-check' }), 200);
```

### Example 3: Throttle with trailing emission
```typescript
import { fromEvent, timer } from 'rxjs';
import { throttle, map } from 'rxjs';

const scroll$ = fromEvent(window, 'scroll').pipe(
  throttle(() => timer(200), { leading: true, trailing: true }),
  map(() => window.scrollY)
);

// Emits immediately on first scroll AND captures the final position
scroll$.subscribe(scrollY => {
  console.log('Scroll position:', scrollY);
  updateScrollIndicator(scrollY);
});

function updateScrollIndicator(y: number): void {
  const indicator = document.getElementById('scroll-indicator');
  if (indicator) indicator.style.top = `${y / document.body.scrollHeight * 100}%`;
}
```

## Common Pitfalls

### Pitfall 1: Confusing throttle (leading) with debounce (trailing)
`throttle` (leading only) gives immediate feedback but drops intermediate values. `debounce` waits for quiet time. Using throttle where debounce is needed causes stale data to be processed.

```typescript
// ❌ Throttling a search input — fires on the first keystroke, misses final query
throttle(() => timer(500))

// ✅ Debounce is correct for search inputs — waits for the user to stop typing
import { debounceTime } from 'rxjs';
debounceTime(300)
```

### Pitfall 2: Ignoring the `trailing` option when the last value matters
With default settings (`trailing: false`) the last value in a rapid burst is silently dropped, which can lead to missed state updates.

```typescript
import { throttle, timer } from 'rxjs';

// ❌ The final scroll/drag position may never be emitted
throttle(() => timer(100))

// ✅ Enable trailing to capture the resting position
throttle(() => timer(100), { leading: true, trailing: true })
```

## Related Operators
- **`throttleTime`**: Convenience wrapper for `throttle` with a fixed millisecond window; prefer it when the duration is constant.
- **`debounce`**: Waits for silence rather than leading with an immediate emission; better when only the final value in a burst matters.
- **`auditTime`** / **`audit`**: Always emits the *most recent* value at the end of each window, not the first.
- **`sampleTime`**: Emits the most recent source value on a fixed clock tick, independent of source activity.
