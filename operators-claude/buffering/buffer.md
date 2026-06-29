# buffer

## Brief Description
`buffer` collects values emitted by a source observable into arrays, emitting each array when a separate "closing" observable emits. The buffer accumulates values until the notifier fires, then emits the collected array and starts a new buffer. This is useful when you need to batch events together based on external signals, such as user interactions or timing events.

## Category
buffering

## Import
```typescript
import { buffer } from 'rxjs';
```

## Signature
```typescript
buffer<T>(closingNotifier: Observable<any>): OperatorFunction<T, T[]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| closingNotifier | `Observable<any>` | An observable that signals when to close the current buffer and emit it |

## Return Type
An `Observable<T[]>` that emits arrays of values collected from the source between successive notifications from the closing notifier.

## Marble Diagram
```
Source:          --a--b--c--d--e--f--|
                              ^
 closingNotifier: -----------n-------|

Output:          -----------[a,b,c,d]--[e,f]--|
```

## Examples

### Example 1: Buffer mouse clicks until a key is pressed
```typescript
import { fromEvent, buffer } from 'rxjs';

const clicks$ = fromEvent<MouseEvent>(document, 'click');
const keypresses$ = fromEvent<KeyboardEvent>(document, 'keydown');

const bufferedClicks$ = clicks$.pipe(
  buffer(keypresses$)
);

bufferedClicks$.subscribe(clickBatch => {
  console.log(`You clicked ${clickBatch.length} times before pressing a key`);
});
```

### Example 2: Buffer values using an interval
```typescript
import { interval, buffer } from 'rxjs';

// Emit values every 200ms
const source$ = interval(200);

// Close buffer every 1 second
const closer$ = interval(1000);

source$.pipe(
  buffer(closer$)
).subscribe(batch => {
  console.log('Batch:', batch);
  // Batch: [0, 1, 2, 3, 4]
  // Batch: [5, 6, 7, 8, 9]
  // ...
});
```

### Example 3: Buffer HTTP polling results until user confirms
```typescript
import { interval, fromEvent, buffer, switchMap } from 'rxjs';

const pollResults$ = interval(500); // simulate polling
const confirmButton$ = fromEvent(document.getElementById('confirm')!, 'click');

// Accumulate poll results, flush when user clicks confirm
pollResults$.pipe(
  buffer(confirmButton$)
).subscribe(results => {
  console.log('Processing batch of results:', results);
  // results is an array of all values emitted since last confirm click
});
```

## Common Pitfalls

### Pitfall 1: Empty buffers when notifier fires rapidly
If the closing notifier emits before the source emits any values, you will receive empty arrays. Guard against this if empty batches are unexpected.

```typescript
import { interval, buffer, filter } from 'rxjs';

const source$ = interval(1000);
const fastCloser$ = interval(100);

// ❌ Produces many empty arrays
source$.pipe(
  buffer(fastCloser$)
).subscribe(batch => console.log(batch));

// ✅ Filter out empty buffers
source$.pipe(
  buffer(fastCloser$),
  filter(batch => batch.length > 0)
).subscribe(batch => console.log(batch));
```

### Pitfall 2: Memory leak if closing notifier never fires
If the closing notifier never emits, the buffer grows indefinitely. Ensure the notifier eventually fires or the source completes.

```typescript
import { interval, buffer, NEVER, take } from 'rxjs';

// ❌ Buffer grows forever, never emits
interval(100).pipe(
  buffer(NEVER)
).subscribe(console.log);

// ✅ Ensure source completes so buffer flushes on completion
interval(100).pipe(
  take(10),
  buffer(NEVER) // emits remaining buffer on source complete
).subscribe(console.log); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## Related Operators
- **`bufferCount`**: buffers a fixed number of values instead of waiting for a notifier
- **`bufferTime`**: buffers values over a fixed time window
- **`bufferWhen`**: like `buffer` but the closing notifier is a factory function called per buffer
- **`window`**: same concept but emits inner Observables instead of arrays
