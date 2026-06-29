# bufferWhen

## Brief Description
`bufferWhen` collects values from the source observable into arrays, where the end of each buffer is determined by an observable returned from a factory function. When the closing observable emits (or completes), the current buffer is emitted and a new buffer immediately starts, with `closingSelector` called again to get the next closing signal. This enables dynamic, sequential (non-overlapping) buffer windows whose duration can vary based on runtime conditions.

## Category
buffering

## Import
```typescript
import { bufferWhen } from 'rxjs';
```

## Signature
```typescript
bufferWhen<T>(closingSelector: () => ObservableInput<any>): OperatorFunction<T, T[]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| closingSelector | `() => ObservableInput<any>` | A function with no arguments that returns an observable. When this observable emits or completes, the current buffer closes and is emitted. The function is called again for the next buffer |

## Return Type
An `Observable<T[]>` emitting arrays of values collected between successive closing signals.

## Marble Diagram
```
Source:          --a--b--c--d--e--f--|
ClosingSelector: ----C1---------C2---|
                 (called again)  (called again...)

Output:          ----[a,b]------[c,d,e,f]--|
```

## Examples

### Example 1: Buffer with randomly varying window duration
```typescript
import { interval, bufferWhen, timer } from 'rxjs';

const source$ = interval(100);

source$.pipe(
  bufferWhen(() => {
    // Random window duration between 300ms and 800ms
    const duration = 300 + Math.random() * 500;
    return timer(duration);
  })
).subscribe(batch => {
  console.log(`Variable window captured ${batch.length} items:`, batch);
});
```

### Example 2: Buffer until a condition is met
```typescript
import { fromEvent, bufferWhen, filter, map } from 'rxjs';

const keydowns$ = fromEvent<KeyboardEvent>(document, 'keydown');

// Buffer keypresses until Enter is pressed
keydowns$.pipe(
  bufferWhen(() =>
    keydowns$.pipe(
      filter(e => e.key === 'Enter')
    )
  ),
  map(events => events.map(e => e.key).filter(k => k !== 'Enter'))
).subscribe(chars => {
  const word = chars.join('');
  console.log('Typed word:', word);
});
```

### Example 3: Adaptive batching based on queue depth
```typescript
import { Subject, bufferWhen, timer, switchMap } from 'rxjs';

const events$ = new Subject<{ priority: string; data: string }>();
let queueDepth = 0;

events$.pipe(
  bufferWhen(() => {
    // Flush quickly if queue is deep, slowly if shallow
    return queueDepth > 10 ? timer(100) : timer(1000);
  })
).subscribe(batch => {
  queueDepth = 0;
  console.log(`Flushing ${batch.length} events`);
  // send batch to server
});

// Simulate varying load
for (let i = 0; i < 20; i++) {
  events$.next({ priority: 'high', data: `event-${i}` });
  queueDepth++;
}
```

## Common Pitfalls

### Pitfall 1: closingSelector is called for each new buffer, not just once
The factory is re-invoked after every buffer closes. If it has side effects (e.g., a fetch) or expensive setup, those run on every cycle.

```typescript
import { interval, bufferWhen, timer } from 'rxjs';

let callCount = 0;

// ❌ If closingSelector has side effects, they run repeatedly
interval(100).pipe(
  bufferWhen(() => {
    callCount++; // called once per buffer!
    return timer(500);
  })
).subscribe(batch => console.log(`Buffer ${callCount}:`, batch));

// ✅ Keep closingSelector pure and side-effect free
interval(100).pipe(
  bufferWhen(() => timer(500))
).subscribe(batch => console.log('Batch:', batch));
```

### Pitfall 2: If closingSelector's observable never emits, buffer grows unbounded
```typescript
import { interval, bufferWhen, NEVER } from 'rxjs';

// ❌ NEVER never emits — buffer accumulates all values forever
interval(100).pipe(
  bufferWhen(() => NEVER)
).subscribe(console.log); // never logs anything, memory grows

// ✅ Always ensure the closing observable eventually emits
import { timer } from 'rxjs';
interval(100).pipe(
  bufferWhen(() => timer(1000)) // closes every 1 second
).subscribe(console.log);
```

## Related Operators
- **`buffer`**: same closing-notifier concept but uses a single shared notifier rather than a factory
- **`bufferToggle`**: allows overlapping buffers by specifying both open and close observables
- **`bufferTime`**: simpler API when the window duration is a fixed millisecond value
- **`windowWhen`**: same semantics but emits inner Observables instead of arrays
