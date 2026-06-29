# windowToggle

## Brief Description
`windowToggle` opens a new inner observable each time the `openings` source emits, and closes that inner observable when the observable returned by `closingSelector` emits. Multiple windows can be open simultaneously, causing values to be emitted to more than one active window. The operator is the streaming counterpart to `bufferToggle`, useful when you need reactive, real-time access to windowed slices of a stream — for example tracking user interaction sessions or time-boxed query windows.

## Category
buffering

## Import
```typescript
import { windowToggle } from 'rxjs';
```

## Signature
```typescript
windowToggle<T, O>(
  openings: ObservableInput<O>,
  closingSelector: (openValue: O) => ObservableInput<any>
): OperatorFunction<T, Observable<T>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| openings | `ObservableInput<O>` | An observable whose emissions open a new window |
| closingSelector | `(openValue: O) => ObservableInput<any>` | A function receiving the opening value and returning an observable; when it emits, the corresponding window closes |

## Return Type
An `Observable<Observable<T>>` — a higher-order observable where each emitted inner observable represents one open window.

## Marble Diagram
```
Source:    --a--b--c--d--e--f--|
Openings:  ----O---------O-----|
Closing1:        ----C----------|
Closing2:                  --C--|

Outer:     ----W1--------W2----|
W1 emits:       --b--c--d|
W2 emits:                  --e-f|
```

## Examples

### Example 1: Window source values during active mouse button hold
```typescript
import { fromEvent, windowToggle, mergeMap, map, toArray } from 'rxjs';

const mousedown$ = fromEvent<MouseEvent>(document, 'mousedown');
const mouseup$ = fromEvent<MouseEvent>(document, 'mouseup');
const moves$ = fromEvent<MouseEvent>(document, 'mousemove');

moves$.pipe(
  windowToggle(
    mousedown$,
    () => mouseup$
  ),
  mergeMap(win$ => win$.pipe(toArray())),
  map(events => ({
    count: events.length,
    distance: events.length > 1
      ? Math.hypot(
          events[events.length - 1].clientX - events[0].clientX,
          events[events.length - 1].clientY - events[0].clientY
        )
      : 0
  }))
).subscribe(({ count, distance }) => {
  console.log(`Drag: ${count} move events, ${distance.toFixed(1)}px distance`);
});
```

### Example 2: Overlapping measurement windows
```typescript
import { interval, windowToggle, mergeMap, reduce, timer } from 'rxjs';

const source$ = interval(100);

// Open a window every 300ms, each lasting 600ms — causing overlap
source$.pipe(
  windowToggle(
    interval(300),
    () => timer(600)
  ),
  mergeMap(win$ =>
    win$.pipe(reduce((acc, val) => acc + val, 0))
  )
).subscribe(sum => {
  console.log('Window sum:', sum);
});
```

### Example 3: Track activity sessions
```typescript
import { fromEvent, windowToggle, mergeMap, count, map, timer } from 'rxjs';

const focus$ = fromEvent(window, 'focus');
const blur$ = fromEvent(window, 'blur');
const keydowns$ = fromEvent(document, 'keydown');

// Count keystrokes during each focus session
keydowns$.pipe(
  windowToggle(
    focus$,
    () => blur$ // window closes when page loses focus
  ),
  mergeMap(win$ => win$.pipe(count())),
  map((keystrokeCount, sessionIndex) => ({ session: sessionIndex + 1, keystrokeCount }))
).subscribe(({ session, keystrokeCount }) => {
  console.log(`Session ${session}: ${keystrokeCount} keystrokes`);
});
```

## Common Pitfalls

### Pitfall 1: Values emitted to multiple open windows simultaneously
When `closingSelector` windows outlast the `openings` interval, multiple windows are open and source values are multicast to all of them.

```typescript
import { interval, windowToggle, mergeMap, toArray, timer } from 'rxjs';

// Each window lasts 500ms but a new one opens every 200ms — heavy overlap
interval(100).pipe(
  windowToggle(
    interval(200),
    () => timer(500) // 500 > 200: always 2-3 open windows
  ),
  mergeMap(win$ => win$.pipe(toArray()))
).subscribe(batch => {
  // Values like 3, 4 may appear in 2-3 different batches
  console.log('Window values:', batch);
});
```

### Pitfall 2: closingSelector must return an ObservableInput
Returning a non-observable (like `undefined`) causes a runtime error.

```typescript
import { interval, windowToggle, timer } from 'rxjs';

// ❌ Forgot to return the closing observable
interval(100).pipe(
  windowToggle(
    interval(400),
    (_openVal) => {
      timer(200); // return is missing!
    } as any
  )
);

// ✅ Always return an ObservableInput from closingSelector
interval(100).pipe(
  windowToggle(
    interval(400),
    () => timer(200)
  )
);
```

## Related Operators
- **`bufferToggle`**: same open/close semantics but emits arrays instead of inner Observables
- **`window`**: closes windows with a single shared boundary observable (no overlapping)
- **`windowWhen`**: sequential (non-overlapping) windows with a factory-based closer
