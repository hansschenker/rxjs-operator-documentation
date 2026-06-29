# concatAll

## Brief Description
`concatAll` subscribes to each inner Observable emitted by a higher-order Observable one at a time, in order. It waits for each inner Observable to complete before subscribing to the next one. This preserves the sequential order of emissions and is useful when the order in which inner Observables complete matters, such as processing a queue of HTTP requests that must run in sequence.

## Category
combination

## Import
```typescript
import { concatAll } from 'rxjs';
```

## Signature
```typescript
concatAll<O extends ObservableInput<any>>(): OperatorFunction<O, ObservedValueOf<O>>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| _(none)_ | | `concatAll` takes no parameters. It is configured entirely by the higher-order Observable it operates on. |

## Return Type
An `OperatorFunction` that flattens a higher-order Observable into a first-order Observable, subscribing to and emitting values from inner Observables one at a time in strict sequential order.

## Marble Diagram
```
Outer:    --(A$)--(B$)--(C$)--|        (outer completes)
A$:           --1--2--3--|             (A$ must complete before B$ starts)
B$:                       --4--5--|   (B$ must complete before C$ starts)
C$:                                --6--|  

Result:   ----1--2--3----4--5----6--|  (strictly sequential, no interleaving)
```

## Examples

### Example 1: Processing a queue of tasks sequentially
```typescript
import { of, interval, concatAll } from 'rxjs';
import { map, take, delay } from 'rxjs/operators';

// Simulate tasks that take different amounts of time
const task1$ = of('Task 1 done').pipe(delay(1000));
const task2$ = of('Task 2 done').pipe(delay(500));
const task3$ = of('Task 3 done').pipe(delay(800));

// Process tasks in order, even though task2 would finish first independently
of(task1$, task2$, task3$).pipe(
  concatAll()
).subscribe(result => console.log(result));
// Output (always in order):
// Task 1 done (after 1000ms)
// Task 2 done (after 1500ms total)
// Task 3 done (after 2300ms total)
```

### Example 2: Sequential API calls from user actions
```typescript
import { Subject, from, concatAll } from 'rxjs';
import { map, delay } from 'rxjs/operators';

const submitAction$ = new Subject<{ id: number; data: string }>();

// Simulate API save — each call takes 600ms
const saveToApi = (payload: { id: number; data: string }) =>
  of(`Saved: ${payload.data} (id=${payload.id})`).pipe(delay(600));

// Queue all submissions and process them in order
submitAction$.pipe(
  map(saveToApi),
  concatAll()
).subscribe(result => console.log(result));

// Rapid-fire user submissions
submitAction$.next({ id: 1, data: 'First post' });
submitAction$.next({ id: 2, data: 'Second post' });
submitAction$.next({ id: 3, data: 'Third post' });
// Each save completes before the next starts
```

### Example 3: Animating steps in sequence
```typescript
import { of, interval, concatAll } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

const steps = [
  { label: 'Fade in header', duration: 3 },
  { label: 'Slide in content', duration: 5 },
  { label: 'Show footer', duration: 2 }
];

const animations$ = of(
  ...steps.map(step =>
    interval(100).pipe(
      take(step.duration),
      tap((frame) => console.log(`  ${step.label} frame ${frame + 1}/${step.duration}`)),
      map(() => step.label)
    )
  )
);

animations$.pipe(
  concatAll()
).subscribe({
  next: (label) => {},
  complete: () => console.log('All animations complete')
});
```

## Common Pitfalls

### Pitfall 1: Inner Observables that never complete block the queue
Because `concatAll` waits for each inner Observable to complete, a long-running or infinite inner Observable will prevent subsequent inner Observables from ever being subscribed to.

```typescript
import { of, interval, concatAll } from 'rxjs';
import { take } from 'rxjs/operators';

// ❌ interval() never completes — second Observable never starts
of(
  interval(1000), // This runs forever!
  of('I will never run')
).pipe(
  concatAll()
).subscribe(console.log);

// ✅ Ensure inner Observables complete with take, first, etc.
of(
  interval(1000).pipe(take(3)),
  of('I will run after 3 seconds')
).pipe(
  concatAll()
).subscribe(console.log);
```

### Pitfall 2: Using concatAll when order doesn't matter (performance)
`concatAll` is sequential and never concurrent. If the order of results does not matter, `mergeAll` offers better throughput by running inner Observables in parallel.

```typescript
import { of, concatAll, mergeAll } from 'rxjs';
import { delay } from 'rxjs/operators';

// ❌ Takes 3 seconds total (sequential)
of(
  of('A').pipe(delay(1000)),
  of('B').pipe(delay(1000)),
  of('C').pipe(delay(1000))
).pipe(concatAll()).subscribe(console.log);

// ✅ Takes ~1 second total (concurrent) when order doesn't matter
of(
  of('A').pipe(delay(1000)),
  of('B').pipe(delay(1000)),
  of('C').pipe(delay(1000))
).pipe(mergeAll()).subscribe(console.log);
```

## Related Operators
- **`concatWith`**: Pipeable operator that appends one or more Observables after the source completes, without a higher-order Observable.
- **`mergeAll`**: Like `concatAll` but subscribes to all inner Observables concurrently; use when order of completion doesn't matter.
- **`switchAll`**: Cancels the previous inner Observable when a new one arrives; use when only the latest matters.
- **`exhaustAll`**: Ignores new inner Observables while one is already active; use when you want to prevent queuing entirely.
- **`concatMap`**: Equivalent to `map` followed by `concatAll`; more concise for most use cases.
