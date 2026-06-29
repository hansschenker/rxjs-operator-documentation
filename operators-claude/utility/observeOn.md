# observeOn

## Brief Description
`observeOn` re-schedules notifications (next, error, complete) from the source observable to be delivered on a specified scheduler. It controls which execution context downstream operators and subscribers receive emissions on. This is most commonly used to move CPU-intensive work off the main thread (using `asapScheduler` or `asyncScheduler`) or to ensure UI updates happen synchronously after an async operation.

## Category
utility

## Import
```typescript
import { observeOn } from 'rxjs';
```

## Signature
```typescript
observeOn<T>(scheduler: SchedulerLike, delay?: number): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| scheduler | `SchedulerLike` | The scheduler to use for delivering notifications. Common options: `asyncScheduler`, `asapScheduler`, `queueScheduler`, `animationFrameScheduler`. |
| delay | `number` | Optional. Additional delay in milliseconds before scheduling each notification. Defaults to `0`. |

## Return Type
Returns a `MonoTypeOperatorFunction<T>` — an observable that emits the same values as the source but delivers them via the specified scheduler.

## Marble Diagram
```
Source (synchronous):   (a)(b)(c)|>
observeOn(asyncScheduler):
Scheduled async:        --a--b--c--|>
(notifications deferred to the macro-task queue)
```

## Examples

### Example 1: Deferring synchronous emissions to the async macro-task queue
```typescript
import { of, observeOn, asyncScheduler } from 'rxjs';

console.log('Before subscribe');

of(1, 2, 3).pipe(
  observeOn(asyncScheduler)
).subscribe(val => console.log('Received:', val));

console.log('After subscribe');

// Output:
// Before subscribe
// After subscribe   <-- synchronous code runs first
// Received: 1       <-- async notifications come later
// Received: 2
// Received: 3
```

### Example 2: Using asapScheduler for microtask-level scheduling
```typescript
import { of, observeOn, asapScheduler } from 'rxjs';

console.log('1 - start');

of('microtask value').pipe(
  observeOn(asapScheduler)
).subscribe(val => console.log('3 - received:', val));

console.log('2 - after subscribe');
// Microtask runs before next macro-task but after current call stack

// Output:
// 1 - start
// 2 - after subscribe
// 3 - received: microtask value
```

### Example 3: Ensuring UI updates happen on animationFrameScheduler
```typescript
import { fromEvent, map, observeOn, animationFrameScheduler } from 'rxjs';

// Schedule DOM updates to align with the browser's animation frame
const mouseMoves$ = fromEvent<MouseEvent>(document, 'mousemove').pipe(
  map(event => ({ x: event.clientX, y: event.clientY })),
  observeOn(animationFrameScheduler)
);

mouseMoves$.subscribe(({ x, y }) => {
  // This runs in sync with requestAnimationFrame, preventing layout thrashing
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }
});
```

## Common Pitfalls

### Pitfall 1: Confusing observeOn with subscribeOn
`observeOn` controls where emissions are *delivered* (downstream). `subscribeOn` controls where *subscription* happens (upstream). They affect different parts of the pipeline.

```typescript
import { of, observeOn, subscribeOn, asyncScheduler } from 'rxjs';
import { tap } from 'rxjs';

// ❌ Incorrect mental model — thinking observeOn moves the source work
of(1, 2, 3).pipe(
  observeOn(asyncScheduler),
  tap(val => console.log('This is still async — observeOn affected delivery'))
).subscribe();

// ✅ Correct understanding:
// observeOn = "schedule the DELIVERY of notifications"
// subscribeOn = "schedule the SUBSCRIPTION (source execution) itself"
of(1, 2, 3).pipe(
  subscribeOn(asyncScheduler), // source subscription is async
  observeOn(asyncScheduler)    // delivery is also async
).subscribe(val => console.log(val));
```

### Pitfall 2: Using observeOn in performance-sensitive tight loops
Each emission scheduled via `observeOn` incurs scheduler overhead. For high-frequency streams (e.g., `animationFrameScheduler` with `interval`), this overhead can be significant.

```typescript
import { interval, observeOn, asyncScheduler, take } from 'rxjs';

// ❌ Potentially costly — scheduling overhead for every single emission
interval(0).pipe(
  take(10000),
  observeOn(asyncScheduler)
).subscribe(val => {
  // 10,000 async tasks scheduled
});

// ✅ Preferred — use the scheduler directly in the source operator when possible
import { observeOn, asyncScheduler } from 'rxjs';
import { scheduled } from 'rxjs';
const items = Array.from({ length: 10000 }, (_, i) => i);
scheduled(items, asyncScheduler).subscribe(val => {
  // items emitted using asyncScheduler natively
});
```

## Related Operators
- **`subscribeOn`**: Controls the scheduler for the subscription itself (upstream execution), not the delivery of notifications.
- **`scheduled`** (creation operator): Creates an observable from a source using a specific scheduler directly.
- **`delay`**: Uses `asyncScheduler` under the hood to defer emissions; `observeOn` offers finer-grained scheduler control.
