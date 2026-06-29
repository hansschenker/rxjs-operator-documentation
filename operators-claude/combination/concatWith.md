# concatWith

## Brief Description
`concatWith` appends one or more Observables to the end of the source Observable, subscribing to each subsequent Observable only after the previous one completes. Values from each Observable are emitted in order without interleaving. This operator is ideal for chaining sequential streams, such as playing an intro animation followed by loading content, or appending a completion notification to a data stream.

## Category
combination

## Import
```typescript
import { concatWith } from 'rxjs';
```

## Signature
```typescript
concatWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `...otherSources` | `ObservableInputTuple<A>` | One or more Observables (or Observable-compatible sources) to concatenate after the source Observable completes. They are subscribed to in the order provided. |

## Return Type
An `OperatorFunction` that returns an Observable emitting all values from the source Observable followed by all values from each subsequent Observable in order. The result type is the union of all source types.

## Marble Diagram
```
source$:  --1--2--3--|                 (source completes)
other1$:              --4--5--|        (other1 starts after source completes)
other2$:                       --6--|  (other2 starts after other1 completes)

result$:  --1--2--3----4--5----6--|    (sequential, no overlap)
```

## Examples

### Example 1: Appending a completion message to a data stream
```typescript
import { of, concatWith } from 'rxjs';
import { delay } from 'rxjs/operators';

const loadData$ = of('record-1', 'record-2', 'record-3').pipe(delay(500));
const done$ = of('--- Loading complete ---');

loadData$.pipe(
  concatWith(done$)
).subscribe(msg => console.log(msg));
// record-1 (after 500ms)
// record-2
// record-3
// --- Loading complete ---
```

### Example 2: Chaining intro, main content, and outro sequences
```typescript
import { of, interval, concatWith } from 'rxjs';
import { map, take } from 'rxjs/operators';

const intro$ = of('Playing intro...');

const mainContent$ = interval(500).pipe(
  take(4),
  map((i) => `Content frame ${i + 1}`)
);

const outro$ = of('Playing outro...');

intro$.pipe(
  concatWith(mainContent$, outro$)
).subscribe(event => {
  console.log(event);
});
// Playing intro...
// Content frame 1
// Content frame 2
// Content frame 3
// Content frame 4
// Playing outro...
```

### Example 3: Running initialization steps before main application logic
```typescript
import { of, concatWith } from 'rxjs';
import { tap, delay, ignoreElements } from 'rxjs/operators';

// Simulate async setup steps
const loadConfig$ = of('config').pipe(
  delay(300),
  tap(() => console.log('Config loaded'))
);

const connectDatabase$ = of('db').pipe(
  delay(500),
  tap(() => console.log('Database connected'))
);

const startApp$ = of('App started and running!');

loadConfig$.pipe(
  ignoreElements(),
  concatWith(connectDatabase$.pipe(ignoreElements()), startApp$)
).subscribe(msg => console.log(msg));
// Config loaded (after 300ms)
// Database connected (after 800ms)
// App started and running! (after 800ms)
```

## Common Pitfalls

### Pitfall 1: Source Observable that never completes blocks subsequent Observables
If the source (or any intermediate) Observable does not complete, the next Observable in the chain will never be subscribed to.

```typescript
import { interval, of, concatWith } from 'rxjs';
import { take } from 'rxjs/operators';

// ❌ interval() never completes — of('done') never runs
interval(1000).pipe(
  concatWith(of('done'))
).subscribe(console.log);

// ✅ Bound the source so it completes
interval(1000).pipe(
  take(3),
  concatWith(of('done'))
).subscribe(console.log);
// 0, 1, 2, done
```

### Pitfall 2: Mixing types and ignoring the union return type
When sources emit different types, the result Observable emits a union type. Forgetting to handle all type variants leads to runtime errors.

```typescript
import { of, concatWith } from 'rxjs';

// ❌ Treating a number as a string without type guard
of(1, 2, 3).pipe(
  concatWith(of('end'))
).subscribe((value) => {
  // value is number | string — this cast is unsafe:
  console.log((value as string).toUpperCase()); // Runtime error for numbers!
});

// ✅ Use a type guard or map before subscribing
of(1, 2, 3).pipe(
  concatWith(of('end'))
).subscribe((value) => {
  if (typeof value === 'string') {
    console.log('Status:', value.toUpperCase());
  } else {
    console.log('Number:', value * 2);
  }
});
```

## Related Operators
- **`concatAll`**: Higher-order version; use when Observables to concatenate are emitted dynamically by another Observable.
- **`concat`**: Static creation function combining multiple Observables sequentially; use outside of a pipe chain.
- **`mergeWith`**: Like `concatWith` but subscribes to all Observables concurrently; use when order doesn't matter.
- **`startWith`**: Prepends values to the beginning of the source Observable (the inverse direction).
- **`endWith`**: Appends static values (not Observables) to the end of the source Observable.
