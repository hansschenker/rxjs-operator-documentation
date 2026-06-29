# bufferToggle

## Brief Description
`bufferToggle` opens a new buffer each time an `openings` observable emits, and closes that buffer when the observable returned by `closingSelector` for that opening emits. Multiple buffers can be open simultaneously, meaning values can appear in more than one buffer. This operator is ideal for capturing activity within explicitly defined open/close windows, such as tracking events that occur during a UI interaction or a timed operation.

## Category
buffering

## Import
```typescript
import { bufferToggle } from 'rxjs';
```

## Signature
```typescript
bufferToggle<T, O>(
  openings: ObservableInput<O>,
  closingSelector: (value: O) => ObservableInput<any>
): OperatorFunction<T, T[]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| openings | `ObservableInput<O>` | An observable whose emissions open new buffers |
| closingSelector | `(value: O) => ObservableInput<any>` | A function that receives the opening value and returns an observable; when that observable emits, the corresponding buffer closes and is emitted |

## Return Type
An `Observable<T[]>` that emits arrays of values collected between corresponding open and close signals.

## Marble Diagram
```
Source:   --a--b--c--d--e--f--|
Openings: ----O---------O-----|
Closing:       ------C       ---C|

Output:   ----------[b,c,d]--[e,f]--|
          (buffer 1 opened at O1, closed at C1)
          (buffer 2 opened at O2, closed at C2)
```

## Examples

### Example 1: Record keypresses during a mouse button hold
```typescript
import { fromEvent, bufferToggle, map } from 'rxjs';

const mousedown$ = fromEvent<MouseEvent>(document, 'mousedown');
const mouseup$ = fromEvent<MouseEvent>(document, 'mouseup');
const keypresses$ = fromEvent<KeyboardEvent>(document, 'keydown');

keypresses$.pipe(
  bufferToggle(
    mousedown$,
    () => mouseup$ // close buffer when mouse is released
  ),
  map(keys => keys.map(e => e.key))
).subscribe(keys => {
  console.log('Keys pressed while mouse held:', keys);
});
```

### Example 2: Capture values during interval windows
```typescript
import { interval, bufferToggle, timer } from 'rxjs';

const source$ = interval(100);

// Open a window every 500ms
const openings$ = interval(500);

// Each window stays open for 200ms
source$.pipe(
  bufferToggle(
    openings$,
    () => timer(200)
  )
).subscribe(batch => {
  console.log('Captured during window:', batch);
  // Captured during window: [4, 5]
  // Captured during window: [9, 10]
  // ...
});
```

### Example 3: Overlapping buffers (multiple open at once)
```typescript
import { interval, bufferToggle, timer } from 'rxjs';

const source$ = interval(100);

// Open a new window every 200ms
const openings$ = interval(200);

// Each window lasts 400ms — longer than the opening interval
// so windows will overlap and values will appear in multiple buffers
source$.pipe(
  bufferToggle(
    openings$,
    () => timer(400)
  )
).subscribe(batch => {
  console.log('Overlapping window:', batch);
});
// Overlapping window: [1, 2, 3, 4]  (window 1: 200ms–600ms)
// Overlapping window: [3, 4, 5, 6]  (window 2: 400ms–800ms)
// ...
```

## Common Pitfalls

### Pitfall 1: Values appearing in multiple buffers
When windows overlap (closing window is longer than opening interval), source values are captured in every currently-open buffer. This is by design but can be surprising.

```typescript
import { from, bufferToggle, timer, of } from 'rxjs';

// ❌ Assuming each value appears in exactly one buffer
// With overlapping windows, values repeat across buffers
from([1,2,3,4,5]).pipe(
  bufferToggle(
    of(0, 2), // open two windows
    () => timer(10)
  )
).subscribe(buf => console.log(buf)); // values may repeat!

// ✅ Use bufferWhen for exclusive, sequential windows
// or ensure closingSelector returns before next opening fires
```

### Pitfall 2: Forgetting to return an observable from closingSelector
The `closingSelector` must return an `ObservableInput`. Returning `undefined` or a plain value will cause an error.

```typescript
import { interval, bufferToggle, timer } from 'rxjs';

// ❌ closingSelector returns undefined (common mistake)
interval(100).pipe(
  bufferToggle(
    interval(500),
    (_openValue) => {
      // forgot to return!
      timer(200);
    } as any
  )
);

// ✅ Always return the closing observable
interval(100).pipe(
  bufferToggle(
    interval(500),
    (_openValue) => timer(200)
  )
);
```

## Related Operators
- **`buffer`**: closes a single running buffer on a notifier signal
- **`bufferWhen`**: like `bufferToggle` but opens/closes sequentially (one buffer at a time)
- **`windowToggle`**: same open/close semantics but emits inner Observables instead of arrays
