# mergeAll

## Brief Description
`mergeAll` subscribes to each inner Observable emitted by a higher-order Observable concurrently, merging all their emissions into a single output stream. Unlike `concatAll`, it does not wait for one inner Observable to complete before subscribing to the next. This makes it ideal for scenarios where multiple asynchronous operations should run in parallel and results should be emitted as soon as they arrive, such as parallel HTTP requests or real-time event streams.

## Category
combination

## Import
```typescript
import { mergeAll } from 'rxjs';
```

## Signature
```typescript
mergeAll<O extends ObservableInput<any>>(
  concurrent?: number
): OperatorFunction<O, ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `concurrent` | `number` | Optional. Maximum number of inner Observables to subscribe to at the same time. Defaults to `Infinity` (all concurrent). When the limit is reached, new inner Observables are queued until a current one completes. |

## Return Type
An `OperatorFunction` that flattens a higher-order Observable into a first-order Observable, emitting values from all active inner Observables as they arrive, without preserving order.

## Marble Diagram
```
Outer:    --(A$)--(B$)--(C$)--|       (outer emits inner Observables)
A$:           --1-----3----------->
B$:                --2-------4---->
C$:                      --5------>

Result:   ----1--2--3---5--4------> (interleaved, as fast as each inner emits)
```

## Examples

### Example 1: Parallel HTTP requests
```typescript
import { of, mergeAll } from 'rxjs';
import { map, delay } from 'rxjs/operators';

const urls = ['/api/users', '/api/posts', '/api/comments'];

// Simulate fetching data with different response times
const fetchAll$ = of(
  ...urls.map((url, i) =>
    of(`Response from ${url}`).pipe(delay((3 - i) * 300))
  )
);

fetchAll$.pipe(
  mergeAll()
).subscribe(response => console.log(response));
// Response from /api/comments  (fastest, 300ms)
// Response from /api/posts     (600ms)
// Response from /api/users     (900ms)
// Responses arrive as each request completes
```

### Example 2: Limiting concurrency with the concurrent parameter
```typescript
import { Subject, of, mergeAll } from 'rxjs';
import { delay, map } from 'rxjs/operators';

const uploadQueue$ = new Subject<string>();

// Simulate file upload
const uploadFile = (filename: string) =>
  of(`Uploaded: ${filename}`).pipe(delay(1000));

// Only 2 uploads at a time
uploadQueue$.pipe(
  map(uploadFile),
  mergeAll(2) // concurrent = 2
).subscribe(result => console.log(result));

// Enqueue 5 files
['file1.jpg', 'file2.jpg', 'file3.jpg', 'file4.jpg', 'file5.jpg']
  .forEach(f => uploadQueue$.next(f));
// file1 and file2 upload in parallel
// file3 starts when file1 or file2 finishes
// etc.
```

### Example 3: Merging real-time event streams
```typescript
import { fromEvent, of, mergeAll } from 'rxjs';
import { map } from 'rxjs/operators';

// Create event streams from multiple buttons
const buttons = ['#btn-save', '#btn-delete', '#btn-refresh'];

const buttonEvents$ = of(
  ...buttons.map(selector => {
    const el = document.querySelector(selector) as HTMLButtonElement;
    return fromEvent(el, 'click').pipe(
      map(() => `Clicked: ${selector}`)
    );
  })
);

buttonEvents$.pipe(
  mergeAll()
).subscribe(event => {
  console.log(event);
  // Handle whichever button was clicked
});
```

## Common Pitfalls

### Pitfall 1: Uncontrolled concurrency causing resource exhaustion
With the default `concurrent = Infinity`, `mergeAll` will subscribe to every inner Observable immediately. This can overwhelm APIs or system resources if many inner Observables are generated rapidly.

```typescript
import { interval, of, mergeAll } from 'rxjs';
import { map, take, delay } from 'rxjs/operators';

// ❌ Every tick creates a new long-running request — can create thousands
interval(10).pipe(
  map((i) => of(`Request ${i}`).pipe(delay(5000))),
  mergeAll() // Unlimited! Thousands of concurrent subscriptions
).subscribe(console.log);

// ✅ Limit concurrency
interval(10).pipe(
  map((i) => of(`Request ${i}`).pipe(delay(5000))),
  mergeAll(5) // Max 5 concurrent
).subscribe(console.log);
```

### Pitfall 2: Emissions are not in order
`mergeAll` does not guarantee the order of emissions. If your downstream logic relies on order, use `concatAll` instead.

```typescript
import { of, mergeAll, concatAll } from 'rxjs';
import { delay } from 'rxjs/operators';

// ❌ mergeAll — order depends on which resolves first
of(
  of('slow').pipe(delay(500)),
  of('fast').pipe(delay(100))
).pipe(
  mergeAll()
).subscribe(console.log);
// fast, slow — not the original order!

// ✅ concatAll preserves order when required
of(
  of('slow').pipe(delay(500)),
  of('fast').pipe(delay(100))
).pipe(
  concatAll()
).subscribe(console.log);
// slow (after 500ms), fast (after 600ms)
```

## Related Operators
- **`mergeWith`**: Pipeable operator to merge the current Observable with other known Observables without a higher-order source.
- **`concatAll`**: Sequential alternative; waits for each inner Observable to complete before starting the next.
- **`switchAll`**: Cancels the previous inner Observable when a new one arrives; use for type-ahead scenarios.
- **`exhaustAll`**: Ignores new inner Observables while one is already running; prevents overlapping requests.
- **`mergeMap`**: Combines `map` + `mergeAll`; more concise for most real-world use cases.
