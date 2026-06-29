# skipWhile

## Brief Description
The `skipWhile` operator suppresses values from the source observable as long as a provided predicate function returns `true`. Once the predicate returns `false` for the first time, all subsequent values (including that first non-matching value) are emitted — the predicate is never checked again. This makes it suitable for skipping an initial run of values that do not meet a condition.

## Category
filtering

## Import
```typescript
import { skipWhile } from 'rxjs';
```

## Signature
```typescript
skipWhile<T>(predicate: (value: T, index: number) => boolean): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| predicate | `(value: T, index: number) => boolean` | A function evaluated for each source value while values are being skipped. Skipping stops permanently once this returns `false`. |

## Return Type
A `MonoTypeOperatorFunction<T>` — an Observable of the same type, emitting values from the point the predicate first returns `false`.

## Marble Diagram
```
Source:  --1--2--3--4--5--2--|
skipWhile(x => x < 3)
Output:  --------3--4--5--2--|
         (once predicate fails at 3, all values pass through including 2)
```

## Examples

### Example 1: Skip values below a threshold
```typescript
import { of, skipWhile } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  skipWhile(n => n < 3)
).subscribe(console.log);
// Output: 3, 4, 5
```

### Example 2: Skip loading states until data is ready
```typescript
import { BehaviorSubject, skipWhile } from 'rxjs';

interface AppState {
  loading: boolean;
  data: string | null;
}

const state$ = new BehaviorSubject<AppState>({ loading: true, data: null });

state$.pipe(
  skipWhile(s => s.loading)
).subscribe(s => console.log('Data ready:', s.data));

setTimeout(() => state$.next({ loading: false, data: 'Hello!' }), 500);
// Output: Data ready: Hello!
```

### Example 3: Use the index parameter to skip the first few emissions
```typescript
import { interval, skipWhile, take } from 'rxjs';

interval(200).pipe(
  skipWhile((_, index) => index < 3),
  take(4)
).subscribe(console.log);
// Output: 3, 4, 5, 6
```

## Common Pitfalls

### Pitfall 1: Expecting skipWhile to re-engage after the predicate returns true again
Once the predicate returns `false`, `skipWhile` stops evaluating it. Even if later values would make the predicate `true` again, they are still emitted.

```typescript
import { of, skipWhile } from 'rxjs';

// ❌ Incorrect assumption: 2 at the end will be skipped because 2 < 3
of(1, 2, 3, 4, 2, 1).pipe(
  skipWhile(n => n < 3)
).subscribe(console.log);
// Output: 3, 4, 2, 1 — 2 and 1 are NOT skipped again!

// ✅ Use filter if you want to suppress values matching the condition throughout
import { filter } from 'rxjs';
of(1, 2, 3, 4, 2, 1).pipe(
  filter(n => n >= 3)
).subscribe(console.log);
// Output: 3, 4
```

### Pitfall 2: Confusing skipWhile with skipUntil
`skipWhile` evaluates a predicate on each source value; `skipUntil` waits for an external observable to emit.

```typescript
import { of, skipWhile } from 'rxjs';

// skipWhile: value-based gating
of(0, 0, 1, 2, 3).pipe(
  skipWhile(n => n === 0)
).subscribe(console.log); // 1, 2, 3
```

## Related Operators
- **`skipUntil`**: Skips values until an external notifier emits.
- **`skip`**: Skips exactly N values unconditionally.
- **`takeWhile`**: Emits values while the predicate is true, then completes (mirror of `skipWhile`).
- **`filter`**: Applies the predicate to every value throughout the stream.
