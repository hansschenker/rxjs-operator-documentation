# skipUntil

## Brief Description
The `skipUntil` operator suppresses all values from the source observable until a notifier observable emits its first value. Once the notifier emits, all subsequent source values pass through. This is particularly useful for deferring a stream until a gate condition (such as a user action or timer) is met.

## Category
filtering

## Import
```typescript
import { skipUntil } from 'rxjs';
```

## Signature
```typescript
skipUntil<T>(notifier: ObservableInput<any>): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| notifier | `ObservableInput<any>` | An Observable (or compatible input) whose first emission triggers the source to start passing values through. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type that suppresses values until the notifier fires.

## Marble Diagram
```
Source:   --1--2--3--4--5--6--|
Notifier: ---------N-----------|
skipUntil(Notifier)
Output:   -----------4--5--6--|
```

## Examples

### Example 1: Skip values until a button is clicked
```typescript
import { interval, fromEvent, skipUntil } from 'rxjs';

const start$ = fromEvent(document.querySelector('#start')!, 'click');

interval(500).pipe(
  skipUntil(start$)
).subscribe(val => console.log('Value after click:', val));
// Values are suppressed until the #start button is clicked
```

### Example 2: Skip values until a delay has elapsed
```typescript
import { interval, timer, skipUntil, take } from 'rxjs';

interval(200).pipe(
  skipUntil(timer(1000)), // wait 1 second before accepting values
  take(5)
).subscribe(console.log);
// Output: 5, 6, 7, 8, 9 (approx — first ~5 values skipped)
```

### Example 3: Skip values until another observable emits
```typescript
import { Subject, interval, skipUntil, take } from 'rxjs';

const gate$ = new Subject<void>();

interval(300).pipe(
  skipUntil(gate$),
  take(3)
).subscribe(console.log);

setTimeout(() => gate$.next(), 1000);
// Values from index ~3 onward are emitted
```

## Common Pitfalls

### Pitfall 1: Notifier that never emits means the source is always suppressed
If the notifier never emits, all source values will be dropped.

```typescript
import { interval, NEVER, skipUntil } from 'rxjs';

// ❌ NEVER never emits, so no values are ever passed through
interval(500).pipe(
  skipUntil(NEVER)
).subscribe(console.log); // Nothing is ever logged
```

### Pitfall 2: Confusing skipUntil with skipWhile
`skipUntil` is driven by an external observable. `skipWhile` is driven by a predicate on the source values themselves.

```typescript
import { of, skipWhile, skipUntil, timer } from 'rxjs';

// skipWhile: predicate on source values
of(1, 2, 3, 4, 5).pipe(
  skipWhile(n => n < 3)
).subscribe(console.log); // 3, 4, 5

// skipUntil: triggered by an external event
of(1, 2, 3, 4, 5).pipe(
  skipUntil(timer(0)) // microtask delay — will skip everything synchronous
).subscribe(console.log); // Nothing (of() completes synchronously before timer fires)
```

## Related Operators
- **`skipWhile`**: Skips values based on a predicate applied to each value.
- **`skip`**: Skips the first N values unconditionally.
- **`takeUntil`**: Emits values until a notifier fires (the complement of `skipUntil`).
- **`filter`**: Suppresses values based on a per-value predicate, not a gate.
