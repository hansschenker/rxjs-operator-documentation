# delayWhen

## Brief Description
`delayWhen` delays each item emitted by the source observable by an amount determined by a per-item selector function. Unlike `delay`, which applies a uniform fixed delay to all emissions, `delayWhen` lets you compute a custom duration observable for each value — making it suitable for scenarios where the delay needs to vary based on the content of each emission, such as retry backoff strategies or content-aware scheduling.

## Category
utility

## Import
```typescript
import { delayWhen } from 'rxjs';
```

## Signature
```typescript
delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay?: Observable<any>
): MonoTypeOperatorFunction<T>
```

## Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| delayDurationSelector | `(value: T, index: number) => Observable<any>` | A function called for each source emission. It receives the emitted value and its zero-based index, and must return an observable. The source item is forwarded when this returned observable emits its first value. |
| subscriptionDelay | `Observable<any>` | Optional. An observable that, when it emits, triggers subscription to the source. If omitted, subscription to the source begins immediately. |

## Return Type
Returns a `MonoTypeOperatorFunction<T>` — an observable that emits the same values as the source, each delayed until its corresponding duration observable emits.

## Marble Diagram
```
Source:           --a--------b--------c--|>
delay for a:      ------|>
delay for b:      --|>
delay for c:      --------|>

delayWhen result: ------a--b-----------c--|>
                  (each item waits for its own duration observable)
```

## Examples

### Example 1: Applying variable delays based on value
```typescript
import { of, delayWhen, timer } from 'rxjs';

const items = ['fast', 'medium', 'slow'];

of(...items).pipe(
  delayWhen(value => {
    const delayMs = value === 'fast' ? 100 : value === 'medium' ? 500 : 1000;
    console.log(`Delaying "${value}" by ${delayMs}ms`);
    return timer(delayMs);
  })
).subscribe(value => console.log(`Emitted: "${value}" at`, Date.now()));

// Output (approximately):
// Delaying "fast" by 100ms
// Delaying "medium" by 500ms
// Delaying "slow" by 1000ms
// Emitted: "fast" at T+100
// Emitted: "medium" at T+500
// Emitted: "slow" at T+1000
```

### Example 2: Exponential backoff retry delay
```typescript
import { of, delayWhen, timer } from 'rxjs';
import { map } from 'rxjs';

// Simulate retry attempts with exponential backoff
const retryAttempts = of(1, 2, 3, 4);

retryAttempts.pipe(
  delayWhen((attempt, index) => {
    const backoffMs = Math.pow(2, index) * 100; // 100, 200, 400, 800ms
    console.log(`Attempt ${attempt}: waiting ${backoffMs}ms`);
    return timer(backoffMs);
  }),
  map(attempt => ({ attempt, timestamp: Date.now() }))
).subscribe(({ attempt, timestamp }) =>
  console.log(`Attempt ${attempt} executed at`, timestamp)
);
```

### Example 3: Delay based on an external signal
```typescript
import { fromEvent, delayWhen, take, map } from 'rxjs';
import { Subject } from 'rxjs';

// Each item waits for a user action (or a simulated signal) before emitting
const signal$ = new Subject<void>();

const items$ = new Subject<string>();

items$.pipe(
  delayWhen(() => signal$.pipe(take(1)))
).subscribe(item => console.log('Processed after signal:', item));

items$.next('item-1');
items$.next('item-2');

// Simulate signal after 1 second:
setTimeout(() => {
  console.log('Signal fired!');
  signal$.next();
  signal$.next();
}, 1000);

// Output (after ~1s):
// Signal fired!
// Processed after signal: item-1
// Processed after signal: item-2
```

## Common Pitfalls

### Pitfall 1: Forgetting that the delay observable must emit to release the value
The source value is held until the duration observable emits its first item. If the duration observable never emits (e.g., `NEVER`), the value is held forever.

```typescript
import { of, delayWhen, NEVER, timer } from 'rxjs';

// ❌ Incorrect — NEVER never emits, so values are blocked indefinitely
of(1, 2, 3).pipe(
  delayWhen(value => value === 2 ? NEVER : timer(100))
).subscribe(console.log);
// Output: 1, 3 — value 2 is lost/blocked

// ✅ Correct — ensure all branches return an observable that will emit
of(1, 2, 3).pipe(
  delayWhen(value => timer(value === 2 ? 2000 : 100))
).subscribe(console.log);
// Output: 1, 3 (at 100ms), 2 (at 2000ms)
```

### Pitfall 2: Using delayWhen when a simple delay is sufficient
`delayWhen` is more complex and has higher overhead. Use `delay` when the delay is uniform.

```typescript
import { of, delay, delayWhen, timer } from 'rxjs';

// ❌ Overcomplicated — uniform delay using delayWhen
of(1, 2, 3).pipe(
  delayWhen(() => timer(1000))
).subscribe(console.log);

// ✅ Simpler — use delay for a fixed duration
of(1, 2, 3).pipe(
  delay(1000)
).subscribe(console.log);
```

## Related Operators
- **`delay`**: Applies a uniform fixed delay to all emissions; simpler when delay is constant.
- **`debounceTime`**: Waits for a quiet period after the last emission; different intent from per-item delay.
- **`retryWhen`** (deprecated in RxJS 7, replaced by `retry` with delay config): Similar pattern for retry delays.
- **`audit`**: Emits only the most recent value after a duration observable emits; different filtering behavior.
